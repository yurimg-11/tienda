import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Settings, Store, Download, Upload, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    exportBackup,
    importBackup,
    resetDemoData,
    lastSyncedAt,
    cloudSyncStatus
  } = useApp();

  const [storeName, setStoreName] = useState<string>(settings.storeName);
  const [tagline, setTagline] = useState<string>(settings.tagline);
  const [address, setAddress] = useState<string>(settings.address);
  const [phone, setPhone] = useState<string>(settings.phone);
  const [email, setEmail] = useState<string>(settings.email);
  const [taxId, setTaxId] = useState<string>(settings.taxId);
  const [currencySymbol, setCurrencySymbol] = useState<string>(settings.currencySymbol);
  const [ticketFooter, setTicketFooter] = useState<string>(settings.ticketFooter);
  const [adminPin, setAdminPin] = useState<string>(settings.adminPin || '1234');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      storeName,
      tagline,
      address,
      phone,
      email,
      taxId,
      currencySymbol,
      ticketFooter,
      adminPin: adminPin.trim() || '1234',
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        const success = importBackup(content);
        if (success) {
          alert('¡Base de datos e inventario importados con éxito!');
        } else {
          alert('Error al importar archivo de respaldo. Asegúrate de que sea un JSON válido.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-700" />
            <span>Configuración de la Tienda y Nube</span>
          </h2>
          <p className="text-xs text-slate-500">Personaliza tickets, datos fiscales, moneda y respaldos</p>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">Datos del Negocio y Ticket</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de la Tienda</label>
            <input
              type="text"
              required
              value={storeName}
              onChange={e => setStoreName(e.target.value)}
              className="w-full text-xs text-slate-900 font-bold border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Lema / Eslogan</label>
            <input
              type="text"
              value={tagline}
              onChange={e => setTagline(e.target.value)}
              className="w-full text-xs text-slate-900 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Dirección Física</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full text-xs text-slate-900 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono de Contacto</label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full text-xs text-slate-900 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">RFC / Registro Fiscal (Tax ID)</label>
            <input
              type="text"
              value={taxId}
              onChange={e => setTaxId(e.target.value)}
              className="w-full text-xs text-slate-900 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Símbolo de Moneda</label>
            <input
              type="text"
              value={currencySymbol}
              onChange={e => setCurrencySymbol(e.target.value)}
              className="w-full text-xs font-bold text-slate-900 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Pie de Página del Ticket</label>
          <input
            type="text"
            value={ticketFooter}
            onChange={e => setTicketFooter(e.target.value)}
            className="w-full text-xs text-slate-900 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* ADMIN SECURITY SECTION */}
        <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 space-y-2 mt-4">
          <div className="flex items-center gap-2 text-amber-950 font-black text-xs">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Seguridad y Contraseña de Administrador</span>
          </div>
          <p className="text-[11px] text-amber-900 leading-snug">
            Esta contraseña o PIN protege el acceso a los módulos administrativos (reportes de ganancias, configuración, precios de compra y reinicio de datos) impidiendo accesos no autorizados por parte del personal o cajeros.
          </p>
          <div className="pt-1">
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Contraseña / PIN de Administrador
            </label>
            <input
              type="text"
              required
              value={adminPin}
              onChange={e => setAdminPin(e.target.value)}
              placeholder="Ej: 1234 o mi_clave_secreta"
              className="w-full sm:w-64 text-xs font-bold text-slate-900 bg-white border border-amber-300 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-600 shadow-2xs"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          {savedSuccess && (
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Configuración guardada con éxito
            </span>
          )}
          <button
            type="submit"
            className="ml-auto py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
          >
            Guardar Configuración
          </button>
        </div>
      </form>

      {/* Cloud Sync & Backup Operations */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>Sincronización Cloud y Respaldos</span>
        </h3>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div>
            <div className="text-xs font-bold text-slate-900">Estado de Sincronización en la Nube</div>
            <p className="text-xs text-slate-500">Última actualización sincronizada: {lastSyncedAt}</p>
          </div>

          <button
            onClick={exportBackup}
            className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Descargar Respaldo JSON</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <label className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer border border-slate-300">
            <Upload className="w-4 h-4 text-slate-600" />
            <span>Restaurar desde Respaldo JSON</span>
            <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
          </label>

          <button
            onClick={() => {
              if (confirm('¿Restablecer datos de muestra? Todos los cambios no guardados se reemplazarán.')) {
                resetDemoData();
              }
            }}
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-slate-300"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span>Cargar Datos Demo</span>
          </button>
        </div>
      </div>

    </div>
  );
};
