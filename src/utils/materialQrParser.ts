/**
 * Parser for Material QR Codes
 * Expected format:
 * Mã vật tư ^^ Màu ^^ Size ^^ Length ^^ Lô sản xuất ^^ Lệnh sản xuất
 * (Hoặc có thể dùng dấu phân tách là '-' hoặc '|')
 */

export interface FieldAnalysis {
  index: number;
  label: string;
  key: string;
  value: string;
  isProvided: boolean;
}

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
  delimiterUsed: '^^' | '-' | '|' | 'none';
  missingFields: string[];
  fieldAnalysis: FieldAnalysis[];
  errorReason?: string;
}

export const MATERIAL_QR_STANDARD_FIELDS = [
  { index: 1, key: 'materialCode', label: 'Mã vật tư', example: 'VT-COTTON-01' },
  { index: 2, key: 'color', label: 'Màu sắc', example: 'Đỏ đô / Xanh Navy' },
  { index: 3, key: 'size', label: 'Kích cỡ (Size)', example: 'L / XL / 1.4mm' },
  { index: 4, key: 'length', label: 'Chiều dài (Length)', example: '120m / 50m' },
  { index: 5, key: 'batchNumber', label: 'Lô sản xuất (Lot)', example: 'LOT-2026-09' },
  { index: 6, key: 'productionOrder', label: 'Lệnh sản xuất (PO)', example: 'LSX-88992' },
];

export function parseMaterialQr(input: string): ParsedMaterialQr {
  const cleanInput = (input || '').trim();

  if (!cleanInput) {
    const emptyAnalysis: FieldAnalysis[] = MATERIAL_QR_STANDARD_FIELDS.map((f) => ({
      index: f.index,
      label: f.label,
      key: f.key,
      value: '',
      isProvided: false,
    }));

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
      missingFields: MATERIAL_QR_STANDARD_FIELDS.map((f) => f.label),
      fieldAnalysis: emptyAnalysis,
      errorReason: 'Mã QR rỗng, không chứa dữ liệu văn bản.',
    };
  }

  let delimiterUsed: '^^' | '-' | '|' | 'none' = 'none';
  let parts: string[] = [];

  // 1. Check if ^^ is used
  if (cleanInput.includes('^^')) {
    delimiterUsed = '^^';
    parts = cleanInput.split('^^').map((s) => s.trim());
  } else if (cleanInput.includes('|')) {
    // 2. Check if | is used (e.g. MES barcode standard)
    delimiterUsed = '|';
    parts = cleanInput.split('|').map((s) => s.trim());
  } else if (cleanInput.includes(' - ')) {
    // 3. Check if " - " with spaces is used
    delimiterUsed = '-';
    parts = cleanInput.split(' - ').map((s) => s.trim());
  } else if (cleanInput.includes('-') && cleanInput.split('-').length >= 6) {
    // 4. Check if plain "-" is used with at least 6 parts
    delimiterUsed = '-';
    parts = cleanInput.split('-').map((s) => s.trim());
  } else {
    // Single value or fallback (cannot split into 6 parts)
    parts = [cleanInput];
  }

  const materialCode = parts[0] || '';
  const color = parts[1] || '';
  const size = parts[2] || '';
  const length = parts[3] || '';
  const batchNumber = parts[4] || '';
  const productionOrder = parts[5] || (parts.length > 6 ? parts.slice(5).join(' - ') : '');

  const extractedValues = [materialCode, color, size, length, batchNumber, productionOrder];

  const fieldAnalysis: FieldAnalysis[] = MATERIAL_QR_STANDARD_FIELDS.map((field, idx) => {
    const val = extractedValues[idx] || '';
    return {
      index: field.index,
      label: field.label,
      key: field.key,
      value: val,
      isProvided: Boolean(val && val.trim().length > 0),
    };
  });

  const missingFields = fieldAnalysis.filter((f) => !f.isProvided).map((f) => f.label);
  const isValid = parts.length >= 6 && Boolean(materialCode);

  let errorReason: string | undefined;
  if (!isValid) {
    if (delimiterUsed === 'none' || parts.length <= 1) {
      errorReason =
        "Mã QR không chứa dấu phân tách quy chuẩn ('^^' hoặc '-'). Toàn bộ chuỗi chỉ nhận diện được 1 trường, không thể bóc tách 6 trường.";
    } else if (parts.length < 6) {
      errorReason = `Mã QR chỉ nhận diện được ${parts.length}/6 trường thông tin. Còn thiếu: ${missingFields.join(', ')}.`;
    } else if (!materialCode) {
      errorReason = 'Trường đầu tiên (Mã vật tư) bị để trống.';
    }
  }

  return {
    raw: cleanInput,
    materialCode,
    color,
    size,
    length,
    batchNumber,
    productionOrder,
    isValid,
    partsCount: parts.length,
    delimiterUsed,
    missingFields,
    fieldAnalysis,
    errorReason,
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
  {
    label: '⚠️ Mẫu lỗi: Thiếu trường',
    delimiter: '^^' as const,
    raw: 'VT-COTTON-01 ^^ Đỏ đô ^^ L',
    description: 'Mã lỗi chỉ có 3/6 trường (thiếu Length, Lô SX, Lệnh SX)',
  },
  {
    label: '⚠️ Mẫu lỗi: Sai phân tách',
    delimiter: 'none' as any,
    raw: 'MA-VAT-TU-KHONG-CO-DAU-PHAN-TACH-12345',
    description: 'Mã lỗi không chứa dấu ^^ hoặc -',
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
