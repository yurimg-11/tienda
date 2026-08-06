import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RoleSwitchModal } from './auth/RoleSwitchModal';
import {
  ShoppingCart,
  Package,
  AlertOctagon,
  TrendingUp,
  Receipt,
  Sparkles,
  Settings,
  PlusCircle,
  Database,
  ShieldCheck,
  User,
  Lock
} from 'lucide-react';

export const Sidebar: React.FC<{ onCloseMobileNav?: () => void }> = ({ onCloseMobileNav }) => {
  const { activeTab, setActiveTab, products, sales, settings, currentUserRole, activeCashierName } = useApp();
  const [showRoleModal, setShowRoleModal] = useState<boolean>(false);

  const navItems = [
    {
      id: 'pos',
      label: 'Punto de Venta',
      icon: ShoppingCart,
      badge: null,
      adminOnly: false,
      color: 'text-emerald-600',
      activeBg: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold'
    },
    {
      id: 'inventory',
      label: 'Inventario de Productos',
      icon: Package,
      badge: products.length,
      adminOnly: false,
      color: 'text-blue-600',
      activeBg: 'bg-blue-50 text-blue-800 border-blue-300 font-semibold'
    },
    {
      id: 'alerts',
      label: 'Alertas y Caducidad',
      icon: AlertOctagon,
      badge: null,
      adminOnly: false,
      color: 'text-amber-600',
      activeBg: 'bg-amber-50 text-amber-900 border-amber-300 font-semibold'
    },
    {
      id: 'reports',
      label: 'Ganancias y Reportes',
      icon: TrendingUp,
      badge: currentUserRole === 'cashier' ? '🔒 ADMIN' : null,
      adminOnly: true,
      color: 'text-purple-600',
      activeBg: 'bg-purple-50 text-purple-900 border-purple-300 font-semibold'
    },
    {
      id: 'sales',
      label: 'Historial de Tickets',
      icon: Receipt,
      badge: sales.length,
      adminOnly: false,
      color: 'text-teal-600',
      activeBg: 'bg-teal-50 text-teal-900 border-teal-300 font-semibold'
    },
    {
      id: 'ai',
      label: 'Asistente IA Negocio',
      icon: Sparkles,
      badge: 'IA',
      adminOnly: false,
      color: 'text-indigo-600',
      activeBg: 'bg-indigo-50 text-indigo-900 border-indigo-300 font-semibold'
    },
    {
      id: 'settings',
      label: 'Configuración',
      icon: Settings,
      badge: currentUserRole === 'cashier' ? '🔒 ADMIN' : null,
      adminOnly: true,
      color: 'text-slate-600',
      activeBg: 'bg-slate-100 text-slate-900 border-slate-300 font-semibold'
    },
  ];

  const handleSelect = (id: string, adminOnly: boolean) => {
    if (adminOnly && currentUserRole === 'cashier') {
      setShowRoleModal(true);
      return;
    }
    setActiveTab(id);
    if (onCloseMobileNav) onCloseMobileNav();
  };

  return (
    <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-full p-3 md:p-4 select-none">
      <div className="space-y-3">
        
        {/* ACTIVE USER ROLE CARD */}
        <div
          onClick={() => setShowRoleModal(true)}
          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            currentUserRole === 'admin'
              ? 'bg-amber-50/80 border-amber-200 text-amber-950 hover:bg-amber-100/80'
              : 'bg-emerald-50/80 border-emerald-200 text-emerald-950 hover:bg-emerald-100/80'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`p-2 rounded-xl text-white font-bold ${currentUserRole === 'admin' ? 'bg-amber-600' : 'bg-emerald-600'}`}>
              {currentUserRole === 'admin' ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                {currentUserRole === 'admin' ? 'Modo Sistema' : 'Cajero Activo'}
              </div>
              <div className="text-xs font-black truncate leading-snug">
                {currentUserRole === 'admin' ? 'Administrador' : activeCashierName}
              </div>
            </div>
          </div>
          <span className="text-[10px] bg-white px-2 py-0.5 rounded-lg border border-slate-200 font-bold text-slate-700 shadow-2xs">
            Cambiar
          </span>
        </div>

        {/* Quick Action Button */}
        <button
          onClick={() => {
            if (currentUserRole === 'cashier') {
              setShowRoleModal(true);
            } else {
              handleSelect('inventory-new', false);
            }
          }}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all text-sm cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-emerald-400" />
          <span>+ Registrar Producto</span>
        </button>

        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (item.id === 'inventory' && activeTab === 'inventory-new');
            const isLockedForCashier = item.adminOnly && currentUserRole === 'cashier';

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id, item.adminOnly)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all border ${
                  isActive
                    ? item.activeBg + ' shadow-xs'
                    : isLockedForCashier
                    ? 'text-slate-400 bg-slate-50/60 border-slate-100 hover:bg-slate-100/60 cursor-pointer'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? item.color : isLockedForCashier ? 'text-slate-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isLockedForCashier
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : isActive
                        ? 'bg-white/80'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Box */}
      <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-2">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-700 font-semibold mb-1">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              Estado Nube
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
              Sincronizado
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Acceso seguro multidispositivo. Sincronización continua en la nube.
          </p>
        </div>
      </div>

      {/* Role Switch Modal */}
      {showRoleModal && <RoleSwitchModal onClose={() => setShowRoleModal(false)} />}
    </aside>
  );
};
