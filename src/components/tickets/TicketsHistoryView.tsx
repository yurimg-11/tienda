import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sale } from '../../types';
import { TicketModal } from './TicketModal';
import { EmailTicketModal } from './EmailTicketModal';
import { Receipt, Search, Printer, Mail, Calendar, DollarSign, Eye } from 'lucide-react';

export const TicketsHistoryView: React.FC = () => {
  const { sales, settings } = useApp();
  const [ticketSearch, setTicketSearch] = useState<string>('');
  const [selectedSaleForPrint, setSelectedSaleForPrint] = useState<Sale | null>(null);
  const [selectedSaleForEmail, setSelectedSaleForEmail] = useState<Sale | null>(null);

  const filteredSales = sales.filter(s => {
    const q = ticketSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      s.ticketNumber.toLowerCase().includes(q) ||
      s.items.some(i => i.productName.toLowerCase().includes(q)) ||
      s.paymentMethod.toLowerCase().includes(q) ||
      (s.customerEmail && s.customerEmail.toLowerCase().includes(q))
    );
  });

  const formatCurrency = (val: number) =>
    `${settings.currencySymbol}${val.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="p-3 sm:p-6 space-y-4 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-teal-600" />
            <span>Historial de Tickets Emitidos ({sales.length})</span>
          </h2>
          <p className="text-xs text-slate-500">
            Consulta comprobantes de venta pasados, re-imprime tickets o re-envía recibos digitales
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={ticketSearch}
            onChange={e => setTicketSearch(e.target.value)}
            placeholder="Buscar por #Ticket, producto o correo..."
            className="w-full bg-slate-50 text-slate-800 text-xs rounded-xl pl-9 pr-3 py-2 border border-slate-300 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Tickets List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-900 text-slate-200 uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="py-3 px-4"># Ticket</th>
                <th className="py-3 px-3">Fecha y Hora</th>
                <th className="py-3 px-3">Productos Vendidos</th>
                <th className="py-3 px-3">Método</th>
                <th className="py-3 px-3 text-right">Monto Total</th>
                <th className="py-3 px-3 text-right">Ganancia Neta</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No se encontraron tickets en el historial.
                  </td>
                </tr>
              ) : (
                filteredSales.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold font-mono text-slate-900">{s.ticketNumber}</td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      {new Date(s.date).toLocaleDateString('es-MX')} {new Date(s.date).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3 max-w-xs truncate font-medium text-slate-800">
                      {s.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                    </td>
                    <td className="py-3 px-3">
                      <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                        {s.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-black text-slate-900">
                      {formatCurrency(s.total)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-700">
                      {formatCurrency(s.profitTotal)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedSaleForPrint(s)}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1 font-bold text-[11px]"
                          title="Ver / Imprimir Ticket"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Ticket</span>
                        </button>
                        <button
                          onClick={() => setSelectedSaleForEmail(s)}
                          className="p-1.5 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors flex items-center gap-1 font-bold text-[11px]"
                          title="Enviar por Correo"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Correo</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSaleForPrint && (
        <TicketModal sale={selectedSaleForPrint} onClose={() => setSelectedSaleForPrint(null)} />
      )}

      {selectedSaleForEmail && (
        <EmailTicketModal sale={selectedSaleForEmail} onClose={() => setSelectedSaleForEmail(null)} />
      )}
    </div>
  );
};
