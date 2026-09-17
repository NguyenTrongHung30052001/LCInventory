import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FilePlus2,
  X,
  Camera,
  QrCode,
  Sparkles,
  CheckCircle2,
  Trash2,
  Save,
  Tag,
  User,
  DollarSign,
  FileText,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Ticket, TicketCategory, TicketStatus } from '../types';
import {
  generateTicketCode,
  extractTicketSuggestionsFromQr,
  getCategoryLabel,
} from '../utils/ticketStorage';

interface TicketCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenScanner: () => void;
  scannedQrValue: string | null;
  onSaveTicket: (ticket: Ticket) => void;
  onClearScannedQr: () => void;
}

export const TicketCreateModal: React.FC<TicketCreateModalProps> = ({
  isOpen,
  onClose,
  onOpenScanner,
  scannedQrValue,
  onSaveTicket,
  onClearScannedQr,
}) => {
  const [ticketCode, setTicketCode] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TicketCategory>('general');
  const [qrData, setQrData] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<TicketStatus>('pending');
  const [notes, setNotes] = useState('');
  const [extractedInfo, setExtractedInfo] = useState<any>(null);

  // Initialize or reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTicketCode(generateTicketCode());
      if (!scannedQrValue) {
        setTitle('');
        setCategory('general');
        setQrData('');
        setCustomerName('');
        setAmount('');
        setStatus('pending');
        setNotes('');
        setExtractedInfo(null);
      }
    }
  }, [isOpen]);

  // When a QR code is detected from camera
  useEffect(() => {
    if (scannedQrValue) {
      setQrData(scannedQrValue);
      const suggestions = extractTicketSuggestionsFromQr(scannedQrValue);
      setExtractedInfo(suggestions.parsed);

      if (suggestions.suggestedTitle && !title) {
        setTitle(suggestions.suggestedTitle);
      }
      if (suggestions.suggestedCategory) {
        setCategory(suggestions.suggestedCategory);
      }
      if (suggestions.suggestedAmount && !amount) {
        setAmount(suggestions.suggestedAmount);
      }
      if (suggestions.suggestedCustomer && !customerName) {
        setCustomerName(suggestions.suggestedCustomer);
      }
      if (suggestions.suggestedNotes && !notes) {
        setNotes(suggestions.suggestedNotes);
      }
    }
  }, [scannedQrValue]);

  // Handle manual QR input change
  const handleQrInputChange = (val: string) => {
    setQrData(val);
    if (val.trim()) {
      const suggestions = extractTicketSuggestionsFromQr(val.trim());
      setExtractedInfo(suggestions.parsed);
      if (!title) setTitle(suggestions.suggestedTitle);
      setCategory(suggestions.suggestedCategory);
      if (suggestions.suggestedAmount && !amount) setAmount(suggestions.suggestedAmount);
      if (suggestions.suggestedNotes && !notes) setNotes(suggestions.suggestedNotes);
    } else {
      setExtractedInfo(null);
    }
  };

  const handleClearQr = () => {
    setQrData('');
    setExtractedInfo(null);
    onClearScannedQr();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalTitle = title.trim() || `Phiếu ${ticketCode}`;
    const newTicket: Ticket = {
      id: `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      code: ticketCode.trim() || generateTicketCode(),
      title: finalTitle,
      category,
      qrData: qrData.trim(),
      qrType: extractedInfo?.type || 'other',
      qrMetadata: extractedInfo?.metadata,
      customerName: customerName.trim(),
      amount: amount.trim(),
      status,
      notes: notes.trim(),
      createdAt: Date.now(),
    };

    onSaveTicket(newTicket);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        {/* Backdrop click */}
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="relative z-10 w-full max-w-2xl my-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                <FilePlus2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Tạo Phiếu Mới</span>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                    {ticketCode}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Nhập mã QR trực tiếp hoặc bấm nút camera để quét tự động
                </p>
              </div>
            </div>

            <button
              id="btn-close-create-ticket-modal"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* QR CODE INPUT & SCAN BUTTON SECTION (CORE USER REQUIREMENT) */}
            <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="input-qr-data"
                  className="text-xs font-bold text-indigo-950 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5"
                >
                  <QrCode className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Ô Nhập Dữ Liệu QR / Quét Camera</span>
                  <span className="text-rose-500">*</span>
                </label>

                {qrData && (
                  <button
                    type="button"
                    onClick={handleClearQr}
                    className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Xóa mã QR</span>
                  </button>
                )}
              </div>

              {/* Input field + Camera Scan button */}
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <div className="relative flex-1">
                  <input
                    id="input-qr-data"
                    type="text"
                    value={qrData}
                    onChange={(e) => handleQrInputChange(e.target.value)}
                    placeholder="Dán nội dung QR, nhập mã hoặc bấm Quét QR..."
                    className="w-full h-11 px-3.5 pr-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono"
                  />
                  {qrData && (
                    <button
                      type="button"
                      onClick={handleClearQr}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* The requested "1 nút camera quét QR" */}
                <button
                  id="btn-trigger-camera-scan"
                  type="button"
                  onClick={onOpenScanner}
                  className="h-11 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all shrink-0 hover:scale-[1.02]"
                >
                  <Camera className="h-4 w-4" />
                  <span>Quét QR Camera</span>
                </button>
              </div>

              {/* Extracted QR Data Badge info */}
              {extractedInfo ? (
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-slate-900 dark:text-white">
                        Đã tự động trích xuất:
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                        Loại: {extractedInfo.type.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {extractedInfo.title || qrData}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Bấm <strong>&quot;Quét QR Camera&quot;</strong> để mở máy ảnh &rarr; rê vào mã QR hệ thống tự lấy data và quay lại đây.</span>
                </div>
              )}
            </div>

            {/* TICKET DETAILS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tiêu đề phiếu */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="input-ticket-title"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Tiêu đề / Tên phiếu <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-ticket-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Phiếu thanh toán đơn hàng, Phiếu kiểm kê thiết bị..."
                  className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Loại phiếu */}
              <div>
                <label
                  htmlFor="select-ticket-category"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Phân loại phiếu
                </label>
                <select
                  id="select-ticket-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TicketCategory)}
                  className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="payment">Phiếu thanh toán</option>
                  <option value="inventory">Kiểm kê / Kho hàng</option>
                  <option value="warranty">Bảo hành / Sửa chữa</option>
                  <option value="event">Vé sự kiện / Check-in</option>
                  <option value="delivery">Giao nhận hàng</option>
                  <option value="general">Phiếu công việc chung</option>
                </select>
              </div>

              {/* Trạng thái phiếu */}
              <div>
                <label
                  htmlFor="select-ticket-status"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Trạng thái phiếu
                </label>
                <select
                  id="select-ticket-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TicketStatus)}
                  className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="pending">Chờ xử lý / Đang tiến hành</option>
                  <option value="completed">Đã hoàn thành</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>

              {/* Khách hàng / Đơn vị tiếp nhận */}
              <div>
                <label
                  htmlFor="input-customer-name"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Khách hàng / Người nhận / Đơn vị
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="input-customer-name"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Tên khách hàng hoặc phòng ban tiếp nhận"
                    className="w-full h-10 pl-9 pr-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Số tiền / Giá trị nếu có */}
              <div>
                <label
                  htmlFor="input-ticket-amount"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Số tiền / Giá trị (VNĐ nếu áp dụng)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="input-ticket-amount"
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Ví dụ: 1,500,000"
                    className="w-full h-10 pl-9 pr-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Ghi chú & Chi tiết trích xuất */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="textarea-ticket-notes"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Ghi chú / Chi tiết nội dung phiếu
                </label>
                <textarea
                  id="textarea-ticket-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi chú thêm về phiếu, các thông số hoặc lưu ý kiểm tra..."
                  className="w-full p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Form Action Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                id="btn-cancel-create-ticket"
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Hủy bỏ
              </button>

              <button
                id="btn-submit-ticket"
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02]"
              >
                <Save className="h-4 w-4" />
                <span>Lưu & Hoàn Tất Phiếu</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
