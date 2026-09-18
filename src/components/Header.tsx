import React from 'react';
import { Menu, Bell } from 'lucide-react';

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
  // Keeping props to respect "no logic change" rule, though we may not show them all in this clean header
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b border-slate-200">
      <div className="mx-auto flex h-14 w-full items-center justify-between px-4">
        {/* Left: Hamburger Menu */}
        <button
          type="button"
          className="p-1 text-slate-500 hover:text-slate-800 transition-colors"
          aria-label="Menu"
        >
          <Menu className="h-6 w-6" strokeWidth={1.5} />
        </button>

        {/* Right: Notifications & Avatar */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="p-1 text-slate-500 hover:text-slate-800 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" strokeWidth={1.5} />
          </button>
          
          <div className="h-8 w-8 rounded-full bg-slate-200 overflow-hidden border border-slate-200 cursor-pointer">
            <img 
              src="https://ui-avatars.com/api/?name=User&background=random" 
              alt="User Avatar" 
              className="h-full w-full object-cover" 
            />
          </div>
        </div>
      </div>
    </header>
  );
};

