import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Info } from 'lucide-react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'info';
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success' }) => {
  if (!message) return null;

  return (
    <AnimatePresence>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl border border-slate-700/50 dark:border-slate-200 text-xs font-semibold backdrop-blur-md"
        >
          {type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
          ) : (
            <Info className="h-4 w-4 text-sky-400 dark:text-sky-600" />
          )}
          <span>{message}</span>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
