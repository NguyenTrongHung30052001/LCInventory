import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Printer,
  Copy,
  CheckCircle2,
  Clock,
  Ban,
  Package,
  MapPin,
  Trash2,
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="h-3 w-3" />
            Đã nhập
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
            <Ban className="h-3 w-3" />
            Đã hủy
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <Clock className="h-3 w-3" />
            Chờ kiểm
          </span>
        );
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-3 bg-black/60 backdrop-blur-xs">
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="relative z-10 w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-900 dark:text-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {ticket.code}
              </span>
              {getStatusBadge()}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 space-y-3.5 overflow-y-auto flex-1">
            {/* Main Item Highlight */}
            <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-800 dark:text-emerald-300">
                  Mã vật tư
                </span>
                <h2 className="text-base font-black font-mono text-slate-900 dark:text-white">
                  {ticket.materialCode || '—'}
                </h2>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-800 dark:text-emerald-300">
                  Số lượng
                </span>
                <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  {ticket.quantity} {ticket.unit}
                </p>
              </div>
            </div>

            {/* 6 Fields Grid */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Thông tin mã QR
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Màu sắc</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {ticket.color || '—'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Kích cỡ (Size)</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {ticket.size || '—'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Chiều dài (Length)</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {ticket.length || '—'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Lô sản xuất</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {ticket.batchNumber || '—'}
                  </span>
                </div>
                <div className="col-span-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Lệnh sản xuất (PO)</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {ticket.productionOrder || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Warehouse Location & QR String */}
            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                  Vị trí kho
                </span>
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                  {ticket.warehouseLocation || '(Chưa xác định)'}
                </span>
              </div>

              {ticket.rawQr && (
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block">QR gốc:</span>
                    <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 truncate block">
                      {ticket.rawQr}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onCopyText(ticket.rawQr)}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0"
                  >
                    <Copy className="h-3 w-3" />
                    Chép
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer controls */}
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                onDeleteTicket(ticket.id);
                onClose();
              }}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-semibold"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Xóa</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleStatus(ticket.id)}
                className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                {ticket.status === 'completed' ? 'Đổi sang Chờ' : 'Nhập kho'}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>In</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
