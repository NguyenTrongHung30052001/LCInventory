import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  UploadCloud,
  Zap,
  ZapOff,
  SwitchCamera,
  Play,
  Pause,
  Image as ImageIcon,
  Scan,
  Sparkles,
  AlertCircle,
  FileText
} from 'lucide-react';
import { ScanMode, ScanResult } from '../types';

interface ScannerViewportProps {
  mode: ScanMode;
  onModeChange: (mode: ScanMode) => void;
  onScanDetected: (raw: string) => void;
  onOpenSampleModal: () => void;
}

export const ScannerViewport: React.FC<ScannerViewportProps> = ({
  mode,
  onModeChange,
  onScanDetected,
  onOpenSampleModal,
}) => {
  // Camera state
  const [torchOn, setTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isPaused, setIsPaused] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  // Upload image state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Attempt real camera stream if available in browser
  useEffect(() => {
    let isMounted = true;

    async function initCamera() {
      if (mode !== 'camera') {
        stopCamera();
        return;
      }

      setCameraError(null);
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Trình duyệt không hỗ trợ truy cập máy ảnh');
        }

        stopCamera();

        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setIsCameraActive(true);
      } catch (err: any) {
        if (isMounted) {
          console.warn('Camera access unavailable or restricted:', err?.message);
          setCameraError(err?.message || 'Không thể mở máy ảnh trên thiết bị hoặc quyền bị chặn');
          setIsCameraActive(false);
        }
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [mode, facingMode]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const handleToggleTorch = async () => {
    setTorchOn((prev) => !prev);
    // Apply torch constraint if hardware supports it
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as any;
      if (capabilities && 'torch' in capabilities) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: !torchOn } as any],
          });
        } catch (e) {
          console.warn('Torch failed to toggle', e);
        }
      }
    }
  };

  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const processImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedImage(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto px-4 py-6">
      {/* Mode Switcher Tabs */}
      <div className="flex w-full max-w-md items-center rounded-xl bg-slate-100 dark:bg-slate-900 p-1 mb-6 border border-slate-200 dark:border-slate-800">
        <button
          id="tab-camera-mode"
          type="button"
          onClick={() => onModeChange('camera')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
            mode === 'camera'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Camera className="h-4 w-4" />
          <span>Camera Trực Tiếp</span>
        </button>

        <button
          id="tab-upload-mode"
          type="button"
          onClick={() => onModeChange('upload')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
            mode === 'upload'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <UploadCloud className="h-4 w-4" />
          <span>Tải Ảnh Mã QR</span>
        </button>
      </div>

      {/* Main Viewport Card */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-xl flex flex-col items-center">
        {mode === 'camera' ? (
          /* CAMERA VIEWPORT */
          <div className="relative w-full aspect-square sm:aspect-[4/3] max-h-[440px] flex items-center justify-center bg-slate-950 overflow-hidden select-none">
            {/* Real Video Element */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                isCameraActive ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                transform: `scale(${zoomLevel}) ${facingMode === 'user' ? 'scaleX(-1)' : ''}`,
              }}
            />

            {/* Simulated Live Viewport Background (Shown if camera is in preview/sandbox or denied) */}
            {!isCameraActive && (
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-center p-6 text-center">
                {/* Tech grid texture overlay */}
                <div
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
                    backgroundSize: '24px 24px',
                  }}
                />

                {cameraError ? (
                  <div className="relative z-10 max-w-xs flex flex-col items-center">
                    <div className="h-12 w-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                      <Camera className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-200 mb-1">
                      Mô phỏng máy ảnh đang chạy
                    </h3>
                    <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                      Trong chế độ xem này, bạn có thể kiểm tra giao diện hoặc thử ngay với các mẫu mã QR bên dưới.
                    </p>
                    <button
                      id="btn-trigger-sample-qr"
                      type="button"
                      onClick={onOpenSampleModal}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition-all"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Quét thử mẫu QR ngay
                    </button>
                  </div>
                ) : (
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="h-10 w-10 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin mb-3" />
                    <p className="text-xs text-slate-400">Đang khởi động camera...</p>
                  </div>
                )}
              </div>
            )}

            {/* Dark Vignette Mask around target area */}
            <div className="absolute inset-0 pointer-events-none bg-black/40 backdrop-blur-[1px]" />

            {/* Reticle / Viewfinder Target Box */}
            <div className="relative z-10 w-60 h-60 sm:w-68 sm:h-68 rounded-2xl flex items-center justify-center">
              {/* Clear cutout center */}
              <div className="absolute inset-0 rounded-2xl border border-white/20 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />

              {/* Glowing Corner Brackets */}
              <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-indigo-400 rounded-tl-xl drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-indigo-400 rounded-tr-xl drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-indigo-400 rounded-bl-xl drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-indigo-400 rounded-br-xl drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]" />

              {/* Center Crosshair Dot */}
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400/70 drop-shadow-[0_0_4px_rgba(99,102,241,1)]" />

              {/* Animated Laser Scanning Line */}
              {!isPaused && (
                <motion.div
                  className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent pointer-events-none shadow-[0_0_12px_2px_rgba(34,211,238,0.8)]"
                  animate={{
                    top: ['6%', '94%', '6%'],
                  }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <div className="w-full h-8 -mt-4 bg-gradient-to-b from-cyan-400/20 to-transparent pointer-events-none" />
                </motion.div>
              )}

              {/* Paused state overlay */}
              {isPaused && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl backdrop-blur-xs">
                  <span className="text-xs font-semibold text-slate-200 bg-black/70 px-3 py-1.5 rounded-full border border-white/20">
                    Đã tạm dừng
                  </span>
                </div>
              )}
            </div>

            {/* Quick in-view controls (Torch, Flip, Pause) */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
              {/* Torch Button */}
              <button
                id="btn-torch-toggle"
                type="button"
                onClick={handleToggleTorch}
                aria-label="Bật/Tắt đèn flash"
                className={`p-2.5 rounded-full backdrop-blur-md border transition-colors ${
                  torchOn
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.5)]'
                    : 'bg-black/50 text-white border-white/20 hover:bg-black/70'
                }`}
                title="Bật/Tắt đèn flash"
              >
                {torchOn ? <Zap className="h-4 w-4" /> : <ZapOff className="h-4 w-4" />}
              </button>

              {/* Flip Camera */}
              <button
                id="btn-flip-camera"
                type="button"
                onClick={handleFlipCamera}
                aria-label="Đổi camera trước/sau"
                className="p-2.5 rounded-full bg-black/50 text-white border border-white/20 hover:bg-black/70 backdrop-blur-md transition-colors"
                title="Đổi camera trước/sau"
              >
                <SwitchCamera className="h-4 w-4" />
              </button>

              {/* Pause / Resume */}
              <button
                id="btn-pause-scan"
                type="button"
                onClick={() => setIsPaused((prev) => !prev)}
                aria-label={isPaused ? 'Tiếp tục quét' : 'Tạm dừng quét'}
                className="p-2.5 rounded-full bg-black/50 text-white border border-white/20 hover:bg-black/70 backdrop-blur-md transition-colors"
                title={isPaused ? 'Tiếp tục quét' : 'Tạm dừng quét'}
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>
            </div>

            {/* Zoom presets chip overlay at bottom */}
            <div className="absolute bottom-4 z-20 flex items-center gap-1.5 bg-black/60 border border-white/15 px-2 py-1 rounded-full backdrop-blur-md">
              {[1, 2, 3].map((level) => (
                <button
                  key={level}
                  id={`btn-zoom-${level}x`}
                  type="button"
                  onClick={() => setZoomLevel(level)}
                  className={`px-2.5 py-0.5 text-xs font-semibold rounded-full transition-colors ${
                    zoomLevel === level
                      ? 'bg-white text-black shadow-xs'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  {level}x
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* UPLOAD IMAGE VIEWPORT */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative w-full aspect-square sm:aspect-[4/3] max-h-[440px] flex flex-col items-center justify-center p-6 text-center transition-all ${
              isDragging
                ? 'bg-indigo-950/40 border-2 border-dashed border-indigo-400'
                : 'bg-slate-950'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInputChange}
            />

            {uploadedImage ? (
              /* Image Uploaded Preview */
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                <img
                  src={uploadedImage}
                  alt="QR tải lên"
                  className="max-h-64 max-w-full rounded-xl object-contain border border-slate-800 shadow-md"
                />

                {/* Laser scan animation over uploaded image */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <motion.div
                    className="w-48 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_2px_rgba(34,211,238,0.9)]"
                    animate={{
                      y: [-80, 80, -80],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    id="btn-scan-uploaded-image"
                    type="button"
                    onClick={() => {
                      // Demo scan trigger for uploaded image
                      onScanDetected('https://example.com/tai-anh-thanh-cong');
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs sm:text-sm font-semibold text-white shadow-md shadow-indigo-600/30 transition-all"
                  >
                    <Scan className="h-4 w-4" />
                    Phân tích mã QR này
                  </button>

                  <button
                    id="btn-change-uploaded-image"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs sm:text-sm font-medium text-slate-300 transition-all border border-slate-700"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Chọn ảnh khác
                  </button>
                </div>
              </div>
            ) : (
              /* Drag & drop empty state */
              <div className="flex flex-col items-center justify-center max-w-sm">
                <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 shadow-inner">
                  <UploadCloud className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-slate-100 mb-1">
                  Kéo thả ảnh mã QR vào đây
                </h3>
                <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                  Hỗ trợ các định dạng PNG, JPG, JPEG, WEBP hoặc SVG chứa mã QR rõ nét.
                </p>
                <button
                  id="btn-browse-file"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <ImageIcon className="h-4 w-4" />
                  Chọn ảnh từ máy tính / điện thoại
                </button>
              </div>
            )}
          </div>
        )}

        {/* Viewport Sub-bar Guide */}
        <div className="w-full bg-slate-900 border-t border-slate-800 px-4 py-3 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="truncate">
              {mode === 'camera'
                ? 'Hướng máy ảnh vào mã QR để quét tự động'
                : 'Tải ảnh lên để phân tích nội dung mã QR'}
            </span>
          </div>

          <button
            id="btn-quick-sample"
            type="button"
            onClick={onOpenSampleModal}
            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium whitespace-nowrap ml-2"
          >
            <Sparkles className="h-3 w-3" />
            Thử mẫu
          </button>
        </div>
      </div>

      {/* Helper Tips under scanner */}
      <div className="w-full max-w-md mt-5 grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
          <div className="h-6 w-6 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Scan className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="font-semibold block text-slate-900 dark:text-slate-100">
              Đủ sáng & Rõ nét
            </span>
            <span>Giữ camera ổn định và bật đèn pin nếu phòng tối.</span>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
          <div className="h-6 w-6 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <FileText className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="font-semibold block text-slate-900 dark:text-slate-100">
              Đa định dạng
            </span>
            <span>Hỗ trợ URL, Wi-Fi, VietQR, vCard và văn bản.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
