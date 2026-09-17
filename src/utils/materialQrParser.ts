/**
 * Parser for Material QR Codes
 * Expected format:
 * Mã vật tư ^^ Màu ^^ Size ^^ Length ^^ Lô sản xuất ^^ Lệnh sản xuất
 * (Hoặc có thể dùng dấu phân tách là '-')
 */

export interface ParsedMaterialQr {
  raw: string;
  materialCode: string;
  color: string;
  size: string;
  length: string;
  batchNumber: string;
  productionOrder: string;
  isValid: boolean;
  partsCount: number;
  delimiterUsed: '^^' | '-' | 'none';
}

export function parseMaterialQr(input: string): ParsedMaterialQr {
  const cleanInput = (input || '').trim();

  if (!cleanInput) {
    return {
      raw: '',
      materialCode: '',
      color: '',
      size: '',
      length: '',
      batchNumber: '',
      productionOrder: '',
      isValid: false,
      partsCount: 0,
      delimiterUsed: 'none',
    };
  }

  let delimiterUsed: '^^' | '-' | 'none' = 'none';
  let parts: string[] = [];

  // Check if ^^ is used
  if (cleanInput.includes('^^')) {
    delimiterUsed = '^^';
    parts = cleanInput.split('^^').map((s) => s.trim());
  } else if (cleanInput.includes(' - ')) {
    // Check if " - " with spaces is used
    delimiterUsed = '-';
    parts = cleanInput.split(' - ').map((s) => s.trim());
  } else if (cleanInput.includes('-')) {
    // Check if plain "-" is used
    delimiterUsed = '-';
    parts = cleanInput.split('-').map((s) => s.trim());
  } else {
    // Single value or fallback
    parts = [cleanInput];
  }

  return {
    raw: cleanInput,
    materialCode: parts[0] || '',
    color: parts[1] || '',
    size: parts[2] || '',
    length: parts[3] || '',
    batchNumber: parts[4] || '',
    productionOrder: parts[5] || (parts.length > 6 ? parts.slice(5).join(' - ') : ''),
    isValid: parts.length >= 6,
    partsCount: parts.length,
    delimiterUsed,
  };
}

/**
 * Format 6 fields back to QR string using chosen delimiter
 */
export function buildMaterialQrString(
  fields: {
    materialCode: string;
    color: string;
    size: string;
    length: string;
    batchNumber: string;
    productionOrder: string;
  },
  delimiter: '^^' | '-' = '^^'
): string {
  const separator = delimiter === '^^' ? ' ^^ ' : ' - ';
  return [
    fields.materialCode.trim(),
    fields.color.trim(),
    fields.size.trim(),
    fields.length.trim(),
    fields.batchNumber.trim(),
    fields.productionOrder.trim(),
  ]
    .filter(Boolean)
    .join(separator);
}

/**
 * Common sample QR codes for immediate testing
 */
export const SAMPLE_MATERIAL_QRS = [
  {
    label: 'Mẫu 1 (Dấu ^^)',
    delimiter: '^^' as const,
    raw: 'VT-COTTON-01 ^^ Đỏ đô ^^ L ^^ 120m ^^ LOT-2026-09 ^^ LSX-88992',
    description: 'Vải Cotton đỏ đô, size L, dài 120m, Lô 2026-09',
  },
  {
    label: 'Mẫu 2 (Dấu -)',
    delimiter: '-' as const,
    raw: 'VT-POLY-102 - Xanh Navy - XL - 50m - L2603 - SX-1024',
    description: 'Sợi Polyester xanh Navy, size XL, dài 50m',
  },
  {
    label: 'Mẫu 3 (Dấu ^^ Da may)',
    delimiter: '^^' as const,
    raw: 'DA-PU-PREMIUM ^^ Nâu da bò ^^ 1.4mm ^^ 85m ^^ LOT-PU-441 ^^ LSX-BAG-99',
    description: 'Da PU nâu, độ dày 1.4mm, dài 85m',
  },
  {
    label: 'Mẫu 4 (Dấu - Dệt kim)',
    delimiter: '-' as const,
    raw: 'CHI-MAY-SPUN - Trắng tinh - 40/2 - 5000m - LOT-CHI-26 - LSX-MAY-301',
    description: 'Chỉ may Spun trắng 40/2 dài 5000m',
  },
];

export const SAMPLE_WAREHOUSE_LOCATIONS = [
  {
    label: 'Kệ A1 - Tầng 2 - Ô 04',
    code: 'KHO-A1-KE02-O04',
    desc: 'Kho nguyên phụ liệu A1',
  },
  {
    label: 'Kệ B3 - Dãy 1',
    code: 'RACK-B3-ROW01',
    desc: 'Kho vải chính B3',
  },
  {
    label: 'Khu vực Pallet C-09',
    code: 'PLT-C09-SEC2',
    desc: 'Khu hàng chờ gia công',
  },
  {
    label: 'Kho Phụ Liệu - Tủ 05',
    code: 'KHO-PL-TU05',
    desc: 'Tủ lưu chỉ và cúc',
  },
];

export const COMMON_UNITS = [
  'Mét (m)',
  'Cuộn',
  'Cây',
  'Kg',
  'Cái',
  'Thùng',
  'Bộ',
  'Hộp',
  'Tấm',
  'Yards',
];
