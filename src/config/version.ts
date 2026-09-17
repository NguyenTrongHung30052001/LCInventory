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
  version: 'v1.2.0',
  buildNumber: '20260917.02',
  updatedAt: '17/09/2026 15:35',
  updatedDate: '17/09/2026',
  updatedTime: '15:35:00',
  author: 'Liên Châu MES Team',
  releaseNotes: 'Cập nhật logo nhận diện Liên Châu, hiển thị phiên bản và cổng kết nối MES 5092',
  mesApi: 'http://mes.lienchau.vn:5092/api/FinishedGoodInventory',
};
