import { ScanResult, ScanType } from '../types';

export function parseQrContent(raw: string): ScanResult {
  const trimmed = raw.trim();
  const id = `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = Date.now();

  // Check URL
  if (/^https?:\/\//i.test(trimmed) || /^(www\.)[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(trimmed)) {
    const url = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    return {
      id,
      rawText: trimmed,
      type: 'url',
      title: url,
      timestamp,
      metadata: { url }
    };
  }

  // Check Wi-Fi format: WIFI:T:WPA;S:MyNetwork;P:mypassword;;
  if (trimmed.startsWith('WIFI:')) {
    const ssidMatch = trimmed.match(/S:([^;]+)/);
    const passMatch = trimmed.match(/P:([^;]+)/);
    const encMatch = trimmed.match(/T:([^;]+)/);
    const ssid = ssidMatch ? ssidMatch[1] : 'Không rõ tên Wi-Fi';
    const password = passMatch ? passMatch[1] : '';
    const encryption = encMatch ? encMatch[1] : 'WPA/WPA2';

    return {
      id,
      rawText: trimmed,
      type: 'wifi',
      title: `Wi-Fi: ${ssid}`,
      timestamp,
      metadata: {
        ssid,
        password,
        encryption
      }
    };
  }

  // Check vCard
  if (trimmed.includes('BEGIN:VCARD')) {
    const nameMatch = trimmed.match(/FN:([^\r\n]+)/) || trimmed.match(/N:([^\r\n]+)/);
    const telMatch = trimmed.match(/TEL(?:;[^:]+)?:([^\r\n]+)/);
    const emailMatch = trimmed.match(/EMAIL(?:;[^:]+)?:([^\r\n]+)/);
    const name = nameMatch ? nameMatch[1].replace(/;/g, ' ').trim() : 'Danh bạ cá nhân';

    return {
      id,
      rawText: trimmed,
      type: 'contact',
      title: name,
      timestamp,
      metadata: {
        name,
        phone: telMatch ? telMatch[1].trim() : undefined,
        email: emailMatch ? emailMatch[1].trim() : undefined
      }
    };
  }

  // Check VietQR / Payment format
  if (trimmed.startsWith('000201') || trimmed.toLowerCase().includes('vietqr') || trimmed.toLowerCase().includes('napas')) {
    return {
      id,
      rawText: trimmed,
      type: 'payment',
      title: 'Mã QR Thanh toán / Chuyển khoản',
      timestamp,
      metadata: {
        bank: 'Ngân hàng thụ hưởng (VietQR / Napas247)',
        note: 'Quét để thanh toán hóa đơn hoặc chuyển tiền nhanh'
      }
    };
  }

  // Check Email
  if (trimmed.startsWith('mailto:') || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    const email = trimmed.replace(/^mailto:/i, '');
    return {
      id,
      rawText: trimmed,
      type: 'email',
      title: email,
      timestamp,
      metadata: { email }
    };
  }

  // Plain Text default
  return {
    id,
    rawText: trimmed,
    type: 'text',
    title: trimmed.length > 40 ? trimmed.substring(0, 40) + '...' : trimmed,
    timestamp
  };
}

export const SAMPLE_QR_ITEMS: Array<{ label: string; description: string; raw: string; type: ScanType }> = [
  {
    label: 'Liên kết Website',
    description: 'Địa chỉ trang web công nghệ',
    raw: 'https://vnexpress.net',
    type: 'url'
  },
  {
    label: 'Mạng Wi-Fi Quán Cafe',
    description: 'Thông tin kết nối Wi-Fi tự động',
    raw: 'WIFI:S:Highlands_Coffee_Free;T:WPA;P:coffee2026;;',
    type: 'wifi'
  },
  {
    label: 'Mã Chuyển Khoản (VietQR)',
    description: 'Mã thanh toán nhanh Napas247',
    raw: '00020101021238540010A00000072701240006970422011001234567895204481453037045405500005802VN',
    type: 'payment'
  },
  {
    label: 'Danh Bạ Liên Lạc',
    description: 'vCard Nguyễn Minh Hoàng',
    raw: 'BEGIN:VCARD\nVERSION:3.0\nFN:Nguyễn Minh Hoàng\nTEL:0988765432\nEMAIL:hoang.nm@example.vn\nEND:VCARD',
    type: 'contact'
  },
  {
    label: 'Văn Bản & Ghi Chú',
    description: 'Nội dung thông báo hoặc mật mã',
    raw: 'Mã ưu đãi giảm 20%: QRSCAN2026 - Hạn dùng đến 31/12/2026',
    type: 'text'
  }
];

export const INITIAL_HISTORY: ScanResult[] = [
  parseQrContent('https://vnexpress.net/cong-nghe'),
  parseQrContent('WIFI:S:Office_Guest_HighSpeed;T:WPA;P:welcome2026;;'),
  parseQrContent('Mã xác nhận bảo mật OTP: 849201 (Hết hạn sau 5 phút)')
];
