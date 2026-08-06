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
  address: 'ZARAGOZA 1 #450, Col. Centro',
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

export const INITIAL_PRODUCTS: Product[] = [
  // VERDURAS Y FRUTAS
  {
    id: 'p1',
    name: 'Jitomate Saladette',
    category: 'verduras',
    barcode: '750100000001',
    purchasePrice: 18.00,
    sellingPrice: 28.50,
    stock: 24.5,
    minStock: 8.0,
    unit: 'kg',
    expirationDate: getRelativeDate(4), // Caduca en 4 días
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p2',
    name: 'Aguacate Hass Premium',
    category: 'frutas',
    barcode: '750100000002',
    purchasePrice: 42.00,
    sellingPrice: 65.00,
    stock: 12.0,
    minStock: 5.0,
    unit: 'kg',
    expirationDate: getRelativeDate(3), // Caduca en 3 días (ALERTA)
    imageUrl: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=300&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p3',
    name: 'Manzana Red Delicious',
    category: 'frutas',
    barcode: '750100000003',
    purchasePrice: 26.00,
    sellingPrice: 38.00,
    stock: 18.0,
    minStock: 6.0,
    unit: 'kg',
    expirationDate: getRelativeDate(14),
    imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p4',
    name: 'Cebolla Blanca',
    category: 'verduras',
    barcode: '750100000004',
    purchasePrice: 14.00,
    sellingPrice: 22.00,
    stock: 3.5, // Stock bajo
    minStock: 10.0,
    unit: 'kg',
    expirationDate: getRelativeDate(20),
    imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=300&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // ABARROTES
  {
    id: 'p5',
    name: 'Aceite Vegetal Canola 800ml',
    category: 'abarrotes',
    barcode: '750100000005',
    purchasePrice: 32.00,
    sellingPrice: 45.00,
    stock: 35,
    minStock: 10,
    unit: 'pieza',
    expirationDate: getRelativeDate(180),
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p6',
    name: 'Arroz Blanco Extra 1kg',
    category: 'abarrotes',
    barcode: '750100000006',
    purchasePrice: 19.50,
    sellingPrice: 27.00,
    stock: 2, // Stock muy bajo
    minStock: 15,
    unit: 'pieza',
    expirationDate: getRelativeDate(240),
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p7',
    name: 'Frijol Negro de la Olla 1kg',
    category: 'abarrotes',
    barcode: '750100000007',
    purchasePrice: 24.00,
    sellingPrice: 35.00,
    stock: 22,
    minStock: 8,
    unit: 'pieza',
    expirationDate: getRelativeDate(300),
    imageUrl: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=300&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // CARNES Y EMBUTIDOS
  {
    id: 'p8',
    name: 'Pechuga de Pollo Fresca',
    category: 'carnes',
    barcode: '750100000008',
    purchasePrice: 75.00,
    sellingPrice: 110.00,
    stock: 8.4,
    minStock: 5.0,
    unit: 'kg',
    expirationDate: getRelativeDate(2), // CADUCA EN 2 DÍAS (CRÍTICO)
    imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p9',
    name: 'Jamón de Pavo Virginia 250g',
    category: 'carnes',
    barcode: '750100000009',
    purchasePrice: 32.00,
    sellingPrice: 48.00,
    stock: 14,
    minStock: 5,
    unit: 'paquete',
    expirationDate: getRelativeDate(6),
    imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // LÁCTEOS
  {
    id: 'p10',
    name: 'Leche Entera 1 Litro',
    category: 'lacteos',
    barcode: '750100000010',
    purchasePrice: 18.50,
    sellingPrice: 26.00,
    stock: 40,
    minStock: 12,
    unit: 'litro',
    expirationDate: getRelativeDate(5),
    imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p11',
    name: 'Huevo Blanco 30 piezas',
    category: 'lacteos',
    barcode: '750100000011',
    purchasePrice: 62.00,
    sellingPrice: 85.00,
    stock: 15,
    minStock: 4,
    unit: 'caja',
    expirationDate: getRelativeDate(18),
    imageUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=300&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // LIMPIEZA
  {
    id: 'p12',
    name: 'Detergente Multiusos 1kg',
    category: 'limpieza',
    barcode: '750100000012',
    purchasePrice: 28.00,
    sellingPrice: 42.00,
    stock: 28,
    minStock: 10,
    unit: 'pieza',
    expirationDate: undefined,
    imageUrl: 'https://images.unsplash.com/photo-1585837575652-267c041d77d4?w=300&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p13',
    name: 'Cloro Desinfectante 950ml',
    category: 'limpieza',
    barcode: '750100000013',
    purchasePrice: 13.00,
    sellingPrice: 20.00,
    stock: 18,
    minStock: 6,
    unit: 'pieza',
    expirationDate: undefined,
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // BEBIDAS
  {
    id: 'p14',
    name: 'Refresco Cola 600ml',
    category: 'bebidas',
    barcode: '750100000014',
    purchasePrice: 13.50,
    sellingPrice: 20.00,
    stock: 48,
    minStock: 15,
    unit: 'pieza',
    expirationDate: getRelativeDate(120),
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p15',
    name: 'Agua Purificada 1.5L',
    category: 'bebidas',
    barcode: '750100000015',
    purchasePrice: 9.00,
    sellingPrice: 15.00,
    stock: 30,
    minStock: 10,
    unit: 'pieza',
    expirationDate: getRelativeDate(360),
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=300&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

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
      });
    }
  }
  
  return sales;
};
