/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FilePlus2,
  Camera,
  QrCode,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Ban,
  Copy,
  Eye,
  Trash2,
  Sparkles,
  ArrowRight,
  Printer,
  Layers,
  FileCheck,
  Zap,
  Package,
  Palette,
  Maximize2,
  Ruler,
  Boxes,
  ClipboardList,
  MapPin,
  Table as TableIcon,
  LayoutGrid,
  Download,
  Check,
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
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

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
    }, 3000);
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
        showToast(
          `Đã quét & tách 6 trường (${parsed.delimiterUsed === '^^' ? 'Dấu ^^' : 'Dấu -'}): ${parsed.materialCode}`
        );
      } else {
        showToast('Đã nhận diện mã QR vật tư!');
      }
    } else {
      // Warehouse location: raw string without parsing
      setScannedLocationQr(scannedRaw);
      showToast(`Đã nhận diện vị trí kho: ${scannedRaw}`);
    }
  };

  // Save new material ticket
  const handleSaveTicket = (newTicket: MaterialTicket) => {
    setTickets((prev) => [newTicket, ...prev]);
    setScannedMaterialQr(null);
    setScannedLocationQr(null);
    showToast(`Đã tạo thành công phiếu ${newTicket.code} (${newTicket.materialCode})!`);
  };

  // Delete ticket
  const handleDeleteTicket = (id: string) => {
    setTickets((prev) => prev.filter((t) => t.id !== id));
    showToast('Đã xóa phiếu vật tư.');
  };

  // Toggle ticket status
  const handleToggleStatus = (id: string) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextStatus: TicketStatus =
            t.status === 'completed' ? 'pending' : 'completed';
          const updated = { ...t, status: nextStatus };
          if (viewingTicket && viewingTicket.id === id) {
            setViewingTicket(updated);
          }
          return updated;
        }
        return t;
      })
    );
    showToast('Đã cập nhật trạng thái phiếu.');
  };

  // Copy text helper
  const handleCopyText = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast('Đã sao chép vào bộ nhớ tạm!');
    }
  };

  // Export tickets to CSV
  const handleExportCSV = () => {
    if (tickets.length === 0) {
      showToast('Chưa có dữ liệu phiếu để xuất!');
      return;
    }

    const headers = [
      'Mã phiếu',
      'Mã vật tư',
      'Màu sắc',
      'Size',
      'Length',
      'Lô sản xuất',
      'Lệnh sản xuất',
      'Đơn vị tính',
      'Số lượng',
      'Vị trí kho',
      'Trạng thái',
      'Thời gian tạo',
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
    link.setAttribute('download', `phieu-vat-tu-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất file CSV thành công!');
  };

  // Distinct warehouse locations for filtering
  const distinctLocations = Array.from(
    new Set(tickets.map((t) => t.warehouseLocation).filter(Boolean))
  );

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            Đã nhập kho
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <Ban className="h-3 w-3" />
            Đã hủy
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="h-3 w-3" />
            Chờ xử lý
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans transition-colors">
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

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* HERO WORKFLOW CARD */}
        <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 overflow-hidden shadow-xl border border-indigo-800/40">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)`,
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-3">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span>Hỗ trợ định dạng QR: Mã vật tư ^^ Màu ^^ Size ^^ Length ^^ Lô SX ^^ Lệnh SX (hoặc dấu -)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                Quét QR Tách 6 Trường & Điền Vị Trí Kho Tự Động
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                Mở form tạo phiếu &rarr; Bấm quét camera &rarr; Rê vào mã QR để tự động lấy dữ liệu tách ra 6 trường, ẩn khung quét & điền kèm 3 trường (Đơn vị tính, Số lượng, Vị trí kho).
              </p>

              {/* Format badges preview */}
              <div className="flex flex-wrap items-center gap-1.5 mt-3 text-[11px]">
                <span className="text-slate-400 font-semibold">Cấu trúc 6 trường:</span>
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-indigo-200 font-mono">1. Mã vật tư</span>
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-pink-200 font-mono">2. Màu</span>
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-cyan-200 font-mono">3. Size</span>
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-amber-200 font-mono">4. Length</span>
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-emerald-200 font-mono">5. Lô SX</span>
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-purple-200 font-mono">6. Lệnh SX</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                id="btn-open-create-material-ticket"
                type="button"
                onClick={() => {
                  setScannedMaterialQr(null);
                  setScannedLocationQr(null);
                  setIsCreateModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 hover:scale-[1.02] transition-all"
              >
                <FilePlus2 className="h-4 w-4" />
                <span>+ Tạo Phiếu Mới</span>
              </button>

              <button
                id="btn-scan-qr-direct"
                type="button"
                onClick={() => {
                  setScannedMaterialQr(null);
                  setScannedLocationQr(null);
                  setIsCreateModalOpen(true);
                  handleOpenMaterialScanner();
                }}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-100 text-sm font-semibold border border-slate-700 transition-all"
              >
                <Camera className="h-4 w-4 text-cyan-400" />
                <span>Quét QR Bằng Camera</span>
              </button>
            </div>
          </div>
        </div>

        {/* SUMMARY STATS TILES */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Tổng số phiếu vật tư
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {tickets.length}
              </span>
              <Package className="h-4 w-4 text-indigo-500" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Đã nhập kho
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {tickets.filter((t) => t.status === 'completed').length}
              </span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Chờ xử lý / Đang kiểm
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                {tickets.filter((t) => t.status === 'pending').length}
              </span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Vị trí kho đang lưu
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                {distinctLocations.length}
              </span>
              <MapPin className="h-4 w-4 text-indigo-500" />
            </div>
          </div>
        </div>

        {/* SEARCH & FILTER CONTROLS */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="input-search-material-tickets"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo Mã vật tư, Màu, Size, Length, Lô SX, Lệnh SX, Vị trí kho..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Filters & View switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status filter */}
            <select
              id="select-material-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="completed">Đã nhập kho</option>
              <option value="pending">Chờ xử lý</option>
            </select>

            {/* Warehouse Location filter */}
            <select
              id="select-material-location"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tất cả vị trí kho</option>
              {distinctLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Dạng bảng dữ liệu"
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Bảng</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Dạng thẻ lưới"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Thẻ</span>
              </button>
            </div>

            {/* Export CSV button */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
              title="Xuất danh sách ra file CSV Excel"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden sm:inline">Xuất CSV</span>
            </button>
          </div>
        </div>

        {/* TICKET LIST SECTION */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-indigo-500" />
              <span>Danh Sách Phiếu Vật Tư ({filteredTickets.length})</span>
            </h3>

            <button
              type="button"
              onClick={() => {
                setScannedMaterialQr(null);
                setScannedLocationQr(null);
                setIsCreateModalOpen(true);
              }}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>+ Thêm phiếu mới</span>
            </button>
          </div>

          {filteredTickets.length === 0 ? (
            /* Empty State */
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center flex flex-col items-center justify-center">
              <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-500 flex items-center justify-center mb-3">
                <Package className="h-7 w-7" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Không tìm thấy phiếu vật tư nào
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-5">
                {searchTerm || selectedStatus !== 'all' || selectedLocation !== 'all'
                  ? 'Không có phiếu nào khớp với bộ lọc tìm kiếm hiện tại.'
                  : 'Hãy bấm "Tạo Phiếu Mới" hoặc dùng camera quét mã QR để lưu phiếu vật tư đầu tiên.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedStatus('all');
                  setSelectedLocation('all');
                  setScannedMaterialQr(null);
                  setScannedLocationQr(null);
                  setIsCreateModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md transition-colors"
              >
                <FilePlus2 className="h-4 w-4" />
                <span>Tạo phiếu mới ngay</span>
              </button>
            </div>
          ) : viewMode === 'table' ? (
            /* TABLE VIEW: Displays all 6 QR fields + 3 additional fields clearly */
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3">Mã phiếu</th>
                      <th className="py-3 px-3">Mã vật tư (1)</th>
                      <th className="py-3 px-3">Màu (2)</th>
                      <th className="py-3 px-3">Size (3)</th>
                      <th className="py-3 px-3">Length (4)</th>
                      <th className="py-3 px-3">Lô SX (5)</th>
                      <th className="py-3 px-3">Lệnh SX (6)</th>
                      <th className="py-3 px-3">ĐVT & SL</th>
                      <th className="py-3 px-3">Vị trí kho</th>
                      <th className="py-3 px-3">Trạng thái</th>
                      <th className="py-3 px-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredTickets.map((t) => (
                      <tr
                        key={t.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Code */}
                        <td className="py-3 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {t.code}
                        </td>

                        {/* 1. Mã vật tư */}
                        <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                          <button
                            type="button"
                            onClick={() => setViewingTicket(t)}
                            className="hover:underline text-left"
                          >
                            {t.materialCode || '—'}
                          </button>
                        </td>

                        {/* 2. Màu */}
                        <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">
                          {t.color || '—'}
                        </td>

                        {/* 3. Size */}
                        <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                          {t.size || '—'}
                        </td>

                        {/* 4. Length */}
                        <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                          {t.length || '—'}
                        </td>

                        {/* 5. Lô SX */}
                        <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                          {t.batchNumber || '—'}
                        </td>

                        {/* 6. Lệnh SX */}
                        <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                          {t.productionOrder || '—'}
                        </td>

                        {/* ĐVT & SL */}
                        <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {t.quantity} {t.unit}
                        </td>

                        {/* Vị trí kho */}
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                            <MapPin className="h-3 w-3 text-emerald-500" />
                            {t.warehouseLocation || 'Chưa gán'}
                          </span>
                        </td>

                        {/* Trạng thái */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {getStatusBadge(t.status)}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setViewingTicket(t)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                              title="Xem chi tiết phiếu"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyText(t.rawQr || t.materialCode)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Sao chép dữ liệu QR"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTicket(t.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950"
                              title="Xóa phiếu"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* CARDS GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTickets.map((t) => (
                <div
                  key={t.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md hover:border-indigo-400/60 dark:hover:border-indigo-600/60 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Header: Code & Status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                        {t.code}
                      </span>
                      {getStatusBadge(t.status)}
                    </div>

                    {/* Material Code */}
                    <h4
                      onClick={() => setViewingTicket(t)}
                      className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors cursor-pointer line-clamp-1 mb-2 font-mono"
                    >
                      {t.materialCode || '(Chưa có mã vật tư)'}
                    </h4>

                    {/* 6 QR Fields Mini Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Màu:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                          {t.color || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Size / Kích cỡ:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                          {t.size || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Length:</span>
                        <span className="font-mono font-medium text-slate-800 dark:text-slate-200 truncate block">
                          {t.length || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Lô SX:</span>
                        <span className="font-mono font-medium text-slate-800 dark:text-slate-200 truncate block">
                          {t.batchNumber || '—'}
                        </span>
                      </div>
                    </div>

                    {/* Additional fields: ĐVT, SL, Vị trí kho */}
                    <div className="flex items-center justify-between text-xs pt-1 mb-2">
                      <div className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {t.quantity} {t.unit}
                      </div>

                      <div className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <MapPin className="h-3 w-3 text-emerald-500" />
                        <span>{t.warehouseLocation || 'Chưa gán'}</span>
                      </div>
                    </div>

                    {/* QR raw snippet */}
                    {t.rawQr && (
                      <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded-md">
                        QR: {t.rawQr}
                      </div>
                    )}
                  </div>

                  {/* Card footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400">
                      Lệnh SX: <strong className="font-mono">{t.productionOrder || '—'}</strong>
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDeleteTicket(t.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950"
                        title="Xóa phiếu"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setViewingTicket(t)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-semibold transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Chi tiết</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
            ? 'Quét Tem Mã QR Vật Tư'
            : 'Quét Mã Vị Trí Kho'
        }
        description={
          scannerTarget === 'material'
            ? 'Rê camera vào tem QR vật tư (Mã VT ^^ Màu ^^ Size ^^ Length ^^ Lô SX ^^ Lệnh SX)'
            : 'Rê camera vào tem kệ kho / pallet — Tự động lấy chuỗi vị trí'
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
