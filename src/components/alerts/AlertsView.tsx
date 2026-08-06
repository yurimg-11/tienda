import React from 'react';
import { useApp } from '../../context/AppContext';
import { getExpirationStatus, getStockStatus } from '../../utils/inventoryUtils';
import { CATEGORY_LABELS } from '../../data/initialData';
import {
  AlertTriangle,
  AlertOctagon,
  TrendingDown,
  Percent,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Flame
} from 'lucide-react';

export const AlertsView: React.FC = () => {
  const { products, updateProduct, adjustStock, settings, setActiveTab } = useApp();

  // Categorize alerts
  const expiredProducts = products.filter(
    p => getExpirationStatus(p, settings.expirationWarningDays).status === 'expired'
  );

  const criticalExpiringProducts = products.filter(
    p => getExpirationStatus(p, settings.expirationWarningDays).status === 'critical'
  );

  const warningExpiringProducts = products.filter(
    p => getExpirationStatus(p, settings.expirationWarningDays).status === 'warning'
  );

  const lowStockProducts = products.filter(
    p => getStockStatus(p).status === 'low' || getStockStatus(p).status === 'out'
  );

  const formatCurrency = (val: number) =>
    `${settings.currencySymbol}${val.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Apply a discount to clear out inventory before it expires
  const applyClearanceDiscount = (productId: string, discountPercentage: number) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const newPrice = Number((prod.sellingPrice * (1 - discountPercentage / 100)).toFixed(2));
    updateProduct(productId, {
      sellingPrice: newPrice,
      notes: `Oferta de remate ${discountPercentage}% por próxima caducidad`
    });
    alert(`¡Precio actualizado a ${formatCurrency(newPrice)} (${discountPercentage}% desc.) para "${prod.name}"!`);
  };

  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Title Header */}
      <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2 text-amber-400">
            <AlertOctagon className="w-6 h-6" />
            <span>Centro de Alertas de Caducidad y Control de Inventario</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Protege tus ganancias: detecta productos próximos a vencer y reabastece productos agotados a tiempo.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('ai')}
          className="py-2.5 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Consultar IA para Mermas</span>
        </button>
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-red-900 uppercase">Productos Caducados</div>
            <div className="text-2xl font-black text-red-700">{expiredProducts.length}</div>
          </div>
          <div className="w-10 h-10 bg-red-100 text-red-700 rounded-xl flex items-center justify-center font-bold">
            🚨
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-amber-900 uppercase">Caducan en ≤7 Días</div>
            <div className="text-2xl font-black text-amber-700">{criticalExpiringProducts.length}</div>
          </div>
          <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center font-bold">
            ⚠️
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-yellow-900 uppercase">Caducan en ≤30 Días</div>
            <div className="text-2xl font-black text-yellow-700">{warningExpiringProducts.length}</div>
          </div>
          <div className="w-10 h-10 bg-yellow-100 text-yellow-700 rounded-xl flex items-center justify-center font-bold">
            ⏳
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-blue-900 uppercase">Stock Bajo / Agotado</div>
            <div className="text-2xl font-black text-blue-700">{lowStockProducts.length}</div>
          </div>
          <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center font-bold">
            📉
          </div>
        </div>
      </div>

      {/* EXPIRED ITEMS SECTION */}
      {expiredProducts.length > 0 && (
        <div className="bg-white rounded-2xl border border-red-200 p-4 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-red-700 font-black text-base border-b border-red-100 pb-2">
            <Flame className="w-5 h-5" />
            <h3>Productos Caducados (Retirar de Exhibición)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {expiredProducts.map(p => {
              const exp = getExpirationStatus(p, settings.expirationWarningDays);
              return (
                <div key={p.id} className="bg-red-50/70 border border-red-200 rounded-xl p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{p.name}</span>
                      <span className="text-[10px] font-bold bg-red-200 text-red-900 px-2 py-0.5 rounded">
                        {exp.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Stock actual: <span className="font-bold">{p.stock} {p.unit}</span> | Costo unitario: {formatCurrency(p.purchasePrice)}
                    </p>
                  </div>

                  <div className="flex gap-2 mt-3 pt-2 border-t border-red-200/60">
                    <button
                      onClick={() => {
                        adjustStock(p.id, -p.stock);
                        alert(`Se ajustó a 0 el stock de ${p.name} por merma.`);
                      }}
                      className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Registrar Merma (0 Stock)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CRITICAL EXPIRING ITEMS (< 7 DAYS) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span>Productos por Caducar en Menos de 7 Días ({criticalExpiringProducts.length})</span>
          </h3>
          <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
            Aplica ofertas de remate para evitar pérdidas
          </span>
        </div>

        {criticalExpiringProducts.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            🎉 ¡Excelente! No tienes productos críticos próximos a caducar esta semana.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {criticalExpiringProducts.map(p => {
              const exp = getExpirationStatus(p, settings.expirationWarningDays);
              return (
                <div key={p.id} className="bg-amber-50/50 border border-amber-200 rounded-xl p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{p.name}</span>
                      <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                        {exp.label}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                      <div>Stock: <span className="font-bold">{p.stock} {p.unit}</span></div>
                      <div>Precio Actual: <span className="font-bold text-emerald-700">{formatCurrency(p.sellingPrice)}</span></div>
                    </div>
                  </div>

                  {/* Discount Buttons */}
                  <div className="mt-3 pt-2 border-t border-amber-200/60">
                    <div className="text-[10px] font-bold text-amber-800 mb-1">Poner en Oferta de Remate:</div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => applyClearanceDiscount(p.id, 15)}
                        className="flex-1 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs"
                      >
                        -15% Desc.
                      </button>
                      <button
                        onClick={() => applyClearanceDiscount(p.id, 30)}
                        className="flex-1 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs"
                      >
                        -30% Desc.
                      </button>
                      <button
                        onClick={() => applyClearanceDiscount(p.id, 50)}
                        className="flex-1 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs"
                      >
                        -50% Desc.
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* LOW STOCK ALERT SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-blue-600" />
            <span>Alertas de Stock Bajo y Agotados ({lowStockProducts.length})</span>
          </h3>
          <button
            onClick={() => setActiveTab('inventory')}
            className="text-xs text-emerald-600 font-bold hover:underline"
          >
            Ir al Inventario Completo →
          </button>
        </div>

        {lowStockProducts.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            ✅ Todo el inventario tiene niveles de stock óptimos.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockProducts.map(p => (
              <div key={p.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{p.name}</h4>
                  <p className="text-[11px] text-slate-500">
                    Stock actual: <span className="font-bold text-red-600">{p.stock} {p.unit}</span> (Mínimo: {p.minStock})
                  </p>
                </div>

                <button
                  onClick={() => {
                    adjustStock(p.id, 20);
                    alert(`¡Se agregaron 20 unidades a ${p.name}!`);
                  }}
                  className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs whitespace-nowrap"
                >
                  + Reabastecer 20
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
