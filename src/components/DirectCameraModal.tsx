import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  X,
  Zap,
  ZapOff,
  SwitchCamera,
  Scan,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileImage,
  MapPin,
  Edit3,
} from 'lucide-react';
import { decodeCanvas, decodeImageFile } from '../utils/qrScanner';
import { SAMPLE_MATERIAL_QRS } from '../utils/materialQrParser';
import { ScanErrorInfo } from './ScanErrorModal';

interface DirectCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (rawQrData: string) => void;
  onScanError?: (error: ScanErrorInfo) => void;
  title?: string;
  description?: string;
  scannerTarget?: 'location' | 'material';
  currentLocation?: string | null;
  onSwitchLocation?: () => void;
  onManualEntry?: () => void;
  samples?: { label: string; description?: string; desc?: string; raw?: string; code?: string }[];
}

export const DirectCameraModal: React.FC<DirectCameraModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  onScanError,
  title = 'Quét Mã QR Trực Tiếp',
  description = 'Rê camera vào mã QR — Tự động bóc tách & điền vào form tạo phiếu',
  scannerTarget = 'material',
  currentLocation,
  onSwitchLocation,
  onManualEntry,
  samples,
}) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [scanLocked, setScanLocked] = useState(false);
  const [showSamplePicker, setShowSamplePicker] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const isDecodingRef = useRef(false);
  const hasTriggeredRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Play audio chime when scanned
  const playSuccessChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {
      // Audio not permitted or supported
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(60);
      }
    } catch {
      // ignore
    }
  };

  // Stop camera stream cleanly
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setTorchOn(false);
  }, []);

  // Initialize camera
  const startCamera = useCallback(async () => {
    if (!isOpen) return;

    setCameraError(null);
    hasTriggeredRef.current = false;
    setScanLocked(false);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Trình duyệt không hỗ trợ getUserMedia hoặc chưa cấp quyền camera.');
      }

      stopCamera();

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
      setCameraError(null);
    } catch (err: any) {
      console.warn('Camera error:', err?.message);
      setIsCameraActive(false);
      setCameraError(
        err?.message || 'Không thể truy cập camera. Vui lòng cấp quyền hoặc sử dụng mã mẫu.'
      );
    }
  }, [isOpen, facingMode, stopCamera]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  // Frame scanning loop
  useEffect(() => {
    if (!isOpen || !isCameraActive || scanLocked) {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      return;
    }

    let isMounted = true;
    let lastScanTime = 0;
    const SCAN_INTERVAL_MS = 100; // Scan 10 times a second for fast, instantaneous detection

    const loop = async (timestamp: number) => {
      if (!isMounted || hasTriggeredRef.current) return;

      if (timestamp - lastScanTime > SCAN_INTERVAL_MS) {
        lastScanTime = timestamp;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (
          video &&
          canvas &&
          video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
          video.videoWidth > 0 &&
          !isDecodingRef.current
        ) {
          isDecodingRef.current = true;
          try {
            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
            }

            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const result = await decodeCanvas(canvas);

              if (result && result.data && result.data.trim() && !hasTriggeredRef.current) {
                hasTriggeredRef.current = true;
                setScanLocked(true);
                playSuccessChime();

                // Trigger callback and close camera form immediately
                setTimeout(() => {
                  stopCamera();
                  onScanSuccess(result.data);
                  onClose();
                }, 220);
              }
            }
          } catch (e) {
            // continue next frame
          } finally {
            isDecodingRef.current = false;
          }
        }
      }

      if (isMounted && !hasTriggeredRef.current) {
        animFrameIdRef.current = requestAnimationFrame(loop);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      isMounted = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
    };
  }, [isOpen, isCameraActive, scanLocked, onScanSuccess, onClose, stopCamera]);

  // Torch toggle
  const handleToggleTorch = async () => {
    const nextState = !torchOn;
    setTorchOn(nextState);
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as any;
      if (capabilities && 'torch' in capabilities) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: nextState } as any],
          });
        } catch (e) {
          console.warn('Torch failed', e);
        }
      }
    }
  };

  // Flip camera
  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Select sample QR to instantly test
  const handleSelectSample = (sampleRaw: string) => {
    playSuccessChime();
    hasTriggeredRef.current = true;
    setScanLocked(true);
    stopCamera();
    onScanSuccess(sampleRaw);
    onClose();
  };

  // Handle uploaded image as fallback
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (event) => {
        const url = event.target?.result as string;
        try {
          const decoded = await decodeImageFile(url);
          if (decoded && decoded.data && decoded.data.trim()) {
            playSuccessChime();
            hasTriggeredRef.current = true;
            stopCamera();
            onScanSuccess(decoded.data);
            onClose();
          } else {
            if (onScanError) {
              onClose();
              onScanError({
                type: 'decode_failed',
                title: 'Không tìm thấy mã QR trong ảnh',
                message:
                  'Hệ thống đã quét hình ảnh nhưng không phát hiện mã QR nào. Vui lòng chụp rõ nét, cận cảnh tem QR và đảm bảo đủ ánh sáng.',
              });
            }
          }
        } catch (err: any) {
          if (onScanError) {
            onClose();
            onScanError({
              type: 'decode_failed',
              title: 'Lỗi phân tích hình ảnh',
              message:
                err?.message ||
                'Không thể đọc dữ liệu từ tệp hình ảnh vừa chọn. Vui lòng thử lại với hình ảnh khác.',
            });
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
        {/* Backdrop click */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Hidden canvas for video frame decoding */}
        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative z-10 w-full max-w-lg rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden flex flex-col text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Camera className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{title}</span>
                  {scanLocked && (
                    <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Xong!
                    </span>
                  )}
                </h3>
              </div>
            </div>

            <button
              id="btn-close-scanner-modal"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Camera Viewport Area */}
          <div className="relative w-full aspect-[4/3] bg-slate-950 flex items-center justify-center overflow-hidden select-none">
            {/* Real Camera Stream */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                isCameraActive ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
              }}
            />

            {/* Error state */}
            {!isCameraActive && (
              <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-200 mb-1">
                  Chưa thể mở Camera
                </h4>
                <p className="text-xs text-slate-400 mb-4 max-w-xs leading-relaxed">
                  {cameraError || 'Đang kết nối camera của thiết bị...'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    id="btn-retry-scanner-cam"
                    type="button"
                    onClick={startCamera}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-md transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Thử lại Camera
                  </button>

                  {cameraError && onScanError && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onScanError({
                          type: 'camera_permission',
                          title: 'Không thể truy cập máy ảnh (Camera)',
                          message:
                            cameraError ||
                            'Bạn chưa cấp quyền truy cập Camera cho trình duyệt hoặc thiết bị không tìm thấy camera.',
                        });
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-xs font-medium text-rose-200 border border-rose-800 transition-colors"
                    >
                      <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                      Mô tả lỗi
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
                  >
                    <FileImage className="h-3.5 w-3.5" />
                    Tải ảnh có QR
                  </button>
                </div>
              </div>
            )}

            {/* Dark mask around viewfinder */}
            <div className="absolute inset-0 pointer-events-none bg-black/40 backdrop-blur-[1px]" />

            {/* Reticle Target Box */}
            <div className="relative z-10 w-56 h-56 sm:w-64 sm:h-64 rounded-2xl flex items-center justify-center">
              {/* Cutout box */}
              <div
                className={`absolute inset-0 rounded-2xl border transition-all duration-300 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] ${
                  scanLocked
                    ? 'border-emerald-400 bg-emerald-500/15'
                    : 'border-white/20'
                }`}
              />

              {/* Glowing Corner Brackets */}
              <div
                className={`absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 rounded-tl-xl transition-all duration-300 ${
                  scanLocked
                    ? 'border-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,1)]'
                    : 'border-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                }`}
              />
              <div
                className={`absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 rounded-tr-xl transition-all duration-300 ${
                  scanLocked
                    ? 'border-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,1)]'
                    : 'border-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                }`}
              />
              <div
                className={`absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 rounded-bl-xl transition-all duration-300 ${
                  scanLocked
                    ? 'border-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,1)]'
                    : 'border-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                }`}
              />
              <div
                className={`absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 rounded-br-xl transition-all duration-300 ${
                  scanLocked
                    ? 'border-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,1)]'
                    : 'border-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                }`}
              />

              {/* Center Crosshair Dot */}
              <div
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  scanLocked
                    ? 'bg-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,1)]'
                    : 'bg-emerald-400/80 drop-shadow-[0_0_4px_rgba(16,185,129,1)]'
                }`}
              />

              {/* Animated Scan Laser */}
              {!scanLocked && isCameraActive && (
                <motion.div
                  className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent pointer-events-none shadow-[0_0_12px_2px_rgba(52,211,153,0.9)]"
                  animate={{
                    top: ['8%', '92%', '8%'],
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <div className="w-full h-6 -mt-3 bg-gradient-to-b from-emerald-400/20 to-transparent pointer-events-none" />
                </motion.div>
              )}

              {/* Scan Lock Success Splash */}
              {scanLocked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/60 rounded-2xl backdrop-blur-xs">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-bounce" />
                  <span className="text-xs font-bold text-emerald-200 mt-2">
                    Đã lấy dữ liệu mã QR!
                  </span>
                </div>
              )}
            </div>

            {/* Quick in-view Controls (Torch & Flip) */}
            <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
              <button
                id="btn-scanner-torch"
                type="button"
                onClick={handleToggleTorch}
                title="Bật/Tắt đèn Flash"
                className={`p-2 rounded-full backdrop-blur-md border transition-colors ${
                  torchOn
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                    : 'bg-black/50 text-white border-white/20 hover:bg-black/70'
                }`}
              >
                {torchOn ? <Zap className="h-4 w-4" /> : <ZapOff className="h-4 w-4" />}
              </button>

              <button
                id="btn-scanner-flip"
                type="button"
                onClick={handleFlipCamera}
                title="Đổi camera trước / sau"
                className="p-2 rounded-full bg-black/50 text-white border border-white/20 hover:bg-black/70 backdrop-blur-md transition-colors"
              >
                <SwitchCamera className="h-4 w-4" />
              </button>
            </div>

            {/* Quick in-view Location Indicator & Switch Location Button */}
            {scannerTarget === 'material' && currentLocation && (
              <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 max-w-[calc(100%-84px)] pointer-events-auto">
                <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/50 backdrop-blur-md shadow-md text-white text-xs">
                  <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span className="text-slate-400 text-[10px]">Vị trí:</span>
                  <span className="font-mono font-bold text-emerald-300 text-xs">{currentLocation}</span>
                </div>
                {onSwitchLocation && (
                  <button
                    id="btn-scanner-switch-location"
                    type="button"
                    onClick={onSwitchLocation}
                    className="px-2.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 text-[11px] font-semibold text-slate-200 hover:text-emerald-300 backdrop-blur-md shadow-md transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Đổi vị trí</span>
                  </button>
                )}

                {onManualEntry && (
                  <button
                    id="btn-scanner-manual-entry"
                    type="button"
                    onClick={() => {
                      stopCamera();
                      onManualEntry();
                      onClose();
                    }}
                    className="px-2.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 text-[11px] font-semibold text-slate-200 hover:text-emerald-300 backdrop-blur-md shadow-md transition-colors flex items-center gap-1"
                    title="Tự điền thông tin vật tư thủ công"
                  >
                    <Edit3 className="h-3 w-3 text-emerald-400" />
                    <span>Tự điền</span>
                  </button>
                )}
              </div>
            )}

            {scannerTarget === 'location' && (
              <div className="absolute top-3 left-3 z-20 flex items-center max-w-[calc(100%-84px)] pointer-events-auto">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/50 backdrop-blur-md shadow-md text-amber-300 text-xs font-semibold">
                  <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>Bước 1: Quét mã vị trí kho</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Guide & Sample Bar */}
          <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Rê vào mã QR để tự động quét</span>
              </div>

              <div className="flex items-center gap-2">
                {scannerTarget === 'material' && onManualEntry && (
                  <button
                    id="btn-footer-manual-entry"
                    type="button"
                    onClick={() => {
                      stopCamera();
                      onManualEntry();
                      onClose();
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800 transition-colors"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>Tự điền</span>
                  </button>
                )}

                <button
                  id="btn-toggle-sample-list"
                  type="button"
                  onClick={() => setShowSamplePicker((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>{showSamplePicker ? 'Đóng' : 'Mẫu thử'}</span>
                </button>
              </div>
            </div>

            {/* Expandable Sample QRs for quick testing */}
            {showSamplePicker && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto"
              >
                {(samples || SAMPLE_MATERIAL_QRS).map((item, idx) => {
                  const val = item.raw || item.code || '';
                  const desc = item.description || item.desc || '';
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSample(val)}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-800/80 hover:bg-emerald-950/60 border border-slate-700/60 hover:border-emerald-500/50 text-left transition-colors"
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-slate-200 block truncate">
                          {item.label}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {desc || val}
                        </span>
                      </div>
                      <span className="text-[11px] text-emerald-400 font-semibold shrink-0 ml-2">
                        Chọn &rarr;
                      </span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
