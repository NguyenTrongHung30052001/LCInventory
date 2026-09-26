import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  X,
  RefreshCw,
  Camera,
  CheckCircle2,
  XCircle,
  Copy,
  ArrowRight,
  Info,
  Layers,
} from 'lucide-react';
import { ParsedMaterialQr } from '../utils/materialQrParser';

export interface ScanErrorInfo {
  type: 'invalid_format' | 'camera_permission' | 'decode_failed' | 'empty_qr' | 'location_error';
  title: string;
  message: string;
  rawQr?: string;
  parsed?: ParsedMaterialQr;
}

interface ScanErrorModalProps {
  isOpen: boolean;
  error: ScanErrorInfo | null;
  onClose: () => void;
  onRescan: () => void;
  onContinueAnyway?: () => void;
}

export const ScanErrorModal: React.FC<ScanErrorModalProps> = ({
  isOpen,
  error,
  onClose,
  onRescan,
  onContinueAnyway,
}) => {
  if (!isOpen || !error) return null;

  const handleCopyRaw = () => {
    if (error.rawQr) {
      navigator.clipboard.writeText(error.rawQr);
    }
  };

  const isMaterialFormatError = error.type === 'invalid_format' && error.parsed;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs">
        {/* Backdrop */}
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border-t sm:border border-rose-200 dark:border-rose-900/60 flex flex-col max-h-[92vh] sm:max-h-[90vh] text-slate-900 dark:text-slate-100 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-rose-50 dark:bg-rose-950/50 border-b border-rose-200/80 dark:border-rose-900/50">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                  {error.title || 'Lỗi quét mã QR'}
                </h3>
                <span className="text-[10px] text-rose-700/80 dark:text-rose-300/80 font-medium">
                  LIÊN CHÂU • Kiểm tra quy chuẩn quét mã
                </span>
              </div>
            </div>

            <button
              id="btn-close-scan-error-modal"
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-rose-400 hover:text-rose-700 dark:hover:text-rose-200 hover:bg-rose-100 dark:hover:bg-rose-900/40"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3.5 overflow-y-auto flex-1 text-xs">
            {/* Error Message Highlight Box */}
            <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60">
              <p className="text-rose-900 dark:text-rose-200 font-semibold leading-relaxed">
                {error.message}
              </p>
            </div>

            {/* Scanned String Display */}
            {error.rawQr && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  <span>Chuỗi QR quét được:</span>
                  <button
                    type="button"
                    onClick={handleCopyRaw}
                    className="text-slate-600 dark:text-slate-300 hover:text-emerald-600 flex items-center gap-1 font-medium"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Sao chép</span>
                  </button>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-200 break-all select-all leading-relaxed max-h-24 overflow-y-auto">
                  {error.rawQr}
                </div>
              </div>
            )}

            {/* Fields Analysis Breakdown */}
            {isMaterialFormatError && error.parsed && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    Đối chiếu {error.message.includes('Tip') ? '2' : error.message.includes('4 phần') ? '3' : '6'} trường quy chuẩn:
                  </span>
                  <span className="font-mono text-rose-600 dark:text-rose-400">
                    {error.parsed.fieldAnalysis.filter((f) => f.isProvided && (error.message.includes('Tip') ? ['materialCode', 'batchNumber'].includes(f.key) : error.message.includes('4 phần') ? ['materialCode', 'color', 'batchNumber'].includes(f.key) : true)).length}/{error.message.includes('Tip') ? '2' : error.message.includes('4 phần') ? '3' : '6'} trường
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  {error.parsed.fieldAnalysis.filter(f => error.message.includes('Tip') ? ['materialCode', 'batchNumber'].includes(f.key) : error.message.includes('4 phần') ? ['materialCode', 'color', 'batchNumber'].includes(f.key) : true).map((field) => (
                    <div
                      key={field.key}
                      className={`p-1.5 rounded-lg border text-[11px] flex items-start gap-1.5 ${
                        field.isProvided
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-slate-800 dark:text-slate-200'
                          : 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {field.isProvided ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-none mb-0.5">
                          {field.index}. {field.label}
                        </span>
                        <span
                          className={`font-mono text-[10px] truncate block ${
                            field.isProvided
                              ? 'font-bold text-emerald-700 dark:text-emerald-300'
                              : 'italic text-rose-500 dark:text-rose-400'
                          }`}
                        >
                          {field.isProvided ? field.value : '(Thiếu dữ liệu)'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Standard Format Reminder */}
            <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-[11px] space-y-1">
              <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1">
                <Info className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                Cấu trúc QR {error.message.includes('Tip') ? 'Tip' : error.message.includes('4 phần') ? 'dạng 4 phần' : 'vật tư'} chuẩn:
              </span>
              <p className="font-mono text-[10px] text-amber-800 dark:text-amber-300 bg-white/70 dark:bg-black/30 p-1.5 rounded-lg border border-amber-200/60 dark:border-amber-900/40 break-all leading-relaxed">
                {error.message.includes('Tip') ? 'Mã vật tư ^^ ... ^^ Lô sản xuất' : error.message.includes('4 phần') ? '... ^^ Mã vật tư ^^ Màu ^^ Lô sản xuất' : 'Mã vật tư ^^ Màu ^^ Size ^^ Length ^^ Lệnh sản xuất ^^ Lô sản xuất'}
              </p>
              <p className="text-[10px] text-amber-700 dark:text-amber-400">
                (Hệ thống chấp nhận dấu phân tách là <strong>^^</strong>{error.message.includes('Tip') || error.message.includes('4 phần') ? '' : ' hoặc <strong>-</strong>'})
              </p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
            {onContinueAnyway && (
              <button
                id="btn-error-continue-anyway"
                type="button"
                onClick={onContinueAnyway}
                className="order-2 sm:order-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Vẫn dùng &amp; tự điền</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </button>
            )}

            <button
              id="btn-error-rescan"
              type="button"
              onClick={onRescan}
              className="order-1 sm:order-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <Camera className="h-4 w-4" />
              <span>Quét lại</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
