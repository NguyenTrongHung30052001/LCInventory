import React from 'react';
import { Plus, Info } from 'lucide-react';
import { LienChauLogo } from './LienChauLogo';
import { APP_VERSION } from '../config/version';

interface HeaderProps {
  ticketCount?: number;
  beepEnabled?: boolean;
  onToggleBeep?: () => void;
  onOpenCreateTicket: () => void;
  onOpenQuickScan?: () => void;
  onExportCSV?: () => void;
  onOpenVersionModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  ticketCount = 0,
  beepEnabled = true,
  onToggleBeep,
  onOpenCreateTicket,
  onOpenQuickScan,
  onExportCSV,
  onOpenVersionModal,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full transition-colors pt-2 px-2 pb-1">
      <div className="mx-auto flex h-14 max-w-lg sm:max-w-xl md:max-w-3xl lg:max-w-5xl items-center justify-between px-3 sm:px-4 rounded-2xl glass-panel">
        {/* App Branding với Logo Liên Châu */}
        <div className="flex items-center gap-2">
          {/* Logo Liên Châu */}
          <button
            type="button"
            onClick={onOpenVersionModal}
            className="flex items-center gap-2.5 text-left focus:outline-hidden group"
            title="Xem thông tin phiên bản"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-md group-hover:bg-emerald-400/40 transition-all duration-300"></div>
              <LienChauLogo size="md" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-black bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300 tracking-wider font-sans leading-none uppercase">
                  LIÊN CHÂU
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-br from-emerald-100 to-teal-50 text-emerald-700 dark:from-emerald-900/50 dark:to-teal-900/50 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-700/50 shadow-sm">
                  {ticketCount}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 leading-none tracking-wide">
                  QR Kho MES
                </span>
                <span className="h-2 w-px bg-slate-300 dark:bg-slate-700" />
                {/* Phần hiển thị phiên bản & thời gian cập nhật */}
                <span className="inline-flex items-center gap-0.5 text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded group-hover:bg-emerald-100/80 dark:group-hover:bg-emerald-800/60 transition-colors backdrop-blur-sm border border-emerald-100 dark:border-emerald-800/50">
                  {APP_VERSION.version}
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Version Info Button */}
          <button
            id="btn-version-info"
            onClick={onOpenVersionModal}
            type="button"
            aria-label="Thông tin phiên bản"
            className="hidden xs:flex h-9 items-center gap-1.5 px-2.5 rounded-xl border border-slate-200/60 bg-white/50 text-slate-600 hover:bg-slate-100/80 hover:border-slate-300 dark:border-slate-700/60 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-700/80 text-[10px] font-mono transition-all backdrop-blur-sm shadow-sm"
            title={`Phiên bản: ${APP_VERSION.version} - Cập nhật: ${APP_VERSION.updatedAt}`}
          >
            <Info className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline font-bold">{APP_VERSION.version}</span>
          </button>

          {/* PRIMARY: Tạo Phiếu Button */}
          <button
            id="btn-header-create-ticket"
            onClick={onOpenCreateTicket}
            type="button"
            className="flex h-9 items-center gap-1.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-95 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            <span className="tracking-wide">Tạo phiếu</span>
          </button>
        </div>
      </div>
    </header>
  );
};
