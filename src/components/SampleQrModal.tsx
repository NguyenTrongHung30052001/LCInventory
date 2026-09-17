import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  X,
  Globe,
  Wifi,
  CreditCard,
  User,
  FileText,
  ArrowRight,
  QrCode
} from 'lucide-react';
import { SAMPLE_QR_ITEMS } from '../utils/qrParser';
import { ScanType } from '../types';

interface SampleQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample: (raw: string) => void;
}

export const SampleQrModal: React.FC<SampleQrModalProps> = ({
  isOpen,
  onClose,
  onSelectSample,
}) => {
  if (!isOpen) return null;

  const getIcon = (type: ScanType) => {
    switch (type) {
      case 'url':
        return <Globe className="h-4 w-4 text-blue-500" />;
      case 'wifi':
        return <Wifi className="h-4 w-4 text-emerald-500" />;
      case 'payment':
        return <CreditCard className="h-4 w-4 text-purple-500" />;
      case 'contact':
        return <User className="h-4 w-4 text-amber-500" />;
      default:
        return <FileText className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Thử nghiệm mẫu mã QR
                </h3>
                <p className="text-xs text-slate-400">
                  Chọn mẫu để xem trước giao diện kết quả hiển thị
                </p>
              </div>
            </div>
            <button
              id="btn-close-sample-modal"
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* List of sample QRs */}
          <div className="p-5 space-y-2.5 max-h-[60vh] overflow-y-auto">
            {SAMPLE_QR_ITEMS.map((item, idx) => (
              <button
                key={idx}
                id={`sample-item-${idx}`}
                type="button"
                onClick={() => {
                  onSelectSample(item.raw);
                  onClose();
                }}
                className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors shrink-0">
                    {getIcon(item.type)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {item.label}
                    </span>
                    <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                      {item.description}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity pl-2 shrink-0">
                  <span>Thử ngay</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </button>
            ))}
          </div>

          {/* Footer note */}
          <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 text-center">
            Bạn có thể tích hợp thư viện giải mã camera hoặc các chức năng xử lý sau.
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
