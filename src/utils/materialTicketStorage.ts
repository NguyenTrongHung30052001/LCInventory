import { MaterialTicket } from '../types';

const STORAGE_KEY = 'material_inventory_tickets_v1';

export const INITIAL_MATERIAL_TICKETS: MaterialTicket[] = [
  {
    id: 'mat-ticket-1',
    code: 'PH-892101',
    createdAt: Date.now() - 1000 * 60 * 120, // 2 hours ago
    rawQr: 'VT-COTTON-01 ^^ Đỏ đô ^^ L ^^ 120m ^^ LOT-2026-09 ^^ LSX-88992',
    materialCode: 'VT-COTTON-01',
    color: 'Đỏ đô',
    size: 'L',
    length: '120m',
    batchNumber: 'LOT-2026-09',
    productionOrder: 'LSX-88992',
    unit: 'Cuộn',
    quantity: 12,
    warehouseLocation: 'KHO-A1-KE02-O04',
    status: 'completed',
    notes: 'Vải đạt kiểm định độ bền màu, đã xếp vào kệ A1.',
  },
  {
    id: 'mat-ticket-2',
    code: 'PH-892102',
    createdAt: Date.now() - 1000 * 60 * 45, // 45 mins ago
    rawQr: 'VT-POLY-102 - Xanh Navy - XL - 50m - L2603 - SX-1024',
    materialCode: 'VT-POLY-102',
    color: 'Xanh Navy',
    size: 'XL',
    length: '50m',
    batchNumber: 'L2603',
    productionOrder: 'SX-1024',
    unit: 'Mét (m)',
    quantity: 350,
    warehouseLocation: 'RACK-B3-ROW01',
    status: 'pending',
    notes: 'Chờ bộ phận KCS kiểm tra trước khi cấp phát cho xưởng may.',
  },
  {
    id: 'mat-ticket-3',
    code: 'PH-892103',
    createdAt: Date.now() - 1000 * 60 * 15, // 15 mins ago
    rawQr: 'DA-PU-PREMIUM ^^ Nâu da bò ^^ 1.4mm ^^ 85m ^^ LOT-PU-441 ^^ LSX-BAG-99',
    materialCode: 'DA-PU-PREMIUM',
    color: 'Nâu da bò',
    size: '1.4mm',
    length: '85m',
    batchNumber: 'LOT-PU-441',
    productionOrder: 'LSX-BAG-99',
    unit: 'Tấm',
    quantity: 40,
    warehouseLocation: 'PLT-C09-SEC2',
    status: 'completed',
    notes: 'Nguyên liệu cho đơn hàng túi xách cao cấp.',
  },
];

export function getStoredMaterialTickets(): MaterialTicket[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading material tickets from localStorage', e);
  }
  return INITIAL_MATERIAL_TICKETS;
}

export function saveStoredMaterialTickets(tickets: MaterialTicket[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  } catch (e) {
    console.error('Error saving material tickets to localStorage', e);
  }
}

export function generateMaterialTicketCode(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `PH-${num}`;
}
