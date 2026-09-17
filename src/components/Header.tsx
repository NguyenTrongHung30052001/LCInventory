import React from 'react';
import { QrCode, History, Settings, Volume2, VolumeX, Sparkles } from 'lucide-react';

interface HeaderProps {
  historyCount: number;
  beepEnabled: boolean;
  onToggleBeep: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenSamples: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  historyCount,
  beepEnabled,
  onToggleBeep,
  onOpenHistory,
  onOpenSettings,
  onOpenSamples,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/90 transition-colors">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* App Branding */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-md shadow-indigo-500/20">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                QR Scanner
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Sẵn sàng
              </span>
            </div>
            <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
              Quét mã QR qua Camera hoặc Tải ảnh
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Sample preset scans */}
          <button
            id="btn-sample-scans"
            onClick={onOpenSamples}
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-900/80 transition-colors shadow-xs"
            title="Thử nghiệm quét các mẫu mã QR"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
            <span className="hidden xs:inline sm:inline">Quét thử mẫu</span>
          </button>

          {/* Sound Mute/Unmute */}
          <button
            id="btn-toggle-sound"
            onClick={onToggleBeep}
            type="button"
            aria-label={beepEnabled ? 'Tắt âm báo' : 'Bật âm báo'}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 transition-colors"
            title={beepEnabled ? 'Âm báo quét: Đang bật' : 'Âm báo quét: Đang tắt'}
          >
            {beepEnabled ? (
              <Volume2 className="h-4 w-4 text-slate-700 dark:text-slate-200" />
            ) : (
              <VolumeX className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            )}
          </button>

          {/* History Drawer Trigger */}
          <button
            id="btn-open-history"
            onClick={onOpenHistory}
            type="button"
            aria-label="Xem lịch sử quét"
            className="relative flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900 transition-colors text-xs font-medium"
            title="Lịch sử quét mã"
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Lịch sử</span>
            {historyCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1 text-[11px] font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
                {historyCount > 99 ? '99+' : historyCount}
              </span>
            )}
          </button>

          {/* Settings Trigger */}
          <button
            id="btn-open-settings"
            onClick={onOpenSettings}
            type="button"
            aria-label="Cài đặt máy quét"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 transition-colors"
            title="Cài đặt quét"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
