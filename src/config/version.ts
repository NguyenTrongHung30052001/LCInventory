/**
 * Application Version & Release Metadata
 * Quản lý phiên bản và thời gian cập nhật ứng dụng QR Kho Liên Châu
 */

export interface AppVersionInfo {
  version: string;
  buildNumber: string;
  updatedAt: string;
  updatedDate: string;
  updatedTime: string;
  author: string;
  releaseNotes?: string;
  mesApi: string;
}

export const APP_VERSION: AppVersionInfo = {
  version: 'v1.4.0',
  buildNumber: '20260917.05',
  updatedAt: '17/09/2026 16:30',
  updatedDate: '17/09/2026',
  updatedTime: '16:30:00',
  author: 'Liên Châu MES Team',
  releaseNotes: 'Tự động lấy userid và warehouseCode từ URL params, tối giản giao diện không hiển thị 2 trường này',
  mesApi: 'http://mes.lienchau.vn:5092/api/FinishedGoodInventory',
};
