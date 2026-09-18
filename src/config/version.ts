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
  version: 'v1.1.1',
  buildNumber: '20260917.111',
  updatedAt: '17/09/2026 21:00',
  updatedDate: '17/09/2026',
  updatedTime: '21:00:00',
  author: 'Liên Châu MES Team',
  releaseNotes: 'Phiên bản 1.1.1: Tối ưu nhập số lượng bàn phím số, bỏ gợi ý vị trí khi tạo phiếu mới, tăng tốc độ API',
  mesApi: 'http://mes.lienchau.vn:5092/api/FinishedGoodInventory',
};
