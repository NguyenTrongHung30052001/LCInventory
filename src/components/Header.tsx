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
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 transition-colors">
      <div className="mx-auto flex h-14 max-w-lg sm:max-w-xl md:max-w-3xl lg:max-w-5xl items-center justify-between px-3 sm:px-4">
        {/* App Branding với Logo Liên Châu */}
        <div className="flex items-center gap-2">
          {/* Logo Liên Châu */}
          <button
            type="button"
            onClick={onOpenVersionModal}
            className="flex items-center gap-2 text-left focus:outline-hidden group"
            title="Xem thông tin phiên bản"
          >
            <LienChauLogo size="md" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black text-emerald-800 dark:text-emerald-400 tracking-wider font-sans leading-none uppercase">
                  LIÊN CHÂU
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {ticketCount}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 leading-none">
                  QR Kho MES
                </span>
                <span className="h-2 w-px bg-slate-200 dark:bg-slate-700" />
                {/* Phần hiển thị phiên bản & thời gian cập nhật */}
                <span className="inline-flex items-center gap-0.5 text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.2 rounded group-hover:bg-emerald-100 transition-colors">
                  {APP_VERSION.version}
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          {/* Version Info Button */}
          <button
            id="btn-version-info"
            onClick={onOpenVersionModal}
            type="button"
            aria-label="Thông tin phiên bản"
            className="hidden xs:flex h-9 items-center gap-1 px-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 text-[10px] font-mono transition-colors"
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
            className="flex h-9 items-center gap-1.5 px-3 sm:px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-xs sm:text-sm font-bold text-white shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo phiếu</span>
          </button>
        </div>
      </div>
    </header>
  );
};
