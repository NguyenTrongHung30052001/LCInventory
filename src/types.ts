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

export interface ScannerSettings {
  beepOnScan: boolean;
  vibrateOnScan: boolean;
  autoOpenUrl: boolean;
  continuousScan: boolean;
  saveHistory: boolean;
  preferredCamera: 'environment' | 'user';
}

export type ScanMode = 'camera' | 'upload';
