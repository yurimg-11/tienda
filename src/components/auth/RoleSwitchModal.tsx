import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { ShieldCheck, UserCheck, KeyRound, CheckCircle2, User, Lock, Sparkles, X } from 'lucide-react';

interface RoleSwitchModalProps {
  onClose: () => void;
}

export const RoleSwitchModal: React.FC<RoleSwitchModalProps> = ({ onClose }) => {
  const { currentUserRole, activeCashierName, switchUserRole, settings } = useApp();
  
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentUserRole);
  const [cashierNameInput, setCashierNameInput] = useState<string>(
    currentUserRole === 'cashier' ? activeCashierName : 'Juan Pérez (Cajero)'
  );
  const [adminPin, setAdminPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<boolean>(false);

  const expectedPin = settings.adminPin || '1234';

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');

    // If switching to admin or confirming admin, MANDATORY PIN check
    if (selectedRole === 'admin') {
      if (!adminPin.trim()) {
        setPinError(' Debes ingresar la contraseña/PIN de Administrador para acceder');
        return;
      }
      if (adminPin.trim() !== expectedPin) {
        setPinError(` Contraseña/PIN incorrecto. Acceso denegado al módulo Administrador.`);
        return;
      }
      switchUserRole('admin', 'Administrador Principal');
    } else {
      const finalName = cashierNameInput.trim() || 'Cajero de Turno';
      switchUserRole('cashier', finalName);
    }

    setSuccessMsg(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 text-emerald-400 rounded-2xl flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Perfil y Permisos de Usuario</h3>
              <p className="text-xs text-slate-500">Selecciona si estás operando como Administrador o Cajero</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="font-black text-slate-900 text-base">¡Perfil Cambiado Correctamente!</h4>
            <p className="text-xs text-slate-600">
              Ahora estás operando en modo <span className="font-bold text-slate-900 uppercase">{selectedRole === 'admin' ? 'Administrador' : 'Cajero'}</span> ({selectedRole === 'admin' ? 'Administrador Principal' : cashierNameInput}).
            </p>
          </div>
        ) : (
          <form onSubmit={handleApply} className="space-y-4">
            
            {/* Role Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* ADMIN ROLE CARD */}
              <div
                onClick={() => setSelectedRole('admin')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  selectedRole === 'admin'
                    ? 'border-amber-500 bg-amber-50/60 text-amber-950 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 rounded-xl bg-amber-100 text-amber-800 font-bold text-xs flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    👑 ADMIN
                  </span>
                  {selectedRole === 'admin' && (
                    <CheckCircle2 className="w-5 h-5 text-amber-600" />
                  )}
                </div>
                <h4 className="font-black text-sm text-slate-900">Administrador</h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                  Acceso total: gestión de inventario, precios de costo, ganancias netas, reportes y configuración.
                </p>
              </div>

              {/* CASHIER ROLE CARD */}
              <div
                onClick={() => setSelectedRole('cashier')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  selectedRole === 'cashier'
                    ? 'border-emerald-500 bg-emerald-50/60 text-emerald-950 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1">
                    <User className="w-4 h-4" />
                    👤 CAJERO
                  </span>
                  {selectedRole === 'cashier' && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  )}
                </div>
                <h4 className="font-black text-sm text-slate-900">Cajero / Empleado</h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                  Modo caja: Cobro ágil en punto de venta, venta por kilos/gramos exactos e impresión de tickets.
                </p>
              </div>

            </div>

            {/* Custom Inputs per Role */}
            {selectedRole === 'cashier' ? (
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Nombre del Empleado / Cajero Activo:
                </label>
                <input
                  type="text"
                  required
                  value={cashierNameInput}
                  onChange={e => setCashierNameInput(e.target.value)}
                  placeholder="Ej: Juan Pérez - Turno Mañana"
                  className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
                />
                <div className="flex gap-1.5 pt-1">
                  {['Juan Pérez (Matutino)', 'María López (Vespertino)', 'Carlos Ruiz (Caja 1)'].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCashierNameInput(preset)}
                      className="text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-2 py-1 rounded-lg"
                    >
                      {preset.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    Contraseña / PIN de Administrador (Obligatorio)
                  </span>
                  <span className="text-[10px] text-amber-700 font-semibold bg-amber-100 px-2 py-0.5 rounded-md">
                    {settings.adminPin || ''}
                  </span>
                </div>
                <input
                  type="password"
                  required
                  value={adminPin}
                  onChange={e => setAdminPin(e.target.value)}
                  placeholder="Ingresa la contraseña o PIN de Admin"
                  className="w-full text-xs font-bold text-slate-900 bg-white border border-amber-300 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-600"
                />
                <p className="text-[10px] text-slate-500 italic">
                  Protección contra acceso no autorizado por parte de empleados o cajeros.
                </p>
                {pinError && (
                  <p className="text-[11px] font-bold text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">{pinError}</p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Confirmar Cambio de Perfil
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
