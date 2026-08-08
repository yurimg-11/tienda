import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { POSView } from './components/pos/POSView';
import { InventoryView } from './components/inventory/InventoryView';
import { AlertsView } from './components/alerts/AlertsView';
import { ReportsView } from './components/reports/ReportsView';
import { TicketsHistoryView } from './components/tickets/TicketsHistoryView';
import { AIModal } from './components/ai/AIModal';
import { SettingsView } from './components/settings/SettingsView';

const AdminLockGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUserRole, switchUserRole, settings } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (currentUserRole === 'admin') {
    return <>{children}</>;
  }

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === (settings.adminPin || '1234')) {
      switchUserRole('admin', 'Administrador Principal');
    } else {
      setError(' Contraseña/PIN de Administrador incorrecto. Acceso denegado.');
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto my-12 bg-white rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
      <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto font-bold text-2xl">
        
      </div>
      <h3 className="text-lg font-black text-slate-900">Módulo Protegido para Administrador</h3>
      <p className="text-xs text-slate-600 leading-relaxed">
        Esta sección contiene información confidencial (reportes de ganancias, costos y configuración del negocio). Ingresa la contraseña de Administrador para acceder.
      </p>
      <form onSubmit={handleUnlock} className="space-y-3 pt-2">
        <input
          type="password"
          required
          value={pin}
          onChange={e => setPin(e.target.value)}
          placeholder="Ingresa la Contraseña / PIN de Admin"
          className="w-full text-center text-sm font-bold border-2 border-amber-400 rounded-xl py-2.5 focus:outline-none focus:border-amber-600 bg-amber-50/20 text-slate-900"
        />
        {error && <p className="text-xs font-bold text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">{error}</p>}
        <button
          type="submit"
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
        >
          Desbloquear Acceso como Administrador
        </button>
      </form>
    </div>
  );
};

const MainContent: React.FC = () => {
  const { activeTab } = useApp();
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top sticky app bar */}
      <Header onOpenMobileNav={() => setMobileNavOpen(true)} />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Mobile Navigation Drawer Overlay */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 md:hidden bg-slate-900/60 backdrop-blur-xs flex">
            <div className="w-72 bg-white h-full shadow-2xl overflow-y-auto overscroll-contain">
              <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
                <span className="font-bold text-xs uppercase tracking-wider">Menú Principal</span>
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="text-slate-400 hover:text-white text-lg font-bold p-1"
                >
                  ✕
                </button>
              </div>
              <Sidebar onCloseMobileNav={() => setMobileNavOpen(false)} />
            </div>
            <div className="flex-1" onClick={() => setMobileNavOpen(false)} />
          </div>
        )}

        {/* Dynamic Main View */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'pos' && <POSView />}
          {(activeTab === 'inventory' || activeTab === 'inventory-new') && <InventoryView />}
          {activeTab === 'alerts' && <AlertsView />}
          {activeTab === 'reports' && (
            <AdminLockGuard>
              <ReportsView />
            </AdminLockGuard>
          )}
          {activeTab === 'sales' && <TicketsHistoryView />}
          {activeTab === 'ai' && <AIModal />}
          {activeTab === 'settings' && (
            <AdminLockGuard>
              <SettingsView />
            </AdminLockGuard>
          )}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
