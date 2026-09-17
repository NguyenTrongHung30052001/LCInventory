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
  version: 'v1.5.0',
  buildNumber: '20260917.06',
  updatedAt: '17/09/2026 20:15',
  updatedDate: '17/09/2026',
  updatedTime: '20:15:00',
  author: 'Liên Châu MES Team',
  releaseNotes: 'Quy trình kiểm kê mới: Quét vị trí trước -> Quét QR vật tư -> Submit tự động mở camera quét tiếp -> Hỗ trợ đổi vị trí linh hoạt',
  mesApi: 'http://mes.lienchau.vn:5092/api/FinishedGoodInventory',
};
