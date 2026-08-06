import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getTodayMetrics } from '../../utils/inventoryUtils';
import { CATEGORY_LABELS } from '../../data/initialData';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Award,
  Calendar,
  PieChart as PieChartIcon,
  BarChart3,
  Download,
  Percent,
  ArrowUpRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

export const ReportsView: React.FC = () => {
  const { sales, settings } = useApp();
  const [dateRange, setDateRange] = useState<'7days' | '30days' | 'all'>('7days');

  // Compute Today's exact metrics
  const todayMetrics = getTodayMetrics(sales);

  const formatCurrency = (val: number) =>
    `${settings.currencySymbol}${val.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Prepare chart data grouped by Date
  const salesByDateMap: Record<string, { date: string; sales: number; cost: number; profit: number; count: number }> = {};

  sales.forEach(sale => {
    const day = sale.date.split('T')[0];
    if (!salesByDateMap[day]) {
      salesByDateMap[day] = { date: day, sales: 0, cost: 0, profit: 0, count: 0 };
    }
    salesByDateMap[day].sales += sale.total;
    salesByDateMap[day].cost += sale.costTotal;
    salesByDateMap[day].profit += sale.profitTotal;
    salesByDateMap[day].count += 1;
  });

  const sortedDailyChartData = Object.values(salesByDateMap)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({
      dateFormatted: d.date.split('-').slice(1).join('/'),
      Ventas: Number(d.sales.toFixed(2)),
      Ganancia: Number(d.profit.toFixed(2)),
      Costos: Number(d.cost.toFixed(2)),
      Transacciones: d.count,
    }));

  const chartDataSlice =
    dateRange === '7days'
      ? sortedDailyChartData.slice(-7)
      : dateRange === '30days'
      ? sortedDailyChartData.slice(-30)
      : sortedDailyChartData;

  // Prepare Category Sales Pie Chart Data
  const categorySalesMap: Record<string, number> = {};
  sales.forEach(s => {
    s.items.forEach(item => {
      categorySalesMap[item.category] = (categorySalesMap[item.category] || 0) + item.total;
    });
  });

  const categoryPieData = Object.entries(categorySalesMap).map(([catKey, totalVal]) => ({
    name: CATEGORY_LABELS[catKey]?.name || catKey,
    value: Number(totalVal.toFixed(2)),
  }));

  const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];

  // Payment Method Breakdown
  const paymentMap: Record<string, number> = { efectivo: 0, tarjeta: 0, transferencia: 0 };
  sales.forEach(s => {
    paymentMap[s.paymentMethod] = (paymentMap[s.paymentMethod] || 0) + s.total;
  });

  const paymentBarData = [
    { name: 'Efectivo', Monto: Number(paymentMap.efectivo.toFixed(2)) },
    { name: 'Tarjeta', Monto: Number(paymentMap.tarjeta.toFixed(2)) },
    { name: 'Transferencia', Monto: Number(paymentMap.transferencia.toFixed(2)) },
  ];

  // Total Period Metrics
  const totalPeriodSales = chartDataSlice.reduce((acc, d) => acc + d.Ventas, 0);
  const totalPeriodProfit = chartDataSlice.reduce((acc, d) => acc + d.Ganancia, 0);
  const totalPeriodTx = chartDataSlice.reduce((acc, d) => acc + d.Transacciones, 0);

  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            <span>Rendimiento Financiero y Reportes de Ganancias</span>
          </h2>
          <p className="text-xs text-slate-500">
            Análisis detallado de ventas, margen bruto y ganancias líquidas diarias y mensuales
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['7days', '30days', 'all'].map(r => (
            <button
              key={r}
              onClick={() => setDateRange(r as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                dateRange === r
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r === '7days' ? 'Últimos 7 días' : r === '30days' ? 'Último Mes' : 'Histórico'}
            </button>
          ))}
        </div>
      </div>

      {/* HERO HERO HERO: ¿CUÁNTO SE GANÓ HOY? */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-6 shadow-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
              BALANCE Y GANANCIA DEL DÍA DE HOY ({new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })})
            </span>
          </div>
          <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-3 py-1 rounded-full border border-emerald-500/30">
            {todayMetrics.profitMargin}% Margen Promedio
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
          
          {/* NET PROFIT BIG BOX */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 md:col-span-2 space-y-1">
            <div className="text-xs text-emerald-300 font-bold uppercase tracking-wide flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Ganancia Neta de Hoy (Líquido)
            </div>
            <div className="text-4xl font-black text-emerald-400">
              {formatCurrency(todayMetrics.netProfit)}
            </div>
            <p className="text-xs text-slate-300 pt-1 border-t border-emerald-500/20">
              Fórmula: Ventas Totales ({formatCurrency(todayMetrics.totalSales)}) - Costo Compra ({formatCurrency(todayMetrics.totalCost)})
            </p>
          </div>

          {/* TOTAL SALES */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-1">
            <div className="text-xs text-slate-400 font-semibold uppercase flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-sky-400" />
              Ventas Totales Hoy
            </div>
            <div className="text-2xl font-black text-white">
              {formatCurrency(todayMetrics.totalSales)}
            </div>
            <p className="text-[11px] text-slate-400">
              En {todayMetrics.transactionCount} transacciones
            </p>
          </div>

          {/* TOP PRODUCT TODAY */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-1">
            <div className="text-xs text-slate-400 font-semibold uppercase flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              Producto Más Vendido
            </div>
            <div className="text-base font-bold text-amber-300 truncate">
              {todayMetrics.topProduct}
            </div>
            <p className="text-[11px] text-slate-400">
              Ticket Promedio: {formatCurrency(todayMetrics.transactionCount > 0 ? todayMetrics.totalSales / todayMetrics.transactionCount : 0)}
            </p>
          </div>

        </div>
      </div>

      {/* CHART 1: SALES & NET PROFIT TIMELINE */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <span>Ventas Totales vs Ganancia Neta por Día</span>
            </h3>
            <p className="text-xs text-slate-500">Comparativa histórica de ingresos y utilidad líquida</p>
          </div>

          <div className="text-right">
            <div className="text-xs font-bold text-slate-500">Total Periodo Seleccionado</div>
            <div className="text-sm font-black text-emerald-700">
              Ventas: {formatCurrency(totalPeriodSales)} | Ganancia: {formatCurrency(totalPeriodProfit)}
            </div>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartDataSlice} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="dateFormatted" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                formatter={(val: any) => [`$${val.toFixed(2)}`, '']}
              />
              <Legend />
              <Area type="monotone" dataKey="Ventas" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#salesGrad)" />
              <Area type="monotone" dataKey="Ganancia" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#profitGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CHARTS ROW 2: CATEGORY PIE CHART & PAYMENT METHODS BAR CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Category Pie Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
          <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-indigo-600" />
            <span>Ventas por Categoría de Producto</span>
          </h3>

          <div className="h-60 w-full flex items-center justify-center">
            {categoryPieData.length === 0 ? (
              <p className="text-xs text-slate-400">Sin datos de ventas disponibles</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [`$${val.toFixed(2)}`, 'Ventas']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Payment Method Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
          <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Desglose por Métodos de Pago</span>
          </h3>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentBarData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip formatter={(val: any) => [`$${val.toFixed(2)}`, 'Monto Total']} />
                <Bar dataKey="Monto" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
