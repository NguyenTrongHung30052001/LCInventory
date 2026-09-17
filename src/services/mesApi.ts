import { MaterialTicket } from '../types';

export interface MesInventoryPayload {
  warehouseCode: string;
  location: string;
  scannedBy: string;
  scannedAt: string;
  qrCode: string;
  materialCode: string;
  color: string;
  size: string;
  length: string;
  lotNumber: string;
  productionOrder: string;
  unit: string;
  quantity: number;
  notes?: string;
}

export interface MesApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

/**
 * Sends finished good inventory ticket data to MES API:
 * POST http://mes.lienchau.vn:5092/api/FinishedGoodInventory
 *
 * Uses the internal /api/FinishedGoodInventory proxy to prevent CORS and Mixed Content issues.
 */
export async function sendToMesInventory(ticket: MaterialTicket): Promise<MesApiResponse> {
  const numericQty =
    typeof ticket.quantity === 'number'
      ? ticket.quantity
      : parseFloat(String(ticket.quantity)) || 0;

  const payload: MesInventoryPayload = {
    warehouseCode: ticket.warehouseCode?.trim() || 'FGW',
    location: ticket.warehouseLocation?.trim() || 'A1-02',
    scannedBy: ticket.scannedBy?.trim() || '105',
    scannedAt: new Date(ticket.createdAt || Date.now()).toISOString(),
    qrCode: ticket.rawQr || `${ticket.materialCode}|${ticket.color}|${ticket.size}|${ticket.length}|${ticket.batchNumber}|${ticket.productionOrder}`,
    materialCode: ticket.materialCode || '',
    color: ticket.color || '',
    size: ticket.size || '',
    length: ticket.length || '',
    lotNumber: ticket.batchNumber || '',
    productionOrder: ticket.productionOrder || '',
    unit: ticket.unit || 'Cuộn',
    quantity: numericQty,
    notes: ticket.notes || '',
  };

  // Attempt 1: Call through internal Express proxy /api/FinishedGoodInventory
  try {
    const response = await fetch('/api/FinishedGoodInventory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const resJson = await response.json().catch(() => null);

    if (response.ok && (resJson?.success !== false)) {
      return {
        success: true,
        message: 'Đã gửi thành công lên hệ thống MES',
        data: resJson?.data || resJson,
      };
    } else {
      const errMsg = resJson?.error || resJson?.message || `Máy chủ MES trả về mã ${response.status}`;
      return {
        success: false,
        error: errMsg,
        data: resJson,
      };
    }
  } catch (err: any) {
    console.warn('Proxy request failed, attempting direct fetch fallback...', err);

    // Attempt 2: Direct fetch to http://mes.lienchau.vn:5173/api/FinishedGoodInventory
    try {
      const directRes = await fetch('http://mes.lienchau.vn:5092/api/FinishedGoodInventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const directText = await directRes.text();
      let directJson;
      try {
        directJson = JSON.parse(directText);
      } catch {
        directJson = { message: directText };
      }

      if (directRes.ok) {
        return {
          success: true,
          message: 'Đã gửi trực tiếp lên hệ thống MES',
          data: directJson,
        };
      } else {
        return {
          success: false,
          error: `Máy chủ MES từ chối (mã ${directRes.status})`,
          data: directJson,
        };
      }
    } catch (directErr: any) {
      return {
        success: false,
        error: `Không thể kết nối đến máy chủ MES: ${directErr.message || err.message}`,
      };
    }
  }
}
