import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RoleSwitchModal } from './auth/RoleSwitchModal';
import {
  Store,
  Search,
  AlertTriangle,
  Calendar,
  RefreshCw,
  ShoppingBag,
  Bell,
  ShieldCheck,
  User,
  UserCheck
} from 'lucide-react';
import { getExpirationStatus, getStockStatus } from '../utils/inventoryUtils';

export const Header: React.FC<{ onOpenMobileNav?: () => void }> = ({ onOpenMobileNav }) => {
  const {
    settings,
    searchQuery,
    setSearchQuery,
    products,
    sales,
    cloudSyncStatus,
    lastSyncedAt,
    triggerCloudSync,
    setActiveTab,
    activeTab,
    currentUserRole,
    activeCashierName
  } = useApp();

  const [showRoleModal, setShowRoleModal] = useState<boolean>(false);

  // Calculate alerts badge count
  const alertCount = products.filter(p => {
    const exp = getExpirationStatus(p, settings.expirationWarningDays);
    const stk = getStockStatus(p);
    return exp.status === 'expired' || exp.status === 'critical' || stk.status === 'low' || stk.status === 'out';
  }).length;

  // Calculate today sales total
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTotal = sales
    .filter(s => s.date.startsWith(todayStr))
    .reduce((sum, s) => sum + s.total, 0);

  const formatCurrency = (val: number) =>
    `${settings.currencySymbol}${val.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Mobile menu toggle & Logo */}
        <div className="flex items-center gap-3">
          {onOpenMobileNav && (
            <button
              onClick={onOpenMobileNav}
              className="md:hidden p-2 text-slate-300 hover:text-white bg-slate-800 rounded-lg"
              title="Abrir menú"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          <div
            onClick={() => setActiveTab('pos')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Store className="w-5 h-5 text-slate-950" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-base text-slate-100 leading-tight tracking-tight">
                {settings.storeName || 'Control de Inventario'}
              </h1>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Punto de Venta & Caja Digital
              </p>
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md mx-2 sm:mx-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar producto por nombre o código..."
              className="w-full bg-slate-800/90 text-slate-100 placeholder-slate-400 text-sm rounded-xl pl-9 pr-3 py-1.5 border border-slate-700/80 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white bg-slate-700 rounded-full w-4 h-4 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right Status Actions & Stats */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Today's Sales Pill */}
          <div
            onClick={() => setActiveTab('reports')}
            className="hidden lg:flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
            title="Ver reporte de ventas de hoy"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Ventas Hoy</div>
              <div className="text-xs font-bold text-emerald-400">{formatCurrency(todayTotal)}</div>
            </div>
          </div>

          {/* Expiration & Low Stock Alert Badge */}
          <button
            onClick={() => setActiveTab('alerts')}
            className={`relative p-2 rounded-xl border transition-all ${
              alertCount > 0
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:text-white'
            }`}
            title={`${alertCount} Alertas activas de caducidad y inventario`}
          >
            <Bell className="w-5 h-5" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-sm animate-bounce">
                {alertCount}
              </span>
            )}
          </button>

          {/* USER ROLE INDICATOR BADGE & SWITCHER */}
          <button
            onClick={() => setShowRoleModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-xs cursor-pointer ${
              currentUserRole === 'admin'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
            title="Haz clic para cambiar entre Administrador y Cajero"
          >
            {currentUserRole === 'admin' ? (
              <>
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Modo:</span>
                <span className="font-black tracking-wide uppercase text-amber-300">ADMINISTRADOR</span>
              </>
            ) : (
              <>
                <User className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Cajero:</span>
                <span className="font-black text-emerald-200 truncate max-w-[120px]">{activeCashierName}</span>
              </>
            )}
            <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-md border border-slate-700 ml-0.5">
              Cambiar
            </span>
          </button>

          {/* Cloud Sync Status Indicator */}
          <button
            onClick={triggerCloudSync}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 transition-colors"
            title={`Sincronización en la nube activa. Última actualización: ${lastSyncedAt}`}
          >
            {cloudSyncStatus === 'syncing' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                <span className="hidden xl:inline text-sky-300">Sincronizando...</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="hidden xl:inline text-slate-300 font-medium">Nube Activa</span>
              </>
            )}
          </button>

        </div>
      </div>

      {/* Role Switch Modal */}
      {showRoleModal && <RoleSwitchModal onClose={() => setShowRoleModal(false)} />}
    </header>
  );
};
