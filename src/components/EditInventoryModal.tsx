import React, { useState, useEffect } from 'react';
import { X, Edit3, Loader2, Save, FileText, Hash, Package } from 'lucide-react';
import { MaterialTicket } from '../types';

interface EditInventoryModalProps {
  isOpen: boolean;
  ticket: MaterialTicket | null;
  onClose: () => void;
  onSave: (id: string, updatedData: { quantity: number; unit: string; note: string }) => Promise<boolean>;
}

const COMMON_UNITS = ['Cuộn', 'Mét', 'Cái', 'Kg', 'Cây', 'Thùng'];

export const EditInventoryModal: React.FC<EditInventoryModalProps> = ({
  isOpen,
  ticket,
  onClose,
  onSave,
}) => {
  const [quantity, setQuantity] = useState<number | string>(1);
  const [unit, setUnit] = useState('Cuộn');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (ticket) {
      setQuantity(ticket.quantity);
      setUnit(ticket.unit || 'Cuộn');
      setNote(ticket.notes || '');
      setErrorMsg(null);
    }
  }, [ticket, isOpen]);

  if (!isOpen || !ticket) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numQty = parseFloat(String(quantity));
    if (isNaN(numQty) || numQty <= 0) {
      setErrorMsg('Vui lòng nhập số lượng hợp lệ lớn hơn 0');
      return;
    }

    if (!unit.trim()) {
      setErrorMsg('Vui lòng nhập đơn vị tính');
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await onSave(ticket.id, {
        quantity: numQty,
        unit: unit.trim(),
        note: note.trim(),
      });
      if (ok) {
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi cập nhật bản ghi kiểm kê');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Edit3 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Chỉnh sửa dòng kiểm kê #{ticket.id}
              </h2>
              <p className="text-[11px] text-slate-400">
                Chỉ cho phép cập nhật đơn vị tính, số lượng và ghi chú
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Read-only Information Card */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Mã vật tư:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                {ticket.materialCode || '—'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200/60 dark:border-slate-800">
              <div>
                <span className="text-slate-400">Màu: </span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {ticket.color || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Size: </span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {ticket.size || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Lô SX: </span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {ticket.batchNumber || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Vị trí kho: </span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {ticket.warehouseLocation || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Editable Field 1: Số lượng */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Số lượng kiểm kê thực tế</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              min="0.001"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="VD: 120"
              className="w-full h-11 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono font-bold text-base focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Editable Field 2: Đơn vị tính */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Đơn vị tính</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="VD: Cuộn, Mét, Kg..."
              className="w-full h-10 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-semibold text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            {/* Quick unit pills */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {COMMON_UNITS.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                    unit === u
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Editable Field 3: Ghi chú */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Ghi chú kiểm kê</span>
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập ghi chú (VD: Đã kiểm đếm lại theo phiếu kiểm kê thực tế)..."
              className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang cập nhật...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Lưu thay đổi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
