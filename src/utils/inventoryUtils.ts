import { Product, Sale } from '../types';

export type ExpirationStatus = 'expired' | 'critical' | 'warning' | 'ok' | 'none';
export type StockStatus = 'out' | 'low' | 'ok';

export const getExpirationStatus = (product: Product, warningDays: number = 7): {
  status: ExpirationStatus;
  daysRemaining: number | null;
  label: string;
  colorClass: string;
  badgeBg: string;
} => {
  if (!product?.expirationDate) {
    return { status: 'none', daysRemaining: null, label: 'Sin caducidad', colorClass: 'text-slate-400', badgeBg: 'bg-slate-100 text-slate-600' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expDate = new Date(product.expirationDate + 'T00:00:00');
  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'expired',
      daysRemaining: diffDays,
      label: `CADUCADO (${Math.abs(diffDays)}d)`,
      colorClass: 'text-red-700 font-bold',
      badgeBg: 'bg-red-100 text-red-800 border-red-300',
    };
  }

  if (diffDays <= warningDays) {
    return {
      status: 'critical',
      daysRemaining: diffDays,
      label: diffDays === 0 ? 'Caduca hoy' : `Caduca en ${diffDays}d`,
      colorClass: 'text-amber-700 font-semibold',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse',
    };
  }

  if (diffDays <= 30) {
    return {
      status: 'warning',
      daysRemaining: diffDays,
      label: `Caduca en ${diffDays}d`,
      colorClass: 'text-yellow-700',
      badgeBg: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    };
  }

  return {
    status: 'ok',
    daysRemaining: diffDays,
    label: `Vence ${product.expirationDate}`,
    colorClass: 'text-emerald-700',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  };
};

export const getStockStatus = (product: Product): {
  status: StockStatus;
  label: string;
  badgeBg: string;
} => {
  const stock = product?.stock || 0;
  const minStock = product?.minStock || 0;
  const unit = product?.unit || 'pieza';

  if (stock <= 0) {
    return { status: 'out', label: 'AGOTADO', badgeBg: 'bg-red-100 text-red-800 border-red-200' };
  }
  if (stock <= minStock) {
    return { status: 'low', label: `Stock bajo (${stock} ${unit})`, badgeBg: 'bg-amber-100 text-amber-800 border-amber-200' };
  }
  return { status: 'ok', label: `${stock} ${unit}`, badgeBg: 'bg-slate-100 text-slate-700' };
};

// Calculate today's metrics
export const getTodayMetrics = (sales: Sale[]) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const todaysSales = (sales || []).filter(s => {
    return s?.date?.startsWith(todayStr);
  });

  const totalSales = todaysSales.reduce((acc, s) => acc + (s?.total || 0), 0);
  const totalCost = todaysSales.reduce((acc, s) => acc + (s?.costTotal || 0), 0);
  const netProfit = totalSales - totalCost;
  const transactionCount = todaysSales.length;

  const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

  // Find top product sold today
  const productQuantities: Record<string, { name: string; qty: number }> = {};
  todaysSales.forEach(s => {
    (s?.items || []).forEach(item => {
      if (!productQuantities[item.productId]) {
        productQuantities[item.productId] = { name: item.productName, qty: 0 };
      }
      productQuantities[item.productId].qty += item.quantity;
    });
  });

  let topProduct = 'Ninguno';
  let maxQty = 0;
  Object.values(productQuantities).forEach(p => {
    if (p.qty > maxQty) {
      maxQty = p.qty;
      topProduct = p.name;
    }
  });

  return {
    todayStr,
    totalSales: Number(totalSales.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
    transactionCount,
    profitMargin: Number(profitMargin.toFixed(1)),
    topProduct,
    todaysSalesList: todaysSales,
  };
};