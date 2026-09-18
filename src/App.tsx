/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Camera,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Copy,
  Eye,
  Trash2,
  MapPin,
  X,
  FileText,
  Edit3,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Header } from './components/Header';
import { MaterialTicketCreateModal } from './components/MaterialTicketCreateModal';
import { MaterialTicketDetailModal } from './components/MaterialTicketDetailModal';
import { EditInventoryModal } from './components/EditInventoryModal';
import { DirectCameraModal } from './components/DirectCameraModal';
import { LocationStepModal } from './components/LocationStepModal';
import { VersionInfoModal } from './components/VersionInfoModal';
import { ScanErrorModal, ScanErrorInfo } from './components/ScanErrorModal';
import { LienChauLogo } from './components/LienChauLogo';
import { Toast } from './components/Toast';
import { MaterialTicket } from './types';
import { APP_VERSION } from './config/version';
import { getAppUrlParams } from './utils/urlParams';
import {
  SAMPLE_MATERIAL_QRS,
  SAMPLE_WAREHOUSE_LOCATIONS,
  parseMaterialQr,
} from './utils/materialQrParser';
import {
  sendToMesInventory,
  fetchInventoryByUser,
  updateInventoryItem,
  deleteInventoryItem,
} from './services/mesApi';

export default function App() {
  // Lấy userid và warehouseCode trực tiếp từ URL params (?userid=...&warehouseCode=...)
  // Không cần hiển thị nhập/chọn trên giao diện
  const urlConfig = getAppUrlParams();
  const [scannedByUserId] = useState<string>(urlConfig.userId);
  const [warehouseCode] = useState<string>(urlConfig.warehouseCode);

  // Inventory items loaded directly from MES API by scannedBy ID
  const [tickets, setTickets] = useState<MaterialTicket[]>([]);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);
  const [listError, setListError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [scanError, setScanError] = useState<ScanErrorInfo | null>(null);
  const [scannerTarget, setScannerTarget] = useState<'material' | 'location'>('material');
  const [viewingTicket, setViewingTicket] = useState<MaterialTicket | null>(null);
  const [editingTicket, setEditingTicket] = useState<MaterialTicket | null>(null);

  // Active warehouse location state (persisted across scans)
  const [currentLocation, setCurrentLocation] = useState<string>(() => {
    return localStorage.getItem('lc_inventory_active_location') || '';
  });

  const handleSetCurrentLocation = (loc: string) => {
    const clean = loc.trim();
    setCurrentLocation(clean);
    if (clean) {
      localStorage.setItem('lc_inventory_active_location', clean);
    } else {
      localStorage.removeItem('lc_inventory_active_location');
    }
  };

  // Scanned QR values passed into create modal
  const [scannedMaterialQr, setScannedMaterialQr] = useState<string | null>(null);
  const [scannedLocationQr, setScannedLocationQr] = useState<string | null>(null);

  // Audio settings, loading and toast
  const [beepEnabled, setBeepEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Fetch inventory list from MES API: GET /api/FinishedGoodInventory/by-user/{scannedBy}
  const loadInventory = useCallback(
    async (userId: string = scannedByUserId, fresh: boolean = false) => {
      if (tickets.length === 0) {
        setIsLoadingList(true);
      }
      setListError(null);
      try {
        const res = await fetchInventoryByUser(userId, fresh);
        if (res.success) {
          setTickets(res.data);
        } else {
          setListError(res.error || 'Không thể tải danh sách kiểm kê');
        }
      } catch (err: any) {
        setListError(err.message || 'Lỗi kết nối máy chủ MES');
      } finally {
        setIsLoadingList(false);
      }
    },
    [scannedByUserId, tickets.length]
  );

  // Load inventory on initial mount
  useEffect(() => {
    loadInventory(scannedByUserId);
  }, [loadInventory, scannedByUserId]);

  // Quy trình chuẩn: Bấm Tạo phiếu -> Mở popup điền thông tin vị trí kệ kho (Bước 1), vị trí bỏ trống
  const handleStartInventoryFlow = () => {
    handleSetCurrentLocation('');
    setScannedLocationQr(null);
    setIsCreateModalOpen(false);
    setIsScannerModalOpen(false);
    setIsLocationModalOpen(true);
  };

  // Đổi sang vị trí kệ khác -> Mở lại popup chọn vị trí
  const handleSwitchLocation = () => {
    setIsScannerModalOpen(false);
    setIsCreateModalOpen(false);
    setIsLocationModalOpen(true);
  };

  // Mở camera quét tem vị trí từ popup vị trí
  const handleOpenLocationScanner = () => {
    setIsLocationModalOpen(false);
    setScannerTarget('location');
    setIsScannerModalOpen(true);
  };

  // Open camera scanner for Material QR
  const handleOpenMaterialScanner = () => {
    setIsCreateModalOpen(false);
    setScannerTarget('material');
    setIsScannerModalOpen(true);
  };

  // Khi người dùng bấm "Tiếp tục" từ popup vị trí: chọn quét tiếp bằng camera hay tự điền
  const handleConfirmLocation = (loc: string, nextAction: 'scan' | 'manual') => {
    handleSetCurrentLocation(loc);
    setIsLocationModalOpen(false);
    setScannedLocationQr(null);

    if (nextAction === 'scan') {
      // Qua bước quét QR vật tư bằng Camera
      setScannerTarget('material');
      setScannedMaterialQr(null);
      setTimeout(() => {
        setIsScannerModalOpen(true);
      }, 250);
      showToast(`Vị trí: ${loc} — Quét mã QR vật tư`);
    } else {
      // Tự điền thông tin phiếu
      setScannedMaterialQr(null);
      setIsCreateModalOpen(true);
      showToast(`Vị trí: ${loc} — Tự điền thông tin phiếu`);
    }
  };

  // Chuyển sang tự điền thông tin ngay từ camera scanner
  const handleManualEntryFromCamera = () => {
    setIsScannerModalOpen(false);
    setScannedMaterialQr(null);
    setIsCreateModalOpen(true);
  };

  // Camera scan success handler
  const handleScanSuccess = (scannedRaw: string) => {
    setIsScannerModalOpen(false);

    if (scannerTarget === 'location') {
      const cleanLoc = scannedRaw.trim();
      if (!cleanLoc) {
        setScanError({
          type: 'location_error',
          title: 'Mã vị trí kho không hợp lệ',
          message: 'Dữ liệu quét vị trí kho bị rỗng hoặc không đọc được.',
          rawQr: scannedRaw,
        });
        return;
      }

      handleSetCurrentLocation(cleanLoc);
      setScannedLocationQr(cleanLoc);
      showToast(`Đã nhận vị trí: ${cleanLoc}`);

      // Quay lại popup vị trí với giá trị đã được điền
      setIsLocationModalOpen(true);
    } else {
      // scannerTarget === 'material'
      const parsed = parseMaterialQr(scannedRaw);
      if (!parsed.isValid) {
        setScanError({
          type: 'invalid_format',
          title: 'Mã QR không đúng quy chuẩn',
          message:
            parsed.errorReason ||
            'Mã QR vật tư không đủ 6 trường thông tin hoặc sai định dạng quy chuẩn của Liên Châu.',
          rawQr: scannedRaw,
          parsed,
        });
        return;
      }

      setScannedMaterialQr(scannedRaw);
      setIsCreateModalOpen(true);
      showToast(`Đã quét mã: ${parsed.materialCode}`);
    }
  };

  // Camera scanner error handler
  const handleCameraScanError = (errInfo: ScanErrorInfo) => {
    setIsScannerModalOpen(false);
    setScanError(errInfo);
  };

  const handleRescanFromError = () => {
    setScanError(null);
    setIsScannerModalOpen(true);
  };

  const handleContinueAnywayFromError = () => {
    if (scanError?.rawQr) {
      if (scannerTarget === 'material') {
        setScannedMaterialQr(scanError.rawQr);
      } else {
        setScannedLocationQr(scanError.rawQr);
        handleSetCurrentLocation(scanError.rawQr.trim());
      }
    }
    setScanError(null);
    setIsCreateModalOpen(true);
  };

  // Save new material ticket & call MES API: POST /api/FinishedGoodInventory
  // Khi quét QR xong, điền hết thông tin và bấm nút submit thì tiếp tục quét QR tiếp!
  const handleSaveTicket = async (
    newTicket: MaterialTicket,
    action: 'continue' | 'close' = 'continue'
  ) => {
    setIsSaving(true);
    try {
      const ticketLocation = newTicket.warehouseLocation || currentLocation || 'A1-02';
      if (!currentLocation && newTicket.warehouseLocation) {
        handleSetCurrentLocation(newTicket.warehouseLocation);
      }

      const ticketToSave: MaterialTicket = {
        ...newTicket,
        warehouseLocation: ticketLocation,
        scannedBy: scannedByUserId,
        warehouseCode: warehouseCode,
      };

      const mesRes = await sendToMesInventory(ticketToSave);
      setScannedMaterialQr(null);

      if (mesRes.success) {
        showToast(`Đã lưu & gửi MES thành công: ${ticketToSave.materialCode}!`);
      } else {
        showToast(`Đã lưu phiếu (Lỗi gửi MES: ${mesRes.error || 'Kiểm tra mạng'})`);
      }

      // Re-fetch directly from MES API ngầm
      loadInventory(scannedByUserId);

      if (action === 'continue') {
        // Tiếp tục quét QR tiếp tại vị trí hiện tại
        setIsCreateModalOpen(false);
        setScannerTarget('material');
        setTimeout(() => {
          setIsScannerModalOpen(true);
        }, 350);
      } else {
        // Dừng quét & đóng modal
        setIsCreateModalOpen(false);
      }
    } catch (err: any) {
      showToast(`Lỗi gửi dữ liệu: ${err.message || 'Không thể kết nối'}`);
      loadInventory(scannedByUserId);
    } finally {
      setIsSaving(false);
    }
  };

  // Edit ticket: PUT /api/FinishedGoodInventory/{id}
  const handleSaveEdit = async (
    id: string,
    updatedData: { quantity: number; unit: string; note: string }
  ): Promise<boolean> => {
    // 1. Optimistic update: Update tickets state immediately (0ms latency for user)
    const previousTickets = [...tickets];
    setTickets((prev) =>
      prev.map((t) =>
        String(t.id) === String(id)
          ? {
              ...t,
              quantity: updatedData.quantity,
              unit: updatedData.unit,
              notes: updatedData.note,
            }
          : t
      )
    );
    if (viewingTicket?.id === id) {
      setViewingTicket((prev) =>
        prev
          ? {
              ...prev,
              quantity: updatedData.quantity,
              unit: updatedData.unit,
              notes: updatedData.note,
            }
          : null
      );
    }

    try {
      const res = await updateInventoryItem(id, updatedData);
      if (res.success) {
        showToast(res.message || 'Đã cập nhật bản ghi kiểm kê thành công');
        // Background sync to ensure consistency
        loadInventory(scannedByUserId, true);
        return true;
      } else {
        // Rollback on server error
        setTickets(previousTickets);
        showToast(`Cập nhật thất bại: ${res.error || 'Lỗi không xác định'}`);
        return false;
      }
    } catch (err: any) {
      setTickets(previousTickets);
      showToast(`Lỗi cập nhật: ${err.message || 'Không thể kết nối'}`);
      return false;
    }
  };

  // Delete ticket: DELETE /api/FinishedGoodInventory/{id}
  const handleDeleteTicket = async (id: string) => {
    // 1. Optimistic delete: remove card immediately from UI
    const previousTickets = [...tickets];
    setTickets((prev) => prev.filter((t) => String(t.id) !== String(id)));
    if (viewingTicket?.id === id) {
      setViewingTicket(null);
    }

    showToast(`Đang xóa bản ghi #${id}...`);
    try {
      const res = await deleteInventoryItem(id);
      if (res.success) {
        showToast(res.message || 'Đã xóa bản ghi kiểm kê thành công');
        // Background sync
        loadInventory(scannedByUserId, true);
      } else {
        // Rollback on failure
        setTickets(previousTickets);
        showToast(`Xóa thất bại: ${res.error || 'Lỗi không xác định'}`);
      }
    } catch (err: any) {
      setTickets(previousTickets);
      showToast(`Lỗi khi xóa: ${err.message || 'Không thể kết nối'}`);
    }
  };

  // Resend ticket to MES API
  const handleResendToMes = async (ticket: MaterialTicket) => {
    showToast('Đang gửi lại lên hệ thống MES...');
    const mesRes = await sendToMesInventory(ticket);

    if (mesRes.success) {
      showToast('Đã gửi MES thành công!');
      await loadInventory(scannedByUserId);
    } else {
      showToast(`Gửi lại thất bại: ${mesRes.error || 'Lỗi'}`);
    }
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
      'ID',
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
      `"${t.id}"`,
      `"${(t.materialCode || '').replace(/"/g, '""')}"`,
      `"${(t.color || '').replace(/"/g, '""')}"`,
      `"${(t.size || '').replace(/"/g, '""')}"`,
      `"${(t.length || '').replace(/"/g, '""')}"`,
      `"${(t.batchNumber || '').replace(/"/g, '""')}"`,
      `"${(t.productionOrder || '').replace(/"/g, '""')}"`,
      `"${(t.unit || '').replace(/"/g, '""')}"`,
      `"${t.quantity}"`,
      `"${(t.warehouseLocation || '').replace(/"/g, '""')}"`,
      `"${(t.warehouseCode || warehouseCode || 'FGW').replace(/"/g, '""')}"`,
      `"${(t.scannedBy || scannedByUserId || '105').replace(/"/g, '""')}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
      `"${t.mesSyncStatus || 'synced'}"`,
      `"${new Date(t.createdAt).toLocaleString('vi-VN')}"`,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MES_KiemKe_${scannedByUserId}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống file CSV');
  };

  // Filtered tickets by search term
  const filteredTickets = tickets.filter((t) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      t.id.toLowerCase().includes(term) ||
      (t.materialCode && t.materialCode.toLowerCase().includes(term)) ||
      (t.color && t.color.toLowerCase().includes(term)) ||
      (t.size && t.size.toLowerCase().includes(term)) ||
      (t.length && t.length.toLowerCase().includes(term)) ||
      (t.batchNumber && t.batchNumber.toLowerCase().includes(term)) ||
      (t.productionOrder && t.productionOrder.toLowerCase().includes(term)) ||
      (t.warehouseLocation && t.warehouseLocation.toLowerCase().includes(term)) ||
      (t.notes && t.notes.toLowerCase().includes(term))
    );
  });

  const formatQuantity = (qty: number | string | undefined | null) => {
    if (qty === undefined || qty === null || qty === '') return '0';
    const str = String(qty).replace(',', '.');
    const num = parseFloat(str);
    if (isNaN(num)) return str;
    return String(num);
  };

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
        onOpenCreateTicket={handleStartInventoryFlow}
        onOpenQuickScan={handleStartInventoryFlow}
        onExportCSV={handleExportCSV}
        onOpenVersionModal={() => setIsVersionModalOpen(true)}
      />

      {/* Main Mobile Screen */}
      <main className="flex-1 max-w-md sm:max-w-xl w-full mx-auto px-3.5 py-3 space-y-3">
        {/* SEARCH INPUT */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="input-mobile-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm mã VT, màu, size, lô, vị trí, ghi chú..."
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

          {/* Clean Action Bar: Ticket count & Refresh button (không hiển thị mã user và mã kho trên UI) */}
          <div className="flex items-center justify-between px-1 text-xs">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Danh sách kiểm kê ({tickets.length} phiếu)
            </span>

            <button
              type="button"
              onClick={() => loadInventory(scannedByUserId)}
              disabled={isLoadingList}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-colors disabled:opacity-50 shadow-2xs"
              title="Tải lại danh sách từ máy chủ MES"
            >
              <RefreshCw
                className={`h-3 w-3 ${isLoadingList ? 'animate-spin text-emerald-600' : ''}`}
              />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* API Error Notification */}
        {listError && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between gap-2">
            <span>{listError}</span>
            <button
              type="button"
              onClick={() => loadInventory(scannedByUserId)}
              className="text-[11px] font-bold underline shrink-0 hover:text-amber-950 dark:hover:text-amber-100"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* TICKET CARDS LIST (MOBILE OPTIMIZED) - CHỈ LẤY DANH SÁCH TỪ API */}
        <div className="space-y-2.5 pt-1">
          {isLoadingList && tickets.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mb-2" />
              <p className="text-xs text-slate-500">
                Đang tải danh sách kiểm kê từ máy chủ MES...
              </p>
            </div>
          ) : filteredTickets.length === 0 ? (
            /* Empty State with Lien Chau Branding */
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center">
              <div className="mb-3">
                <LienChauLogo size="lg" />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-0.5">
                Chưa có phiếu vật tư kiểm kê
              </p>
              <p className="text-[11px] text-slate-400 mb-4 max-w-xs">
                Đưa camera quét mã QR trên cuộn vải/vật tư để tạo và gửi dữ liệu vào MES.
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
                {/* Card Top: Item ID, MES Status & Time */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-[11px]">
                      #{t.id}
                    </span>
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
                    <span className="text-[9px] text-slate-400 block leading-none mb-0.5">
                      Màu:
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {t.color || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block leading-none mb-0.5">
                      Size:
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {t.size || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block leading-none mb-0.5">
                      Length:
                    </span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {t.length || '—'}
                    </span>
                  </div>
                  <div className="col-span-1">
                    <span className="text-[9px] text-slate-400 block leading-none mb-0.5">
                      Lô SX:
                    </span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 truncate block">
                      {t.batchNumber || '—'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] text-slate-400 block leading-none mb-0.5">
                      Lệnh SX:
                    </span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 truncate block">
                      {t.productionOrder || '—'}
                    </span>
                  </div>
                </div>

                {/* Mô tả vật tư - Luôn hiển thị ra ngoài */}
                <div className="text-[11px] text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/70 p-2 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block leading-tight">
                      Mô tả:
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 break-words">
                      {t.notes?.trim() ||
                        [
                          t.materialCode,
                          t.color && `Màu: ${t.color}`,
                          t.size && `Size: ${t.size}`,
                          t.length && t.length !== '0' && `Dài: ${t.length}`,
                          t.batchNumber && t.batchNumber !== '_' && `Lô: ${t.batchNumber}`,
                          t.productionOrder && `LSX: ${t.productionOrder}`,
                        ]
                          .filter(Boolean)
                          .join(' - ') ||
                        'Chưa có mô tả'}
                    </span>
                  </div>
                </div>

                {/* Card Bottom: Quantity, Location & Quick actions */}
                <div className="flex items-center justify-between pt-0.5">
                  <div className="flex items-center gap-2">
                    {/* Quantity Pill */}
              
<span className="text-xs font-black px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-mono">
  {formatQuantity(t.quantity).replace(/\./g, ',')} {t.unit}
</span>


                    {/* Location Badge */}
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      <MapPin className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="truncate max-w-[110px]">
                        {t.warehouseLocation || 'A1-02'}
                      </span>
                    </span>
                  </div>

                  {/* Actions: Edit, Delete, Copy, Detail */}
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Nút Sửa: Chỉ sửa đơn vị tính, số lượng, ghi chú */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTicket(t);
                      }}
                      className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
                      title="Chỉnh sửa (ĐVT, số lượng, ghi chú)"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>

                    {/* Nút Xóa: Gọi API DELETE /api/FinishedGoodInventory/{id} */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTicket(t.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                      title="Xóa dòng kiểm kê trên MES"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyText(t.rawQr || t.materialCode);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      title="Sao chép"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewingTicket(t)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400"
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
            <span className="font-bold text-emerald-600 dark:text-emerald-400 group-hover:underline">
              {APP_VERSION.version}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>Cập nhật: {APP_VERSION.updatedAt}</span>
          </button>
        </div>
      </main>

      {/* MODAL 0: LOCATION STEP MODAL (BƯỚC 1: ĐIỀN HOẶC QUÉT VỊ TRÍ) */}
      <LocationStepModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocation={currentLocation}
        scannedLocationQr={scannedLocationQr}
        onConfirmLocation={handleConfirmLocation}
        onOpenLocationScanner={handleOpenLocationScanner}
      />

      {/* MODAL 1: MATERIAL TICKET CREATION FORM */}
      <MaterialTicketCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onOpenMaterialScanner={handleOpenMaterialScanner}
        onOpenLocationScanner={handleOpenLocationScanner}
        onSwitchLocation={handleSwitchLocation}
        scannedMaterialQr={scannedMaterialQr}
        scannedLocationQr={scannedLocationQr}
        currentLocation={currentLocation}
        onSaveTicket={handleSaveTicket}
        onClearScannedMaterialQr={() => setScannedMaterialQr(null)}
        onClearScannedLocationQr={() => setScannedLocationQr(null)}
        onShowScanError={(err) => setScanError(err)}
        isSaving={isSaving}
        defaultWarehouseCode={warehouseCode}
        defaultScannedBy={scannedByUserId}
      />

      {/* MODAL 2: DIRECT CAMERA SCANNER */}
      <DirectCameraModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onScanSuccess={handleScanSuccess}
        onScanError={handleCameraScanError}
        scannerTarget={scannerTarget}
        currentLocation={currentLocation}
        onSwitchLocation={handleSwitchLocation}
        onManualEntry={handleManualEntryFromCamera}
        title={
          scannerTarget === 'material'
            ? 'Quét mã QR vật tư'
            : 'Bước 1: Quét vị trí kho'
        }
        description={
          scannerTarget === 'material'
            ? `Vị trí: ${currentLocation || 'A1-02'} — Đưa camera vào tem QR vật tư`
            : 'Đưa camera vào tem mã vị trí kệ kho'
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
        onEditTicket={(ticket) => setEditingTicket(ticket)}
        onCopyText={handleCopyText}
        onResendToMes={handleResendToMes}
      />

      {/* MODAL 4: EDIT INVENTORY MODAL (PUT API) */}
      <EditInventoryModal
        isOpen={!!editingTicket}
        ticket={editingTicket}
        onClose={() => setEditingTicket(null)}
        onSave={handleSaveEdit}
      />

      {/* MODAL 5: VERSION INFO MODAL */}
      <VersionInfoModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
      />

      {/* MODAL 6: SCAN ERROR POPUP */}
      <ScanErrorModal
        isOpen={!!scanError}
        error={scanError}
        onClose={() => setScanError(null)}
        onRescan={handleRescanFromError}
        onContinueAnyway={handleContinueAnywayFromError}
      />

      {/* TOAST NOTIFICATION */}
      <Toast message={toastMessage} />
    </div>
  );
}
