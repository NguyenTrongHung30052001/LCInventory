import React from 'react';
import { QrCode, Plus, Volume2, VolumeX, Camera } from 'lucide-react';

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
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 transition-colors">
      <div className="mx-auto flex h-14 max-w-lg sm:max-w-xl md:max-w-3xl lg:max-w-5xl items-center justify-between px-3 sm:px-4">
        {/* App Branding */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                QR Kho
              </h1>
              <span className="text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                {ticketCount}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-none">
              Quản lý vật tư
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          {/* Sound Toggle */}
          <button
            id="btn-toggle-sound"
            onClick={onToggleBeep}
            type="button"
            aria-label={beepEnabled ? 'Tắt âm báo' : 'Bật âm báo'}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            title={beepEnabled ? 'Âm báo: Bật' : 'Âm báo: Tắt'}
          >
            {beepEnabled ? (
              <Volume2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <VolumeX className="h-4 w-4 text-slate-400" />
            )}
          </button>

          {/* Quick Camera Scanner Button */}
          <button
            id="btn-open-quick-camera"
            onClick={onOpenQuickScan}
            type="button"
            className="flex h-9 items-center gap-1.5 px-2.5 sm:px-3 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-semibold transition-colors"
          >
            <Camera className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden xs:inline text-xs font-bold">Quét</span>
          </button>

          {/* PRIMARY: Tạo Phiếu Button */}
          <button
            id="btn-header-create-ticket"
            onClick={onOpenCreateTicket}
            type="button"
            className="flex h-9 items-center gap-1 px-3 sm:px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-xs sm:text-sm font-bold text-white shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo phiếu</span>
          </button>
        </div>
      </div>
    </header>
  );
};
