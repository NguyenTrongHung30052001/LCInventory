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
} from 'lucide-react';
import { Header } from './components/Header';
import { TicketCreateModal } from './components/TicketCreateModal';
import { DirectCameraModal } from './components/DirectCameraModal';
import { TicketDetailModal } from './components/TicketDetailModal';
import { Toast } from './components/Toast';
import { Ticket, TicketCategory, TicketStatus } from './types';
import {
  getStoredTickets,
  saveStoredTickets,
  getCategoryLabel,
  extractTicketSuggestionsFromQr,
} from './utils/ticketStorage';

export default function App() {
  // Tickets State
  const [tickets, setTickets] = useState<Ticket[]>(() => getStoredTickets());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [viewingTicket, setViewingTicket] = useState<Ticket | null>(null);

  // Scanned QR data passed into the Create Ticket form
  const [currentScannedQr, setCurrentScannedQr] = useState<string | null>(null);

  // Audio beep setting
  const [beepEnabled, setBeepEnabled] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persist tickets whenever changed
  useEffect(() => {
    saveStoredTickets(tickets);
  }, [tickets]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Called when user clicks "Quét QR Camera" on the ticket create form
  const handleOpenScannerFromForm = () => {
    setIsScannerModalOpen(true);
  };

  // Called immediately when camera scans a QR code:
  // "rê vô QR thì tự động lấy data và ẩn form Quét QR, chỉ hiện form tạo phiếu"
  const handleScanSuccess = (scannedRaw: string) => {
    setCurrentScannedQr(scannedRaw);
    setIsScannerModalOpen(false); // Hide the QR scan form immediately
    setIsCreateModalOpen(true);   // Ensure ONLY the ticket creation form is visible

    showToast('Đã tự động lấy dữ liệu QR vào phiếu!');
  };

  // Save new ticket
  const handleSaveTicket = (newTicket: Ticket) => {
    setTickets((prev) => [newTicket, ...prev]);
    setCurrentScannedQr(null);
    showToast(`Đã tạo thành công phiếu ${newTicket.code}!`);
  };

  // Delete ticket
  const handleDeleteTicket = (id: string) => {
    setTickets((prev) => prev.filter((t) => t.id !== id));
    showToast('Đã xóa phiếu thành công.');
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

  // Filtered tickets
  const filteredTickets = tickets.filter((ticket) => {
    const matchSearch =
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.qrData.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ticket.customerName &&
        ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchCategory =
      selectedCategory === 'all' || ticket.category === selectedCategory;
    const matchStatus =
      selectedStatus === 'all' || ticket.status === selectedStatus;

    return matchSearch && matchCategory && matchStatus;
  });

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            Đã xong
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
          setCurrentScannedQr(null);
          setIsCreateModalOpen(true);
        }}
        onOpenQuickScan={() => {
          setIsCreateModalOpen(true);
          setIsScannerModalOpen(true);
        }}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        {/* ACTION BANNER: "Tạo Phiếu & Quét Camera Trực Tiếp" */}
        <div className="relative rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 overflow-hidden shadow-xl border border-indigo-800/40">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)`,
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-3">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span>Quét mã QR tự động bằng camera</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                Tạo Phiếu Nhanh Với Camera Trực Tiếp
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                Mở form tạo phiếu, bấm nút camera quét QR &rarr; rê vào mã QR hệ thống tự động bóc tách dữ liệu, ẩn khung camera và hoàn thiện thông tin phiếu ngay lập tức.
              </p>
            </div>

            {/* Main CTA Button */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                id="btn-hero-create-ticket"
                type="button"
                onClick={() => {
                  setCurrentScannedQr(null);
                  setIsCreateModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 hover:scale-[1.02] transition-all"
              >
                <FilePlus2 className="h-4 w-4" />
                <span>+ Mở Form Tạo Phiếu</span>
              </button>

              <button
                id="btn-hero-quick-scan-and-create"
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(true);
                  setIsScannerModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-100 text-sm font-semibold border border-slate-700 transition-all"
              >
                <Camera className="h-4 w-4 text-cyan-400" />
                <span>Quét QR & Điền Phiếu</span>
              </button>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="input-search-tickets"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã phiếu, tên phiếu, dữ liệu QR, khách hàng..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Filter category & status */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              id="select-filter-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tất cả danh mục</option>
              <option value="payment">Phiếu thanh toán</option>
              <option value="inventory">Kiểm kê / Kho</option>
              <option value="warranty">Bảo hành</option>
              <option value="event">Vé sự kiện</option>
              <option value="delivery">Giao nhận</option>
              <option value="general">Phiếu chung</option>
            </select>

            <select
              id="select-filter-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xử lý</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>

            <span className="text-xs text-slate-500 dark:text-slate-400 pl-1">
              ({filteredTickets.length} phiếu)
            </span>
          </div>
        </div>

        {/* TICKETS LIST SECTION */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-indigo-500" />
              <span>Danh Sách Phiếu Đã Tạo</span>
            </h3>

            <button
              type="button"
              onClick={() => {
                setCurrentScannedQr(null);
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
                <QrCode className="h-7 w-7" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Không tìm thấy phiếu nào
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-5">
                {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                  ? 'Không có phiếu nào khớp với bộ lọc tìm kiếm hiện tại.'
                  : 'Hãy bấm "Tạo Phiếu Mới" và quét mã QR để lưu phiếu đầu tiên của bạn.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedStatus('all');
                  setCurrentScannedQr(null);
                  setIsCreateModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md transition-colors"
              >
                <FilePlus2 className="h-4 w-4" />
                <span>Tạo phiếu mới ngay</span>
              </button>
            </div>
          ) : (
            /* Tickets Grid Cards */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md hover:border-indigo-400/60 dark:hover:border-indigo-600/60 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Code & Category */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                        {ticket.code}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {getCategoryLabel(ticket.category)}
                        </span>
                        {getStatusBadge(ticket.status)}
                      </div>
                    </div>

                    {/* Ticket Title */}
                    <h4
                      onClick={() => setViewingTicket(ticket)}
                      className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors cursor-pointer line-clamp-1 mb-1.5"
                    >
                      {ticket.title}
                    </h4>

                    {/* Customer or amount if present */}
                    {(ticket.customerName || ticket.amount) && (
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-2.5">
                        {ticket.customerName && (
                          <span className="truncate">{ticket.customerName}</span>
                        )}
                        {ticket.amount && (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                            {ticket.amount} đ
                          </span>
                        )}
                      </div>
                    )}

                    {/* QR Preview Snippet */}
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 mb-3 flex items-center gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                      <QrCode className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate flex-1">
                        {ticket.qrData || '(Không có dữ liệu QR)'}
                      </span>
                    </div>

                    {/* Created Date */}
                    <p className="text-[10px] text-slate-400">
                      {new Date(ticket.createdAt).toLocaleDateString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => handleCopyText(ticket.qrData)}
                      className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 font-medium transition-colors"
                      title="Sao chép dữ liệu QR"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy QR</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDeleteTicket(ticket.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Xóa phiếu"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setViewingTicket(ticket)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-semibold transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Xem chi tiết</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* POPUP 1: TICKET CREATION MODAL ("Form tạo phiếu có ô nhập QR & nút camera quét QR") */}
      <TicketCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onOpenScanner={handleOpenScannerFromForm}
        scannedQrValue={currentScannedQr}
        onSaveTicket={handleSaveTicket}
        onClearScannedQr={() => setCurrentScannedQr(null)}
      />

      {/* POPUP 2: DIRECT CAMERA SCANNER MODAL ("Khi bấm quét thì mở ra form quét, rê vô QR thì tự động lấy data và ẩn form Quét QR, chỉ hiện form tạo phiếu") */}
      <DirectCameraModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      {/* POPUP 3: TICKET DETAILS MODAL */}
      <TicketDetailModal
        ticket={viewingTicket}
        onClose={() => setViewingTicket(null)}
        onDeleteTicket={handleDeleteTicket}
        onToggleStatus={handleToggleStatus}
        onCopyText={handleCopyText}
      />

      {/* Toast Notification */}
      <Toast message={toastMessage} />
    </div>
  );
}
