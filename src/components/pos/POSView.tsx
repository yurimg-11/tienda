import React, { useEffect } from 'react';
import { Sale } from '../../types';
import { Printer, X, CheckCircle2 } from 'lucide-react';

interface TicketModalProps {
  sale: Sale | null;
  onClose: () => void;
  autoPrint?: boolean;
}

export const TicketModal: React.FC<TicketModalProps> = ({ sale, onClose, autoPrint = false }) => {
  if (!sale) return null;

  // Función directa y limpia para disparar la impresión
  const handlePrint = () => {
    // Dar un breve margen para que el navegador procese el renderizado
    setTimeout(() => {
      window.print();
    }, 100);
  };

  useEffect(() => {
    if (autoPrint) {
      handlePrint();
    }
  }, [autoPrint]);

  const createdAt = (sale as any).createdAt ?? (sale as any).date ?? Date.now();
  const cashRendered = sale.total + (sale.changeAmount ?? 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      {/* Estilos CSS específicos para mandar a imprimir SOLO el ticket en térmicas */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-ticket, #printable-ticket * {
            visibility: visible;
          }
          #printable-ticket {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 80mm; /* Ancho estándar de impresora térmica */
            margin: 0;
            padding: 10px;
            font-family: monospace;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-100 my-auto no-print-bg">
        
        {/* Cabecera modal (Se oculta al imprimir) */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 no-print">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>¡Venta Completada!</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENIDO DEL TICKET (Lo que realmente imprime la impresora térmica) */}
        <div id="printable-ticket" className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs font-mono space-y-2 text-slate-800">
          <div className="text-center border-b border-dashed border-slate-300 pb-2">
            <h2 className="font-black text-sm uppercase">Pollería & Carnicería</h2>
            <p className="text-[10px] text-slate-500">Ticket de Venta #{sale.id.slice(-6)}</p>
            <p className="text-[10px] text-slate-500">{new Date(createdAt).toLocaleString('es-MX')}</p>
          </div>

          <div className="space-y-1 py-1 border-b border-dashed border-slate-300">
            {sale.items.map((item, index) => (
              <div key={index} className="flex justify-between items-start">
                <div className="flex-1 pr-2">
                  <p className="font-bold truncate">{item.productName}</p>
                  <p className="text-[10px] text-slate-500">
                    {item.quantity} {item.unit} x ${(item.quantity > 0 ? item.total / item.quantity : 0).toFixed(2)}
                  </p>
                </div>
                <span className="font-bold">${item.total.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-1 text-right pt-1">
            <div className="flex justify-between font-black text-sm text-slate-900">
              <span>TOTAL:</span>
              <span>${sale.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>Pago ({sale.paymentMethod}):</span>
              <span>${sale.cashRendered.toFixed(2)}</span>
            </div>
            {sale.changeAmount > 0 && (
              <div className="flex justify-between text-[11px] text-slate-600">
                <span>Cambio:</span>
                <span>${sale.changeAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="text-center pt-2 border-t border-dashed border-slate-300 text-[10px] text-slate-500">
            <p>¡Gracias por su compra!</p>
          </div>
        </div>

        {/* Botones de Acción Modal (Ocultos al imprimir) */}
        <div className="flex gap-2 pt-2 border-t border-slate-100 no-print">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-2 py-2.5 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>IMPRIMIR TICKET</span>
          </button>
        </div>

      </div>
    </div>
  );
};