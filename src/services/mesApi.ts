import { MaterialTicket } from '../types';
import { formatToTimezonePlus7, parseMesDateToTimestamp } from '../utils/dateUtils';

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
  note?: string;
  notes?: string;
}

export interface MesApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

function getApiBase(): string {
  const metaEnv = (import.meta as any)?.env;
  return metaEnv?.VITE_API_BASE_URL
    ? String(metaEnv.VITE_API_BASE_URL).replace(/\/$/, '')
    : '';
}

/**
 * Sends finished good inventory ticket data to MES API:
 * POST http://mes.lienchau.vn:5092/api/FinishedGoodInventory
 */
export async function sendToMesInventory(ticket: MaterialTicket): Promise<MesApiResponse> {
  const numericQty =
    typeof ticket.quantity === 'number'
      ? ticket.quantity
      : parseFloat(String(ticket.quantity)) || 0;

  const noteVal = ticket.notes?.trim() || '';

  const truncate = (str: string | undefined, max: number) => (str || '').trim().substring(0, max);

  const payload: MesInventoryPayload = {
    warehouseCode: truncate(ticket.warehouseCode || 'FGW', 50),
    location: truncate(ticket.warehouseLocation || 'A1-02', 50),
    scannedBy: truncate(ticket.scannedBy || '105', 50),
    scannedAt: formatToTimezonePlus7(ticket.createdAt || Date.now()),
    qrCode: truncate(ticket.rawQr || `${ticket.materialCode}|${ticket.color}|${ticket.size}|${ticket.length}|${ticket.batchNumber}|${ticket.productionOrder}`, 500),
    materialCode: truncate(ticket.materialCode, 100),
    color: truncate(ticket.color, 50),
    size: truncate(ticket.size, 50),
    length: truncate(ticket.length, 50),
    lotNumber: truncate(ticket.batchNumber, 50),
    productionOrder: truncate(ticket.productionOrder, 50),
    unit: truncate(ticket.unit || 'MET', 20),
    quantity: numericQty,
    note: truncate(noteVal, 500),
    notes: truncate(noteVal, 500),
  };

  const apiBase = getApiBase();
  const proxyUrl = apiBase ? `${apiBase}/api/FinishedGoodInventory` : '/api/FinishedGoodInventory';

  try {
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      body: JSON.stringify(payload),
    });

    const resJson = await response.json().catch(() => null);

    if (response.ok && resJson && resJson.success !== false) {
      return {
        success: true,
        message: 'Đã gửi thành công lên hệ thống MES',
        data: resJson?.data || resJson,
      };
    } else {
      let errMsg = resJson?.error || resJson?.message;
      if (response.status === 404) {
        errMsg = `Không tìm thấy API ${proxyUrl} (Lỗi 404).`;
      } else if (!errMsg) {
        errMsg = `Máy chủ MES trả về mã ${response.status}`;
      }

      return {
        success: false,
        error: errMsg,
        data: resJson,
      };
    }
  } catch (err: any) {
    console.warn('Proxy request failed, attempting direct fetch fallback...', err);
    try {
      const directRes = await fetch('http://mes.lienchau.vn:5092/api/FinishedGoodInventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
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

/**
 * GET list of inventory items by scannedBy ID:
 * GET http://mes.lienchau.vn:5092/api/FinishedGoodInventory/by-user/{scannedBy}
 */
export async function fetchInventoryByUser(
  scannedBy: string = '105',
  fresh: boolean = false
): Promise<{ success: boolean; data: MaterialTicket[]; error?: string }> {
  const apiBase = getApiBase();
  const queryParam = fresh ? '?fresh=true' : '';
  const proxyUrl = apiBase
    ? `${apiBase}/api/FinishedGoodInventory/by-user/${encodeURIComponent(scannedBy)}${queryParam}`
    : `/api/FinishedGoodInventory/by-user/${encodeURIComponent(scannedBy)}${queryParam}`;

  const transformItems = (items: any[]): MaterialTicket[] => {
    return items.map((item) => ({
      id: String(item.id),
      createdAt: parseMesDateToTimestamp(item.scannedAt || item.createdAt),
      rawQr: item.qrCode || '',
      materialCode: item.materialCode || '',
      color: item.color || '',
      size: item.size || '',
      length: item.length || '',
      batchNumber: item.lotNumber || '',
      productionOrder: item.productionOrder || '',
      unit: item.unit || 'MET',
      quantity: typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity) || 1,
      warehouseLocation: item.location || '',
      warehouseCode: item.warehouseCode || 'FGW',
      scannedBy: String(item.scannedBy || scannedBy),
      notes: item.note || '',
      mesSyncStatus: 'synced',
    }));
  };

  try {
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    const resJson = await response.json().catch(() => null);

    if (response.ok && resJson && resJson.success !== false) {
      const list = Array.isArray(resJson.data)
        ? resJson.data
        : Array.isArray(resJson)
        ? resJson
        : [];
      return {
        success: true,
        data: transformItems(list),
      };
    }

    // If proxy failed or returned error structure
    const proxyError = resJson?.error || resJson?.message || `Lỗi tải danh sách (mã ${response.status})`;
    throw new Error(proxyError);
  } catch (err: any) {
    console.warn('Proxy fetch by-user failed, fallback to direct fetch...', err);
    try {
      const directRes = await fetch(
        `http://mes.lienchau.vn:5092/api/FinishedGoodInventory/by-user/${encodeURIComponent(scannedBy)}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
          cache: 'no-store',
        }
      );
      const directJson = await directRes.json();
      if (directRes.ok && directJson && directJson.success !== false) {
        const list = Array.isArray(directJson.data)
          ? directJson.data
          : Array.isArray(directJson)
          ? directJson
          : [];
        return {
          success: true,
          data: transformItems(list),
        };
      }
      return {
        success: false,
        data: [],
        error: directJson?.error || directJson?.message || `Lỗi tải danh sách (mã ${directRes.status})`,
      };
    } catch (directErr: any) {
      return {
        success: false,
        data: [],
        error: `Không thể kết nối MES: ${directErr.message || err.message}`,
      };
    }
  }
}

/**
 * PUT update inventory item:
 * PUT http://mes.lienchau.vn:5092/api/FinishedGoodInventory/{id}
 * Body: { quantity, unit, note }
 */
export async function updateInventoryItem(
  id: string | number,
  data: { quantity: number; unit: string; note: string }
): Promise<MesApiResponse> {
  const apiBase = getApiBase();
  const proxyUrl = apiBase
    ? `${apiBase}/api/FinishedGoodInventory/${encodeURIComponent(id)}`
    : `/api/FinishedGoodInventory/${encodeURIComponent(id)}`;

  const bodyData = {
    quantity: Number(data.quantity),
    unit: String(data.unit || 'MET'),
    note: String(data.note || ''),
  };

  try {
    const response = await fetch(proxyUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      body: JSON.stringify(bodyData),
    });

    const resJson = await response.json().catch(() => null);

    if (response.ok && resJson && resJson.success !== false) {
      return {
        success: true,
        message: resJson?.message || 'Đã cập nhật bản ghi kiểm kê thành công',
        data: resJson?.data,
      };
    }

    throw new Error(resJson?.error || resJson?.message || `Lỗi cập nhật (mã ${response.status})`);
  } catch (err: any) {
    console.warn('Proxy update failed, fallback to direct fetch...', err);
    try {
      const directRes = await fetch(
        `http://mes.lienchau.vn:5092/api/FinishedGoodInventory/${encodeURIComponent(id)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
          body: JSON.stringify(bodyData),
        }
      );
      const directJson = await directRes.json().catch(() => null);
      if (directRes.ok && directJson && directJson.success !== false) {
        return {
          success: true,
          message: directJson?.message || 'Đã cập nhật bản ghi thành công',
          data: directJson,
        };
      }
      return {
        success: false,
        error: directJson?.error || directJson?.message || `Lỗi cập nhật (mã ${directRes.status})`,
      };
    } catch (directErr: any) {
      return {
        success: false,
        error: `Không thể kết nối máy chủ MES: ${directErr.message || err.message}`,
      };
    }
  }
}

/**
 * DELETE inventory item:
 * DELETE http://mes.lienchau.vn:5092/api/FinishedGoodInventory/{id}
 */
export async function deleteInventoryItem(id: string | number): Promise<MesApiResponse> {
  const apiBase = getApiBase();
  const proxyUrl = apiBase
    ? `${apiBase}/api/FinishedGoodInventory/${encodeURIComponent(id)}`
    : `/api/FinishedGoodInventory/${encodeURIComponent(id)}`;

  try {
    const response = await fetch(proxyUrl, {
      method: 'DELETE',
      cache: 'no-store',
    });

    const resJson = await response.json().catch(() => null);

    if (response.ok && (!resJson || resJson.success !== false)) {
      return {
        success: true,
        message: resJson?.message || 'Đã xóa bản ghi kiểm kê thành công',
      };
    }

    throw new Error(resJson?.error || resJson?.message || `Lỗi xóa (mã ${response.status})`);
  } catch (err: any) {
    console.warn('Proxy delete failed, fallback to direct fetch...', err);
    try {
      const directRes = await fetch(
        `http://mes.lienchau.vn:5092/api/FinishedGoodInventory/${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
          cache: 'no-store',
        }
      );
      const directJson = await directRes.json().catch(() => null);
      if (directRes.ok && (!directJson || directJson.success !== false)) {
        return {
          success: true,
          message: directJson?.message || 'Đã xóa bản ghi kiểm kê thành công',
        };
      }
      return {
        success: false,
        error: directJson?.error || directJson?.message || `Lỗi xóa (mã ${directRes.status})`,
      };
    } catch (directErr: any) {
      return {
        success: false,
        error: `Không thể kết nối máy chủ MES: ${directErr.message || err.message}`,
      };
    }
  }
}
