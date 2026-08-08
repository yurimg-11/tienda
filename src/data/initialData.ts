import { Product, StoreSettings, Sale } from '../types';

export const CATEGORY_LABELS: Record<string, { name: string; icon: string; color: string; bgColor: string }> = {
  verduras: { name: 'Verduras', icon: '🥬', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200' },
  frutas: { name: 'Frutas', icon: '🍎', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' },
  abarrotes: { name: 'Abarrotes', icon: '🥫', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200' },
  carnes: { name: 'Carnes y Embutidos', icon: '🥩', color: 'text-rose-700', bgColor: 'bg-rose-50 border-rose-200' },
  limpieza: { name: 'Artículos de Limpieza', icon: '🧹', color: 'text-sky-700', bgColor: 'bg-sky-50 border-sky-200' },
  lacteos: { name: 'Lácteos y Huevos', icon: '🧀', color: 'text-yellow-700', bgColor: 'bg-yellow-50 border-yellow-200' },
  bebidas: { name: 'Bebidas y Jugos', icon: '🥤', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
  otros: { name: 'Otros Productos', icon: '📦', color: 'text-slate-700', bgColor: 'bg-slate-50 border-slate-200' },
};

// Helper to generate dates relative to today
const getRelativeDate = (daysOffset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
};

export const INITIAL_SETTINGS: StoreSettings = {
  storeName: 'TIENDA CASA MANJARREZ',
  tagline: 'Tu tienda de confianza con los mejores productos',
  address: 'ZARAGOZA 1 , Col. Centro',
  phone: '243-127-82-53 O 243-43-1-66-60',
  email: '',
  taxId: '',
  currencySymbol: '$',
  ticketFooter: '¡Gracias por su compra! Vuelva pronto.',
  autoCloudSync: true,
  lowStockAlertDays: 5,
  expirationWarningDays: 10,
  adminPin: '',
};

export const INITIAL_PRODUCTS: Product[] = [];

// Generate sample past sales for today and previous days
export const generateInitialSales = (): Sale[] => {
  const sales: Sale[] = [];
  const now = new Date();
  
  // Create sales for today and past 7 days
  for (let i = 0; i < 7; i++) {
    const saleDate = new Date(now);
    saleDate.setDate(saleDate.getDate() - i);
    
    // Generate 3-6 transactions per day
    const transactionsCount = i === 0 ? 5 : Math.floor(Math.random() * 4) + 3;
    
    for (let j = 0; j < transactionsCount; j++) {
      saleDate.setHours(9 + j * 2, Math.floor(Math.random() * 50));
      
      const ticketNum = `TCK-${String(1000 + sales.length + 1)}`;
      const itemsCount = Math.floor(Math.random() * 3) + 1;
      const items = [];
      let subtotal = 0;
      let costTotal = 0;
      
      for (let k = 0; k < itemsCount; k++) {
        const prod = INITIAL_PRODUCTS[(k + j + i) % INITIAL_PRODUCTS.length];
        const qty = prod.unit === 'kg' ? Number((Math.random() * 1.5 + 0.5).toFixed(2)) : Math.floor(Math.random() * 3) + 1;
        const itemTotal = Number((qty * prod.sellingPrice).toFixed(2));
        const itemCost = Number((qty * prod.purchasePrice).toFixed(2));
        
        items.push({
          productId: prod.id,
          productName: prod.name,
          category: prod.category,
          quantity: qty,
          unit: prod.unit,
          purchasePrice: prod.purchasePrice,
          sellingPrice: prod.sellingPrice,
          discount: 0,
          total: itemTotal,
        });
        
        subtotal += itemTotal;
        costTotal += itemCost;
      }
      
      subtotal = Number(subtotal.toFixed(2));
      costTotal = Number(costTotal.toFixed(2));
      const profitTotal = Number((subtotal - costTotal).toFixed(2));
      
      const paymentMethods: ('efectivo' | 'tarjeta' | 'transferencia')[] = ['efectivo', 'efectivo', 'tarjeta', 'transferencia'];
      const pMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      const amountPaid = pMethod === 'efectivo' ? Math.ceil(subtotal / 50) * 50 : subtotal;
      
      sales.push({
        id: `sale-${i}-${j}`,
        ticketNumber: ticketNum,
        date: saleDate.toISOString(),
        items,
        subtotal,
        discountTotal: 0,
        total: subtotal,
        costTotal,
        profitTotal,
        paymentMethod: pMethod,
        amountPaid,
        changeGiven: Number((amountPaid - subtotal).toFixed(2)),
        cashRendered: amountPaid,
        changeAmount: Number((amountPaid - subtotal).toFixed(2)),
      });
    }
  }
  
  return sales;
};
