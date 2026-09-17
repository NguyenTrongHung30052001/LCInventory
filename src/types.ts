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

export interface MaterialTicket {
  id: string;
  code: string; // e.g. PH-102931
  createdAt: number;

  // Raw QR string
  rawQr: string;

  // 6 fields extracted from QR (Mã vật tư ^^ Màu ^^ Size ^^ Length ^^ Lô sản xuất ^^ Lệnh sản xuất)
  materialCode: string;    // Mã vật tư
  color: string;           // Màu
  size: string;            // Size
  length: string;          // Length
  batchNumber: string;     // Lô sản xuất
  productionOrder: string; // Lệnh sản xuất

  // 3 additional fields: Đơn vị tính, số lượng, vị trí kho
  unit: string;              // Đơn vị tính
  quantity: number | string; // Số lượng
  warehouseLocation: string; // Vị trí kho (quét hoặc điền, chuỗi đơn thuần)

  status: TicketStatus;
  notes?: string;
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

