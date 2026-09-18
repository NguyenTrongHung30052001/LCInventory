export type ScanType = 'url' | 'wifi' | 'text' | 'contact' | 'email' | 'payment' | 'other';

export interface ScanResult {
  id: string;
  rawText: string;
  type: ScanType;
  title: string;
  timestamp: number;
  metadata?: {
    ssid?: string;
    encryption?: string;
    password?: string;
    url?: string;
    email?: string;
    name?: string;
    phone?: string;
    amount?: string;
    bank?: string;
    note?: string;
  };
}

export type TicketCategory =
  | 'inventory'
  | 'payment'
  | 'warranty'
  | 'event'
  | 'delivery'
  | 'general';

export type TicketStatus = 'pending' | 'completed' | 'cancelled';

export const ALLOWED_UNITS = ['MET', 'KG', 'PCS', 'PAIR'] as const;
export type InventoryUnit = (typeof ALLOWED_UNITS)[number];

export interface MaterialTicket {
  id: string;
  code?: string; // Optional (removed from creation form per user request)
  createdAt: number;

  // Raw QR string
  rawQr: string;

  // 6 fields extracted from QR (Mã vật tư ^^ Màu ^^ Size ^^ Length ^^ Lệnh sản xuất ^^ Lô sản xuất)
  materialCode: string;    // Mã vật tư
  color: string;           // Màu
  size: string;            // Size
  length: string;          // Length
  batchNumber: string;     // Lô sản xuất (lotNumber)
  productionOrder: string; // Lệnh sản xuất

  // Thông tin kho & số lượng
  unit: string;              // Đơn vị tính
  quantity: number | string; // Số lượng
  warehouseLocation: string; // Vị trí kho (location)
  warehouseCode?: string;    // Mã kho (mặc định FGW)
  scannedBy?: string;        // Người quét (mặc định 105)

  // Ghi chú (được yêu cầu thêm)
  notes: string;

  status?: TicketStatus;     // Optional (bỏ khỏi form tạo phiếu)
  mesSyncStatus?: 'synced' | 'failed' | 'pending';
  mesSyncError?: string;
}

export interface Ticket {
  id: string;
  code: string;
  title: string;
  category: TicketCategory;
  qrData: string;
  qrType?: ScanType;
  qrMetadata?: Record<string, any>;
  customerName?: string;
  amount?: string;
  status: TicketStatus;
  notes?: string;
  createdAt: number;
}

export interface ScannerSettings {
  beepOnScan: boolean;
  vibrateOnScan: boolean;
  autoOpenUrl: boolean;
  continuousScan: boolean;
  saveHistory: boolean;
  preferredCamera: 'environment' | 'user';
}

export type ScanMode = 'camera' | 'upload';

