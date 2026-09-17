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
  version: 'v1.3.0',
  buildNumber: '20260917.04',
  updatedAt: '17/09/2026 16:15',
  updatedDate: '17/09/2026',
  updatedTime: '16:15:00',
  author: 'Liên Châu MES Team',
  releaseNotes: 'Tích hợp API sửa (PUT), xóa (DELETE), và tải danh sách kiểm kê theo người quét (GET by-user)',
  mesApi: 'http://mes.lienchau.vn:5092/api/FinishedGoodInventory',
};
