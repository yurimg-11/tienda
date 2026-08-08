import React from 'react';
import { Sale } from '../../types';
import { useApp } from '../../context/AppContext';
import { Printer, Share2, Mail, Download, CheckCircle2 } from 'lucide-react';

interface TicketModalProps {
  sale: Sale;
  onClose: () => void;
  autoPrint?: boolean;
}

export const TicketModal: React.FC<TicketModalProps> = ({ sale, onClose }) => {
  const { settings } = useApp() as any;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const textLines = [
      ` *${settings?.storeName || 'Tienda'}*`,
      `Ticket: ${sale?.ticketNumber || 'N/A'}`,
      `Fecha: ${sale?.date ? new Date(sale.date).toLocaleString('es-MX') : ''}`,
      `--------------------------------`,
      ...(sale?.items || []).map(i => `${i?.quantity || 0}x ${i?.productName || 'Producto'} - $${(i?.total || 0).toFixed(2)}`),
      `--------------------------------`,
      `*TOTAL: $${(sale?.total || 0).toFixed(2)}*`,
      `Método: ${(sale?.paymentMethod || 'efectivo').toUpperCase()}`,
      `¡Gracias por su compra!`
    ];

    const encodedText = encodeURIComponent(textLines.join('\n'));
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const formatCurrency = (val: number) =>
    `${settings?.currencySymbol || '$'}${val.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-100 my-auto print:p-0 print:shadow-none print:border-none print:w-full">
        
        {/* Printable Ticket Receipt Container */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 font-mono text-xs text-slate-800 space-y-3 print:bg-white print:p-0 print:text-black">
          
          {/* Header */}
          <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-3">
            <h2 className="font-black text-sm uppercase tracking-wider">{settings?.storeName}</h2>
            <p className="text-[11px] text-slate-500">{settings?.tagline}</p>
            <p className="text-[10px] text-slate-500">{settings?.address}</p>
            <p className="text-[10px] text-slate-500">Tel: {settings?.phone} | Tax ID: {settings?.taxId}</p>
          </div>

          {/* Ticket Metadata */}
          <div className="space-y-1 border-b border-dashed border-slate-300 pb-2 text-[11px]">
            <div className="flex justify-between">
              <div>
                <span className="font-bold">Ticket:</span> {sale?.ticketNumber}
              </div>
              <div>
                {sale?.date && `${new Date(sale.date).toLocaleDateString('es-MX')} ${new Date(sale.date).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`}
              </div>
            </div>
            {sale?.cashierName && (
              <div className="text-[10px] text-slate-600">
                <span className="font-bold">Le atendió:</span> {sale.cashierName}
              </div>
            )}
          </div>

          {/* Itemized Table */}
          <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3">
            <div className="flex justify-between font-bold text-[10px] text-slate-500 uppercase">
              <span>Cant. Producto</span>
              <span>Total</span>
            </div>
            {(sale?.items || []).map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-[11px]">
                <div className="pr-2">
                  <span className="font-bold">{item?.quantity || 0} {item?.unit || 'pieza'}</span> × {item?.productName || 'Producto'}
                  <span className="block text-[9px] text-slate-400">@{formatCurrency(item?.sellingPrice || 0)}</span>
                </div>
                <div className="font-bold">{formatCurrency(item?.total || 0)}</div>
              </div>
            ))}
          </div>

          {/* Totals & Payment */}
          <div className="space-y-1 text-right text-xs">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(sale?.subtotal || 0)}</span>
            </div>
            {(sale?.discountTotal || 0) > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Descuento:</span>
                <span>-{formatCurrency(sale.discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-300">
              <span>TOTAL:</span>
              <span>{formatCurrency(sale?.total || 0)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-600 pt-1">
              <span>Pago ({(sale?.paymentMethod || 'efectivo').toUpperCase()}):</span>
              <span>{formatCurrency(sale?.amountPaid || 0)}</span>
            </div>
            {(sale?.changeGiven || 0) > 0 && (
              <div className="flex justify-between text-[11px] font-bold text-slate-800">
                <span>Cambio:</span>
                <span>{formatCurrency(sale.changeGiven)}</span>
              </div>
            )}
          </div>

          {/* Footer Barcode */}
          <div className="text-center pt-2 space-y-1 border-t border-dashed border-slate-300">
            <div className="font-mono text-[10px] tracking-widest text-slate-500">
              ||| | |||| || ||| |||| | ||
            </div>
            <p className="text-[10px] italic text-slate-600">{settings?.ticketFooter}</p>
          </div>

        </div>

        {/* Action buttons (Hidden during print) */}
        <div className="space-y-2 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>IMPRIMIR TICKET</span>
          </button>

          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>Enviar por WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};