import jsQR from 'jsqr';
import { BrowserQRCodeReader } from '@zxing/browser';
import { DecodeHintType, BarcodeFormat } from '@zxing/library';

// ── 1. Native BarcodeDetector (Chrome Android, Edge) ──────────────────────────
const hasBarcodeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;
let barcodeDetectorInstance: any = null;
if (hasBarcodeDetector) {
  try {
    barcodeDetectorInstance = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
  } catch {
    // ignore
  }
}

// ── 2. ZXing reader (best tolerance for blur/angle/low-light) ─────────────────
const hints = new Map();
hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
hints.set(DecodeHintType.TRY_HARDER, true);
// Reuse a single reader instance — do NOT call reset() between frames for performance
const zxingReader = new BrowserQRCodeReader(hints);

export interface DecodeResult {
  data: string;
  location?: {
    topLeftCorner: { x: number; y: number };
    topRightCorner: { x: number; y: number };
    bottomRightCorner: { x: number; y: number };
    bottomLeftCorner: { x: number; y: number };
  };
}

/**
 * Decode a QR from an HTMLCanvasElement.
 * Tries engines in order: BarcodeDetector → ZXing → jsQR
 */
export async function decodeCanvas(canvas: HTMLCanvasElement): Promise<DecodeResult | null> {
  if (canvas.width === 0 || canvas.height === 0) return null;

  // ── Engine 1: Native BarcodeDetector (fastest on Android Chrome) ──────────
  if (barcodeDetectorInstance) {
    try {
      const barcodes = await barcodeDetectorInstance.detect(canvas);
      if (barcodes?.length && barcodes[0].rawValue) {
        const b = barcodes[0];
        return {
          data: b.rawValue,
          location: b.cornerPoints
            ? {
                topLeftCorner: b.cornerPoints[0],
                topRightCorner: b.cornerPoints[1],
                bottomRightCorner: b.cornerPoints[2],
                bottomLeftCorner: b.cornerPoints[3],
              }
            : undefined,
        };
      }
    } catch {
      // fall through
    }
  }

  // ── Engine 2: ZXing (best for blurry/angled/partial codes like Zalo) ──────
  try {
    const result = await zxingReader.decodeFromCanvas(canvas);
    if (result?.getText()) {
      return { data: result.getText() };
    }
  } catch {
    // NotFoundException thrown when no QR found — this is normal, suppress it
  }

  // ── Engine 3: jsQR fallback ───────────────────────────────────────────────
  try {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      });
      if (code?.data) {
        return { data: code.data, location: code.location };
      }
    }
  } catch {
    // ignore
  }

  return null;
}


/**
 * Decode QR from an image file / Data URL
 */
export async function decodeImageFile(imageUrl: string): Promise<DecodeResult | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);

        // Try direct canvas
        const result = await decodeCanvas(canvas);
        if (result) {
          resolve(result);
          return;
        }

        // If resolution is huge, scale down and try again
        if (canvas.width > 1200 || canvas.height > 1200) {
          const maxDim = 1000;
          const scale = Math.min(maxDim / canvas.width, maxDim / canvas.height);
          const scaledCanvas = document.createElement('canvas');
          scaledCanvas.width = Math.floor(canvas.width * scale);
          scaledCanvas.height = Math.floor(canvas.height * scale);
          const scaledCtx = scaledCanvas.getContext('2d', { willReadFrequently: true });
          if (scaledCtx) {
            scaledCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
            const scaledResult = await decodeCanvas(scaledCanvas);
            if (scaledResult) {
              resolve(scaledResult);
              return;
            }
          }
        }

        resolve(null);
      } catch (e) {
        console.error('Error decoding image file:', e);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}
