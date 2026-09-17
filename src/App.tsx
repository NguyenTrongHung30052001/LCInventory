/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ScannerViewport } from './components/ScannerViewport';
import { ScanResultModal } from './components/ScanResultModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { SettingsModal } from './components/SettingsModal';
import { SampleQrModal } from './components/SampleQrModal';
import { Toast } from './components/Toast';
import { ScanMode, ScanResult, ScannerSettings } from './types';
import { parseQrContent, INITIAL_HISTORY } from './utils/qrParser';

const DEFAULT_SETTINGS: ScannerSettings = {
  beepOnScan: true,
  vibrateOnScan: true,
  autoOpenUrl: false,
  continuousScan: false,
  saveHistory: true,
  preferredCamera: 'environment',
};

export default function App() {
  const [mode, setMode] = useState<ScanMode>('camera');
  const [activeResult, setActiveResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<ScanResult[]>(() => {
    try {
      const saved = localStorage.getItem('qr_scanner_history');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_HISTORY;
  });

  const [settings, setSettings] = useState<ScannerSettings>(() => {
    try {
      const saved = localStorage.getItem('qr_scanner_settings');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  // UI Modals / Drawers state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSamplesOpen, setIsSamplesOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync history to localStorage if enabled
  useEffect(() => {
    if (settings.saveHistory) {
      try {
        localStorage.setItem('qr_scanner_history', JSON.stringify(history));
      } catch {
        // ignore
      }
    }
  }, [history, settings.saveHistory]);

  // Sync settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('qr_scanner_settings', JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  // Audio feedback synthesizer
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio context might be restricted before interaction
    }
  };

  const handleScanDetected = (rawText: string) => {
    const parsed = parseQrContent(rawText);

    // Audio & Haptic feedback
    if (settings.beepOnScan) {
      playBeep();
    }
    if (settings.vibrateOnScan && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(80);
      } catch {
        // ignore
      }
    }

    // Add to history
    if (settings.saveHistory) {
      setHistory((prev) => [parsed, ...prev.filter((item) => item.rawText !== parsed.rawText)]);
    }

    // Open URL automatically if setting enabled
    if (settings.autoOpenUrl && parsed.type === 'url') {
      const url = parsed.rawText.startsWith('http') ? parsed.rawText : `https://${parsed.rawText}`;
      window.open(url, '_blank');
    }

    setActiveResult(parsed);
  };

  const handleCopyText = (text: string, label = 'nội dung') => {
    navigator.clipboard.writeText(text);
    showToast(`Đã sao chép ${label} vào bộ nhớ tạm`);
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('qr_scanner_history');
    } catch {
      // ignore
    }
    showToast('Đã xóa sạch lịch sử quét');
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    showToast('Đã xóa khỏi lịch sử');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Header
        historyCount={history.length}
        beepEnabled={settings.beepOnScan}
        onToggleBeep={() =>
          setSettings((prev) => {
            const next = !prev.beepOnScan;
            showToast(next ? 'Đã bật âm báo' : 'Đã tắt âm báo');
            return { ...prev, beepOnScan: next };
          })
        }
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSamples={() => setIsSamplesOpen(true)}
      />

      {/* Main Scanner Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
        <ScannerViewport
          mode={mode}
          onModeChange={setMode}
          onScanDetected={handleScanDetected}
          onOpenSampleModal={() => setIsSamplesOpen(true)}
        />
      </main>

      {/* Footer / Status bar */}
      <footer className="w-full border-t border-slate-200/80 dark:border-slate-800/80 py-3 px-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Giao diện Trình quét mã QR Web &bull; Sẵn sàng mở rộng thêm chức năng</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSamplesOpen(true)}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Mẫu quét thử
            </button>
            <span>&bull;</span>
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Lịch sử ({history.length})
            </button>
            <span>&bull;</span>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Cài đặt
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <ScanResultModal
        result={activeResult}
        onClose={() => setActiveResult(null)}
        onRescan={() => setActiveResult(null)}
        onCopyText={handleCopyText}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        history={history}
        onClose={() => setIsHistoryOpen(false)}
        onClearHistory={handleClearHistory}
        onDeleteItem={handleDeleteHistoryItem}
        onSelectItem={(item) => {
          setActiveResult(item);
          setIsHistoryOpen(false);
        }}
        onCopyText={handleCopyText}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onUpdateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
        onClose={() => setIsSettingsOpen(false)}
      />

      <SampleQrModal
        isOpen={isSamplesOpen}
        onClose={() => setIsSamplesOpen(false)}
        onSelectSample={handleScanDetected}
      />

      {/* Toast Feedback */}
      <Toast message={toastMessage} />
    </div>
  );
}
