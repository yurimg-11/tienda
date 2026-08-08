import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Product } from '../../types';
import { Camera, X, AlertCircle, Barcode } from 'lucide-react';

interface CameraScannerModalProps {
  products: Product[];
  onProductScanned: (product: Product) => void;
  onClose: () => void;
  onUnknownBarcode?: (barcode: string) => void;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  products,
  onProductScanned,
  onClose,
  onUnknownBarcode
}) => {
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [cameraError, setCameraError] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const isStoppingRef = useRef<boolean>(false);

  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.warn('Audio feedback error', e);
    }
  };

  const safeStopScanner = async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;

    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.warn("Aviso al detener el escáner:", err);
      } finally {
        scannerRef.current = null;
        isStoppingRef.current = false;
      }
    }
  };

  const handleClose = () => {
    onClose();
    safeStopScanner();
  };

  const processBarcode = (code: string) => {
    const now = Date.now();
    if (code === lastScannedCode && now - lastScanTimeRef.current < 1500) {
      return;
    }

    lastScanTimeRef.current = now;
    setLastScannedCode(code);
    playBeep();

    const matched = products.find(p => p.barcode === code.trim());
    if (matched) {
      if (matched.stock <= 0) {
        setScanMessage({ type: 'error', text: `⚠️ "${matched.name}" está AGOTADO.` });
      } else {
        onProductScanned(matched);
        setScanMessage({ type: 'success', text: `✓ Agregado: ${matched.name}` });
      }
    } else {
      if (onUnknownBarcode) onUnknownBarcode(code);
      setScanMessage({ type: 'info', text: `Código detectado: ${code}` });
    }

    setTimeout(() => { setScanMessage(null); }, 3000);
  };

  useEffect(() => {
    let isMounted = true;

    const startScanner = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (!isMounted) return;

      try {
        setCameraError('');
        const container = document.getElementById('camera-reader-element');
        if (!container) return;

        const html5Qrcode = new Html5Qrcode('camera-reader-element');
        scannerRef.current = html5Qrcode;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.333,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
        };

        await html5Qrcode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => { if (isMounted) processBarcode(decodedText); },
          () => {}
        );
      } catch (err: unknown) {
        if (!isMounted) return;
        console.error('Camera scanner init error:', err);
        setCameraError('No se pudo acceder a la cámara. Revisa los permisos o usa los botones rápidos.');
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      safeStopScanner();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 relative flex flex-col max-h-[92vh]">
        
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Camera className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                Escáner de Código de Barras
                <span className="text-[10px] bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full font-extrabold uppercase">Cámara En Vivo</span>
              </h3>
              <p className="text-[11px] text-slate-400">Apunta la cámara al código del producto</p>
            </div>
          </div>
          <button type="button" onClick={handleClose} className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {scanMessage && (
          <div className={`p-3 text-xs font-bold text-center text-white ${scanMessage.type === 'success' ? 'bg-emerald-600' : scanMessage.type === 'error' ? 'bg-rose-600' : 'bg-sky-600'}`}>
            {scanMessage.text}
          </div>
        )}

        <div className="relative bg-slate-950 flex-1 flex flex-col items-center justify-center min-h-[260px]">
          {cameraError ? (
            <div className="p-6 text-center text-slate-300 space-y-3 max-w-sm">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
              <p className="text-xs font-semibold leading-relaxed">{cameraError}</p>
            </div>
          ) : (
            <div className="w-full relative flex items-center justify-center overflow-hidden min-h-[240px]">
              <div id="camera-reader-element" className="w-full max-w-md rounded-xl overflow-hidden [&_video]:rounded-2xl"></div>
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-36 border-2 border-emerald-400/80 rounded-2xl relative flex items-center justify-center">
                  <div className="w-full h-0.5 bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse"></div>
                  <span className="absolute bottom-2 text-[10px] font-bold text-emerald-300 bg-slate-900/80 px-2 py-0.5 rounded-md">
                    Alinear código aquí
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1">
              <Barcode className="w-4 h-4 text-emerald-600" />
              Selección rápida de prueba:
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-32 overflow-y-auto pr-1">
            {products.slice(0, 6).map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => processBarcode(p.barcode)}
                className="p-2 text-left bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all cursor-pointer shadow-2xs group"
              >
                <div className="font-bold text-[11px] text-slate-900 truncate group-hover:text-emerald-700">{p.name}</div>
                <div className="text-[10px] font-mono text-slate-500 flex justify-between">
                  <span>{p.barcode}</span>
                  <span className="font-bold text-emerald-600">${p.sellingPrice.toFixed(2)}</span>
                </div>
              </button>
            ))}
          </div>
          <button type="button" onClick={handleClose} className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer mt-2">
            Cerrar Cámara
          </button>
        </div>

      </div>
    </div>
  );
};