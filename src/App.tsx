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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-700/50 backdrop-blur-sm shadow-sm">
            <CheckCircle2 className="h-3 w-3" />
            Đã gửi MES
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100/80 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300 border border-rose-200/60 dark:border-rose-700/50 backdrop-blur-sm shadow-sm">
            <AlertCircle className="h-3 w-3" />
            Lỗi gửi MES
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100/80 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/50 backdrop-blur-sm shadow-sm">
            <Clock className="h-3 w-3" />
            Đã lưu
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-emerald-50/40 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20 dark:text-slate-100 flex flex-col font-sans transition-colors pb-8 selection:bg-emerald-500/30">
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
      <main className="flex-1 max-w-md sm:max-w-xl w-full mx-auto px-4 py-4 space-y-4">
        {/* SEARCH INPUT */}
        <div className="space-y-3">
          <div className="relative group">
            <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <input
              id="input-mobile-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm mã VT, màu, size, lô, vị trí, ghi chú..."
              className="w-full h-12 pl-11 pr-10 rounded-full glass-panel text-[13px] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50 transition-all relative z-10"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors z-10"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Clean Action Bar: Ticket count & Refresh button (không hiển thị mã user và mã kho trên UI) */}
          <div className="flex items-center justify-between px-2 text-xs">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wide">
              Danh sách kiểm kê ({tickets.length} phiếu)
            </span>

            <button
              type="button"
              onClick={() => loadInventory(scannedByUserId)}
              disabled={isLoadingList}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-panel text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:border-emerald-200/60 dark:hover:border-emerald-800/60 transition-all disabled:opacity-50"
              title="Tải lại danh sách từ máy chủ MES"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isLoadingList ? 'animate-spin text-emerald-600' : ''}`}
              />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* API Error Notification */}
        {listError && (
          <div className="p-3.5 rounded-2xl glass-panel !bg-rose-50/80 dark:!bg-rose-950/40 !border-rose-200 dark:!border-rose-900 text-rose-800 dark:text-rose-200 text-[13px] flex items-center justify-between gap-3 shadow-rose-900/5">
            <span className="font-medium">{listError}</span>
            <button
              type="button"
              onClick={() => loadInventory(scannedByUserId)}
              className="text-xs font-bold underline shrink-0 hover:text-rose-950 dark:hover:text-rose-100 px-2 py-1"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* TICKET CARDS LIST (MOBILE OPTIMIZED) - CHỈ LẤY DANH SÁCH TỪ API */}
        <div className="space-y-3 pt-1">
          {isLoadingList && tickets.length === 0 ? (
            <div className="p-10 rounded-3xl glass-panel text-center flex flex-col items-center justify-center animate-pulse">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-3" />
              <p className="text-sm font-medium text-slate-500">
                Đang tải dữ liệu từ MES...
              </p>
            </div>
          ) : filteredTickets.length === 0 ? (
            /* Empty State with Lien Chau Branding */
            <div className="p-10 rounded-3xl glass-panel text-center flex flex-col items-center justify-center">
              <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-full border border-emerald-100 dark:border-emerald-800/50">
                <LienChauLogo size="lg" />
              </div>
              <p className="text-base font-black text-slate-800 dark:text-slate-200 mb-1">
                Chưa có phiếu kiểm kê
              </p>
              <p className="text-xs text-slate-500 mb-6 max-w-[250px] leading-relaxed">
                Đưa camera quét mã QR trên cuộn vải hoặc vật tư để tạo và gửi dữ liệu vào MES.
              </p>
              <button
                type="button"
                onClick={() => {
                  setScannedMaterialQr(null);
                  setScannedLocationQr(null);
                  setIsCreateModalOpen(true);
                  handleOpenMaterialScanner();
                }}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-95 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all duration-200"
              >
                <Camera className="h-5 w-5" />
                <span className="tracking-wide">Quét mã ngay</span>
              </button>
            </div>
            filteredTickets.map((t) => (
              <div
                key={t.id}
                onClick={() => setViewingTicket(t)}
                className="p-4 rounded-3xl glass-panel hover:border-emerald-500/40 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] transition-all duration-300 cursor-pointer space-y-3.5 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100/30 to-transparent dark:from-emerald-900/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:opacity-100 opacity-60 transition-opacity"></div>
                
                {/* Card Top: Item ID, MES Status & Time */}
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 font-mono font-bold text-[11px] shadow-sm">
                      #{t.id}
                    </span>
                    {getMesBadge(t.mesSyncStatus)}
                  </div>
                  <span className="text-[10px] text-slate-500/80 dark:text-slate-400 font-mono font-medium tracking-wide">
                    {new Date(t.createdAt).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    - {new Date(t.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                {/* Material Code Title */}
                <div className="relative z-10 pt-1">
                  <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-slate-500 block mb-1">
                    Mã vật tư:
                  </span>
                  <h3 className="text-[17px] font-black font-mono text-emerald-700 dark:text-emerald-400 truncate tracking-tight">
                    {t.materialCode || '(Chưa có mã VT)'}
                  </h3>
                </div>

                {/* 6 Fields Compact Summary Grid */}
                <div className="grid grid-cols-3 gap-2.5 text-[11px] p-3 rounded-[1.25rem] bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 relative z-10 shadow-inner">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-1">
                      Màu:
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {t.color || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-1">
                      Size:
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {t.size || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-1">
                      Length:
                    </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {t.length || '—'}
                    </span>
                  </div>
                  <div className="col-span-1 pt-0.5">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-1">
                      Lô SX:
                    </span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300 truncate block">
                      {t.batchNumber || '—'}
                    </span>
                  </div>
                  <div className="col-span-2 pt-0.5">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-1">
                      Lệnh SX:
                    </span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300 truncate block">
                      {t.productionOrder || '—'}
                    </span>
                  </div>
                </div>

                {/* Mô tả vật tư - Luôn hiển thị ra ngoài */}
                <div className="text-[12px] text-slate-700 dark:text-slate-300 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-[1.25rem] border border-emerald-100/50 dark:border-emerald-900/30 flex items-start gap-2 relative z-10">
                  <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 opacity-80" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600/70 dark:text-emerald-500/70 block mb-0.5">
                      Mô tả:
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 line-clamp-2 break-words leading-snug">
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
                <div className="flex items-center justify-between pt-1 relative z-10">
                  <div className="flex items-center gap-2.5">
                    {/* Quantity Pill */}
                    <span className="text-[13px] font-black px-3 py-1 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-emerald-900/60 dark:to-teal-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50 font-mono shadow-sm">
                      {formatQuantity(t.quantity).replace(/\./g, ',')} <span className="text-[10px] font-sans font-bold opacity-80 uppercase ml-0.5">{t.unit}</span>
                    </span>

                    {/* Location Badge */}
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold px-2.5 py-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                      <MapPin className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="truncate max-w-[110px]">
                        {t.warehouseLocation || 'A1-02'}
                      </span>
                    </span>
                  </div>

                  {/* Actions: Edit, Delete, Copy, Detail */}
                  <div
                    className="flex items-center gap-1 bg-white/60 dark:bg-slate-900/60 rounded-2xl p-1 border border-slate-100 dark:border-slate-800/60 shadow-sm backdrop-blur-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Nút Sửa: Chỉ sửa đơn vị tính, số lượng, ghi chú */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTicket(t);
                      }}
                      className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-900/50 dark:hover:text-emerald-300 transition-all"
                      title="Chỉnh sửa (ĐVT, số lượng, ghi chú)"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>

                    {/* Nút Xóa: Gọi API DELETE /api/FinishedGoodInventory/{id} */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTicket(t.id);
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/50 dark:hover:text-rose-400 transition-all"
                      title="Xóa dòng kiểm kê trên MES"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyText(t.rawQr || t.materialCode);
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800/80 transition-all"
                      title="Sao chép"
                    >
                      <Copy className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewingTicket(t)}
                      className="p-2 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-900/50 transition-all"
                      title="Chi tiết"
                    >
                      <Eye className="h-4 w-4" />
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
