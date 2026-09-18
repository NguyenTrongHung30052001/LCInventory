import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Camera,
  QrCode,
  CheckCircle2,
  Trash2,
  Save,
  Loader2,
  MapPin,
  FileText,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { MaterialTicket, ALLOWED_UNITS } from '../types';
import { parseMaterialQr } from '../utils/materialQrParser';
import { ScanErrorInfo } from './ScanErrorModal';

interface MaterialTicketCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMaterialScanner: () => void;
  onOpenLocationScanner: () => void;
  onSwitchLocation?: () => void;
  scannedMaterialQr: string | null;
  scannedLocationQr: string | null;
  currentLocation?: string | null;
  onSaveTicket: (ticket: MaterialTicket, action?: 'continue' | 'close') => Promise<void> | void;
  onClearScannedMaterialQr: () => void;
  onClearScannedLocationQr: () => void;
  onShowScanError?: (error: ScanErrorInfo) => void;
  isSaving?: boolean;
  defaultWarehouseCode?: string;
  defaultScannedBy?: string;
}

export const MaterialTicketCreateModal: React.FC<MaterialTicketCreateModalProps> = ({
  isOpen,
  onClose,
  onOpenMaterialScanner,
  onOpenLocationScanner,
  onSwitchLocation,
  scannedMaterialQr,
  scannedLocationQr,
  currentLocation,
  onSaveTicket,
  onClearScannedMaterialQr,
  onClearScannedLocationQr,
  onShowScanError,
  isSaving = false,
  defaultWarehouseCode = 'FGW',
  defaultScannedBy = '105',
}) => {
  const [rawQr, setRawQr] = useState('');

  // 6 fields from QR
  const [materialCode, setMaterialCode] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [length, setLength] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [productionOrder, setProductionOrder] = useState('');

  // Warehouse & quantity fields
  const [unit, setUnit] = useState<string>('MET');
  const [quantity, setQuantity] = useState<string | number>('1');
  const [quantityError, setQuantityError] = useState('');
  const [warehouseLocation, setWarehouseLocation] = useState(currentLocation || '');

  // Ghi chú (yêu cầu thêm)
  const [notes, setNotes] = useState('');

  const [isParsed, setIsParsed] = useState(false);
  const [localSaving, setLocalSaving] = useState(false);
  const [submitAction, setSubmitAction] = useState<'continue' | 'close'>('continue');

  // Reset form when opened fresh, keep warehouse location
  useEffect(() => {
    if (isOpen) {
      setWarehouseLocation(currentLocation || '');
      setQuantityError('');
      if (!scannedMaterialQr) {
        setRawQr('');
        setMaterialCode('');
        setColor('');
        setSize('');
        setLength('');
        setBatchNumber('');
        setProductionOrder('');
        setUnit('MET');
        setQuantity('1');
        setNotes('');
        setIsParsed(false);
      }
    }
  }, [isOpen, currentLocation]);

  // When scannedMaterialQr updates (from camera scan)
  useEffect(() => {
    if (scannedMaterialQr) {
      applyQrString(scannedMaterialQr);
    }
  }, [scannedMaterialQr]);

  // When scannedLocationQr updates (from warehouse location scan)
  useEffect(() => {
    if (scannedLocationQr) {
      setWarehouseLocation(scannedLocationQr.trim());
      onClearScannedLocationQr();
    }
  }, [scannedLocationQr]);

  const applyQrString = (val: string) => {
    setRawQr(val);
    const parsed = parseMaterialQr(val);
    setIsParsed(parsed.isValid);

    if (parsed.materialCode) setMaterialCode(parsed.materialCode);
    if (parsed.color) setColor(parsed.color);
    if (parsed.size) setSize(parsed.size);
    if (parsed.length) setLength(parsed.length);
    if (parsed.batchNumber) setBatchNumber(parsed.batchNumber);
    if (parsed.productionOrder) setProductionOrder(parsed.productionOrder);
    if (parsed.detectedUnit) setUnit(parsed.detectedUnit);
    if (parsed.description) setNotes(parsed.description);
  };

  const handleClearQr = () => {
    setRawQr('');
    setMaterialCode('');
    setColor('');
    setSize('');
    setLength('');
    setBatchNumber('');
    setProductionOrder('');
    setIsParsed(false);
    onClearScannedMaterialQr();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (localSaving || isSaving) return;

    const parsedQty = parseFloat(String(quantity).replace(',', '.'));
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setQuantityError('Số lượng phải lớn hơn 0');
      return;
    }
    setQuantityError('');

    setLocalSaving(true);
    try {
      const newTicket: MaterialTicket = {
        id: `mat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: Date.now(),
        rawQr: rawQr.trim(),
        materialCode: materialCode.trim(),
        color: color.trim(),
        size: size.trim(),
        length: length.trim(),
        batchNumber: batchNumber.trim(),
        productionOrder: productionOrder.trim(),
        unit: unit.trim() || 'MET',
        quantity: String(parsedQty),
        warehouseLocation: warehouseLocation.trim(),
        warehouseCode: defaultWarehouseCode.trim() || 'FGW',
        scannedBy: defaultScannedBy.trim() || '105',
        notes: notes.trim(),
      };

      await onSaveTicket(newTicket, submitAction);
      if (submitAction === 'close') {
        onClose();
      }
    } finally {
      setLocalSaving(false);
    }
  };

  if (!isOpen) return null;

  const submitting = localSaving || isSaving;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-3 bg-black/60 backdrop-blur-xs">
        <div className="fixed inset-0" onClick={submitting ? undefined : onClose} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] sm:max-h-[90vh] text-slate-900 dark:text-slate-100 overflow-hidden"
        >
          {/* Header - Bỏ cột mã phiếu, trạng thái */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <FileText className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Tạo phiếu vật tư
              </h3>
            </div>

            <button
              id="btn-close-material-modal"
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
            {/* 0. VỊ TRÍ KHO HIỆN TẠI (LOCKED CHO PHIÊN KIỂM KÊ) */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                    Vị trí kệ kho
                  </div>
                  <div className="text-xs sm:text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 truncate">
                    {warehouseLocation || 'Chưa chọn vị trí'}
                  </div>
                </div>
              </div>

              <button
                id="btn-change-location-in-modal"
                type="button"
                onClick={() => {
                  if (onSwitchLocation) {
                    onSwitchLocation();
                  } else {
                    onOpenLocationScanner();
                  }
                }}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-600 flex items-center gap-1 shrink-0 shadow-2xs transition-colors"
                title="Đổi sang vị trí kệ khác"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Đổi vị trí</span>
              </button>
            </div>

            {/* 1. KHỐI QUÉT QR */}
            <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-200">
                <span className="flex items-center gap-1.5">
                  <QrCode className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Mã QR vật tư
                </span>
                {rawQr && (
                  <button
                    type="button"
                    onClick={handleClearQr}
                    className="text-rose-600 dark:text-rose-400 text-[11px] font-semibold flex items-center gap-0.5"
                  >
                    <Trash2 className="h-3 w-3" />
                    Xóa
                  </button>
                )}
              </div>

              {/* Input + Camera button */}
              <div className="flex items-center gap-2">
                <input
                  id="input-raw-material-qr"
                  type="text"
                  value={rawQr}
                  onChange={(e) => applyQrString(e.target.value)}
                  placeholder="Dán mã hoặc bấm quét..."
                  className="flex-1 h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <button
                  id="btn-scan-material-qr"
                  type="button"
                  onClick={onOpenMaterialScanner}
                  className="h-10 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  <Camera className="h-4 w-4" />
                  <span>Quét QR</span>
                </button>
              </div>

              {/* Status bóc tách nếu có QR */}
              {rawQr && (
                <div className="flex items-center justify-end pt-0.5">
                  {isParsed ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                      <CheckCircle2 className="h-3 w-3" /> Đã bóc tách 6 trường
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const parsed = parseMaterialQr(rawQr);
                        if (onShowScanError) {
                          onShowScanError({
                            type: 'invalid_format',
                            title: 'Mã QR không đúng quy chuẩn',
                            message:
                              parsed.errorReason ||
                              'Mã QR không đủ 6 trường thông tin quy chuẩn của Liên Châu.',
                            rawQr,
                            parsed,
                          });
                        }
                      }}
                      className="inline-flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 font-bold hover:underline"
                    >
                      <AlertTriangle className="h-3 w-3" /> Lỗi định dạng (Xem chi tiết)
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 2. 6 TRƯỜNG BÓC TÁCH */}
            <div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                6 trường thông tin vật tư
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* 1. Mã vật tư */}
                <div className="col-span-2">
                  <label
                    htmlFor="field-material-code"
                    className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5"
                  >
                    1. Mã vật tư <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="field-material-code"
                    type="text"
                    required
                    value={materialCode}
                    onChange={(e) => setMaterialCode(e.target.value)}
                    placeholder="VD: VT-COTTON-01"
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* 2. Màu */}
                <div>
                  <label
                    htmlFor="field-color"
                    className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5"
                  >
                    2. Màu sắc
                  </label>
                  <input
                    id="field-color"
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="Màu sắc"
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* 3. Size */}
                <div>
                  <label
                    htmlFor="field-size"
                    className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5"
                  >
                    3. Size / Kích cỡ
                  </label>
                  <input
                    id="field-size"
                    type="text"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="Size"
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* 4. Length */}
                <div>
                  <label
                    htmlFor="field-length"
                    className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5"
                  >
                    4. Chiều dài (Length)
                  </label>
                  <input
                    id="field-length"
                    type="text"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    placeholder="Độ dài"
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* 5. Lô SX */}
                <div>
                  <label
                    htmlFor="field-batch-number"
                    className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5"
                  >
                    5. Lô sản xuất (Lot)
                  </label>
                  <input
                    id="field-batch-number"
                    type="text"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder="VD: LOT20260917"
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* 6. Lệnh SX */}
                <div className="col-span-2">
                  <label
                    htmlFor="field-production-order"
                    className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5"
                  >
                    6. Lệnh sản xuất (PO)
                  </label>
                  <input
                    id="field-production-order"
                    type="text"
                    value={productionOrder}
                    onChange={(e) => setProductionOrder(e.target.value)}
                    placeholder="VD: PO-8888"
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* 3. THÔNG TIN KHO, SỐ LƯỢNG & GHI CHÚ */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Thông tin kho & số lượng
              </div>

              {/* Đơn vị tính & Số lượng */}
              <div className="grid grid-cols-2 gap-2.5 items-start">
                <div>
                  <label
                    htmlFor="input-unit"
                    className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1"
                  >
                    Đơn vị tính <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="input-unit"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                  >
                    {ALLOWED_UNITS.map((u) => (
                      <option key={u} value={u} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold">
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="input-quantity"
                    className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1"
                  >
                    Số lượng <span className="text-rose-500">*</span>
                  </label>
           <input id="input-quantity" type="text" inputMode="decimal" pattern="[0-9]*[,]?[0-9]*" required value={quantity} onChange={(e) => { // Thay dấu chấm bằng dấu phẩy, chỉ giữ số và tối đa 1 dấu phẩy thập phân let val = e.target.value .replace(/\./g, ',') .replace(/[^0-9,]/g, ''); const commaParts = val.split(','); // Chỉ cho phép tối đa 1 dấu phẩy if (commaParts.length > 2) { val = commaParts[0] + ',' + commaParts.slice(1).join(''); } setQuantity(val); // Kiểm tra giá trị số > 0 const num = parseFloat(val.replace(',', '.')); if (val !== '' && !isNaN(num) && num > 0) { setQuantityError(''); } }} placeholder="1,0" className={`w-full h-9 px-2.5 rounded-lg bg-white dark:bg-slate-900 border text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:outline-hidden transition-colors ${ quantityError ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500' }`} />
                  {quantityError && (
                    <p className="mt-1 text-[10px] text-rose-500 font-semibold leading-tight">
                      {quantityError}
                    </p>
                  )}
                </div>
              </div>

              {/* 4 Đơn vị tính nhanh: MET, KG, PCS, PAIR */}
              <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                {ALLOWED_UNITS.map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className={`py-1 px-1 rounded-lg text-xs font-bold text-center border transition-all ${
                      unit === u
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>

              {/* CỘT MÔ TẢ / GHI CHÚ */}
              <div>
                <label
                  htmlFor="input-ticket-notes"
                  className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
                    <FileText className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    Mô tả / Ghi chú
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Tự động điền khi quét</span>
                </label>
                <textarea
                  id="input-ticket-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Mô tả vật tư hoặc ghi chú thêm..."
                  className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden resize-none font-medium"
                />
              </div>
            </div>

            {/* Actions: Hủy, Lưu & Đóng, Lưu & Quét tiếp (Primary) */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex items-center gap-2 flex-1">
                <button
                  id="btn-cancel-create-modal"
                  type="button"
                  disabled={submitting}
                  onClick={onClose}
                  className="flex-1 h-11 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                >
                  Hủy
                </button>

                <button
                  id="btn-save-and-close"
                  type="submit"
                  disabled={submitting}
                  onClick={() => setSubmitAction('close')}
                  className="flex-1 h-11 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-bold flex items-center justify-center gap-1 shadow-2xs disabled:opacity-60 transition-colors"
                  title="Lưu bản ghi này và dừng quét"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Lưu & Đóng</span>
                </button>
              </div>

              <button
                id="btn-save-and-scan-next"
                type="submit"
                disabled={submitting}
                onClick={() => setSubmitAction('continue')}
                className="sm:flex-[1.5] h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 transition-all"
                title="Lưu và tự động mở camera quét mã QR tiếp theo tại vị trí này"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang gửi MES...</span>
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" />
                    <span>Lưu & Quét tiếp</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
