import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Sale,
  StoreSettings,
  CartItem,
  PaymentMethod,
  SaleItem,
  UserRole
} from '../types';
import { INITIAL_PRODUCTS, INITIAL_SETTINGS, generateInitialSales } from '../data/initialData';

interface AppContextType {
  products: Product[];
  sales: Sale[];
  settings: StoreSettings;
  cart: CartItem[];
  activeTab: string;
  searchQuery: string;
  selectedCategory: string;
  cloudSyncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  lastSyncedAt: string;
  currentUserRole: UserRole;
  activeCashierName: string;
  
  // Actions
  setActiveTab: (tab: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (cat: string) => void;
  switchUserRole: (role: UserRole, name?: string) => void;
  
  // Product actions
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, amountToAdd: number) => void;
  
  // Cart actions
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  updateCartDiscount: (productId: string, discount: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  
  // Sale actions
  completeSale: (
    paymentMethod: PaymentMethod,
    amountPaid: number,
    customerEmail?: string,
    customerName?: string,
    notes?: string
  ) => Sale;
  
  // Settings & Cloud
  updateSettings: (newSettings: Partial<StoreSettings>) => void;
  triggerCloudSync: () => void;
  exportBackup: () => void;
  importBackup: (jsonData: string) => boolean;
  resetDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_PRODUCTS = 'pos_app_products_v1';
const LOCAL_STORAGE_KEY_SALES = 'pos_app_sales_v1';
const LOCAL_STORAGE_KEY_SETTINGS = 'pos_app_settings_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_PRODUCTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_PRODUCTS;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_SALES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return generateInitialSales();
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_SETTINGS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_SETTINGS;
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>('pos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced');
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(new Date().toLocaleTimeString());
  
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(() => {
    return (localStorage.getItem('pos_user_role') as UserRole) || 'admin';
  });
  const [activeCashierName, setActiveCashierName] = useState<string>(() => {
    return localStorage.getItem('pos_cashier_name') || 'Administrador Principal';
  });

  const switchUserRole = (role: UserRole, name?: string) => {
    setCurrentUserRole(role);
    localStorage.setItem('pos_user_role', role);
    if (name) {
      setActiveCashierName(name);
      localStorage.setItem('pos_cashier_name', name);
    } else if (role === 'admin') {
      setActiveCashierName('Administrador Principal');
      localStorage.setItem('pos_cashier_name', 'Administrador Principal');
    } else if (role === 'cashier' && activeCashierName === 'Administrador Principal') {
      setActiveCashierName('Cajero Turno Matutino');
      localStorage.setItem('pos_cashier_name', 'Cajero Turno Matutino');
    }
  };

  // Save to localStorage on change & simulate background cloud sync
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_SALES, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // Simulate Cloud Sync pulse
  const triggerCloudSync = () => {
    setCloudSyncStatus('syncing');
    setTimeout(() => {
      setCloudSyncStatus('synced');
      setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
  };

  // Product CRUD
  const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...productData,
      id: 'prod-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProducts(prev => [newProduct, ...prev]);
    triggerCloudSync();
  };

  const updateProduct = (id: string, productData: Partial<Product>) => {
    setProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, ...productData, updatedAt: new Date().toISOString() } : p))
    );
    triggerCloudSync();
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    triggerCloudSync();
  };

  const adjustStock = (id: string, amountToAdd: number) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          const newStock = Math.max(0, Number((p.stock + amountToAdd).toFixed(3)));
          return { ...p, stock: newStock, updatedAt: new Date().toISOString() };
        }
        return p;
      })
    );
    triggerCloudSync();
  };

  // Cart operations
  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        const existing = updated[existingIndex];
        const newQty = Number((existing.quantity + quantity).toFixed(3));
        const total = Number((newQty * existing.unitPrice - existing.discount).toFixed(2));
        updated[existingIndex] = { ...existing, quantity: newQty, total };
        return updated;
      } else {
        const total = Number((quantity * product.sellingPrice).toFixed(2));
        return [
          ...prevCart,
          {
            product,
            quantity,
            unitPrice: product.sellingPrice,
            discount: 0,
            total,
          },
        ];
      }
    });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          const total = Number((quantity * item.unitPrice - item.discount).toFixed(2));
          return { ...item, quantity, total };
        }
        return item;
      })
    );
  };

  const updateCartDiscount = (productId: string, discount: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          const total = Number((item.quantity * item.unitPrice - discount).toFixed(2));
          return { ...item, discount, total };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Complete Sale
  const completeSale = (
    paymentMethod: PaymentMethod,
    amountPaid: number,
    customerEmail?: string,
    customerName?: string,
    notes?: string
  ): Sale => {
    const ticketNumber = `TCK-${Date.now().toString().slice(-6)}`;
    
    let subtotal = 0;
    let discountTotal = 0;
    let costTotal = 0;

    const saleItems: SaleItem[] = cart.map(item => {
      subtotal += item.quantity * item.unitPrice;
      discountTotal += item.discount;
      costTotal += item.quantity * item.product.purchasePrice;

      return {
        productId: item.product.id,
        productName: item.product.name,
        category: item.product.category,
        quantity: item.quantity,
        unit: item.product.unit,
        purchasePrice: item.product.purchasePrice,
        sellingPrice: item.unitPrice,
        discount: item.discount,
        total: item.total,
      };
    });

    subtotal = Number(subtotal.toFixed(2));
    discountTotal = Number(discountTotal.toFixed(2));
    costTotal = Number(costTotal.toFixed(2));
    const total = Number((subtotal - discountTotal).toFixed(2));
    const profitTotal = Number((total - costTotal).toFixed(2));
    const changeGiven = Number(Math.max(0, amountPaid - total).toFixed(2));

    const newSale: Sale = {
      id: 'sale-' + Date.now(),
      ticketNumber,
      date: new Date().toISOString(),
      items: saleItems,
      subtotal,
      discountTotal,
      total,
      costTotal,
      profitTotal,
      paymentMethod,
      amountPaid,
      cashRendered: amountPaid,
      changeGiven,
      changeAmount: changeGiven,
      cashierName: activeCashierName,
      customerEmail,
      customerName,
      notes,
    };

    // Deduct stock for sold items
    setProducts(prevProducts =>
      prevProducts.map(prod => {
        const cartMatch = cart.find(c => c.product.id === prod.id);
        if (cartMatch) {
          const updatedStock = Math.max(0, Number((prod.stock - cartMatch.quantity).toFixed(3)));
          return { ...prod, stock: updatedStock, updatedAt: new Date().toISOString() };
        }
        return prod;
      })
    );

    setSales(prev => [newSale, ...prev]);
    clearCart();
    triggerCloudSync();

    return newSale;
  };

  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    triggerCloudSync();
  };

  const exportBackup = () => {
    const data = {
      products,
      sales,
      settings,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `respaldo_tienda_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importBackup = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.products && Array.isArray(parsed.products)) {
        setProducts(parsed.products);
      }
      if (parsed.sales && Array.isArray(parsed.sales)) {
        setSales(parsed.sales);
      }
      if (parsed.settings) {
        setSettings(parsed.settings);
      }
      triggerCloudSync();
      return true;
    } catch (e) {
      console.error('Error importing backup:', e);
      return false;
    }
  };

  const resetDemoData = () => {
    setProducts(INITIAL_PRODUCTS);
    setSales(generateInitialSales());
    setSettings(INITIAL_SETTINGS);
    setCart([]);
    triggerCloudSync();
  };

  return (
    <AppContext.Provider
      value={{
        products,
        sales,
        settings,
        cart,
        activeTab,
        searchQuery,
        selectedCategory,
        cloudSyncStatus,
        lastSyncedAt,
        currentUserRole,
        activeCashierName,
        setActiveTab,
        setSearchQuery,
        setSelectedCategory,
        switchUserRole,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        addToCart,
        updateCartQuantity,
        updateCartDiscount,
        removeFromCart,
        clearCart,
        completeSale,
        updateSettings,
        triggerCloudSync,
        exportBackup,
        importBackup,
        resetDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
