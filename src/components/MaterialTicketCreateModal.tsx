import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FilePlus2,
  X,
  Camera,
  QrCode,
  Sparkles,
  CheckCircle2,
  Trash2,
  Save,
  Package,
  Palette,
  Maximize2,
  Ruler,
  Boxes,
  ClipboardList,
  Scale,
  Hash,
  MapPin,
  ArrowRight,
  Info,
} from 'lucide-react';
import { MaterialTicket, TicketStatus } from '../types';
import {
  parseMaterialQr,
  SAMPLE_MATERIAL_QRS,
  COMMON_UNITS,
  SAMPLE_WAREHOUSE_LOCATIONS,
} from '../utils/materialQrParser';
import { generateMaterialTicketCode } from '../utils/materialTicketStorage';

interface MaterialTicketCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMaterialScanner: () => void;
  onOpenLocationScanner: () => void;
  scannedMaterialQr: string | null;
  scannedLocationQr: string | null;
  onSaveTicket: (ticket: MaterialTicket) => void;
  onClearScannedMaterialQr: () => void;
  onClearScannedLocationQr: () => void;
}

export const MaterialTicketCreateModal: React.FC<MaterialTicketCreateModalProps> = ({
  isOpen,
  onClose,
  onOpenMaterialScanner,
  onOpenLocationScanner,
  scannedMaterialQr,
  scannedLocationQr,
  onSaveTicket,
  onClearScannedMaterialQr,
  onClearScannedLocationQr,
}) => {
  const [ticketCode, setTicketCode] = useState('');
  const [rawQr, setRawQr] = useState('');

  // 6 fields from QR
  const [materialCode, setMaterialCode] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [length, setLength] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [productionOrder, setProductionOrder] = useState('');

  // 3 additional fields
  const [unit, setUnit] = useState('Cuộn');
  const [quantity, setQuantity] = useState<string | number>('1');
  const [warehouseLocation, setWarehouseLocation] = useState('');

  // Auxiliary
  const [status, setStatus] = useState<TicketStatus>('pending');
  const [notes, setNotes] = useState('');
  const [parseStatus, setParseStatus] = useState<{
    isValid: boolean;
    partsCount: number;
    delimiterUsed: '^^' | '-' | 'none';
  }>({
    isValid: false,
    partsCount: 0,
    delimiterUsed: 'none',
  });

  // Reset form when opened fresh
  useEffect(() => {
    if (isOpen) {
      setTicketCode(generateMaterialTicketCode());
      if (!scannedMaterialQr) {
        setRawQr('');
        setMaterialCode('');
        setColor('');
        setSize('');
        setLength('');
        setBatchNumber('');
        setProductionOrder('');
        setUnit('Cuộn');
        setQuantity('1');
        setWarehouseLocation('');
        setStatus('pending');
        setNotes('');
        setParseStatus({ isValid: false, partsCount: 0, delimiterUsed: 'none' });
      }
    }
  }, [isOpen]);

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

  // Function to apply QR string and split into 6 fields
  const applyQrString = (val: string) => {
    setRawQr(val);
    const parsed = parseMaterialQr(val);
    setParseStatus({
      isValid: parsed.isValid,
      partsCount: parsed.partsCount,
      delimiterUsed: parsed.delimiterUsed,
    });

    if (parsed.materialCode) setMaterialCode(parsed.materialCode);
    if (parsed.color) setColor(parsed.color);
    if (parsed.size) setSize(parsed.size);
    if (parsed.length) setLength(parsed.length);
    if (parsed.batchNumber) setBatchNumber(parsed.batchNumber);
    if (parsed.productionOrder) setProductionOrder(parsed.productionOrder);
  };

  const handleRawQrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    applyQrString(e.target.value);
  };

  const handleClearQr = () => {
    setRawQr('');
    setMaterialCode('');
    setColor('');
    setSize('');
    setLength('');
    setBatchNumber('');
    setProductionOrder('');
    setParseStatus({ isValid: false, partsCount: 0, delimiterUsed: 'none' });
    onClearScannedMaterialQr();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newTicket: MaterialTicket = {
      id: `mat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      code: ticketCode.trim() || generateMaterialTicketCode(),
      createdAt: Date.now(),
      rawQr: rawQr.trim(),
      materialCode: materialCode.trim(),
      color: color.trim(),
      size: size.trim(),
      length: length.trim(),
      batchNumber: batchNumber.trim(),
      productionOrder: productionOrder.trim(),
      unit: unit.trim() || 'Cuộn',
      quantity: quantity || '1',
      warehouseLocation: warehouseLocation.trim(),
      status,
      notes: notes.trim(),
    };

    onSaveTicket(newTicket);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="relative z-10 w-full max-w-3xl my-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                <FilePlus2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Tạo Phiếu Quản Lý Vật Tư</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                    {ticketCode}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tự động tách 6 trường từ mã QR (dấu <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">^^</span> hoặc <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">-</span>) & điền vị trí kho
                </p>
              </div>
            </div>

            <button
              id="btn-close-material-modal"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* SECTION 1: QR CODE INPUT & CAMERA SCANNER */}
            <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/90 dark:border-indigo-900/80 space-y-3">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="input-raw-material-qr"
                  className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5"
                >
                  <QrCode className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Mã QR Vật Tư (Mã VT ^^ Màu ^^ Size ^^ Length ^^ Lô SX ^^ Lệnh SX)</span>
                </label>

                {rawQr && (
                  <button
                    type="button"
                    onClick={handleClearQr}
                    className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Xóa mã</span>
                  </button>
                )}
              </div>

              {/* Input field + Camera Button */}
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <div className="relative flex-1">
                  <input
                    id="input-raw-material-qr"
                    type="text"
                    value={rawQr}
                    onChange={handleRawQrChange}
                    placeholder="Quét hoặc dán: Mã vật tư ^^ Màu ^^ Size ^^ Length ^^ Lô SX ^^ Lệnh SX (hoặc dấu -)"
                    className="w-full h-11 px-3.5 pr-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono transition-all"
                  />
                  {rawQr && (
                    <button
                      type="button"
                      onClick={handleClearQr}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Primary Camera Button */}
                <button
                  id="btn-scan-material-qr"
                  type="button"
                  onClick={onOpenMaterialScanner}
                  className="h-11 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all shrink-0 hover:scale-[1.02]"
                >
                  <Camera className="h-4 w-4" />
                  <span>Quét QR Vật Tư</span>
                </button>
              </div>

              {/* Status or Quick Sample Picker */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                {parseStatus.isValid ? (
                  <div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>
                      Đã tách thành công 6 trường ({parseStatus.delimiterUsed === '^^' ? 'Dấu ^^' : 'Dấu -'})
                    </span>
                  </div>
                ) : rawQr ? (
                  <div className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                    <Info className="h-3.5 w-3.5" />
                    <span>
                      Đã nhận {parseStatus.partsCount}/6 phần. Bạn có thể bổ sung các ô bên dưới.
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Hỗ trợ định dạng phân tách bằng <strong>^^</strong> hoặc dấu gạch nối <strong>-</strong>
                  </span>
                )}

                {/* Quick test sample pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Mẫu thử nhanh:
                  </span>
                  {SAMPLE_MATERIAL_QRS.slice(0, 2).map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyQrString(s.raw)}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                      title={s.description}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SECTION 2: 6 FIELDS EXTRACTED FROM QR */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  <span>6 Trường Dữ Liệu Tách Từ Mã QR</span>
                </h4>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tự động điền khi quét xong, có thể chỉnh sửa nếu cần
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {/* 1. Mã vật tư */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <label
                    htmlFor="field-material-code"
                    className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    <span className="flex items-center gap-1">
                      <Package className="h-3.5 w-3.5 text-indigo-500" />
                      1. Mã vật tư <span className="text-rose-500">*</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Mã VT</span>
                  </label>
                  <input
                    id="field-material-code"
                    type="text"
                    required
                    value={materialCode}
                    onChange={(e) => setMaterialCode(e.target.value)}
                    placeholder="Ví dụ: VT-COTTON-01"
                    className="w-full h-9 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                  />
                </div>

                {/* 2. Màu */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <label
                    htmlFor="field-color"
                    className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    <span className="flex items-center gap-1">
                      <Palette className="h-3.5 w-3.5 text-pink-500" />
                      2. Màu sắc
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Màu</span>
                  </label>
                  <input
                    id="field-color"
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="Ví dụ: Đỏ đô, Xanh navy..."
                    className="w-full h-9 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                {/* 3. Size */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <label
                    htmlFor="field-size"
                    className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    <span className="flex items-center gap-1">
                      <Maximize2 className="h-3.5 w-3.5 text-cyan-500" />
                      3. Kích cỡ (Size)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Size</span>
                  </label>
                  <input
                    id="field-size"
                    type="text"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="Ví dụ: L, XL, 1.4mm, 40/2..."
                    className="w-full h-9 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                {/* 4. Length */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <label
                    htmlFor="field-length"
                    className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    <span className="flex items-center gap-1">
                      <Ruler className="h-3.5 w-3.5 text-amber-500" />
                      4. Chiều dài (Length)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Length</span>
                  </label>
                  <input
                    id="field-length"
                    type="text"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    placeholder="Ví dụ: 120m, 50m, 5000m..."
                    className="w-full h-9 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                  />
                </div>

                {/* 5. Lô sản xuất */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <label
                    htmlFor="field-batch-number"
                    className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    <span className="flex items-center gap-1">
                      <Boxes className="h-3.5 w-3.5 text-emerald-500" />
                      5. Lô sản xuất
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Lô SX</span>
                  </label>
                  <input
                    id="field-batch-number"
                    type="text"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder="Ví dụ: LOT-2026-09"
                    className="w-full h-9 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                  />
                </div>

                {/* 6. Lệnh sản xuất */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <label
                    htmlFor="field-production-order"
                    className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    <span className="flex items-center gap-1">
                      <ClipboardList className="h-3.5 w-3.5 text-purple-500" />
                      6. Lệnh sản xuất
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Lệnh SX</span>
                  </label>
                  <input
                    id="field-production-order"
                    type="text"
                    value={productionOrder}
                    onChange={(e) => setProductionOrder(e.target.value)}
                    placeholder="Ví dụ: LSX-88992"
                    className="w-full h-9 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: 3 ADDITIONAL FIELDS (Đơn vị tính, Số lượng, Vị trí kho) */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>3 Trường Bổ Sung (Đơn vị tính, Số lượng, Vị trí kho)</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 7. Đơn vị tính */}
                <div>
                  <label
                    htmlFor="input-unit"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Đơn vị tính (ĐVT) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-unit"
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Cuộn, Mét, Kg, Cái..."
                    className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                  {/* Quick Unit Chips */}
                  <div className="flex items-center gap-1 flex-wrap mt-1.5">
                    {['Cuộn', 'Mét (m)', 'Cây', 'Kg', 'Cái', 'Tấm'].map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setUnit(u)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                          unit === u
                            ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 8. Số lượng */}
                <div>
                  <label
                    htmlFor="input-quantity"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Số lượng <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const cur = parseFloat(String(quantity)) || 1;
                        if (cur > 1) setQuantity(cur - 1);
                      }}
                      className="h-10 w-10 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      -
                    </button>
                    <input
                      id="input-quantity"
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="1"
                      className="flex-1 h-10 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold text-center text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const cur = parseFloat(String(quantity)) || 0;
                        setQuantity(cur + 1);
                      }}
                      className="h-10 w-10 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 9. Vị trí kho (ĐIỀN HOẶC QUÉT CAMERA) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="input-warehouse-location"
                      className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1"
                    >
                      <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Vị trí kho</span>
                    </label>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                      Quét hoặc điền chuỗi
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      id="input-warehouse-location"
                      type="text"
                      value={warehouseLocation}
                      onChange={(e) => setWarehouseLocation(e.target.value)}
                      placeholder="Ví dụ: KHO-A1-KE02-O04"
                      className="flex-1 h-10 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                    />

                    {/* Quét camera vị trí kho */}
                    <button
                      id="btn-scan-location-qr"
                      type="button"
                      onClick={onOpenLocationScanner}
                      title="Bấm để mở camera quét mã vị trí kho"
                      className="h-10 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-xs transition-colors"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Quét vị trí</span>
                    </button>
                  </div>

                  {/* Sample warehouse location suggestions */}
                  <div className="flex items-center gap-1 flex-wrap mt-1.5">
                    {SAMPLE_WAREHOUSE_LOCATIONS.slice(0, 2).map((loc, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setWarehouseLocation(loc.code)}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-emerald-400"
                        title={loc.desc}
                      >
                        {loc.code}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Ghi chú */}
            <div>
              <label
                htmlFor="input-material-notes"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Ghi chú thêm (Tùy chọn)
              </label>
              <textarea
                id="input-material-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú về tình trạng cuộn vải/vật tư, hạn sử dụng, lưu ý khi xuất xưởng..."
                className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Modal Actions Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Phiếu gồm 6 trường QR + 3 trường bổ sung (ĐVT, SL, Vị trí)
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn-cancel-create-material-ticket"
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Hủy bỏ
                </button>

                <button
                  id="btn-save-material-ticket"
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
                >
                  <Save className="h-4 w-4" />
                  <span>Lưu Phiếu Vật Tư</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
