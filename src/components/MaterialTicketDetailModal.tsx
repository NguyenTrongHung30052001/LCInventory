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
  Package,
  Palette,
  Maximize2,
  Ruler,
  Boxes,
  ClipboardList,
  Scale,
  MapPin,
  Trash2,
  QrCode,
  Tag,
} from 'lucide-react';
import { MaterialTicket } from '../types';

interface MaterialTicketDetailModalProps {
  ticket: MaterialTicket | null;
  onClose: () => void;
  onDeleteTicket: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onCopyText: (text: string) => void;
}

export const MaterialTicketDetailModal: React.FC<MaterialTicketDetailModalProps> = ({
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
            Đã nhập kho
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
            Chờ xử lý / Đang kiểm
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
          className="relative z-10 w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Phiếu Vật Tư: {ticket.materialCode || ticket.code}</span>
                  {getStatusBadge()}
                </h3>
                <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                  Mã phiếu: {ticket.code} • Tạo lúc: {new Date(ticket.createdAt).toLocaleString('vi-VN')}
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

          {/* Modal Body */}
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Raw QR Text Preview Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Chuỗi mã QR gốc:
                </span>
                <p className="text-xs font-mono text-slate-800 dark:text-slate-200 break-all">
                  {ticket.rawQr || '(Chưa có mã QR gốc)'}
                </p>
              </div>

              {ticket.rawQr && (
                <button
                  type="button"
                  onClick={() => onCopyText(ticket.rawQr)}
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold shrink-0"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Sao chép</span>
                </button>
              )}
            </div>

            {/* 6 QR Fields Grid */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                <span>6 Trường Tách Từ Mã QR</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-0.5 flex items-center gap-1">
                    <Package className="h-3 w-3 text-indigo-500" />
                    Mã vật tư
                  </span>
                  <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 break-all">
                    {ticket.materialCode || '—'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-0.5 flex items-center gap-1">
                    <Palette className="h-3 w-3 text-pink-500" />
                    Màu sắc
                  </span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    {ticket.color || '—'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-0.5 flex items-center gap-1">
                    <Maximize2 className="h-3 w-3 text-cyan-500" />
                    Kích thước (Size)
                  </span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    {ticket.size || '—'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-0.5 flex items-center gap-1">
                    <Ruler className="h-3 w-3 text-amber-500" />
                    Chiều dài (Length)
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                    {ticket.length || '—'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-0.5 flex items-center gap-1">
                    <Boxes className="h-3 w-3 text-emerald-500" />
                    Lô sản xuất
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-900 dark:text-white">
                    {ticket.batchNumber || '—'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-0.5 flex items-center gap-1">
                    <ClipboardList className="h-3 w-3 text-purple-500" />
                    Lệnh sản xuất
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-900 dark:text-white">
                    {ticket.productionOrder || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* 3 Additional Fields: Đơn vị tính, Số lượng, Vị trí kho */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>3 Trường Bổ Sung (Kho hàng)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40">
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 block mb-1">
                    Đơn vị tính:
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {ticket.unit || 'Cuộn'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40">
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 block mb-1">
                    Số lượng:
                  </span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    {ticket.quantity} {ticket.unit}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40">
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 block mb-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Vị trí kho:
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                    {ticket.warehouseLocation || '(Chưa xác định)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes if any */}
            {ticket.notes && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                <span className="text-slate-400 font-semibold block mb-1">Ghi chú phiếu:</span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {ticket.notes}
                </p>
              </div>
            )}
          </div>

          {/* Footer controls */}
          <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 flex items-center justify-between gap-2">
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
                  {ticket.status === 'completed' ? 'Chuyển về Đang chờ' : 'Đánh dấu Đã nhập kho'}
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
