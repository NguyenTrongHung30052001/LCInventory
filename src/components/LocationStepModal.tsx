import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  X,
  Camera,
  ArrowRight,
  Edit3,
  CheckCircle2,
  QrCode,
} from 'lucide-react';

interface LocationStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: string;
  onConfirmLocation: (location: string, nextAction: 'scan' | 'manual') => void;
  onOpenLocationScanner: () => void;
  scannedLocationQr?: string | null;
}

export const LocationStepModal: React.FC<LocationStepModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onConfirmLocation,
  onOpenLocationScanner,
  scannedLocationQr,
}) => {
  const [locationInput, setLocationInput] = useState('');
  const [isFromQr, setIsFromQr] = useState(false);

  // Sync with prop when opened or when scanned QR arrives
  useEffect(() => {
    if (isOpen) {
      if (scannedLocationQr && scannedLocationQr.trim()) {
        setLocationInput(scannedLocationQr.trim());
        setIsFromQr(true);
      } else if (currentLocation && currentLocation.trim()) {
        setLocationInput(currentLocation.trim());
        setIsFromQr(false);
      } else {
        setLocationInput('');
        setIsFromQr(false);
      }
    }
  }, [isOpen, scannedLocationQr, currentLocation]);

  if (!isOpen) return null;

  const cleanLocation = locationInput.trim();
  const isValid = cleanLocation.length > 0;

  const handleContinue = (nextAction: 'scan' | 'manual') => {
    if (!isValid) return;
    onConfirmLocation(cleanLocation, nextAction);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isValid) {
      e.preventDefault();
      handleContinue('scan');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-3 bg-black/60 backdrop-blur-xs">
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 flex flex-col text-slate-900 dark:text-slate-100 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Bước 1 / 2
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Chọn vị trí kệ kho
                </h3>
              </div>
            </div>

            <button
              id="btn-close-location-modal"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Điền mã vị trí kệ kho hoặc quét mã QR vị trí kệ trước khi tiến hành quét vật tư.
            </p>

            {/* Input vị trí */}
            <div className="space-y-1.5">
              <label
                htmlFor="input-warehouse-location"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Mã vị trí kệ kho <span className="text-rose-500">*</span>
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="h-4 w-4" />
                </div>
                <input
                  id="input-warehouse-location"
                  type="text"
                  autoFocus
                  value={locationInput}
                  onChange={(e) => {
                    setLocationInput(e.target.value);
                    setIsFromQr(false);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder=""
                  className="w-full h-11 pl-9 pr-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm font-mono font-bold text-slate-900 dark:text-white uppercase placeholder:normal-case placeholder:font-sans placeholder:font-normal focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-hidden"
                />
                {locationInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocationInput('');
                      setIsFromQr(false);
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {isFromQr && (
                <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Đã quét từ mã QR vị trí</span>
                </div>
              )}
            </div>

            {/* Nút Quét QR Vị Trí */}
            <div className="pt-0.5">
              <button
                id="btn-scan-location-qr"
                type="button"
                onClick={onOpenLocationScanner}
                className="w-full h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition-colors"
              >
                <QrCode className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <Camera className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Bấm để quét mã QR vị trí kệ</span>
              </button>
            </div>

            {/* Action Buttons: Tiếp tục qua bước quét QR hoặc Tự điền */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <button
                id="btn-confirm-location-next-scan"
                type="button"
                disabled={!isValid}
                onClick={() => handleContinue('scan')}
                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Camera className="h-4 w-4" />
                <span>Tiếp tục: Quét mã QR vật tư</span>
                <ArrowRight className="h-4 w-4 ml-0.5" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  id="btn-cancel-location-step"
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-10 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Hủy
                </button>

                <button
                  id="btn-confirm-location-manual"
                  type="button"
                  disabled={!isValid}
                  onClick={() => handleContinue('manual')}
                  className="flex-1 h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-emerald-500 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Edit3 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Tự điền thông tin</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
