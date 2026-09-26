/**
 * Parser for Material QR Codes
 * Expected format:
 * Mã vật tư ^^ Màu ^^ Size ^^ Length ^^ Lệnh sản xuất ^^ Lô sản xuất
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
  description: string;
  detectedUnit?: 'MET' | 'KG' | 'PCS' | 'PAIR';
  isValid: boolean;
  partsCount: number;
  delimiterUsed: '^^' | '-' | '|' | 'none';
  missingFields: string[];
  fieldAnalysis: FieldAnalysis[];
  errorReason?: string;
  detectedType: 'normal' | 'tip' | 'four_parts';
}

export const MATERIAL_QR_STANDARD_FIELDS = [
  { index: 1, key: 'materialCode', label: 'Mã vật tư', example: 'VT-COTTON-01' },
  { index: 2, key: 'color', label: 'Màu sắc', example: 'Đỏ đô / Xanh Navy' },
  { index: 3, key: 'size', label: 'Kích cỡ (Size)', example: 'L / XL / 1.4mm' },
  { index: 4, key: 'length', label: 'Chiều dài (Length)', example: '120m / 50m' },
  { index: 5, key: 'productionOrder', label: 'Lệnh sản xuất (PO)', example: 'LSX-88992' },
  { index: 6, key: 'batchNumber', label: 'Lô sản xuất (Lot)', example: 'LOT-2026-09' },
];

export function parseMaterialQr(input: string, type: 'normal' | 'tip' = 'normal'): ParsedMaterialQr {
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
      description: '',
      isValid: false,
      partsCount: 0,
      delimiterUsed: 'none',
      missingFields: MATERIAL_QR_STANDARD_FIELDS.map((f) => f.label),
      fieldAnalysis: emptyAnalysis,
      errorReason: 'Mã QR rỗng, không chứa dữ liệu văn bản.',
      detectedType: 'normal',
    };
  }

  let delimiterUsed: '^^' | '-' | '|' | 'none' = 'none';
  let parts: string[] = [];
  let materialCode = '';
  let color = '';
  let size = '';
  let length = '';
  let productionOrder = '';
  let batchNumber = '';
  let isValid = false;
  let missingFields: string[] = [];
  let errorReason: string | undefined;

  let isTipMode = type === 'tip';
  let isFourPartsMode = false;

  if (!isTipMode && cleanInput.includes('^^')) {
    const autoParts = cleanInput.split('^^').map((s) => s.trim());
    if (autoParts.length === 3) {
      isTipMode = true;
    } else if (autoParts.length === 4) {
      isFourPartsMode = true;
    }
  }

  if (isTipMode) {
    // Tip logic: format is "mã vật tư ^^ phần_tử_thứ_2 ^^ lô sản xuất"
    if (cleanInput.includes('^^')) {
      delimiterUsed = '^^';
      parts = cleanInput.split('^^').map((s) => s.trim());
    } else {
      parts = [cleanInput];
    }
    
    materialCode = parts[0] || '';
    batchNumber = parts[2] || '';
    
    isValid = parts.length >= 3 && Boolean(materialCode);
    if (!isValid) {
      if (parts.length < 3) {
        errorReason = "Mã QR tip không đủ 3 phần (yêu cầu phân tách bằng '^^').";
        missingFields = ['Lô sản xuất'];
      }
      if (!materialCode) {
        errorReason = 'Mã vật tư bị để trống.';
        if (!missingFields.includes('Mã vật tư')) missingFields.push('Mã vật tư');
      }
    }
  } else if (isFourPartsMode) {
    if (cleanInput.includes('^^')) {
      delimiterUsed = '^^';
      parts = cleanInput.split('^^').map((s) => s.trim());
    } else {
      parts = [cleanInput];
    }
    
    // Phần tử thứ 2 (index 1) là mã vật tư, thứ 3 là màu, thứ 4 là lô
    materialCode = parts[1] || '';
    color = parts[2] || '';
    batchNumber = parts[3] || '';
    
    isValid = parts.length >= 4 && Boolean(materialCode);
    if (!isValid) {
      if (parts.length < 4) {
        errorReason = "Mã QR loại 4 phần không đủ 4 phần (yêu cầu phân tách bằng '^^').";
        missingFields = ['Lô sản xuất'];
      }
      if (!materialCode) {
        errorReason = 'Mã vật tư bị để trống.';
        if (!missingFields.includes('Mã vật tư')) missingFields.push('Mã vật tư');
      }
    }
  } else {
    // Normal logic
    // 1. Ưu tiên kiểm tra dấu "^^" trước
    if (cleanInput.includes('^^')) {
      delimiterUsed = '^^';
      parts = cleanInput.split('^^').map((s) => s.trim());
    } 
    // 2. Nếu không có thì kiểm tra dấu "-"
    else if (cleanInput.includes('-')) {
      delimiterUsed = '-';
      parts = cleanInput.split('-').map((s) => s.trim());
    } 
    // 3. Dự phòng cho dấu "|"
    else if (cleanInput.includes('|')) {
      delimiterUsed = '|';
      parts = cleanInput.split('|').map((s) => s.trim());
    } else {
      // Single value or fallback
      parts = [cleanInput];
    }

    materialCode = parts[0] || '';
    color = parts[1] || '';
    size = parts[2] || '';
    length = parts[3] || '';
    productionOrder = parts[4] || '';
    batchNumber = parts[5] || '';
  }

  let detectedUnit: 'MET' | 'KG' | 'PCS' | 'PAIR' | undefined;
  if (!isTipMode && parts.length > 6) {
    const rawUnit = parts[6].toUpperCase().trim();
    if (rawUnit === 'M' || rawUnit === 'MET' || rawUnit === 'MÉT' || rawUnit === 'METER') {
      detectedUnit = 'MET';
    } else if (rawUnit === 'KG' || rawUnit === 'KILOGRAM') {
      detectedUnit = 'KG';
    } else if (rawUnit === 'PCS' || rawUnit === 'PC' || rawUnit === 'CÁI' || rawUnit === 'PIECE') {
      detectedUnit = 'PCS';
    } else if (rawUnit === 'PAIR' || rawUnit === 'ĐÔI' || rawUnit === 'PAIRS') {
      detectedUnit = 'PAIR';
    }
  }

  // Generate clear descriptive text from extracted fields
  const description = generateMaterialDescription({
    materialCode,
    color,
    size,
    length,
    batchNumber,
    productionOrder,
  });

  const extractedValues = [materialCode, color, size, length, productionOrder, batchNumber];

  const fieldAnalysis: FieldAnalysis[] = MATERIAL_QR_STANDARD_FIELDS.map((field, idx) => {
    const val = extractedValues[idx] || '';
    // For tip type, only Material Code and Batch Number are relevant, others might not be "missing" but just N/A
    return {
      index: field.index,
      label: field.label,
      key: field.key,
      value: val,
      isProvided: Boolean(val && val.trim().length > 0),
    };
  });

  if (type === 'normal') {
    missingFields = fieldAnalysis.filter((f) => !f.isProvided).map((f) => f.label);
    isValid = parts.length >= 6 && Boolean(materialCode);

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
  } else {
     // Re-calculate missing fields for tip based on field analysis to ensure standard field labels are used if needed
     const expectedTipFields = ['materialCode', 'batchNumber'];
     missingFields = fieldAnalysis.filter(f => expectedTipFields.includes(f.key) && !f.isProvided).map(f => f.label);
  }

  return {
    raw: cleanInput,
    materialCode,
    color,
    size,
    length,
    batchNumber,
    productionOrder,
    description,
    detectedUnit,
    isValid,
    partsCount: parts.length,
    delimiterUsed,
    missingFields,
    fieldAnalysis,
    errorReason,
    detectedType: isTipMode ? 'tip' : (isFourPartsMode ? 'four_parts' : 'normal'),
  };
}

/**
 * Generate a clean, readable material description from its attributes
 */
export function generateMaterialDescription(fields: {
  materialCode?: string;
  color?: string;
  size?: string;
  length?: string;
  batchNumber?: string;
  productionOrder?: string;
}): string {
  const parts: string[] = [];
  if (fields.materialCode?.trim()) {
    parts.push(fields.materialCode.trim());
  }
  if (fields.color?.trim()) {
    parts.push(`Màu: ${fields.color.trim()}`);
  }
  if (fields.size?.trim()) {
    parts.push(`Size: ${fields.size.trim()}`);
  }
  if (fields.length?.trim() && fields.length.trim() !== '0') {
    parts.push(`Dài: ${fields.length.trim()}`);
  }
  if (
    fields.batchNumber?.trim() &&
    fields.batchNumber.trim() !== '_' &&
    fields.batchNumber.trim() !== '0'
  ) {
    parts.push(`Lô: ${fields.batchNumber.trim()}`);
  }
  if (fields.productionOrder?.trim()) {
    parts.push(`LSX: ${fields.productionOrder.trim()}`);
  }
  return parts.join(' - ');
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
    fields.productionOrder.trim(),
    fields.batchNumber.trim(),
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
    raw: 'VT-COTTON-01 ^^ Đỏ đô ^^ L ^^ 120m ^^ LSX-88992 ^^ LOT-2026-09',
    description: 'Vải Cotton đỏ đô, size L, dài 120m, Lô 2026-09',
  },
  {
    label: 'Mẫu 2 (Dấu -)',
    delimiter: '-' as const,
    raw: 'VT-POLY-102 - Xanh Navy - XL - 50m - SX-1024 - L2603',
    description: 'Sợi Polyester xanh Navy, size XL, dài 50m',
  },
  {
    label: 'Mẫu 3 (Dấu ^^ Da may)',
    delimiter: '^^' as const,
    raw: 'DA-PU-PREMIUM ^^ Nâu da bò ^^ 1.4mm ^^ 85m ^^ LSX-BAG-99 ^^ LOT-PU-441',
    description: 'Da PU nâu, độ dày 1.4mm, dài 85m',
  },
  {
    label: 'Mẫu 4 (Dấu - Dệt kim)',
    delimiter: '-' as const,
    raw: 'CHI-MAY-SPUN - Trắng tinh - 40/2 - 5000m - LSX-MAY-301 - LOT-CHI-26',
    description: 'Chỉ may Spun trắng 40/2 dài 5000m',
  },
  {
    label: '⚠️ Mẫu lỗi: Thiếu trường',
    delimiter: '^^' as const,
    raw: 'VT-COTTON-01 ^^ Đỏ đô ^^ L',
    description: 'Mã lỗi chỉ có 3/6 trường (thiếu Length, Lệnh SX, Lô SX)',
  },
  {
    label: '⚠️ Mẫu lỗi: Sai phân tách',
    delimiter: 'none' as any,
    raw: 'MA-VAT-TU-KHONG-CO-DAU-PHAN-TACH-12345',
    description: 'Mã lỗi không chứa dấu ^^ hoặc -',
  },
  {
    label: 'Mẫu Tip (Dấu ^^)',
    delimiter: '^^' as const,
    raw: 'TIP-VT-123 ^^ 0110 ^^ LOT-TIP-2026',
    description: 'Tip: Mã vật tư TIP-VT-123, Lô LOT-TIP-2026',
  },
  {
    label: 'Mẫu 4 phần (Dấu ^^)',
    delimiter: '^^' as const,
    raw: 'IGNORE_ME ^^ T06-2000 ^^ Đỏ ^^ LOT-2023',
    description: '4 phần: Bỏ qua ^^ Mã vật tư ^^ Màu ^^ Lô',
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

export const COMMON_UNITS = ['MET', 'KG', 'PCS', 'PAIR'];
