import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  X,
  Printer,
  Copy,
  CheckCircle2,
  Clock,
  Ban,
  DollarSign,
  User,
  QrCode,
  Share2,
  Trash2,
} from 'lucide-react';
import { Ticket } from '../types';
import { getCategoryLabel } from '../utils/ticketStorage';

interface TicketDetailModalProps {
  ticket: Ticket | null;
  onClose: () => void;
  onDeleteTicket: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onCopyText: (text: string) => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  onClose,
  onDeleteTicket,
  onToggleStatus,
  onCopyText,
}) => {
  if (!ticket) return null;

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = () => {
    switch (ticket.status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Đã hoàn thành
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <Ban className="h-3.5 w-3.5" />
            Đã hủy
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="h-3.5 w-3.5" />
            Chờ xử lý
          </span>
        );
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Chi Tiết Phiếu
                </h3>
                <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                  Mã: {ticket.code}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body content */}
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Title & Status */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {getCategoryLabel(ticket.category)}
                </span>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-1.5">
                  {ticket.title}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tạo lúc: {new Date(ticket.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>

              <div>{getStatusBadge()}</div>
            </div>

            {/* QR Code preview block */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-4">
              <div className="p-2 bg-white rounded-xl border border-slate-200 shrink-0 shadow-xs">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=4&data=${encodeURIComponent(
                    ticket.qrData
                  )}`}
                  alt="QR Code"
                  className="w-24 h-24 rounded-md"
                  loading="lazy"
                />
              </div>

              <div className="min-w-0 flex-1 w-full">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Dữ liệu mã QR đã quét
                </span>
                <p className="text-xs font-mono bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 break-all text-slate-800 dark:text-slate-200 max-h-24 overflow-y-auto">
                  {ticket.qrData || '(Không có dữ liệu QR)'}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onCopyText(ticket.qrData)}
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Sao chép mã QR</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Additional ticket attributes */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              {ticket.customerName && (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Khách hàng / Đơn vị:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {ticket.customerName}
                  </span>
                </div>
              )}

              {ticket.amount && (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Giá trị / Số tiền:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {ticket.amount} VNĐ
                  </span>
                </div>
              )}
            </div>

            {/* Notes */}
            {ticket.notes && (
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                <span className="text-slate-400 block font-semibold mb-1">Ghi chú & Chi tiết:</span>
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {ticket.notes}
                </p>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                onDeleteTicket(ticket.id);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-semibold transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Xóa phiếu</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleStatus(ticket.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>
                  {ticket.status === 'completed' ? 'Chuyển sang Chờ xử lý' : 'Đánh dấu Đã xong'}
                </span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-xs transition-colors"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>In phiếu</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
