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
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Building2,
  Package,
  Hash,
  CalendarClock,
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
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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

  const groupedTickets = filteredTickets.reduce((acc, t) => {
    const loc = t.warehouseLocation || 'Chưa phân bổ';
    if (!acc[loc]) acc[loc] = [];
    acc[loc].push(t);
    return acc;
  }, {} as Record<string, MaterialTicket[]>);

  const groupEntries = Object.entries(groupedTickets);
  const totalPages = Math.ceil(groupEntries.length / ITEMS_PER_PAGE);
  const paginatedGroups = groupEntries.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getWarehouseName = (code: string) => {
    const upper = (code || '').toUpperCase();
    if (upper === 'FGW') return 'Thành phẩm';
    if (upper === 'RMW') return 'Nguyên liệu';
    return upper;
  };

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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-50 via-gray-50 to-emerald-50/40 text-slate-900 flex flex-col font-sans transition-colors">
      {/* Top App Bar from MES (Hidden per request) */}
      <div className="hidden">
        <Header
          ticketCount={tickets.length}
          beepEnabled={beepEnabled}
          onToggleBeep={() => setBeepEnabled((prev) => !prev)}
          onOpenCreateTicket={handleStartInventoryFlow}
          onOpenQuickScan={handleStartInventoryFlow}
          onExportCSV={handleExportCSV}
          onOpenVersionModal={() => setIsVersionModalOpen(true)}
        />
      </div>

      {/* Main Content Screen */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 space-y-5">
        
        {/* Hero Section */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="hidden items-center gap-4 mb-5">
            <div className="bg-emerald-700 text-white p-3.5 rounded-2xl shadow-sm">
              <FileText className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Kiểm kê kho Thành phẩm</h2>
              <p className="text-sm text-slate-500 mt-0.5">Quản lý và ghi nhận thông tin kiểm kê vật tư kho thành phẩm FGW</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="input-mobile-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm mã VT, QR, vị trí, lô..."
                className="w-full h-12 pl-11 pr-10 rounded-2xl border border-slate-200/80 bg-white/60 backdrop-blur-sm text-[13px] text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all shadow-sm relative z-10"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button type="button" className="hidden flex-1 sm:flex-none h-11 px-4 rounded-xl border border-slate-200 text-emerald-700 items-center justify-center bg-white hover:bg-slate-50 transition-colors" title="Bộ lọc">
                <Filter className="h-4 w-4" />
              </button>
              <button type="button" onClick={handleExportCSV} className="hidden flex-1 sm:flex-none h-11 px-4 rounded-xl border border-slate-200 text-emerald-700 items-center justify-center bg-white hover:bg-slate-50 transition-colors" title="Tải xuống CSV">
                <Download className="h-4 w-4" />
              </button>
              <button 
                type="button"
                onClick={handleStartInventoryFlow}
                className="flex-1 sm:flex-none h-12 px-7 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 relative z-10"
              >
                <Camera className="h-4 w-4" />
                Kiểm kê
              </button>
            </div>
          </div>
        </div>

        {/* Total Tickets Indicator instead of Tabs */}
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-3 text-slate-700">
            <div className="p-2.5 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-xl shadow-inner border border-white">
              <FileText className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="font-bold text-[15px]">Tổng số phiếu</span>
          </div>
          <span className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-black text-sm px-3.5 py-1.5 rounded-full shadow-md shadow-emerald-500/20">
            {filteredTickets.length}
          </span>
        </div>

        {/* API Error Notification */}
        {listError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[13px] flex items-center justify-between gap-3 shadow-sm">
            <span className="font-medium">{listError}</span>
            <button
              type="button"
              onClick={() => loadInventory(scannedByUserId)}
              className="text-xs font-bold underline shrink-0 hover:text-rose-950 px-2 py-1"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Cards */}
        <div className="space-y-4">
          {isLoadingList && tickets.length === 0 ? (
            <div className="p-10 bg-white rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center animate-pulse">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-700 mb-3" />
              <p className="text-sm font-medium text-slate-500">
                Đang tải dữ liệu từ MES...
              </p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-10 bg-white rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center">
              <p className="text-base font-bold text-slate-800 mb-2">
                Chưa có dữ liệu kiểm kê
              </p>
              <p className="text-sm text-slate-500 mb-6 max-w-xs">
                Bấm nút Kiểm kê phía trên để bắt đầu quét mã.
              </p>
            </div>
          ) : (
            paginatedGroups.map(([location, locationTickets]) => (
              <div key={location} className="mb-6 last:mb-0">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-emerald-100 rounded-xl shadow-inner border border-white">
                    <MapPin className="h-5 w-5 text-emerald-700" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 flex-1">
                    {location}
                  </h3>
                  <span className="bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded-lg text-sm border border-emerald-200/50 shadow-sm">
                    {locationTickets.length} phiếu
                  </span>
                </div>
                
                <div className="space-y-4 pl-3 sm:pl-5 border-l-2 border-emerald-100/60 ml-4 relative">
                  {locationTickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setViewingTicket(t)}
                      className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-4 hover:shadow-[0_4px_20px_rgb(16,185,129,0.12)] hover:-translate-y-0.5 hover:border-emerald-200 cursor-pointer transition-all duration-300 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-100/30 to-transparent rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none group-hover:opacity-100 opacity-60 transition-opacity"></div>
                      
                      {/* Header row */}
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-base font-black text-slate-800 font-sans tracking-tight relative z-10">
                          {t.materialCode || '(Chưa có mã VT)'}
                        </h3>
                        <span className="inline-flex px-2.5 py-1 bg-gradient-to-br from-emerald-100 to-teal-50 text-emerald-700 text-xs font-black rounded-lg border border-emerald-200/50 shadow-sm relative z-10">
                          {formatQuantity(t.quantity).replace(/\./g, ',')} <span className="text-[10px] uppercase ml-1 mt-0.5 opacity-80">{t.unit}</span>
                        </span>
                      </div>
                      
                      {/* Detail rows */}
                      <div className="space-y-1.5 text-xs text-slate-500 mb-3 relative z-10">
                        <div className="flex items-center">
                          <Building2 className="h-3 w-3 text-slate-400 mr-1.5" />
                          <span>Kho:</span> <span className="font-bold text-slate-800 ml-1">{getWarehouseName(t.warehouseCode || warehouseCode || 'FGW')}</span>
                        </div>
                        <div className="flex items-center">
                          <Package className="h-3 w-3 text-slate-400 mr-1.5" />
                          <span>Lô SX:</span> <span className="text-slate-700 ml-1">{t.batchNumber || '—'}</span>
                          <span className="text-slate-300 mx-2">|</span>
                          <Hash className="h-3 w-3 text-slate-400 mr-1.5" />
                          <span>Lệnh SX:</span> <span className="text-slate-700 ml-1">{t.productionOrder || '—'}</span>
                        </div>
                      </div>
                      
                      {/* Actions row */}
                      <div className="pt-2.5 border-t border-slate-100/80 flex justify-between items-center relative z-10">
                        <div className="flex items-center text-slate-400 text-[11px]">
                          <CalendarClock className="h-3 w-3 mr-1" />
                          {new Date(t.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} {new Date(t.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTicket(t.id);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-gradient-to-r hover:from-rose-500 hover:to-red-500 hover:text-white hover:shadow-md hover:shadow-rose-500/30 active:scale-95 rounded-lg text-xs font-bold transition-all duration-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 p-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mt-4">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100/80 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-bold text-slate-700 bg-slate-100/50 px-4 py-1.5 rounded-full">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100/80 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-4 py-6 text-center text-sm text-slate-500 bg-slate-100 border-t border-slate-200">
        © 2026 Dệt Liên Châu. Được phát triển & bảo trì bởi IT Liên Châu.
      </footer>

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
