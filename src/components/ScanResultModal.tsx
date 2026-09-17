import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ExternalLink,
  Copy,
  Check,
  Share2,
  Wifi,
  Globe,
  FileText,
  User,
  Mail,
  CreditCard,
  QrCode,
  X,
  RotateCcw,
  ShieldCheck,
  KeyRound,
  Phone
} from 'lucide-react';
import { ScanResult, ScanType } from '../types';

interface ScanResultModalProps {
  result: ScanResult | null;
  onClose: () => void;
  onRescan: () => void;
  onCopyText: (text: string, label?: string) => void;
}

export const ScanResultModal: React.FC<ScanResultModalProps> = ({
  result,
  onClose,
  onRescan,
  onCopyText,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!result) return null;

  const handleCopy = (text: string, key = 'main') => {
    onCopyText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: result.title,
          text: result.rawText,
          url: result.type === 'url' ? result.rawText : undefined,
        });
      } catch (err) {
        // Ignored if cancelled
      }
    } else {
      handleCopy(result.rawText, 'share');
    }
  };

  // Type metadata icon and colors
  const getTypeConfig = (type: ScanType) => {
    switch (type) {
      case 'url':
        return {
          icon: Globe,
          label: 'Liên kết Website',
          color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900',
        };
      case 'wifi':
        return {
          icon: Wifi,
          label: 'Mạng Wi-Fi',
          color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900',
        };
      case 'payment':
        return {
          icon: CreditCard,
          label: 'Mã QR Thanh Toán',
          color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-900',
        };
      case 'contact':
        return {
          icon: User,
          label: 'Danh Bạ Liên Lạc',
          color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900',
        };
      case 'email':
        return {
          icon: Mail,
          label: 'Địa chỉ Email',
          color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900',
        };
      default:
        return {
          icon: FileText,
          label: 'Văn Bản / Ghi Chú',
          color: 'text-slate-500 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800',
        };
    }
  };

  const typeConfig = getTypeConfig(result.type);
  const Icon = typeConfig.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
        {/* Backdrop click to close */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Modal Sheet Container */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.96 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Top Grab bar on mobile */}
          <div className="sm:hidden w-full flex justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
          </div>

          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl border ${typeConfig.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  {typeConfig.label}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(result.timestamp).toLocaleTimeString('vi-VN')}
                </span>
              </div>
            </div>

            <button
              id="btn-close-result-modal"
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Đóng bảng kết quả"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="px-6 py-5 overflow-y-auto space-y-4">
            {/* Type-Specific Smart Cards */}
            {result.type === 'url' && (
              <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" />
                    Đường dẫn trang web
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Đã kiểm tra an toàn
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 break-all">
                  {result.rawText}
                </p>
              </div>
            )}

            {result.type === 'wifi' && result.metadata && (
              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Tên mạng (SSID):</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {result.metadata.ssid}
                  </span>
                </div>
                {result.metadata.password && (
                  <div className="flex items-center justify-between pt-2 border-t border-emerald-200/40 dark:border-emerald-900/40">
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <KeyRound className="h-3.5 w-3.5 text-emerald-600" />
                      Mật khẩu:
                    </span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        {result.metadata.password}
                      </code>
                      <button
                        id="btn-copy-wifi-password"
                        type="button"
                        onClick={() => handleCopy(result.metadata!.password!, 'wifi-pass')}
                        className="text-xs text-slate-500 hover:text-emerald-600 p-1"
                        title="Sao chép mật khẩu"
                      >
                        {copiedKey === 'wifi-pass' ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
                {result.metadata.encryption && (
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Mã hóa:</span>
                    <span>{result.metadata.encryption}</span>
                  </div>
                )}
              </div>
            )}

            {result.type === 'contact' && result.metadata && (
              <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 space-y-2.5">
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-sm">
                  <User className="h-4 w-4 text-amber-500" />
                  <span>{result.metadata.name}</span>
                </div>
                {result.metadata.phone && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-amber-200/40 dark:border-amber-900/40">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" /> Số điện thoại:
                    </span>
                    <a
                      href={`tel:${result.metadata.phone}`}
                      className="font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      {result.metadata.phone}
                    </a>
                  </div>
                )}
                {result.metadata.email && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-amber-200/40 dark:border-amber-900/40">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" /> Email:
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {result.metadata.email}
                    </span>
                  </div>
                )}
              </div>
            )}

            {result.type === 'payment' && (
              <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 space-y-2">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-sm">
                  <CreditCard className="h-4 w-4" />
                  <span>Mã VietQR Chuyển Khoản Nhanh</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Chuỗi dữ liệu chuẩn EMVCo / Napas247 tương thích các ứng dụng ngân hàng tại Việt Nam.
                </p>
              </div>
            )}

            {/* Raw Text Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Nội dung mã QR:</span>
                <button
                  id="btn-copy-raw-text"
                  type="button"
                  onClick={() => handleCopy(result.rawText, 'raw')}
                  className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline text-xs"
                >
                  {copiedKey === 'raw' ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Đã chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 break-all max-h-36 overflow-y-auto select-all leading-relaxed">
                {result.rawText}
              </div>
            </div>
          </div>

          {/* Modal Actions Footer */}
          <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
            {/* Left quick actions */}
            <div className="flex items-center gap-2">
              <button
                id="btn-share-result"
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Chia sẻ kết quả"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>Chia sẻ</span>
              </button>

              <button
                id="btn-rescan"
                type="button"
                onClick={onRescan}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Quét mã QR khác"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Quét tiếp</span>
              </button>
            </div>

            {/* Primary Action */}
            {result.type === 'url' ? (
              <a
                id="btn-open-url"
                href={result.rawText.startsWith('http') ? result.rawText : `https://${result.rawText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs sm:text-sm font-semibold text-white shadow-md shadow-indigo-600/30 transition-all"
              >
                <span>Mở liên kết</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <button
                id="btn-copy-main"
                type="button"
                onClick={() => handleCopy(result.rawText, 'main')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs sm:text-sm font-semibold text-white shadow-md shadow-indigo-600/30 transition-all"
              >
                {copiedKey === 'main' ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Đã sao chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Sao chép toàn bộ</span>
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
