/**
 * Helper to parse URL query parameters for userId and warehouseCode
 * Ví dụ URL: https://app.example.com/?userid=105&warehouseCode=FGW
 */

export interface AppUrlParams {
  userId: string;
  warehouseCode: string;
  type: string;
}

export function getAppUrlParams(): AppUrlParams {
  if (typeof window === 'undefined') {
    return { userId: '105', warehouseCode: 'FGW', type: 'normal' };
  }

  try {
    const searchParams = new URLSearchParams(window.location.search);

    // Hỗ trợ các biến thể: userid, userId, user_id, user
    const userId =
      searchParams.get('userid') ||
      searchParams.get('userId') ||
      searchParams.get('user_id') ||
      searchParams.get('user') ||
      '105';

    // Hỗ trợ các biến thể: warehouseCode, warehousecode, warehouse_code, warehouse
    const warehouseCode =
      searchParams.get('warehouseCode') ||
      searchParams.get('warehousecode') ||
      searchParams.get('warehouse_code') ||
      searchParams.get('warehouse') ||
      'FGW';
      
    const type = searchParams.get('type') || 'normal';

    return {
      userId: userId.trim() || '105',
      warehouseCode: warehouseCode.trim() || 'FGW',
      type: type.trim() || 'normal',
    };
  } catch (e) {
    console.error('Error parsing URL parameters:', e);
    return { userId: '105', warehouseCode: 'FGW', type: 'normal' };
  }
}
