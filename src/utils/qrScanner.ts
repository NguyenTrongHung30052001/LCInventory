import jsQR from 'jsqr';

// Check if BarcodeDetector is supported natively in window
const hasBarcodeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;

let barcodeDetectorInstance: any = null;
if (hasBarcodeDetector) {
  try {
    barcodeDetectorInstance = new (window as any).BarcodeDetector({
      formats: ['qr_code'],
    });
  } catch (e) {
    console.warn('BarcodeDetector initialization failed, falling back to jsQR', e);
  }
}

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
 * Decode QR from an HTMLCanvasElement
 */
export async function decodeCanvas(canvas: HTMLCanvasElement): Promise<DecodeResult | null> {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  const width = canvas.width;
  const height = canvas.height;
  if (width === 0 || height === 0) return null;

  // 1. Try native BarcodeDetector if available
  if (barcodeDetectorInstance) {
    try {
      const barcodes = await barcodeDetectorInstance.detect(canvas);
      if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
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
      // Fall through to jsQR
    }
  }

  // 2. jsQR decoding
  try {
    const imageData = ctx.getImageData(0, 0, width, height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });
    if (code && code.data) {
      return {
        data: code.data,
        location: code.location,
      };
    }
  } catch (err) {
    console.error('jsQR decode error', err);
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
