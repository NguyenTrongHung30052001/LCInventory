import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, Sparkles, Tag } from 'lucide-react';
import { APP_VERSION } from '../config/version';
import { LienChauLogo } from './LienChauLogo';

interface VersionInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VersionInfoModal: React.FC<VersionInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative z-10 w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
            <div className="flex items-center gap-2">
              <LienChauLogo size="sm" />
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Thông tin phiên bản
                </h3>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  LIÊN CHÂU • Go With You
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3.5 text-xs">
            {/* Version & Update Highlight */}
            <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                  Phiên bản hiện tại
                </span>
                <span className="text-lg font-black text-emerald-700 dark:text-emerald-400 font-mono">
                  {APP_VERSION.version}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                  Thời gian cập nhật
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                  {APP_VERSION.updatedAt}
                </span>
              </div>
            </div>

            {/* Details List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-emerald-600" />
                  Mã bản dựng (Build)
                </span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {APP_VERSION.buildNumber}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-emerald-600" />
                  Ngày phát hành
                </span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {APP_VERSION.updatedDate}
                </span>
              </div>
            </div>

            {/* Release notes summary */}
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-emerald-600" />
                Nội dung cập nhật v1.1.1
              </span>
              <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
                <li>Bỏ gợi ý và để trống vị trí khi bấm Tạo phiếu</li>
                <li>Tối ưu ô nhập số lượng gọn đẹp, mở bàn phím số trên điện thoại</li>
                <li>Kiểm tra bắt buộc số lượng phải lớn hơn 0</li>
                <li>Tăng tốc độ phản hồi kết nối API</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs"
            >
              Đóng
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
