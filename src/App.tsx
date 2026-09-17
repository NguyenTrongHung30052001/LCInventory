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
  Clock,
  Ban,
  Copy,
  Eye,
  Trash2,
  MapPin,
  Download,
  Package,
  X,
} from 'lucide-react';
import { Header } from './components/Header';
import { MaterialTicketCreateModal } from './components/MaterialTicketCreateModal';
import { MaterialTicketDetailModal } from './components/MaterialTicketDetailModal';
import { DirectCameraModal } from './components/DirectCameraModal';
import { Toast } from './components/Toast';
import { MaterialTicket, TicketStatus } from './types';
import {
  getStoredMaterialTickets,
  saveStoredMaterialTickets,
} from './utils/materialTicketStorage';
import {
  SAMPLE_MATERIAL_QRS,
  SAMPLE_WAREHOUSE_LOCATIONS,
  parseMaterialQr,
} from './utils/materialQrParser';

export default function App() {
  // Stored Material Tickets
  const [tickets, setTickets] = useState<MaterialTicket[]>(() =>
    getStoredMaterialTickets()
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'material' | 'location'>('material');
  const [viewingTicket, setViewingTicket] = useState<MaterialTicket | null>(null);

  // Scanned QR values passed into create modal
  const [scannedMaterialQr, setScannedMaterialQr] = useState<string | null>(null);
  const [scannedLocationQr, setScannedLocationQr] = useState<string | null>(null);

  // Audio settings and toast
  const [beepEnabled, setBeepEnabled] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persist tickets
  useEffect(() => {
    saveStoredMaterialTickets(tickets);
  }, [tickets]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
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

  // Save new material ticket
  const handleSaveTicket = (newTicket: MaterialTicket) => {
    setTickets((prev) => [newTicket, ...prev]);
    setScannedMaterialQr(null);
    setScannedLocationQr(null);
    showToast(`Đã lưu phiếu ${newTicket.code}`);
  };

  // Delete ticket
  const handleDeleteTicket = (id: string) => {
    setTickets((prev) => prev.filter((t) => t.id !== id));
    showToast('Đã xóa phiếu');
  };

  // Toggle ticket status
  const handleToggleStatus = (id: string) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextStatus: TicketStatus =
            t.status === 'completed' ? 'pending' : 'completed';
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
    showToast('Đã cập nhật trạng thái');
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
      'Mã phiếu',
      'Mã vật tư',
      'Màu',
      'Size',
      'Length',
      'Lô SX',
      'Lệnh SX',
      'ĐVT',
      'Số lượng',
      'Vị trí kho',
      'Trạng thái',
      'Thời gian',
    ];

    const rows = tickets.map((t) => [
      t.code,
      `"${(t.materialCode || '').replace(/"/g, '""')}"`,
      `"${(t.color || '').replace(/"/g, '""')}"`,
      `"${(t.size || '').replace(/"/g, '""')}"`,
      `"${(t.length || '').replace(/"/g, '""')}"`,
      `"${(t.batchNumber || '').replace(/"/g, '""')}"`,
      `"${(t.productionOrder || '').replace(/"/g, '""')}"`,
      `"${(t.unit || '').replace(/"/g, '""')}"`,
      t.quantity,
      `"${(t.warehouseLocation || '').replace(/"/g, '""')}"`,
      t.status === 'completed' ? 'Đã nhập kho' : 'Chờ xử lý',
      new Date(t.createdAt).toLocaleString('vi-VN'),
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `phieu-kho-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã tải file CSV');
  };

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      !q ||
      t.code.toLowerCase().includes(q) ||
      t.materialCode.toLowerCase().includes(q) ||
      t.color.toLowerCase().includes(q) ||
      t.size.toLowerCase().includes(q) ||
      t.length.toLowerCase().includes(q) ||
      t.batchNumber.toLowerCase().includes(q) ||
      t.productionOrder.toLowerCase().includes(q) ||
      t.warehouseLocation.toLowerCase().includes(q) ||
      t.rawQr.toLowerCase().includes(q);

    const matchStatus = selectedStatus === 'all' || t.status === selectedStatus;
    const matchLocation =
      selectedLocation === 'all' || t.warehouseLocation === selectedLocation;

    return matchSearch && matchStatus && matchLocation;
  });

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="h-2.5 w-2.5" />
            Đã nhập
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
            <Ban className="h-2.5 w-2.5" />
            Đã hủy
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <Clock className="h-2.5 w-2.5" />
            Chờ kiểm
          </span>
        );
    }
  };

  const completedCount = tickets.filter((t) => t.status === 'completed').length;
  const pendingCount = tickets.filter((t) => t.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans transition-colors pb-10">
      {/* App Header */}
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
        <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
          <span className="font-semibold">
            Tổng: <strong className="text-slate-900 dark:text-white">{tickets.length}</strong>
          </span>
          <span className="h-3 w-px bg-slate-200 dark:bg-slate-800" />
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            Đã nhập: <strong>{completedCount}</strong>
          </span>
          <span className="h-3 w-px bg-slate-200 dark:bg-slate-800" />
          <span className="font-semibold text-amber-600 dark:text-amber-400">
            Chờ kiểm: <strong>{pendingCount}</strong>
          </span>
          <span className="h-3 w-px bg-slate-200 dark:bg-slate-800" />
          <button
            type="button"
            onClick={handleExportCSV}
            className="text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-600 flex items-center gap-1"
            title="Xuất file CSV"
          >
            <Download className="h-3.5 w-3.5 text-slate-400" />
            <span>CSV</span>
          </button>
        </div>

        {/* 3. SEARCH INPUT */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            id="input-mobile-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm mã VT, màu, size, lô, kho..."
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

        {/* 4. FILTER CHIPS */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setSelectedStatus('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedStatus === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Tất cả ({tickets.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatus('completed')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedStatus === 'completed'
                ? 'bg-emerald-600 text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Đã nhập ({completedCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatus('pending')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedStatus === 'pending'
                ? 'bg-emerald-600 text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Chờ kiểm ({pendingCount})
          </button>
        </div>

        {/* 5. TICKET CARDS LIST (MOBILE OPTIMIZED) */}
        <div className="space-y-2.5 pt-1">
          {filteredTickets.length === 0 ? (
            /* Empty State */
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                <Package className="h-6 w-6" />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Chưa có phiếu vật tư
              </p>
              <p className="text-[11px] text-slate-400 mb-4">
                Bấm nút &quot;Quét QR&quot; hoặc &quot;Tạo phiếu&quot; để thêm phiếu mới.
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
                {/* Card Top: Code, Status & Time */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {t.code}
                    </span>
                    {getStatusBadge(t.status)}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(t.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                {/* Material Code Title */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block leading-none">
                    Mã vật tư:
                  </span>
                  <h3 className="text-sm font-black font-mono text-slate-900 dark:text-white truncate">
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
                        {t.warehouseLocation || 'Chưa gán'}
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
        onToggleStatus={handleToggleStatus}
        onCopyText={handleCopyText}
      />

      {/* TOAST NOTIFICATION */}
      <Toast message={toastMessage} />
    </div>
  );
}
