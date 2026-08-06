import React, { useState } from 'react';
import { Sale } from '../../types';
import { Mail, CheckCircle2, Send, Loader2 } from 'lucide-react';

interface EmailTicketModalProps {
  sale: Sale;
  defaultEmail?: string;
  onClose: () => void;
}

export const EmailTicketModal: React.FC<EmailTicketModalProps> = ({
  sale,
  defaultEmail = '',
  onClose
}) => {
  const [email, setEmail] = useState<string>(defaultEmail);
  const [customerName, setCustomerName] = useState<string>(sale.customerName || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [sentSuccess, setSentSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/send-ticket-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          customerName,
          ticket: sale
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSentSuccess(true);
      } else {
        setErrorMessage(data.error || 'No se pudo enviar el correo.');
      }
    } catch (err: any) {
      setErrorMessage('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-sky-600 font-bold">
            <Mail className="w-5 h-5" />
            <h3 className="text-base font-black text-slate-900">Enviar Ticket Digital por Correo</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>

        {sentSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="font-black text-slate-900 text-base">¡Ticket Enviado con Éxito!</h4>
            <p className="text-xs text-slate-500">
              Se ha enviado el comprobante del ticket <span className="font-bold">{sale.ticketNumber}</span> al correo <span className="font-bold text-slate-800">{email}</span>.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Aceptar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendEmail} className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
              <div className="font-bold text-slate-900">Resumen del Ticket #{sale.ticketNumber}:</div>
              <div>Monto Total: <span className="font-bold text-emerald-700">${sale.total.toFixed(2)}</span> ({sale.items.length} productos)</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Cliente (Opcional)</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Ej: María López"
                className="w-full text-xs text-slate-900 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico del Cliente *</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="cliente@ejemplo.com"
                className="w-full text-xs text-slate-900 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500 font-semibold"
              />
            </div>

            {errorMessage && (
              <p className="text-xs text-red-600 font-semibold bg-red-50 p-2 rounded-lg">{errorMessage}</p>
            )}

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{loading ? 'Enviando...' : 'Enviar Ticket'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
