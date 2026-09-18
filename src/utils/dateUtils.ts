/**
 * Tiện ích định dạng và xử lý thời gian theo múi giờ +07:00 (Việt Nam / Hệ thống MES)
 */

/**
 * Chuyển đổi Date hoặc timestamp sang chuỗi ISO múi giờ Việt Nam (+07:00).
 * Ví dụ: "2026-09-18T09:45:00.123+07:00"
 */
export function formatToTimezonePlus7(dateInput?: number | string | Date): string {
  const date = dateInput ? new Date(dateInput) : new Date();
  const validDate = isNaN(date.getTime()) ? new Date() : date;

  // Tính toán thời gian theo múi giờ UTC+7
  const utc = validDate.getTime() + validDate.getTimezoneOffset() * 60000;
  const vnDate = new Date(utc + 7 * 3600000);

  const yyyy = vnDate.getFullYear();
  const MM = String(vnDate.getMonth() + 1).padStart(2, '0');
  const dd = String(vnDate.getDate()).padStart(2, '0');
  const HH = String(vnDate.getHours()).padStart(2, '0');
  const mm = String(vnDate.getMinutes()).padStart(2, '0');
  const ss = String(vnDate.getSeconds()).padStart(2, '0');
  const SSS = String(vnDate.getMilliseconds()).padStart(3, '0');

  return `${yyyy}-${MM}-${dd}T${HH}:${mm}:${ss}.${SSS}+07:00`;
}

/**
 * Phân tích chuỗi ngày giờ từ máy chủ MES về Unix timestamp (ms).
 * Nếu chuỗi chưa có múi giờ (VD: "2026-09-18T09:03:36.3429051"), mặc định hiểu là múi giờ +07:00.
 */
export function parseMesDateToTimestamp(dateStr?: string | null): number {
  if (!dateStr) return Date.now();
  const str = String(dateStr).trim();

  // Đã có chỉ định timezone offset (+07:00 hoặc Z)
  if (str.includes('+') || str.endsWith('Z') || str.endsWith('z')) {
    const t = new Date(str).getTime();
    if (!isNaN(t)) return t;
  }

  // Chuỗi không có timezone offset (thời gian cục bộ của máy chủ MES Việt Nam)
  const normalized = str.includes('T') ? `${str}+07:00` : `${str.replace(' ', 'T')}+07:00`;
  const parsed = new Date(normalized).getTime();
  if (!isNaN(parsed)) return parsed;

  const fallback = new Date(str).getTime();
  return isNaN(fallback) ? Date.now() : fallback;
}

/**
 * Định dạng ngày giờ hiển thị theo chuẩn Việt Nam (Múi giờ Asia/Ho_Chi_Minh GMT+7)
 * Ví dụ: "09:45:00, 18/09/2026"
 */
export function formatDateTimeVN(dateInput?: number | string | Date): string {
  const date = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(date.getTime())) return '';
  return date.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour12: false,
  });
}

/**
 * Định dạng giờ phút giây hiển thị (Múi giờ Asia/Ho_Chi_Minh GMT+7)
 * Ví dụ: "09:45:00"
 */
export function formatTimeVN(dateInput?: number | string | Date): string {
  const date = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/**
 * Định dạng ngày tháng năm hiển thị (Múi giờ Asia/Ho_Chi_Minh GMT+7)
 * Ví dụ: "18/09/2026"
 */
export function formatDateVN(dateInput?: number | string | Date): string {
  const date = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
  });
}
