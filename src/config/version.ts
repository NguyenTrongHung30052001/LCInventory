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
  version: 'v1.2.1',
  buildNumber: '20260917.03',
  updatedAt: '17/09/2026 15:50',
  updatedDate: '17/09/2026',
  updatedTime: '15:50:00',
  author: 'Liên Châu MES Team',
  releaseNotes: 'Bổ sung Vercel Serverless Functions (/api/FinishedGoodInventory) và vercel.json xử lý lỗi 404 khi deploy Vercel',
  mesApi: 'http://mes.lienchau.vn:5092/api/FinishedGoodInventory',
};
