import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  FileText,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { ScanMode } from '../types';
import { decodeCanvas, decodeImageFile, DecodeResult } from '../utils/qrScanner';

interface ScannerViewportProps {
  mode: ScanMode;
  onModeChange: (mode: ScanMode) => void;
  onScanDetected: (raw: string) => void;
  onOpenSampleModal: () => void;
  isScanningPaused?: boolean;
}

export const ScannerViewport: React.FC<ScannerViewportProps> = ({
  mode,
  onModeChange,
  onScanDetected,
  onOpenSampleModal,
  isScanningPaused = false,
}) => {
  // Camera state
  const [torchOn, setTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isManualPaused, setIsManualPaused] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [scanSuccessFlash, setScanSuccessFlash] = useState<boolean>(false);

  // Upload image state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lastDecodedText, setLastDecodedText] = useState<string | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastScanTimestampRef = useRef<number>(0);
  const lastScanTextRef = useRef<string>('');
  const isScanningRef = useRef<boolean>(false);

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
  const initCamera = useCallback(async () => {
    if (mode !== 'camera') {
      stopCamera();
      return;
    }

    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Trình duyệt không hỗ trợ truy cập máy ảnh hoặc đang bị chặn quyền');
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
      console.warn('Camera access unavailable or restricted:', err?.message);
      setIsCameraActive(false);
      setCameraError(
        err?.message || 'Không thể mở máy ảnh trên thiết bị. Bạn có thể cấp quyền hoặc tải ảnh lên để quét.'
      );
    }
  }, [mode, facingMode, stopCamera]);

  useEffect(() => {
    initCamera();
    return () => {
      stopCamera();
    };
  }, [initCamera, stopCamera]);

  // Real-time camera scan frame loop
  useEffect(() => {
    if (mode !== 'camera' || !isCameraActive || isManualPaused || isScanningPaused) {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      return;
    }

    let isMounted = true;
    let lastCheckTime = 0;
    const scanIntervalMs = 120; // Check ~8 times per second to optimize CPU

    const scanFrame = async (timestamp: number) => {
      if (!isMounted) return;

      if (timestamp - lastCheckTime > scanIntervalMs) {
        lastCheckTime = timestamp;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (
          video &&
          canvas &&
          video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
          video.videoWidth > 0 &&
          !isScanningRef.current
        ) {
          isScanningRef.current = true;
          try {
            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
            }

            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const decoded = await decodeCanvas(canvas);

              if (decoded && decoded.data && decoded.data.trim()) {
                const now = Date.now();
                // Cooldown: do not trigger duplicate alert within 2.5 seconds for the same text
                const isSameContent = decoded.data === lastScanTextRef.current;
                const isWithinCooldown = now - lastScanTimestampRef.current < 2500;

                if (!isSameContent || !isWithinCooldown) {
                  lastScanTimestampRef.current = now;
                  lastScanTextRef.current = decoded.data;

                  // Trigger visual flash
                  setScanSuccessFlash(true);
                  setTimeout(() => setScanSuccessFlash(false), 800);

                  onScanDetected(decoded.data);
                }
              }
            }
          } catch (e) {
            // Silently continue frame scan
          } finally {
            isScanningRef.current = false;
          }
        }
      }

      if (isMounted) {
        animFrameIdRef.current = requestAnimationFrame(scanFrame);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(scanFrame);

    return () => {
      isMounted = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
    };
  }, [mode, isCameraActive, isManualPaused, isScanningPaused, onScanDetected]);

  // Flashlight / Torch toggle
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

  // Process uploaded image file & extract QR data
  const processImageFile = (file: File) => {
    setUploadError(null);
    setLastDecodedText(null);
    setIsAnalyzingImage(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const resultUrl = e.target?.result as string;
      setUploadedImage(resultUrl);

      try {
        const decoded = await decodeImageFile(resultUrl);
        setIsAnalyzingImage(false);

        if (decoded && decoded.data && decoded.data.trim()) {
          setLastDecodedText(decoded.data);
          setScanSuccessFlash(true);
          setTimeout(() => setScanSuccessFlash(false), 900);
          onScanDetected(decoded.data);
        } else {
          setUploadError(
            'Không tìm thấy mã QR trong bức ảnh này. Vui lòng thử ảnh có độ tương phản tốt hơn hoặc phóng to mã QR.'
          );
        }
      } catch (err: any) {
        setIsAnalyzingImage(false);
        setUploadError('Đã xảy ra lỗi khi phân tích bức ảnh. Hãy thử lại với tệp ảnh khác.');
      }
    };
    reader.onerror = () => {
      setIsAnalyzingImage(false);
      setUploadError('Không thể đọc tệp hình ảnh vừa chọn.');
    };
    reader.readAsDataURL(file);
  };

  const handleScanUploadedAgain = async () => {
    if (!uploadedImage) return;
    setIsAnalyzingImage(true);
    setUploadError(null);
    try {
      const decoded = await decodeImageFile(uploadedImage);
      setIsAnalyzingImage(false);
      if (decoded && decoded.data && decoded.data.trim()) {
        setLastDecodedText(decoded.data);
        onScanDetected(decoded.data);
      } else {
        setUploadError('Không nhận diện được mã QR. Bạn có thể chọn bức ảnh khác rõ nét hơn.');
      }
    } catch {
      setIsAnalyzingImage(false);
      setUploadError('Lỗi phân tích mã QR. Vui lòng thử lại.');
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto px-4 py-6">
      {/* Hidden processing canvas for frame & image decode */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

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

            {/* Error or Permission fallback UI */}
            {!isCameraActive && (
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-center p-6 text-center">
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
                      Chưa thể bật Camera
                    </h3>
                    <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                      {cameraError}
                    </p>
                    <div className="flex flex-col gap-2 w-full">
                      <button
                        id="btn-retry-camera"
                        type="button"
                        onClick={initCamera}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition-all"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Thử lại kết nối Camera
                      </button>

                      <button
                        id="btn-switch-to-upload"
                        type="button"
                        onClick={() => onModeChange('upload')}
                        className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-all border border-slate-700"
                      >
                        <UploadCloud className="h-3.5 w-3.5" />
                        Hoặc Tải ảnh mã QR từ thiết bị
                      </button>
                    </div>
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
              <div
                className={`absolute inset-0 rounded-2xl border transition-colors duration-300 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] ${
                  scanSuccessFlash
                    ? 'border-emerald-400 bg-emerald-500/10'
                    : 'border-white/20'
                }`}
              />

              {/* Glowing Corner Brackets */}
              <div
                className={`absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 rounded-tl-xl transition-all duration-300 ${
                  scanSuccessFlash
                    ? 'border-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,1)]'
                    : 'border-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]'
                }`}
              />
              <div
                className={`absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 rounded-tr-xl transition-all duration-300 ${
                  scanSuccessFlash
                    ? 'border-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,1)]'
                    : 'border-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]'
                }`}
              />
              <div
                className={`absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 rounded-bl-xl transition-all duration-300 ${
                  scanSuccessFlash
                    ? 'border-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,1)]'
                    : 'border-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]'
                }`}
              />
              <div
                className={`absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 rounded-br-xl transition-all duration-300 ${
                  scanSuccessFlash
                    ? 'border-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,1)]'
                    : 'border-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]'
                }`}
              />

              {/* Center Crosshair Dot */}
              <div
                className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                  scanSuccessFlash
                    ? 'bg-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,1)]'
                    : 'bg-indigo-400/70 drop-shadow-[0_0_4px_rgba(99,102,241,1)]'
                }`}
              />

              {/* Animated Laser Scanning Line */}
              {!isManualPaused && !isScanningPaused && (
                <motion.div
                  className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent pointer-events-none shadow-[0_0_12px_2px_rgba(34,211,238,0.8)]"
                  animate={{
                    top: ['6%', '94%', '6%'],
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <div className="w-full h-8 -mt-4 bg-gradient-to-b from-cyan-400/20 to-transparent pointer-events-none" />
                </motion.div>
              )}

              {/* Paused state overlay */}
              {(isManualPaused || isScanningPaused) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl backdrop-blur-xs">
                  <span className="text-xs font-semibold text-slate-200 bg-black/70 px-3 py-1.5 rounded-full border border-white/20">
                    {isScanningPaused ? 'Đã tìm thấy mã QR' : 'Đã tạm dừng'}
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
                onClick={() => setIsManualPaused((prev) => !prev)}
                aria-label={isManualPaused ? 'Tiếp tục quét' : 'Tạm dừng quét'}
                className="p-2.5 rounded-full bg-black/50 text-white border border-white/20 hover:bg-black/70 backdrop-blur-md transition-colors"
                title={isManualPaused ? 'Tiếp tục quét' : 'Tạm dừng quét'}
              >
                {isManualPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
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
                <div className="relative max-h-60 max-w-full flex items-center justify-center">
                  <img
                    src={uploadedImage}
                    alt="QR tải lên"
                    className="max-h-60 max-w-full rounded-xl object-contain border border-slate-800 shadow-md"
                  />

                  {/* Scanning active animation over uploaded image */}
                  {isAnalyzingImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl backdrop-blur-xs">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-7 w-7 text-cyan-400 animate-spin" />
                        <span className="text-xs font-semibold text-white">Đang trích xuất mã QR...</span>
                      </div>
                    </div>
                  )}

                  {!isAnalyzingImage && lastDecodedText && (
                    <div className="absolute top-2 right-2 bg-emerald-500/90 text-white text-[11px] font-semibold px-2 py-1 rounded-md flex items-center gap-1 shadow-md">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Đã đọc thành công
                    </div>
                  )}
                </div>

                {/* Upload Error Alert */}
                {uploadError && (
                  <div className="mt-3 max-w-sm flex items-start gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-left">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    id="btn-scan-uploaded-image"
                    type="button"
                    disabled={isAnalyzingImage}
                    onClick={handleScanUploadedAgain}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs sm:text-sm font-semibold text-white shadow-md shadow-indigo-600/30 transition-all"
                  >
                    {isAnalyzingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Scan className="h-4 w-4" />
                    )}
                    <span>Quét lại ảnh này</span>
                  </button>

                  <button
                    id="btn-change-uploaded-image"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs sm:text-sm font-medium text-slate-300 transition-all border border-slate-700"
                  >
                    <ImageIcon className="h-4 w-4" />
                    <span>Chọn ảnh khác</span>
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
                  Tự động trích xuất nội dung từ ảnh PNG, JPG, JPEG, WEBP hoặc ảnh chụp màn hình chứa mã QR.
                </p>
                <button
                  id="btn-browse-file"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <ImageIcon className="h-4 w-4" />
                  <span>Chọn ảnh từ thiết bị</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Viewport Sub-bar Guide */}
        <div className="w-full bg-slate-900 border-t border-slate-800 px-4 py-3 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                mode === 'camera' && isCameraActive ? 'bg-emerald-400 animate-ping' : 'bg-cyan-400'
              }`}
            />
            <span className="truncate">
              {mode === 'camera'
                ? isCameraActive
                  ? 'Đang nhận diện trực tiếp qua máy ảnh...'
                  : 'Sẵn sàng khởi động máy ảnh'
                : 'Tự động giải mã ngay khi chọn tệp ảnh'}
            </span>
          </div>

          <button
            id="btn-quick-sample"
            type="button"
            onClick={onOpenSampleModal}
            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium whitespace-nowrap ml-2"
          >
            <Sparkles className="h-3 w-3" />
            <span>Thử mẫu</span>
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
              Nhận diện tự động
            </span>
            <span>Đặt mã QR vào giữa khung ngắm để ứng dụng đọc dữ liệu.</span>
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
            <span>Trích xuất Link web, Wi-Fi, Napas247/VietQR, vCard và văn bản.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
