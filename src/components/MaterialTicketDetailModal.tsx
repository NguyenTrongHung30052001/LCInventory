import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Printer,
  Copy,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Trash2,
  FileText,
  Send,
  Edit3,
} from 'lucide-react';
import { MaterialTicket } from '../types';

interface MaterialTicketDetailModalProps {
  ticket: MaterialTicket | null;
  onClose: () => void;
  onDeleteTicket: (id: string) => void;
  onEditTicket?: (ticket: MaterialTicket) => void;
  onCopyText: (text: string) => void;
  onResendToMes?: (ticket: MaterialTicket) => void;
}

export const MaterialTicketDetailModal: React.FC<MaterialTicketDetailModalProps> = ({
  ticket,
  onClose,
  onDeleteTicket,
  onEditTicket,
  onCopyText,
  onResendToMes,
}) => {
  if (!ticket) return null;

  const handlePrint = () => {
    window.print();
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
          {/* Header - Không còn mã phiếu, trạng thái */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Chi tiết phiếu vật tư
                </h3>
                <span className="text-[10px] text-slate-400">
                  {new Date(ticket.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>
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
                  {String(ticket.quantity).replace(',', '.')} {ticket.unit}
                </p>
              </div>
            </div>

            {/* MES API Sync Status Banner */}
            <div
              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                ticket.mesSyncStatus === 'synced'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                  : ticket.mesSyncStatus === 'failed'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                {ticket.mesSyncStatus === 'synced' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : ticket.mesSyncStatus === 'failed' ? (
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                ) : (
                  <Send className="h-4 w-4 text-slate-400 shrink-0" />
                )}
                <span className="text-xs font-semibold truncate">
                  {ticket.mesSyncStatus === 'synced'
                    ? 'Đã gửi lên MES (FinishedGoodInventory)'
                    : ticket.mesSyncStatus === 'failed'
                    ? `Lỗi gửi MES: ${ticket.mesSyncError || 'Không thể kết nối'}`
                    : 'Đã lưu nội bộ'}
                </span>
              </div>
              {onResendToMes && ticket.mesSyncStatus === 'failed' && (
                <button
                  type="button"
                  onClick={() => onResendToMes(ticket)}
                  className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold shrink-0"
                >
                  Gửi lại
                </button>
              )}
            </div>

            {/* 6 Fields Grid */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Thông tin 6 trường vật tư
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
                  <span className="text-[10px] text-slate-400 block">Lô sản xuất (Lot)</span>
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

            {/* Vị trí kho */}
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                <MapPin className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Vị trí kệ kho
              </span>
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                {ticket.warehouseLocation || 'A1-02'}
              </span>
            </div>

            {/* Mô tả / Ghi chú - luôn hiển thị */}
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block flex items-center gap-1.5">
                <FileText className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                Mô tả / Ghi chú:
              </span>
              <p className="text-xs text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap">
                {ticket.notes?.trim() ||
                  [
                    ticket.materialCode,
                    ticket.color && `Màu: ${ticket.color}`,
                    ticket.size && `Size: ${ticket.size}`,
                    ticket.length && ticket.length !== '0' && `Dài: ${ticket.length}`,
                    ticket.batchNumber && ticket.batchNumber !== '_' && `Lô: ${ticket.batchNumber}`,
                    ticket.productionOrder && `LSX: ${ticket.productionOrder}`,
                  ]
                    .filter(Boolean)
                    .join(' - ') ||
                  'Chưa có mô tả'}
              </p>
            </div>

            {/* QR String */}
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
              <span>Xóa phiếu</span>
            </button>

            <div className="flex items-center gap-2">
              {onEditTicket && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEditTicket(ticket);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Sửa</span>
                </button>
              )}

              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1"
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
