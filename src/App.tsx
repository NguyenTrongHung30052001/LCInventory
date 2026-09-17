/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Camera,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Copy,
  Eye,
  Trash2,
  MapPin,
  Download,
  X,
  FileText,
} from 'lucide-react';
import { Header } from './components/Header';
import { MaterialTicketCreateModal } from './components/MaterialTicketCreateModal';
import { MaterialTicketDetailModal } from './components/MaterialTicketDetailModal';
import { DirectCameraModal } from './components/DirectCameraModal';
import { VersionInfoModal } from './components/VersionInfoModal';
import { LienChauLogo } from './components/LienChauLogo';
import { Toast } from './components/Toast';
import { MaterialTicket } from './types';
import { APP_VERSION } from './config/version';
import {
  getStoredMaterialTickets,
  saveStoredMaterialTickets,
} from './utils/materialTicketStorage';
import {
  SAMPLE_MATERIAL_QRS,
  SAMPLE_WAREHOUSE_LOCATIONS,
  parseMaterialQr,
} from './utils/materialQrParser';
import { sendToMesInventory } from './services/mesApi';

export default function App() {
  // Stored Material Tickets - Mặc định danh sách trống (không có đơn ảo)
  const [tickets, setTickets] = useState<MaterialTicket[]>(() =>
    getStoredMaterialTickets()
  );
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'material' | 'location'>('material');
  const [viewingTicket, setViewingTicket] = useState<MaterialTicket | null>(null);

  // Scanned QR values passed into create modal
  const [scannedMaterialQr, setScannedMaterialQr] = useState<string | null>(null);
  const [scannedLocationQr, setScannedLocationQr] = useState<string | null>(null);

  // Audio settings, loading and toast
  const [beepEnabled, setBeepEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persist tickets to local storage
  useEffect(() => {
    saveStoredMaterialTickets(tickets);
  }, [tickets]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Open camera scanner for Material QR
  const handleOpenMaterialScanner = () => {
    setScannerTarget('material');
    setIsScannerModalOpen(true);
  };

  // Open camera scanner for Warehouse Location
  const handleOpenLocationScanner = () => {
    setScannerTarget('location');
    setIsScannerModalOpen(true);
  };

  // Camera scan success handler
  const handleScanSuccess = (scannedRaw: string) => {
    setIsScannerModalOpen(false); // Hide the camera scanner immediately
    setIsCreateModalOpen(true);   // Ensure ONLY the ticket creation form is visible

    if (scannerTarget === 'material') {
      setScannedMaterialQr(scannedRaw);
      const parsed = parseMaterialQr(scannedRaw);
      if (parsed.isValid) {
        showToast(`Đã quét mã: ${parsed.materialCode}`);
      } else {
        showToast('Đã quét mã QR');
      }
    } else {
      setScannedLocationQr(scannedRaw);
      showToast(`Vị trí: ${scannedRaw}`);
    }
  };

  // Save new material ticket & call MES API: http://mes.lienchau.vn:5092/api/FinishedGoodInventory
  const handleSaveTicket = async (newTicket: MaterialTicket) => {
    setIsSaving(true);
    try {
      const mesRes = await sendToMesInventory(newTicket);
      const savedTicket: MaterialTicket = {
        ...newTicket,
        mesSyncStatus: mesRes.success ? 'synced' : 'failed',
        mesSyncError: mesRes.error,
      };

      setTickets((prev) => [savedTicket, ...prev]);
      setScannedMaterialQr(null);
      setScannedLocationQr(null);

      if (mesRes.success) {
        showToast(`Đã lưu & gửi MES thành công!`);
      } else {
        showToast(`Đã lưu phiếu (Lỗi gửi MES: ${mesRes.error || 'Kiểm tra mạng'})`);
      }
    } catch (err: any) {
      const savedTicket: MaterialTicket = {
        ...newTicket,
        mesSyncStatus: 'failed',
        mesSyncError: err.message || 'Lỗi gửi dữ liệu',
      };
      setTickets((prev) => [savedTicket, ...prev]);
      showToast(`Đã lưu nội bộ (Không gửi được MES)`);
    } finally {
      setIsSaving(false);
    }
  };

  // Resend ticket to MES API
  const handleResendToMes = async (ticket: MaterialTicket) => {
    showToast('Đang gửi lại lên hệ thống MES...');
    const mesRes = await sendToMesInventory(ticket);

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticket.id) {
          return {
            ...t,
            mesSyncStatus: mesRes.success ? 'synced' : 'failed',
            mesSyncError: mesRes.error,
          };
        }
        return t;
      })
    );

    if (mesRes.success) {
      showToast('Đã gửi MES thành công!');
    } else {
      showToast(`Gửi lại thất bại: ${mesRes.error || 'Lỗi'}`);
    }
  };

  // Delete ticket
  const handleDeleteTicket = (id: string) => {
    setTickets((prev) => prev.filter((t) => t.id !== id));
    showToast('Đã xóa phiếu');
  };

  // Copy text helper
  const handleCopyText = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      showToast('Đã sao chép vào bộ nhớ');
    });
  };

  // Export tickets to CSV
  const handleExportCSV = () => {
    if (tickets.length === 0) {
      showToast('Chưa có phiếu để xuất CSV');
      return;
    }

    const headers = [
      'Mã vật tư',
      'Màu',
      'Size',
      'Length',
      'Lô SX (Lot)',
      'Lệnh SX (PO)',
      'ĐVT',
      'Số lượng',
      'Vị trí kho',
      'Mã kho',
      'Người quét',
      'Ghi chú',
      'Trạng thái MES',
      'Thời gian',
    ];

    const rows = tickets.map((t) => [
      `"${(t.materialCode || '').replace(/"/g, '""')}"`,
      `"${(t.color || '').replace(/"/g, '""')}"`,
      `"${(t.size || '').replace(/"/g, '""')}"`,
      `"${(t.length || '').replace(/"/g, '""')}"`,
      `"${(t.batchNumber || '').replace(/"/g, '""')}"`,
      `"${(t.productionOrder || '').replace(/"/g, '""')}"`,
      `"${(t.unit || '').replace(/"/g, '""')}"`,
      t.quantity,
      `"${(t.warehouseLocation || '').replace(/"/g, '""')}"`,
      `"${(t.warehouseCode || 'FGW').replace(/"/g, '""')}"`,
      `"${(t.scannedBy || '105').replace(/"/g, '""')}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
      t.mesSyncStatus === 'synced' ? 'Đã gửi MES' : 'Chưa gửi',
      new Date(t.createdAt).toLocaleString('vi-VN'),
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `phieu-kho-mes-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã tải file CSV');
  };

  // Filtered tickets by search
  const filteredTickets = tickets.filter((t) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      t.materialCode.toLowerCase().includes(q) ||
      t.color.toLowerCase().includes(q) ||
      t.size.toLowerCase().includes(q) ||
      t.length.toLowerCase().includes(q) ||
      t.batchNumber.toLowerCase().includes(q) ||
      t.productionOrder.toLowerCase().includes(q) ||
      t.warehouseLocation.toLowerCase().includes(q) ||
      (t.notes && t.notes.toLowerCase().includes(q)) ||
      t.rawQr.toLowerCase().includes(q)
    );
  });

  const getMesBadge = (status?: 'synced' | 'failed' | 'pending') => {
    switch (status) {
      case 'synced':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="h-2.5 w-2.5" />
            Đã gửi MES
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
            <AlertCircle className="h-2.5 w-2.5" />
            Lỗi gửi MES
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Clock className="h-2.5 w-2.5" />
            Đã lưu
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans transition-colors pb-6">
      {/* App Header with Liên Châu Logo and Version indicator */}
      <Header
        ticketCount={tickets.length}
        beepEnabled={beepEnabled}
        onToggleBeep={() => setBeepEnabled((prev) => !prev)}
        onOpenCreateTicket={() => {
          setScannedMaterialQr(null);
          setScannedLocationQr(null);
          setIsCreateModalOpen(true);
        }}
        onOpenQuickScan={() => {
          setScannedMaterialQr(null);
          setScannedLocationQr(null);
          setIsCreateModalOpen(true);
          handleOpenMaterialScanner();
        }}
        onOpenVersionModal={() => setIsVersionModalOpen(true)}
      />

      {/* Main Mobile Screen */}
      <main className="flex-1 max-w-md sm:max-w-xl w-full mx-auto px-3.5 py-3 space-y-3">
        {/* 1. PRIMARY MOBILE ACTIONS BAR */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Main Action: Quét QR bằng Camera */}
          <button
            id="btn-main-mobile-scan"
            type="button"
            onClick={() => {
              setScannedMaterialQr(null);
              setScannedLocationQr(null);
              setIsCreateModalOpen(true);
              handleOpenMaterialScanner();
            }}
            className="h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 shadow-xs transition-colors text-sm"
          >
            <Camera className="h-5 w-5" />
            <span>Quét QR</span>
          </button>

          {/* Secondary Action: Tạo Phiếu */}
          <button
            id="btn-main-mobile-create"
            type="button"
            onClick={() => {
              setScannedMaterialQr(null);
              setScannedLocationQr(null);
              setIsCreateModalOpen(true);
            }}
            className="h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:border-emerald-500 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center gap-2 shadow-xs transition-colors text-sm"
          >
            <Plus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span>Tạo phiếu</span>
          </button>
        </div>

        {/* 2. STATS PILL ROW */}
        <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
          <span className="font-semibold">
            Tổng phiếu: <strong className="text-slate-900 dark:text-white font-mono">{tickets.length}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-600 flex items-center gap-1"
              title="Xuất file CSV"
            >
              <Download className="h-3.5 w-3.5 text-slate-400" />
              <span>Xuất CSV</span>
            </button>
          </div>
        </div>

        {/* 3. SEARCH INPUT */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            id="input-mobile-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm mã VT, màu, size, lô, kho, ghi chú..."
            className="w-full h-10 pl-9 pr-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* 4. TICKET CARDS LIST (MOBILE OPTIMIZED) - Không có đơn ảo, mặc định để trống */}
        <div className="space-y-2.5 pt-1">
          {filteredTickets.length === 0 ? (
            /* Empty State with Lien Chau Branding */
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center">
              <div className="mb-3">
                <LienChauLogo size="lg" />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-0.5">
                Chưa có phiếu vật tư
              </p>
              <p className="text-[11px] text-slate-400 mb-4 max-w-xs">
                Đưa camera quét mã QR trên cuộn vải/vật tư để tự động nhập dữ liệu vào phiếu.
              </p>
              <button
                type="button"
                onClick={() => {
                  setScannedMaterialQr(null);
                  setScannedLocationQr(null);
                  setIsCreateModalOpen(true);
                  handleOpenMaterialScanner();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Camera className="h-4 w-4" />
                <span>Quét mã QR ngay</span>
              </button>
            </div>
          ) : (
            filteredTickets.map((t) => (
              <div
                key={t.id}
                onClick={() => setViewingTicket(t)}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500/60 active:scale-[0.99] transition-all cursor-pointer space-y-2"
              >
                {/* Card Top: Material Code, MES Status & Time (Bỏ mã phiếu & trạng thái) */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {getMesBadge(t.mesSyncStatus)}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(t.createdAt).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    - {new Date(t.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                {/* Material Code Title */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block leading-none">
                    Mã vật tư:
                  </span>
                  <h3 className="text-sm font-black font-mono text-emerald-700 dark:text-emerald-400 truncate">
                    {t.materialCode || '(Chưa có mã VT)'}
                  </h3>
                </div>

                {/* 6 Fields Compact Summary Grid */}
                <div className="grid grid-cols-3 gap-1.5 text-[11px] p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
                  <div>
                    <span className="text-[9px] text-slate-400 block leading-none mb-0.5">Màu:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {t.color || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block leading-none mb-0.5">Size:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {t.size || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block leading-none mb-0.5">Length:</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {t.length || '—'}
                    </span>
                  </div>
                  <div className="col-span-1">
                    <span className="text-[9px] text-slate-400 block leading-none mb-0.5">Lô SX:</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 truncate block">
                      {t.batchNumber || '—'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] text-slate-400 block leading-none mb-0.5">Lệnh SX:</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 truncate block">
                      {t.productionOrder || '—'}
                    </span>
                  </div>
                </div>

                {/* Ghi chú hiển thị nếu có */}
                {t.notes && (
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800/60 flex items-start gap-1.5">
                    <FileText className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2 italic">{t.notes}</span>
                  </div>
                )}

                {/* Card Bottom: Quantity, Location & Quick actions */}
                <div className="flex items-center justify-between pt-0.5">
                  <div className="flex items-center gap-2">
                    {/* Quantity Pill */}
                    <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                      {t.quantity} {t.unit}
                    </span>

                    {/* Location Badge */}
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      <MapPin className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="truncate max-w-[110px]">
                        {t.warehouseLocation || 'A1-02'}
                      </span>
                    </span>
                  </div>

                  {/* Actions */}
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => handleCopyText(t.rawQr || t.materialCode)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      title="Sao chép"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTicket(t.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                      title="Xóa"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewingTicket(t)}
                      className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                      title="Chi tiết"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 5. PHẦN HIỂN THỊ PHIÊN BẢN & THỜI GIAN CẬP NHẬT (BOTTOM FOOTER) */}
        <div className="pt-3 pb-1 text-center">
          <button
            type="button"
            onClick={() => setIsVersionModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 transition-colors shadow-2xs group"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-slate-700 dark:text-slate-200">
              Liên Châu MES
            </span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1 rounded">
              {APP_VERSION.version}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="font-mono text-[10px]">
              Cập nhật: {APP_VERSION.updatedAt}
            </span>
          </button>
        </div>
      </main>

      {/* MODAL 1: MATERIAL TICKET CREATION FORM */}
      <MaterialTicketCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onOpenMaterialScanner={handleOpenMaterialScanner}
        onOpenLocationScanner={handleOpenLocationScanner}
        scannedMaterialQr={scannedMaterialQr}
        scannedLocationQr={scannedLocationQr}
        onSaveTicket={handleSaveTicket}
        onClearScannedMaterialQr={() => setScannedMaterialQr(null)}
        onClearScannedLocationQr={() => setScannedLocationQr(null)}
        isSaving={isSaving}
      />

      {/* MODAL 2: DIRECT CAMERA SCANNER */}
      <DirectCameraModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onScanSuccess={handleScanSuccess}
        title={
          scannerTarget === 'material'
            ? 'Quét mã QR vật tư'
            : 'Quét vị trí kho'
        }
        description={
          scannerTarget === 'material'
            ? 'Đưa camera vào mã QR'
            : 'Đưa camera vào mã vị trí kệ kho'
        }
        samples={
          scannerTarget === 'material'
            ? SAMPLE_MATERIAL_QRS
            : SAMPLE_WAREHOUSE_LOCATIONS.map((loc) => ({
                label: loc.label,
                description: loc.desc,
                raw: loc.code,
              }))
        }
      />

      {/* MODAL 3: MATERIAL TICKET DETAIL MODAL */}
      <MaterialTicketDetailModal
        ticket={viewingTicket}
        onClose={() => setViewingTicket(null)}
        onDeleteTicket={handleDeleteTicket}
        onCopyText={handleCopyText}
        onResendToMes={handleResendToMes}
      />

      {/* MODAL 4: VERSION INFO MODAL */}
      <VersionInfoModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
      />

      {/* TOAST NOTIFICATION */}
      <Toast message={toastMessage} />
    </div>
  );
}
