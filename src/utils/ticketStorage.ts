import { Ticket, TicketCategory } from '../types';
import { parseQrContent } from './qrParser';

const TICKETS_STORAGE_KEY = 'qr_scanner_tickets_v1';

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'ticket-1',
    code: 'PH-892101',
    title: 'Phiếu kiểm kê thiết bị văn phòng',
    category: 'inventory',
    qrData: 'DEVICE_ID:MAC-M2-2024-099;LOC:P302;STATUS:OK',
    qrType: 'text',
    customerName: 'Bộ phận IT & Cơ sở vật chất',
    amount: '',
    status: 'completed',
    notes: 'Thiết bị MacBook Pro M2 kiểm tra đạt chuẩn, tem niêm phong nguyên vẹn.',
    createdAt: Date.now() - 1000 * 60 * 60 * 3, // 3 hours ago
  },
  {
    id: 'ticket-2',
    code: 'PH-892102',
    title: 'Phiếu thanh toán đơn đặt hàng #DH-4421',
    category: 'payment',
    qrData: '00020101021238540010A00000072701240006970422011001234567895204481453037045405500005802VN',
    qrType: 'payment',
    customerName: 'Công ty TNHH Hoàng Long Logistics',
    amount: '1,500,000',
    status: 'pending',
    notes: 'Khách yêu cầu xuất hóa đơn điện tử vào cuối ngày.',
    createdAt: Date.now() - 1000 * 60 * 45, // 45 mins ago
  },
  {
    id: 'ticket-3',
    code: 'PH-892103',
    title: 'Vé check-in hội thảo Công nghệ số 2026',
    category: 'event',
    qrData: 'TICKET:TECH2026-VIP-9941;HOLDER:TRAN_VAN_NAM',
    qrType: 'text',
    customerName: 'Trần Văn Nam (VIP)',
    amount: '',
    status: 'completed',
    notes: 'Đã cấp thẻ đại biểu và tài liệu hội thảo tại bàn số 02.',
    createdAt: Date.now() - 1000 * 60 * 15, // 15 mins ago
  },
];

export function getStoredTickets(): Ticket[] {
  try {
    const saved = localStorage.getItem(TICKETS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading tickets from storage', e);
  }
  return INITIAL_TICKETS;
}

export function saveStoredTickets(tickets: Ticket[]) {
  try {
    localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(tickets));
  } catch (e) {
    console.error('Error saving tickets to storage', e);
  }
}

export function generateTicketCode(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `PH-${num}`;
}

export function getCategoryLabel(category: TicketCategory): string {
  switch (category) {
    case 'inventory':
      return 'Kiểm kê / Kho';
    case 'payment':
      return 'Thanh toán';
    case 'warranty':
      return 'Bảo hành / Sửa chữa';
    case 'event':
      return 'Vé sự kiện / Check-in';
    case 'delivery':
      return 'Giao nhận hàng';
    case 'general':
    default:
      return 'Phiếu chung';
  }
}

export function extractTicketSuggestionsFromQr(qrRaw: string) {
  const parsed = parseQrContent(qrRaw);
  let suggestedTitle = '';
  let suggestedCategory: TicketCategory = 'general';
  let suggestedAmount = '';
  let suggestedNotes = '';
  let suggestedCustomer = '';

  if (parsed.type === 'payment') {
    suggestedCategory = 'payment';
    suggestedTitle = 'Phiếu thu / Thanh toán chuyển khoản';
    suggestedNotes = `Mã VietQR: ${parsed.rawText}\nNgân hàng/Dịch vụ: ${parsed.metadata?.bank || 'VietQR'}`;
    // Extract amount if present in VietQR string: tag 54 (540550000 -> 50000)
    const match54 = parsed.rawText.match(/54\d{2}(\d+)/);
    if (match54 && match54[1]) {
      try {
        const amt = parseInt(match54[1], 10);
        suggestedAmount = amt.toLocaleString('vi-VN');
      } catch {
        // ignore
      }
    }
  } else if (parsed.type === 'contact') {
    suggestedCategory = 'general';
    suggestedTitle = `Phiếu thông tin khách hàng - ${parsed.metadata?.name || 'Liên hệ'}`;
    suggestedCustomer = parsed.metadata?.name || '';
    suggestedNotes = `Họ tên: ${parsed.metadata?.name || ''}\nSố ĐT: ${parsed.metadata?.phone || ''}\nEmail: ${parsed.metadata?.email || ''}`;
  } else if (parsed.type === 'wifi') {
    suggestedCategory = 'inventory';
    suggestedTitle = `Cấu hình điểm truy cập Wi-Fi: ${parsed.metadata?.ssid || ''}`;
    suggestedNotes = `SSID: ${parsed.metadata?.ssid}\nMật khẩu: ${parsed.metadata?.password}\nBảo mật: ${parsed.metadata?.encryption}`;
  } else if (parsed.type === 'url') {
    suggestedCategory = 'general';
    suggestedTitle = `Phiếu tra cứu liên kết: ${parsed.metadata?.url}`;
    suggestedNotes = `Địa chỉ URL: ${parsed.metadata?.url}`;
  } else {
    // Plain text / custom barcode
    suggestedTitle = parsed.rawText.length > 30 ? `Phiếu xử lý mã: ${parsed.rawText.slice(0, 30)}...` : `Phiếu mã ${parsed.rawText}`;
    suggestedNotes = `Nội dung mã quét: ${parsed.rawText}`;
    if (/ticket|ve|checkin/i.test(parsed.rawText)) {
      suggestedCategory = 'event';
    } else if (/kho|inv|item|ser|serial|imei/i.test(parsed.rawText)) {
      suggestedCategory = 'inventory';
    } else if (/bh|war|ser/i.test(parsed.rawText)) {
      suggestedCategory = 'warranty';
    }
  }

  return {
    parsed,
    suggestedTitle,
    suggestedCategory,
    suggestedAmount,
    suggestedNotes,
    suggestedCustomer,
  };
}
