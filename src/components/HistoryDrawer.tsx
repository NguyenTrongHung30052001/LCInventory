import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  History,
  X,
  Trash2,
  Search,
  Copy,
  Check,
  ExternalLink,
  Globe,
  Wifi,
  FileText,
  CreditCard,
  User,
  Mail,
  ChevronRight
} from 'lucide-react';
import { ScanResult, ScanType } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  history: ScanResult[];
  onClose: () => void;
  onClearHistory: () => void;
  onDeleteItem: (id: string) => void;
  onSelectItem: (item: ScanResult) => void;
  onCopyText: (text: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  history,
  onClose,
  onClearHistory,
  onDeleteItem,
  onSelectItem,
  onCopyText,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | ScanType>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredHistory = history.filter((item) => {
    const matchesFilter = selectedFilter === 'all' || item.type === selectedFilter;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.rawText.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleCopy = (e: React.MouseEvent, id: string, text: string) => {
    e.stopPropagation();
    onCopyText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const getIconForType = (type: ScanType) => {
    switch (type) {
      case 'url':
        return <Globe className="h-4 w-4 text-blue-500" />;
      case 'wifi':
        return <Wifi className="h-4 w-4 text-emerald-500" />;
      case 'payment':
        return <CreditCard className="h-4 w-4 text-purple-500" />;
      case 'contact':
        return <User className="h-4 w-4 text-amber-500" />;
      case 'email':
        return <Mail className="h-4 w-4 text-rose-500" />;
      default:
        return <FileText className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
        {/* Backdrop */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Slide-in Drawer */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="relative z-10 w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                <History className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Lịch sử quét ({history.length})
                </h2>
                <p className="text-xs text-slate-400">Các mã QR đã quét gần đây</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {history.length > 0 && (
                <button
                  id="btn-clear-history"
                  type="button"
                  onClick={onClearHistory}
                  className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Xóa toàn bộ lịch sử"
                  aria-label="Xóa toàn bộ lịch sử"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                id="btn-close-history"
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Đóng lịch sử"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                id="input-search-history"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm nội dung đã quét..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              {(
                [
                  { key: 'all', label: 'Tất cả' },
                  { key: 'url', label: 'Web' },
                  { key: 'wifi', label: 'Wi-Fi' },
                  { key: 'payment', label: 'Thanh toán' },
                  { key: 'contact', label: 'Danh bạ' },
                  { key: 'text', label: 'Văn bản' },
                ] as const
              ).map((chip) => (
                <button
                  key={chip.key}
                  id={`filter-chip-${chip.key}`}
                  type="button"
                  onClick={() => setSelectedFilter(chip.key)}
                  className={`px-2.5 py-1 rounded-full whitespace-nowrap text-xs font-medium transition-colors ${
                    selectedFilter === chip.key
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {filteredHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <History className="h-10 w-10 mb-2 opacity-40" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {searchQuery ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có lịch sử quét'}
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  {searchQuery
                    ? 'Thử tìm kiếm với từ khóa khác'
                    : 'Các mã QR bạn quét bằng camera hoặc tải ảnh lên sẽ xuất hiện tại đây.'}
                </p>
              </div>
            ) : (
              filteredHistory.map((item) => (
                <div
                  key={item.id}
                  id={`history-item-${item.id}`}
                  onClick={() => onSelectItem(item)}
                  className="group relative flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-indigo-300 dark:hover:border-indigo-900/60 hover:shadow-sm cursor-pointer transition-all"
                >
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                    {getIconForType(item.type)}
                  </div>

                  <div className="flex-1 min-w-0 pr-6">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono">
                      {item.rawText}
                    </p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                      {new Date(item.timestamp).toLocaleString('vi-VN', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>

                  {/* Actions (Copy + Delete) */}
                  <div className="absolute right-2 top-2 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      id={`btn-copy-history-${item.id}`}
                      type="button"
                      onClick={(e) => handleCopy(e, item.id, item.rawText)}
                      className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      title="Sao chép"
                    >
                      {copiedId === item.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>

                    <button
                      id={`btn-delete-history-${item.id}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteItem(item.id);
                      }}
                      className="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500"
                      title="Xóa mục này"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
