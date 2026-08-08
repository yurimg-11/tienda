import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sale } from '../../types';
import { TicketModal } from './TicketModal';
import { EmailTicketModal } from './EmailTicketModal';
import {
  Receipt,
  Search,
  Printer,
  Mail,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

export const TicketsHistoryView: React.FC = () => {
  const {
    sales,
    settings,
    cancelSale,
  } = useApp();

  const [ticketSearch, setTicketSearch] = useState('');

  const [selectedSaleForPrint, setSelectedSaleForPrint] =
    useState<Sale | null>(null);

  const [selectedSaleForEmail, setSelectedSaleForEmail] =
    useState<Sale | null>(null);

  const [saleToCancel, setSaleToCancel] =
    useState<Sale | null>(null);

  const [cancellationReason, setCancellationReason] =
    useState('');

  const [isCancelling, setIsCancelling] =
    useState(false);

  const formatCurrency = (val: number) =>
    `${settings.currencySymbol}${val.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  /*
   * BUSCAR TICKETS
   */
  const filteredSales = sales.filter(s => {
    const q = ticketSearch.toLowerCase().trim();

    if (!q) return true;

    return (
      s.ticketNumber.toLowerCase().includes(q) ||
      s.items.some(i =>
        i.productName.toLowerCase().includes(q)
      ) ||
      s.paymentMethod.toLowerCase().includes(q) ||
      (s.customerEmail &&
        s.customerEmail.toLowerCase().includes(q))
    );
  });

  /*
   * ABRIR CONFIRMACIÓN DE CANCELACIÓN
   */
  const openCancelModal = (sale: Sale) => {
    setSaleToCancel(sale);
    setCancellationReason('');
  };

  /*
   * CERRAR CONFIRMACIÓN
   */
  const closeCancelModal = () => {
    if (isCancelling) return;

    setSaleToCancel(null);
    setCancellationReason('');
  };

  /*
   * CANCELAR / ANULAR TICKET
   */
  const handleCancelSale = async () => {
    if (!saleToCancel) return;

    setIsCancelling(true);

    try {
      const reason =
        cancellationReason.trim() ||
        'Venta cancelada desde historial de tickets';

      const success = await cancelSale(
        saleToCancel.id,
        reason
      );

      if (!success) {
        alert(
          'No se pudo cancelar el ticket. Revisa la consola para más detalles.'
        );
        return;
      }

      setSaleToCancel(null);
      setCancellationReason('');

      alert(
        `El ticket ${saleToCancel.ticketNumber} fue cancelado correctamente y el inventario fue devuelto.`
      );
    } catch (error) {
      console.error(
        'Error cancelando ticket:',
        error
      );

      alert(
        'Ocurrió un error al cancelar el ticket.'
      );
    } finally {
      setIsCancelling(false);
    }
  };

  /*
   * Para evitar problemas si todavía no agregaste
   * los campos cancelled al tipo Sale.
   */
  const isSaleCancelled = (sale: Sale) =>
    Boolean(
      (sale as Sale & {
        cancelled?: boolean;
      }).cancelled
    );

  const getCancellationReason = (sale: Sale) =>
    (sale as Sale & {
      cancellationReason?: string;
    }).cancellationReason || 'Venta cancelada';

  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">

        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-teal-600" />

            <span>
              Historial de Tickets Emitidos ({sales.length})
            </span>
          </h2>

          <p className="text-xs text-slate-500">
            Consulta, re-imprime, re-envía o cancela tickets de venta.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />

          <input
            type="text"
            value={ticketSearch}
            onChange={e =>
              setTicketSearch(e.target.value)
            }
            placeholder="Buscar por #Ticket, producto o correo..."
            className="w-full bg-slate-50 text-slate-800 text-xs rounded-xl pl-9 pr-3 py-2 border border-slate-300 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full text-left text-xs text-slate-700">

            <thead className="bg-slate-900 text-slate-200 uppercase text-[10px] tracking-wider font-bold">

              <tr>
                <th className="py-3 px-4">
                  # Ticket
                </th>

                <th className="py-3 px-3">
                  Fecha y Hora
                </th>

                <th className="py-3 px-3">
                  Productos Vendidos
                </th>

                <th className="py-3 px-3">
                  Método
                </th>

                <th className="py-3 px-3 text-right">
                  Monto Total
                </th>

                <th className="py-3 px-3 text-right">
                  Ganancia Neta
                </th>

                <th className="py-3 px-4 text-center">
                  Acciones
                </th>
              </tr>

            </thead>

            <tbody className="divide-y divide-slate-100">

              {filteredSales.length === 0 ? (

                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-slate-400"
                  >
                    No se encontraron tickets en el historial.
                  </td>
                </tr>

              ) : (

                filteredSales.map(s => {

                  const cancelled =
                    isSaleCancelled(s);

                  return (
                    <tr
                      key={s.id}
                      className={`transition-colors ${
                        cancelled
                          ? 'bg-rose-50/60'
                          : 'hover:bg-slate-50'
                      }`}
                    >

                      {/* TICKET */}
                      <td className="py-3 px-4">

                        <div className="flex flex-col gap-1">

                          <span
                            className={`font-bold font-mono ${
                              cancelled
                                ? 'text-rose-700 line-through'
                                : 'text-slate-900'
                            }`}
                          >
                            {s.ticketNumber}
                          </span>

                          {cancelled && (
                            <span className="inline-flex w-fit items-center gap-1 bg-rose-100 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">
                              <XCircle className="w-3 h-3" />
                              CANCELADO
                            </span>
                          )}

                        </div>

                      </td>

                      {/* FECHA */}
                      <td className="py-3 px-3 text-slate-500 text-[11px]">

                        {new Date(
                          s.date
                        ).toLocaleDateString(
                          'es-MX'
                        )}

                        {' '}

                        {new Date(
                          s.date
                        ).toLocaleTimeString(
                          'es-MX',
                          {
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}

                      </td>

                      {/* PRODUCTOS */}
                      <td className="py-3 px-3 max-w-xs">

                        <div
                          className={`truncate font-medium ${
                            cancelled
                              ? 'text-rose-700'
                              : 'text-slate-800'
                          }`}
                          title={s.items
                            .map(
                              i =>
                                `${i.quantity}x ${i.productName}`
                            )
                            .join(', ')}
                        >
                          {s.items
                            .map(
                              i =>
                                `${i.quantity}x ${i.productName}`
                            )
                            .join(', ')}
                        </div>

                        {cancelled && (
                          <div className="mt-1 text-[10px] text-rose-600 font-semibold">
                            {getCancellationReason(s)}
                          </div>
                        )}

                      </td>

                      {/* MÉTODO */}
                      <td className="py-3 px-3">

                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                            cancelled
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {s.paymentMethod}
                        </span>

                      </td>

                      {/* TOTAL */}
                      <td
                        className={`py-3 px-3 text-right font-black ${
                          cancelled
                            ? 'text-rose-600 line-through'
                            : 'text-slate-900'
                        }`}
                      >
                        {formatCurrency(s.total)}
                      </td>

                      {/* GANANCIA */}
                      <td
                        className={`py-3 px-3 text-right font-bold ${
                          cancelled
                            ? 'text-rose-600 line-through'
                            : 'text-emerald-700'
                        }`}
                      >
                        {formatCurrency(s.profitTotal)}
                      </td>

                      {/* ACCIONES */}
                      <td className="py-3 px-4 text-center">

                        <div className="flex items-center justify-center gap-1.5 flex-wrap">

                          {/* TICKET */}
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedSaleForPrint(s)
                            }
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1 font-bold text-[11px]"
                            title="Ver / Imprimir Ticket"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Ticket</span>
                          </button>

                          {/* CORREO */}
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedSaleForEmail(s)
                            }
                            className="p-1.5 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors flex items-center gap-1 font-bold text-[11px]"
                            title="Enviar por Correo"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>Correo</span>
                          </button>

                          {/* CANCELAR */}
                          {!cancelled && (
                            <button
                              type="button"
                              onClick={() =>
                                openCancelModal(s)
                              }
                              className="p-1.5 text-rose-600 hover:text-white hover:bg-rose-600 rounded-lg transition-colors flex items-center gap-1 font-bold text-[11px]"
                              title="Cancelar / Anular Venta"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Cancelar</span>
                            </button>
                          )}

                        </div>

                      </td>

                    </tr>
                  );
                })
              )}

            </tbody>

          </table>

        </div>
      </div>

      {/* MODAL VER / IMPRIMIR */}
      {selectedSaleForPrint && (
        <TicketModal
          sale={selectedSaleForPrint}
          onClose={() =>
            setSelectedSaleForPrint(null)
          }
        />
      )}

      {/* MODAL CORREO */}
      {selectedSaleForEmail && (
        <EmailTicketModal
          sale={selectedSaleForEmail}
          onClose={() =>
            setSelectedSaleForEmail(null)
          }
        />
      )}

      {/* MODAL CANCELAR */}
      {saleToCancel && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">

            {/* HEADER */}
            <div className="flex items-start gap-3 mb-5">

              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="flex-1">

                <h3 className="text-lg font-black text-slate-900">
                  Cancelar venta
                </h3>

                <p className="text-xs text-slate-500 mt-1">
                  Esta acción devolverá los productos al inventario.
                </p>

              </div>

              <button
                type="button"
                onClick={closeCancelModal}
                disabled={isCancelling}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>

            </div>

            {/* INFORMACIÓN DEL TICKET */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4">

              <div className="flex justify-between items-center">

                <span className="text-xs text-slate-500">
                  Ticket
                </span>

                <span className="font-black font-mono text-slate-900">
                  {saleToCancel.ticketNumber}
                </span>

              </div>

              <div className="flex justify-between items-center mt-2">

                <span className="text-xs text-slate-500">
                  Total
                </span>

                <span className="font-black text-rose-600">
                  {formatCurrency(
                    saleToCancel.total
                  )}
                </span>

              </div>

              <div className="mt-3 pt-3 border-t border-slate-200">

                <p className="text-[11px] text-slate-500 mb-1">
                  Productos:
                </p>

                <div className="space-y-1">

                  {saleToCancel.items.map(
                    (item, index) => (
                      <div
                        key={`${item.productId}-${index}`}
                        className="flex justify-between text-xs"
                      >
                        <span className="text-slate-700">
                          {item.quantity}{' '}
                          {item.unit} ×{' '}
                          {item.productName}
                        </span>

                        <span className="font-bold text-slate-800">
                          {formatCurrency(
                            item.total
                          )}
                        </span>
                      </div>
                    )
                  )}

                </div>

              </div>

            </div>

            {/* MOTIVO */}
            <div className="space-y-2 mb-5">

              <label className="block text-xs font-bold text-slate-700">
                Motivo de cancelación
              </label>

              <textarea
                value={cancellationReason}
                onChange={e =>
                  setCancellationReason(
                    e.target.value
                  )
                }
                placeholder="Ej: Ticket capturado por error, cliente canceló la compra..."
                rows={3}
                disabled={isCancelling}
                className="w-full resize-none text-xs text-slate-800 border border-slate-300 rounded-xl py-2.5 px-3 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 disabled:bg-slate-100"
              />

            </div>

            {/* AVISO */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5">

              <p className="text-[11px] text-amber-800 font-semibold">
                ⚠️ Al confirmar, la venta quedará marcada como
                <strong> CANCELADA</strong> y las cantidades
                vendidas se devolverán al inventario.
              </p>

            </div>

            {/* BOTONES */}
            <div className="flex gap-2">

              <button
                type="button"
                onClick={closeCancelModal}
                disabled={isCancelling}
                className="flex-1 py-3 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl disabled:opacity-50"
              >
                No, regresar
              </button>

              <button
                type="button"
                onClick={handleCancelSale}
                disabled={isCancelling}
                className="flex-1 py-3 text-xs font-black bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >

                {isCancelling ? (
                  <>
                    <span className="animate-spin">
                      ⟳
                    </span>

                    Cancelando...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Sí, cancelar venta
                  </>
                )}

              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

