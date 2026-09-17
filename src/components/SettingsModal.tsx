import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings,
  X,
  Volume2,
  Smartphone,
  ExternalLink,
  Layers,
  Save,
  Camera,
  Check
} from 'lucide-react';
import { ScannerSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  settings: ScannerSettings;
  onUpdateSettings: (newSettings: Partial<ScannerSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onUpdateSettings,
  onClose,
}) => {
  if (!isOpen) return null;

  const toggleSetting = (key: keyof ScannerSettings) => {
    if (typeof settings[key] === 'boolean') {
      onUpdateSettings({ [key]: !settings[key] });
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
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                <Settings className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Cài đặt trình quét
              </h3>
            </div>
            <button
              id="btn-close-settings-modal"
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Settings List */}
          <div className="px-6 py-4 space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
            {/* Sound Notification */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                  <Volume2 className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                    Âm thanh khi quét được
                  </span>
                  <span className="text-[11px] text-slate-400 block leading-tight">
                    Phát tiếng bíp báo hiệu khi nhận diện mã thành công.
                  </span>
                </div>
              </div>
              <button
                id="toggle-beep"
                type="button"
                onClick={() => toggleSetting('beepOnScan')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  settings.beepOnScan ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    settings.beepOnScan ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Vibrate */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
                  <Smartphone className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                    Rung phản hồi (Haptic)
                  </span>
                  <span className="text-[11px] text-slate-400 block leading-tight">
                    Rung nhẹ trên thiết bị di động khi đọc được mã.
                  </span>
                </div>
              </div>
              <button
                id="toggle-vibrate"
                type="button"
                onClick={() => toggleSetting('vibrateOnScan')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  settings.vibrateOnScan ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    settings.vibrateOnScan ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Auto Open URL */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                  <ExternalLink className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                    Tự động mở liên kết Website
                  </span>
                  <span className="text-[11px] text-slate-400 block leading-tight">
                    Tự động điều hướng đến URL trang web sau khi quét.
                  </span>
                </div>
              </div>
              <button
                id="toggle-auto-open"
                type="button"
                onClick={() => toggleSetting('autoOpenUrl')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  settings.autoOpenUrl ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    settings.autoOpenUrl ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Continuous / Batch Scan */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                    Chế độ quét liên tục (Batch)
                  </span>
                  <span className="text-[11px] text-slate-400 block leading-tight">
                    Tiếp tục quét mà không dừng lại, lưu ngay vào lịch sử.
                  </span>
                </div>
              </div>
              <button
                id="toggle-continuous-scan"
                type="button"
                onClick={() => toggleSetting('continuousScan')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  settings.continuousScan ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    settings.continuousScan ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Save History */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                  <Save className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                    Lưu lịch sử trên trình duyệt
                  </span>
                  <span className="text-[11px] text-slate-400 block leading-tight">
                    Tự động ghi nhớ các lần quét trước đó.
                  </span>
                </div>
              </div>
              <button
                id="toggle-save-history"
                type="button"
                onClick={() => toggleSetting('saveHistory')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  settings.saveHistory ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    settings.saveHistory ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              id="btn-confirm-settings"
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Hoàn tất</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
