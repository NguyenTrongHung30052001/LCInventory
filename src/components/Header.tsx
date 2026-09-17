import React from 'react';
import { QrCode, PlusCircle, Volume2, VolumeX, Sparkles, FileText } from 'lucide-react';

interface HeaderProps {
  ticketCount: number;
  beepEnabled: boolean;
  onToggleBeep: () => void;
  onOpenCreateTicket: () => void;
  onOpenQuickScan: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  ticketCount,
  beepEnabled,
  onToggleBeep,
  onOpenCreateTicket,
  onOpenQuickScan,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/90 transition-colors">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* App Branding */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-sky-500 text-white shadow-md shadow-indigo-500/20">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                QR Scanner
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                Tạo phiếu & Quét tự động
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Quét camera trực tiếp, trích xuất dữ liệu & điền phiếu tức thì
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            id="btn-toggle-sound"
            onClick={onToggleBeep}
            type="button"
            aria-label={beepEnabled ? 'Tắt âm báo' : 'Bật âm báo'}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 transition-colors"
            title={beepEnabled ? 'Âm báo quét: Đang bật' : 'Âm báo quét: Đang tắt'}
          >
            {beepEnabled ? (
              <Volume2 className="h-4 w-4 text-slate-700 dark:text-slate-200" />
            ) : (
              <VolumeX className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            )}
          </button>

          {/* Quick Camera Scanner */}
          <button
            id="btn-open-quick-camera"
            onClick={onOpenQuickScan}
            type="button"
            className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          >
            <QrCode className="h-4 w-4 text-indigo-500" />
            <span>Quét camera nhanh</span>
          </button>

          {/* PRIMARY: Tạo Phiếu Mới button */}
          <button
            id="btn-header-create-ticket"
            onClick={onOpenCreateTicket}
            type="button"
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs sm:text-sm font-bold text-white shadow-md shadow-indigo-600/25 transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Tạo Phiếu Mới</span>
          </button>
        </div>
      </div>
    </header>
  );
};
