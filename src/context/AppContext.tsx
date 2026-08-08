import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  adjustStock: (id: string, amountToAdd: number) => Promise<void>;
  
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

const productFromDb = (row: any): Product => ({
  id: row.id,
  name: row.name ?? '',
  category: row.category ?? 'otros',
  barcode: row.barcode ?? '',
  purchasePrice: Number(row.purchase_price ?? 0),
  sellingPrice: Number(row.selling_price ?? 0),
  stock: Number(row.stock ?? 0),
  minStock: Number(row.min_stock ?? 0),
  unit: row.unit ?? 'pieza',
  expirationDate: row.expiration_date ?? undefined,
  imageUrl: row.image_url ?? undefined,
  notes: row.notes ?? undefined,
  createdAt: row.created_at ?? new Date().toISOString(),
  updatedAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
});

const productToDb = (product: Product) => ({
  id: product.id,
  name: product.name,
  category: product.category,
  barcode: product.barcode ?? '',
  purchase_price: product.purchasePrice ?? 0,
  selling_price: product.sellingPrice ?? 0,
  stock: product.stock ?? 0,
  min_stock: product.minStock ?? 0,
  unit: product.unit ?? 'pieza',
  expiration_date: product.expirationDate || null,
  image_url: product.imageUrl || null,
  notes: product.notes || null,
  created_at: product.createdAt,
  updated_at: product.updatedAt,
});


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

  // Cloud sync status. The real synchronization is handled by Supabase below.
  const triggerCloudSync = () => {
    setCloudSyncStatus('syncing');
    setLastSyncedAt(new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }));
  };


  // Load products from Supabase and listen for real-time changes.
  useEffect(() => {
    let mounted = true;

    const syncProducts = async () => {
      setCloudSyncStatus('syncing');

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!mounted) return;

      if (error) {
        console.error('Error cargando productos desde Supabase:', error);
        setCloudSyncStatus('offline');
        return;
      }

      const remoteProducts = (data ?? []).map(productFromDb);

      // First-time migration: if Supabase is empty but this device has
      // products in localStorage, upload those products to the cloud.
      const localSaved = localStorage.getItem(LOCAL_STORAGE_KEY_PRODUCTS);
      let localProducts: Product[] = [];

      if (localSaved) {
        try {
          const parsed = JSON.parse(localSaved);
          if (Array.isArray(parsed)) localProducts = parsed;
        } catch (e) {
          console.error('Error leyendo productos locales:', e);
        }
      }

      if (remoteProducts.length === 0 && localProducts.length > 0) {
        const productsToUpload = localProducts.map(product => ({
          ...productToDb(product),
          updated_at: product.updatedAt || new Date().toISOString(),
        }));

        const { data: migrated, error: migrationError } = await supabase
          .from('products')
          .upsert(productsToUpload, { onConflict: 'id' })
          .select();

        if (migrationError) {
          console.error(' Error migrando productos locales a Supabase:', migrationError);
          setProducts(localProducts);
          setCloudSyncStatus('error');
          return;
        }

        const migratedProducts = (migrated ?? []).map(productFromDb);
        setProducts(migratedProducts);
      } else {
        setProducts(remoteProducts);
      }

      setCloudSyncStatus('synced');
      setLastSyncedAt(new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }));
    };

    syncProducts();

    const channel = supabase
      .channel('products-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        payload => {
          if (!mounted) return;

          if (payload.eventType === 'INSERT') {
            const product = productFromDb(payload.new);
            setProducts(prev => {
              const exists = prev.some(item => item.id === product.id);
              return exists
                ? prev.map(item => item.id === product.id ? product : item)
                : [product, ...prev];
            });
          }

          if (payload.eventType === 'UPDATE') {
            const product = productFromDb(payload.new);
            setProducts(prev => {
              const exists = prev.some(item => item.id === product.id);
              return exists
                ? prev.map(item => item.id === product.id ? product : item)
                : [product, ...prev];
            });
          }

          if (payload.eventType === 'DELETE') {
            setProducts(prev =>
              prev.filter(item => item.id !== payload.old.id)
            );
          }

          setCloudSyncStatus('synced');
          setLastSyncedAt(new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }));
        }
      )
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          console.log(' Supabase Realtime conectado para products');
        } else if (status === 'CHANNEL_ERROR') {
          console.error(' Error conectando Supabase Realtime');
          setCloudSyncStatus('error');
        }
      });

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const addProduct = async (
  productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
) => {
  const now = new Date().toISOString();

  const newProduct: Product = {
    ...productData,
    id:
      'prod-' +
      Date.now() +
      '-' +
      Math.random().toString(36).substring(2, 7),
    createdAt: now,
    updatedAt: now,
  };

  setCloudSyncStatus('syncing');

  const { data, error } = await supabase
    .from('products')
    .insert({
      id: newProduct.id,
      name: newProduct.name,
      category: newProduct.category,
      barcode: newProduct.barcode ?? '',
      purchase_price: newProduct.purchasePrice ?? 0,
      selling_price: newProduct.sellingPrice ?? 0,
      stock: newProduct.stock ?? 0,
      min_stock: newProduct.minStock ?? 0,
      unit: newProduct.unit ?? 'pieza',
      expiration_date: newProduct.expirationDate || null,
      image_url: newProduct.imageUrl || null,
      notes: newProduct.notes || null,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error) {
    console.error(
      ' Error guardando producto en Supabase:',
      error
    );

    setCloudSyncStatus('error');
    return;
  }

  console.log(
    ' Producto guardado en Supabase:',
    data
  );

  setProducts(prev => [
    {
      ...newProduct,
      updatedAt: data.updated_at,
    },
    ...prev,
  ]);

  setCloudSyncStatus('synced');

  setLastSyncedAt(
    new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  );
};

  const updateProduct = async (id: string, productUpdates: Partial<Product>) => {
    const now = new Date().toISOString();
    setCloudSyncStatus('syncing');

    const existingProduct = products.find(prod => prod.id === id);
    if (!existingProduct) {
      console.error('Producto no encontrado para actualizar:', id);
      setCloudSyncStatus('error');
      return;
    }

    const updatedProduct: Product = {
      ...existingProduct,
      ...productUpdates,
      updatedAt: now,
    };

    const { data, error } = await supabase
      .from('products')
      .update({
        name: updatedProduct.name,
        category: updatedProduct.category,
        barcode: updatedProduct.barcode ?? '',
        purchase_price: updatedProduct.purchasePrice ?? 0,
        selling_price: updatedProduct.sellingPrice ?? 0,
        stock: updatedProduct.stock ?? 0,
        min_stock: updatedProduct.minStock ?? 0,
        unit: updatedProduct.unit ?? 'pieza',
        expiration_date: updatedProduct.expirationDate || null,
        image_url: updatedProduct.imageUrl || null,
        notes: updatedProduct.notes || null,
        updated_at: now,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(' Error actualizando producto en Supabase:', error);
      setCloudSyncStatus('error');
      return;
    }

    setProducts(prev =>
      prev.map(prod =>
        prod.id === id
          ? {
              ...prod,
              ...productUpdates,
              updatedAt: data?.updated_at || now,
            }
          : prod
      )
    );

    setCloudSyncStatus('synced');
    setLastSyncedAt(
      new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  };

const deleteProduct = async (id: string) => {
  setCloudSyncStatus('syncing');

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(' Error eliminando producto de Supabase:', error);
    setCloudSyncStatus('error');
    return;
  }

  setProducts(prev => prev.filter(p => p.id !== id));

  setCloudSyncStatus('synced');

  setLastSyncedAt(
    new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  );

  console.log(' Producto eliminado de Supabase:', id);
};

  const adjustStock = async (id: string, amountToAdd: number) => {
    const product = products.find(prod => prod.id === id);
    if (!product) {
      console.error('Producto no encontrado para ajustar stock:', id);
      return;
    }

    const newStock = Number(Math.max(0, product.stock + amountToAdd).toFixed(3));
    const now = new Date().toISOString();
    setCloudSyncStatus('syncing');

    const { data, error } = await supabase
      .from('products')
      .update({ stock: newStock, updated_at: now })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(' Error ajustando stock en Supabase:', error);
      setCloudSyncStatus('error');
      return;
    }

    setProducts(prev =>
      prev.map(prod =>
        prod.id === id
          ? { ...prod, stock: newStock, updatedAt: data?.updated_at || now }
          : prod
      )
    );

    setCloudSyncStatus('synced');
    setLastSyncedAt(
      new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  };

  // Cart operations
  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item?.product?.id === product?.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        const existing = updated[existingIndex];
        const newQty = Number(((existing?.quantity || 0) + quantity).toFixed(3));
        const total = Number((newQty * (existing?.unitPrice || 0) - (existing?.discount || 0)).toFixed(2));
        updated[existingIndex] = { ...existing, quantity: newQty, total };
        return updated;
      } else {
        const total = Number((quantity * (product?.sellingPrice || 0)).toFixed(2));
        return [
          ...prevCart,
          {
            product,
            quantity,
            unitPrice: product?.sellingPrice || 0,
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
        if (item?.product?.id === productId) {
          const total = Number((quantity * (item?.unitPrice || 0) - (item?.discount || 0)).toFixed(2));
          return { ...item, quantity, total };
        }
        return item;
      })
    );
  };

  const updateCartDiscount = (productId: string, discount: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item?.product?.id === productId) {
          const total = Number(((item?.quantity || 0) * (item?.unitPrice || 0) - discount).toFixed(2));
          return { ...item, discount, total };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item?.product?.id !== productId));
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
      const qty = item?.quantity || 0;
      const uPrice = item?.unitPrice || 0;
      const disc = item?.discount || 0;
      const prod = item?.product || {};

      subtotal += qty * uPrice;
      discountTotal += disc;
      costTotal += qty * (prod?.purchasePrice || 0);

      return {
        productId: prod?.id || 'unknown',
        productName: prod?.name || 'Producto sin nombre',
        category: prod?.category || 'otros',
        quantity: qty,
        unit: prod?.unit || 'pieza',
        purchasePrice: prod?.purchasePrice || 0,
        sellingPrice: uPrice,
        discount: disc,
        total: item?.total || 0,
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

    // Deduct stock locally and in Supabase.
    const stockUpdates = cart.map(item => {
      const productId = item?.product?.id;
      const quantity = item?.quantity || 0;
      const currentProduct = products.find(prod => prod.id === productId);

      if (!productId || !currentProduct) return null;

      const updatedStock = Math.max(
        0,
        Number(((currentProduct.stock || 0) - quantity).toFixed(3))
      );

      const updatedAt = new Date().toISOString();

      return {
        productId,
        updatedStock,
        updatedAt,
      };
    }).filter(Boolean) as Array<{
      productId: string;
      updatedStock: number;
      updatedAt: string;
    }>;

    setProducts(prevProducts =>
      prevProducts.map(prod => {
        const update = stockUpdates.find(item => item.productId === prod.id);
        return update
          ? { ...prod, stock: update.updatedStock, updatedAt: update.updatedAt }
          : prod;
      })
    );

    if (stockUpdates.length > 0) {
      setCloudSyncStatus('syncing');

      Promise.all(
        stockUpdates.map(update =>
          supabase
            .from('products')
            .update({
              stock: update.updatedStock,
              updated_at: update.updatedAt,
            })
            .eq('id', update.productId)
        )
      ).then(results => {
        const failed = results.find(result => result.error);

        if (failed?.error) {
          console.error('❌ Error sincronizando stock de la venta:', failed.error);
          setCloudSyncStatus('error');
        } else {
          setCloudSyncStatus('synced');
          setLastSyncedAt(new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }));
        }
      });
    }

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
      if (parsed?.products && Array.isArray(parsed.products)) {
        setProducts(parsed.products);
      }
      if (parsed?.sales && Array.isArray(parsed.sales)) {
        setSales(parsed.sales);
      }
      if (parsed?.settings) {
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