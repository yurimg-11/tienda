export type ProductCategory =
  | 'verduras'
  | 'frutas'
  | 'abarrotes'
  | 'carnes'
  | 'limpieza'
  | 'lacteos'
  | 'bebidas'
  | 'otros';

export type ProductUnit = 'kg' | 'g' | 'pieza' | 'litro' | 'paquete' | 'caja';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  barcode: string;
  purchasePrice: number; // Precio de compra (costo)
  sellingPrice: number;  // Precio de venta
  stock: number;         // Cantidad actual en inventario
  minStock: number;      // Alerta cuando el stock sea menor o igual
  unit: ProductUnit;
  expirationDate?: string; // Formato YYYY-MM-DD
  imageUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;      // Puede ser decimal para kilos (ej: 1.250 kg)
  unitPrice: number;     // Precio de venta unitario
  discount: number;      // Descuento en monto $
  total: number;         // (quantity * unitPrice) - discount
}

export type UserRole = 'admin' | 'cashier';

export interface UserSession {
  role: UserRole;
  name: string;
}

export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia';

export interface SaleItem {
  productId: string;
  productName: string;
  category: ProductCategory;
  quantity: number;
  unit: ProductUnit;
  purchasePrice: number; // Guardado al momento de venta para calcular ganancia exacta
  sellingPrice: number;
  discount: number;
  total: number;
}

export interface Sale {
  cashRendered: any;
  changeAmount: number;
  id: string;
  ticketNumber: string;
  date: string;          // ISO string
  items: SaleItem[];
  subtotal: number;
  discountTotal: number;
  total: number;
  costTotal: number;     // Suma de precios de compra de los ítems
  profitTotal: number;   // total - costTotal
  paymentMethod: PaymentMethod;
  amountPaid: number;    // Con cuánto pagó
  changeGiven: number;   // Cambio entregado
  cashierName?: string;  // Nombre del empleado o administrador que realizó la venta
  customerEmail?: string;
  customerName?: string;
  notes?: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  taxId: string; // RFC / NIT / Tax ID
  currencySymbol: string;
  ticketFooter: string;
  autoCloudSync: boolean;
  lowStockAlertDays: number;
  expirationWarningDays: number;
  adminPin: string; // Contraseña / PIN de seguridad para Administrador
}

export interface DailySummary {
  date: string;
  totalSales: number;
  totalCost: number;
  netProfit: number;
  transactionCount: number;
  topSellingProduct: string;
  profitMarginPercentage: number;
}

export interface AIInsightResponse {
  summary: string;
  expiringActionPlan: string[];
  restockRecommendations: string[];
  salesTip: string;
}
