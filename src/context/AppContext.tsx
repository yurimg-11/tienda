import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';

import { supabase } from '../lib/supabase';

import {
  Product,
  Sale,
  StoreSettings,
  CartItem,
  PaymentMethod,
  SaleItem,
  UserRole,
} from '../types';

import {
  INITIAL_PRODUCTS,
  INITIAL_SETTINGS,
  generateInitialSales,
} from '../data/initialData';

interface SaleWithCancellation extends Sale {
  cancelled?: boolean;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
}

interface AppContextType {
  products: Product[];
  sales: SaleWithCancellation[];
  settings: StoreSettings;
  cart: CartItem[];

  activeTab: string;
  searchQuery: string;
  selectedCategory: string;

  cloudSyncStatus:
    | 'synced'
    | 'syncing'
    | 'offline'
    | 'error';

  lastSyncedAt: string;

  currentUserRole: UserRole;
  activeCashierName: string;

  setActiveTab: (tab: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (cat: string) => void;

  switchUserRole: (
    role: UserRole,
    name?: string
  ) => void;

  addProduct: (
    product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;

  updateProduct: (
    id: string,
    product: Partial<Product>
  ) => Promise<void>;

  deleteProduct: (
    id: string
  ) => Promise<void>;

  adjustStock: (
    id: string,
    amountToAdd: number
  ) => Promise<void>;

  addToCart: (
    product: Product,
    quantity?: number
  ) => void;

  updateCartQuantity: (
    productId: string,
    quantity: number
  ) => void;

  updateCartDiscount: (
    productId: string,
    discount: number
  ) => void;

  removeFromCart: (
    productId: string
  ) => void;

  clearCart: () => void;

  completeSale: (
    paymentMethod: PaymentMethod,
    amountPaid: number,
    customerEmail?: string,
    customerName?: string,
    notes?: string
  ) => SaleWithCancellation;

  cancelSale: (
    saleId: string,
    reason?: string
  ) => Promise<boolean>;

  updateSettings: (
    newSettings: Partial<StoreSettings>
  ) => void;

  triggerCloudSync: () => void;

  exportBackup: () => void;

  importBackup: (
    jsonData: string
  ) => boolean;

  resetDemoData: () => void;
}

const AppContext =
  createContext<AppContextType | undefined>(
    undefined
  );

const LOCAL_STORAGE_KEY_PRODUCTS =
  'pos_app_products_v1';

const LOCAL_STORAGE_KEY_SALES =
  'pos_app_sales_v1';

const LOCAL_STORAGE_KEY_SETTINGS =
  'pos_app_settings_v1';

const getNow = () =>
  new Date().toISOString();

const getTime = () =>
  new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

const productFromDb = (
  row: any
): Product => ({
  id: row.id,
  name: row.name ?? '',
  category: row.category ?? 'otros',
  barcode: row.barcode ?? '',
  purchasePrice: Number(
    row.purchase_price ?? 0
  ),
  sellingPrice: Number(
    row.selling_price ?? 0
  ),
  stock: Number(
    row.stock ?? 0
  ),
  minStock: Number(
    row.min_stock ?? 0
  ),
  unit: row.unit ?? 'pieza',
  expirationDate:
    row.expiration_date ??
    undefined,
  imageUrl:
    row.image_url ??
    undefined,
  notes:
    row.notes ??
    undefined,
  createdAt:
    row.created_at ??
    getNow(),
  updatedAt:
    row.updated_at ??
    row.created_at ??
    getNow(),
});

const productToDb = (
  product: Product
) => ({
  id: product.id,
  name: product.name,
  category: product.category,
  barcode: product.barcode ?? '',
  purchase_price:
    product.purchasePrice ?? 0,
  selling_price:
    product.sellingPrice ?? 0,
  stock:
    product.stock ?? 0,
  min_stock:
    product.minStock ?? 0,
  unit:
    product.unit ?? 'pieza',
  expiration_date:
    product.expirationDate || null,
  image_url:
    product.imageUrl || null,
  notes:
    product.notes || null,
  created_at:
    product.createdAt,
  updated_at:
    product.updatedAt,
});

const saleItemFromDb = (
  row: any
): SaleItem => ({
  productId:
    row.product_id,
  productName:
    row.product_name ?? '',
  category:
    row.category ?? 'otros',
  quantity:
    Number(row.quantity ?? 0),
  unit:
    row.unit ?? 'pieza',
  purchasePrice:
    Number(row.purchase_price ?? 0),
  sellingPrice:
    Number(row.selling_price ?? 0),
  discount:
    Number(row.discount ?? 0),
  total:
    Number(row.total ?? 0),
});

const saleFromDb = (
  row: any
): SaleWithCancellation => {
  const items =
    Array.isArray(row.sale_items)
      ? row.sale_items.map(
          saleItemFromDb
        )
      : [];

  return {
    id:
      row.id,

    ticketNumber:
      row.ticket_number,

    date:
      row.date,

    items,

    subtotal:
      Number(row.subtotal ?? 0),

    discountTotal:
      Number(
        row.discount_total ?? 0
      ),

    total:
      Number(row.total ?? 0),

    costTotal:
      Number(row.cost_total ?? 0),

    profitTotal:
      Number(
        row.profit_total ?? 0
      ),

    paymentMethod:
      row.payment_method as PaymentMethod,

    amountPaid:
      Number(
        row.amount_paid ?? 0
      ),

    cashRendered:
      Number(
        row.cash_rendered ?? 0
      ),

    changeGiven:
      Number(
        row.change_given ?? 0
      ),

    changeAmount:
      Number(
        row.change_amount ?? 0
      ),

    cashierName:
      row.cashier_name ?? '',

    customerEmail:
      row.customer_email ??
      undefined,

    customerName:
      row.customer_name ??
      undefined,

    notes:
      row.notes ??
      undefined,

    cancelled:
      Boolean(
        row.cancelled ?? false
      ),

    cancelledAt:
      row.cancelled_at ??
      undefined,

    cancelledBy:
      row.cancelled_by ??
      undefined,

    cancellationReason:
      row.cancellation_reason ??
      undefined,
  };
};

const saleToDb = (
  sale: SaleWithCancellation
) => ({
  id:
    sale.id,

  ticket_number:
    sale.ticketNumber,

  date:
    sale.date,

  subtotal:
    sale.subtotal ?? 0,

  discount_total:
    sale.discountTotal ?? 0,

  total:
    sale.total ?? 0,

  cost_total:
    sale.costTotal ?? 0,

  profit_total:
    sale.profitTotal ?? 0,

  payment_method:
    sale.paymentMethod,

  amount_paid:
    sale.amountPaid ?? 0,

  cash_rendered:
    sale.cashRendered ?? 0,

  change_given:
    sale.changeGiven ?? 0,

  change_amount:
    sale.changeAmount ?? 0,

  cashier_name:
    sale.cashierName ?? '',

  customer_email:
    sale.customerEmail ||
    null,

  customer_name:
    sale.customerName ||
    null,

  notes:
    sale.notes ||
    null,

  cancelled:
    sale.cancelled ?? false,

  cancelled_at:
    sale.cancelledAt ||
    null,

  cancelled_by:
    sale.cancelledBy ||
    null,

  cancellation_reason:
    sale.cancellationReason ||
    null,
});

const saleItemsToDb = (
  sale: SaleWithCancellation
) =>
  sale.items.map(item => ({
    sale_id:
      sale.id,

    product_id:
      item.productId,

    product_name:
      item.productName,

    category:
      item.category ?? 'otros',

    quantity:
      item.quantity ?? 0,

    unit:
      item.unit ?? 'pieza',

    purchase_price:
      item.purchasePrice ?? 0,

    selling_price:
      item.sellingPrice ?? 0,

    discount:
      item.discount ?? 0,

    total:
      item.total ?? 0,
  }));

export const AppProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [products, setProducts] =
    useState<Product[]>(() => {
      const saved =
        localStorage.getItem(
          LOCAL_STORAGE_KEY_PRODUCTS
        );

      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (error) {
          console.error(
            'Error leyendo productos locales:',
            error
          );
        }
      }

      return INITIAL_PRODUCTS;
    });

  const [sales, setSales] =
    useState<SaleWithCancellation[]>(() => {
      const saved =
        localStorage.getItem(
          LOCAL_STORAGE_KEY_SALES
        );

      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (error) {
          console.error(
            'Error leyendo ventas locales:',
            error
          );
        }
      }

      return generateInitialSales();
    });

  const [settings, setSettings] =
    useState<StoreSettings>(() => {
      const saved =
        localStorage.getItem(
          LOCAL_STORAGE_KEY_SETTINGS
        );

      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (error) {
          console.error(
            'Error leyendo configuración local:',
            error
          );
        }
      }

      return INITIAL_SETTINGS;
    });

  const [cart, setCart] =
    useState<CartItem[]>([]);

  const [activeTab, setActiveTab] =
    useState('pos');

  const [searchQuery, setSearchQuery] =
    useState('');

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState('todas');

  const [
    cloudSyncStatus,
    setCloudSyncStatus,
  ] = useState<
    'synced' |
    'syncing' |
    'offline' |
    'error'
  >('syncing');

  const [
    lastSyncedAt,
    setLastSyncedAt,
  ] = useState(getTime());

  const [
    currentUserRole,
    setCurrentUserRole,
  ] = useState<UserRole>(() => {
    return (
      (localStorage.getItem(
        'pos_user_role'
      ) as UserRole) ||
      'admin'
    );
  });

  const [
    activeCashierName,
    setActiveCashierName,
  ] = useState(() => {
    return (
      localStorage.getItem(
        'pos_cashier_name'
      ) ||
      'Administrador Principal'
    );
  });

  const switchUserRole = (
    role: UserRole,
    name?: string
  ) => {
    setCurrentUserRole(role);

    localStorage.setItem(
      'pos_user_role',
      role
    );

    if (name) {
      setActiveCashierName(name);

      localStorage.setItem(
        'pos_cashier_name',
        name
      );

      return;
    }

    if (role === 'admin') {
      const adminName =
        'Administrador Principal';

      setActiveCashierName(
        adminName
      );

      localStorage.setItem(
        'pos_cashier_name',
        adminName
      );

      return;
    }

    if (
      role === 'cashier' &&
      activeCashierName ===
        'Administrador Principal'
    ) {
      const cashierName =
        'Cajero Turno Matutino';

      setActiveCashierName(
        cashierName
      );

      localStorage.setItem(
        'pos_cashier_name',
        cashierName
      );
    }
  };

  useEffect(() => {
    localStorage.setItem(
      LOCAL_STORAGE_KEY_PRODUCTS,
      JSON.stringify(products)
    );
  }, [products]);

  useEffect(() => {
    localStorage.setItem(
      LOCAL_STORAGE_KEY_SALES,
      JSON.stringify(sales)
    );
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(
      LOCAL_STORAGE_KEY_SETTINGS,
      JSON.stringify(settings)
    );
  }, [settings]);

  const loadProducts =
    useCallback(async () => {
      const {
        data,
        error,
      } = await supabase
        .from('products')
        .select('*')
        .order(
          'created_at',
          {
            ascending: false,
          }
        );

      if (error) {
        console.error(
          'Error cargando productos:',
          error
        );

        throw error;
      }

      const remoteProducts =
        (data ?? []).map(
          productFromDb
        );

      setProducts(
        remoteProducts
      );

      return remoteProducts;
    }, []);

  const loadSales =
    useCallback(async () => {
      const {
        data,
        error,
      } = await supabase
        .from('sales')
        .select(
          `
          *,
          sale_items (
            id,
            sale_id,
            product_id,
            product_name,
            category,
            quantity,
            unit,
            purchase_price,
            selling_price,
            discount,
            total,
            created_at
          )
        `
        )
        .order(
          'date',
          {
            ascending: false,
          }
        );

      if (error) {
        console.error(
          'Error cargando ventas:',
          error
        );

        throw error;
      }

      const remoteSales =
        (data ?? []).map(
          saleFromDb
        );

      setSales(
        remoteSales
      );

      return remoteSales;
    }, []);

  const syncSaleToCloud =
    useCallback(
      async (
        sale: SaleWithCancellation
      ) => {
        const {
          error: saleError,
        } = await supabase
          .from('sales')
          .upsert(
            saleToDb(sale),
            {
              onConflict: 'id',
            }
          );

        if (saleError) {
          console.error(
            'Error guardando venta:',
            saleError
          );

          throw saleError;
        }

        const {
          error: deleteItemsError,
        } = await supabase
          .from('sale_items')
          .delete()
          .eq(
            'sale_id',
            sale.id
          );

        if (deleteItemsError) {
          console.error(
            'Error limpiando partidas:',
            deleteItemsError
          );

          throw deleteItemsError;
        }

        const items =
          saleItemsToDb(sale);

        if (items.length > 0) {
          const {
            error: itemsError,
          } = await supabase
            .from('sale_items')
            .insert(items);

          if (itemsError) {
            console.error(
              'Error guardando partidas:',
              itemsError
            );

            throw itemsError;
          }
        }
      },
      []
    );

  const syncAllSales =
    useCallback(async () => {
      setCloudSyncStatus(
        'syncing'
      );

      try {
        for (const sale of sales) {
          await syncSaleToCloud(
            sale
          );
        }

        await loadSales();

        setCloudSyncStatus(
          'synced'
        );

        setLastSyncedAt(
          getTime()
        );
      } catch (error) {
        console.error(
          'Error sincronizando ventas:',
          error
        );

        setCloudSyncStatus(
          'error'
        );
      }
    }, [
      sales,
      syncSaleToCloud,
      loadSales,
    ]);

  const triggerCloudSync =
    useCallback(() => {
      void syncAllSales();
    }, [syncAllSales]);

  useEffect(() => {
    let mounted = true;

    const loadCloudData =
      async () => {
        setCloudSyncStatus(
          'syncing'
        );

        try {
          await Promise.all([
            loadProducts(),
            loadSales(),
          ]);

          if (!mounted) {
            return;
          }

          setCloudSyncStatus(
            'synced'
          );

          setLastSyncedAt(
            getTime()
          );
        } catch (error) {
          if (!mounted) {
            return;
          }

          console.error(
            'Error cargando datos desde Supabase:',
            error
          );

          setCloudSyncStatus(
            'offline'
          );
        }
      };

    void loadCloudData();

    const channel =
      supabase
        .channel(
          'pos-database-realtime'
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'products',
          },
          async () => {
            if (!mounted) {
              return;
            }

            try {
              await loadProducts();

              if (!mounted) {
                return;
              }

              setCloudSyncStatus(
                'synced'
              );

              setLastSyncedAt(
                getTime()
              );
            } catch (error) {
              console.error(
                'Error actualizando productos:',
                error
              );

              setCloudSyncStatus(
                'error'
              );
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'sales',
          },
          async () => {
            if (!mounted) {
              return;
            }

            try {
              await loadSales();

              if (!mounted) {
                return;
              }

              setCloudSyncStatus(
                'synced'
              );

              setLastSyncedAt(
                getTime()
              );
            } catch (error) {
              console.error(
                'Error actualizando ventas:',
                error
              );

              setCloudSyncStatus(
                'error'
              );
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'sale_items',
          },
          async () => {
            if (!mounted) {
              return;
            }

            try {
              await loadSales();

              if (!mounted) {
                return;
              }

              setCloudSyncStatus(
                'synced'
              );

              setLastSyncedAt(
                getTime()
              );
            } catch (error) {
              console.error(
                'Error actualizando partidas:',
                error
              );

              setCloudSyncStatus(
                'error'
              );
            }
          }
        )
        .subscribe(status => {
          console.log(
            'Supabase Realtime:',
            status
          );

          if (
            status ===
            'SUBSCRIBED'
          ) {
            setCloudSyncStatus(
              'synced'
            );
          }

          if (
            status ===
            'CHANNEL_ERROR'
          ) {
            setCloudSyncStatus(
              'error'
            );
          }

          if (
            status ===
            'TIMED_OUT'
          ) {
            setCloudSyncStatus(
              'offline'
            );
          }
        });

    return () => {
      mounted = false;

      supabase.removeChannel(
        channel
      );
    };
  }, [
    loadProducts,
    loadSales,
  ]);

  const addProduct = async (
    productData: Omit<
      Product,
      'id' | 'createdAt' | 'updatedAt'
    >
  ) => {
    const now = getNow();

    const newProduct: Product =
      {
        ...productData,

        id:
          'prod-' +
          Date.now() +
          '-' +
          Math.random()
            .toString(36)
            .substring(2, 7),

        createdAt:
          now,

        updatedAt:
          now,
      };

    setCloudSyncStatus(
      'syncing'
    );

    const {
      data,
      error,
    } = await supabase
      .from('products')
      .insert(
        productToDb(
          newProduct
        )
      )
      .select()
      .single();

    if (error) {
      console.error(
        'Error guardando producto:',
        error
      );

      setCloudSyncStatus(
        'error'
      );

      throw error;
    }

    const savedProduct =
      productFromDb(data);

    setProducts(prev => [
      savedProduct,
      ...prev.filter(
        item =>
          item.id !==
          savedProduct.id
      ),
    ]);

    setCloudSyncStatus(
      'synced'
    );

    setLastSyncedAt(
      getTime()
    );
  };

  const updateProduct =
    async (
      id: string,
      productUpdates: Partial<Product>
    ) => {
      const existingProduct =
        products.find(
          product =>
            product.id === id
        );

      if (!existingProduct) {
        throw new Error(
          'Producto no encontrado.'
        );
      }

      const now = getNow();

      const updatedProduct:
        Product = {
        ...existingProduct,
        ...productUpdates,
        updatedAt: now,
      };

      setCloudSyncStatus(
        'syncing'
      );

      const {
        data,
        error,
      } = await supabase
        .from('products')
        .update({
          name:
            updatedProduct.name,

          category:
            updatedProduct.category,

          barcode:
            updatedProduct.barcode ??
            '',

          purchase_price:
            updatedProduct.purchasePrice ??
            0,

          selling_price:
            updatedProduct.sellingPrice ??
            0,

          stock:
            updatedProduct.stock ??
            0,

          min_stock:
            updatedProduct.minStock ??
            0,

          unit:
            updatedProduct.unit ??
            'pieza',

          expiration_date:
            updatedProduct.expirationDate ||
            null,

          image_url:
            updatedProduct.imageUrl ||
            null,

          notes:
            updatedProduct.notes ||
            null,

          updated_at:
            now,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(
          'Error actualizando producto:',
          error
        );

        setCloudSyncStatus(
          'error'
        );

        throw error;
      }

      const savedProduct =
        productFromDb(data);

      setProducts(prev =>
        prev.map(product =>
          product.id === id
            ? savedProduct
            : product
        )
      );

      setCloudSyncStatus(
        'synced'
      );

      setLastSyncedAt(
        getTime()
      );
    };

  const deleteProduct =
    async (
      id: string
    ) => {
      setCloudSyncStatus(
        'syncing'
      );

      const {
        error,
      } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error(
          'Error eliminando producto:',
          error
        );

        setCloudSyncStatus(
          'error'
        );

        throw error;
      }

      setProducts(prev =>
        prev.filter(
          product =>
            product.id !== id
        )
      );

      setCloudSyncStatus(
        'synced'
      );

      setLastSyncedAt(
        getTime()
      );
    };

  const adjustStock =
    async (
      id: string,
      amountToAdd: number
    ) => {
      const product =
        products.find(
          item =>
            item.id === id
        );

      if (!product) {
        throw new Error(
          'Producto no encontrado.'
        );
      }

      const newStock =
        Number(
          Math.max(
            0,
            Number(
              product.stock || 0
            ) +
              Number(
                amountToAdd || 0
              )
          ).toFixed(3)
        );

      const now = getNow();

      setCloudSyncStatus(
        'syncing'
      );

      const {
        data,
        error,
      } = await supabase
        .from('products')
        .update({
          stock:
            newStock,
          updated_at:
            now,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(
          'Error ajustando stock:',
          error
        );

        setCloudSyncStatus(
          'error'
        );

        throw error;
      }

      const savedProduct =
        productFromDb(data);

      setProducts(prev =>
        prev.map(item =>
          item.id === id
            ? savedProduct
            : item
        )
      );

      setCloudSyncStatus(
        'synced'
      );

      setLastSyncedAt(
        getTime()
      );
    };

  const addToCart = (
    product: Product,
    quantity: number = 1
  ) => {
    const safeQuantity =
      Number(quantity);

    if (
      !Number.isFinite(
        safeQuantity
      ) ||
      safeQuantity <= 0
    ) {
      return;
    }

    setCart(prevCart => {
      const existingIndex =
        prevCart.findIndex(
          item =>
            item.product?.id ===
            product.id
        );

      if (
        existingIndex >= 0
      ) {
        const updated = [
          ...prevCart,
        ];

        const existing =
          updated[
            existingIndex
          ];

        const newQuantity =
          Number(
            (
              Number(
                existing.quantity || 0
              ) +
              safeQuantity
            ).toFixed(3)
          );

        const total =
          Number(
            (
              newQuantity *
                Number(
                  existing.unitPrice ||
                    0
                ) -
              Number(
                existing.discount ||
                  0
              )
            ).toFixed(2)
          );

        updated[
          existingIndex
        ] = {
          ...existing,
          quantity:
            newQuantity,
          total,
        };

        return updated;
      }

      const total =
        Number(
          (
            safeQuantity *
            Number(
              product.sellingPrice ||
                0
            )
          ).toFixed(2)
        );

      return [
        ...prevCart,
        {
          product,
          quantity:
            safeQuantity,
          unitPrice:
            Number(
              product.sellingPrice ||
                0
            ),
          discount: 0,
          total,
        },
      ];
    });
  };

  const updateCartQuantity = (
    productId: string,
    quantity: number
  ) => {
    const safeQuantity =
      Number(quantity);

    if (
      !Number.isFinite(
        safeQuantity
      ) ||
      safeQuantity <= 0
    ) {
      setCart(prev =>
        prev.filter(
          item =>
            item.product?.id !==
            productId
        )
      );

      return;
    }

    setCart(prev =>
      prev.map(item => {
        if (
          item.product?.id !==
          productId
        ) {
          return item;
        }

        const total =
          Number(
            (
              safeQuantity *
                Number(
                  item.unitPrice ||
                    0
                ) -
              Number(
                item.discount ||
                  0
              )
            ).toFixed(2)
          );

        return {
          ...item,
          quantity:
            Number(
              safeQuantity.toFixed(3)
            ),
          total,
        };
      })
    );
  };

  const updateCartDiscount = (
    productId: string,
    discount: number
  ) => {
    const safeDiscount =
      Math.max(
        0,
        Number(discount) || 0
      );

    setCart(prev =>
      prev.map(item => {
        if (
          item.product?.id !==
          productId
        ) {
          return item;
        }

        const subtotal =
          Number(
            item.quantity || 0
          ) *
          Number(
            item.unitPrice || 0
          );

        const finalDiscount =
          Math.min(
            safeDiscount,
            subtotal
          );

        const total =
          Number(
            (
              subtotal -
              finalDiscount
            ).toFixed(2)
          );

        return {
          ...item,
          discount:
            finalDiscount,
          total,
        };
      })
    );
  };

  const removeFromCart = (
    productId: string
  ) => {
    setCart(prev =>
      prev.filter(
        item =>
          item.product?.id !==
          productId
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const completeSale = (
    paymentMethod: PaymentMethod,
    amountPaid: number,
    customerEmail?: string,
    customerName?: string,
    notes?: string
  ): SaleWithCancellation => {
    if (cart.length === 0) {
      throw new Error(
        'No hay productos en el ticket.'
      );
    }

    let subtotal = 0;
    let discountTotal = 0;
    let costTotal = 0;

    const saleItems:
      SaleItem[] =
      cart.map(item => {
        const quantity =
          Number(
            item.quantity || 0
          );

        const unitPrice =
          Number(
            item.unitPrice || 0
          );

        const discount =
          Number(
            item.discount || 0
          );

        const product =
          item.product;

        const itemSubtotal =
          quantity *
          unitPrice;

        const itemTotal =
          Math.max(
            0,
            itemSubtotal -
              discount
          );

        subtotal +=
          itemSubtotal;

        discountTotal +=
          discount;

        costTotal +=
          quantity *
          Number(
            product.purchasePrice ||
              0
          );

        return {
          productId:
            product.id,

          productName:
            product.name,

          category:
            product.category,

          quantity,

          unit:
            product.unit,

          purchasePrice:
            Number(
              product.purchasePrice ||
                0
            ),

          sellingPrice:
            unitPrice,

          discount,

          total:
            Number(
              itemTotal.toFixed(2)
            ),
        };
      });

    subtotal =
      Number(
        subtotal.toFixed(2)
      );

    discountTotal =
      Number(
        discountTotal.toFixed(2)
      );

    costTotal =
      Number(
        costTotal.toFixed(2)
      );

    const total =
      Number(
        Math.max(
          0,
          subtotal -
            discountTotal
        ).toFixed(2)
      );

    const safeAmountPaid =
      Number(
        amountPaid || 0
      );

    const changeGiven =
      Number(
        Math.max(
          0,
          safeAmountPaid -
            total
        ).toFixed(2)
      );

    const profitTotal =
      Number(
        (
          total -
          costTotal
        ).toFixed(2)
      );

    const now = getNow();

    const newSale:
      SaleWithCancellation =
      {
        id:
          'sale-' +
          Date.now() +
          '-' +
          Math.random()
            .toString(36)
            .substring(2, 7),

        ticketNumber:
          `TCK-${Date.now()
            .toString()
            .slice(-6)}`,

        date: now,

        items:
          saleItems,

        subtotal,

        discountTotal,

        total,

        costTotal,

        profitTotal,

        paymentMethod,

        amountPaid:
          safeAmountPaid,

        cashRendered:
          safeAmountPaid,

        changeGiven,

        changeAmount:
          changeGiven,

        cashierName:
          activeCashierName,

        customerEmail,

        customerName,

        notes,

        cancelled: false,
      };

    const stockUpdates =
      cart
        .map(item => {
          const productId =
            item.product?.id;

          const quantity =
            Number(
              item.quantity || 0
            );

          const currentProduct =
            products.find(
              product =>
                product.id ===
                productId
            );

          if (
            !currentProduct ||
            !productId
          ) {
            return null;
          }

          const currentStock =
            Number(
              currentProduct.stock ||
                0
            );

          const updatedStock =
            Number(
              Math.max(
                0,
                currentStock -
                  quantity
              ).toFixed(3)
            );

          return {
            productId,
            updatedStock,
            updatedAt: now,
          };
        })
        .filter(Boolean) as Array<{
        productId: string;
        updatedStock: number;
        updatedAt: string;
      }>;

    setProducts(prev =>
      prev.map(product => {
        const update =
          stockUpdates.find(
            item =>
              item.productId ===
              product.id
          );

        if (!update) {
          return product;
        }

        return {
          ...product,
          stock:
            update.updatedStock,
          updatedAt:
            update.updatedAt,
        };
      })
    );

    setSales(prev => [
      newSale,
      ...prev.filter(
        sale =>
          sale.id !==
          newSale.id
      ),
    ]);

    clearCart();

    setCloudSyncStatus(
      'syncing'
    );

    void (async () => {
      try {
        await syncSaleToCloud(
          newSale
        );

        if (
          stockUpdates.length > 0
        ) {
          const results =
            await Promise.all(
              stockUpdates.map(
                update =>
                  supabase
                    .from('products')
                    .update({
                      stock:
                        update.updatedStock,
                      updated_at:
                        update.updatedAt,
                    })
                    .eq(
                      'id',
                      update.productId
                    )
              )
            );

          const failed =
            results.find(
              result =>
                result.error
            );

          if (failed?.error) {
            throw failed.error;
          }
        }

        setCloudSyncStatus(
          'synced'
        );

        setLastSyncedAt(
          getTime()
        );
      } catch (error) {
        console.error(
          'Error sincronizando venta:',
          error
        );

        setCloudSyncStatus(
          'error'
        );
      }
    })();

    return newSale;
  };

  const cancelSale =
    async (
      saleId: string,
      reason = 'Venta cancelada'
    ): Promise<boolean> => {
      const sale =
        sales.find(
          item =>
            item.id ===
            saleId
        );

      if (!sale) {
        console.error(
          'No se encontró la venta:',
          saleId
        );

        return false;
      }

      if (sale.cancelled) {
        return false;
      }

      const cancelledAt =
        getNow();

      const stockUpdates =
        sale.items
          .map(item => {
            const product =
              products.find(
                product =>
                  product.id ===
                  item.productId
              );

            if (!product) {
              return null;
            }

            const currentStock =
              Number(
                product.stock || 0
              );

            const quantity =
              Number(
                item.quantity || 0
              );

            const restoredStock =
              Number(
                (
                  currentStock +
                  quantity
                ).toFixed(3)
              );

            return {
              productId:
                product.id,
              updatedStock:
                restoredStock,
              updatedAt:
                cancelledAt,
            };
          })
          .filter(Boolean) as Array<{
          productId: string;
          updatedStock: number;
          updatedAt: string;
        }>;

      const cancelledSale:
        SaleWithCancellation =
        {
          ...sale,

          cancelled: true,

          cancelledAt,

          cancelledBy:
            activeCashierName,

          cancellationReason:
            reason ||
            'Venta cancelada',
        };

      setProducts(prev =>
        prev.map(product => {
          const update =
            stockUpdates.find(
              item =>
                item.productId ===
                product.id
            );

          if (!update) {
            return product;
          }

          return {
            ...product,
            stock:
              update.updatedStock,
            updatedAt:
              update.updatedAt,
          };
        })
      );

      setSales(prev =>
        prev.map(item =>
          item.id === saleId
            ? cancelledSale
            : item
        )
      );

      setCloudSyncStatus(
        'syncing'
      );

      try {
        await syncSaleToCloud(
          cancelledSale
        );

        if (
          stockUpdates.length > 0
        ) {
          const results =
            await Promise.all(
              stockUpdates.map(
                update =>
                  supabase
                    .from('products')
                    .update({
                      stock:
                        update.updatedStock,
                      updated_at:
                        update.updatedAt,
                    })
                    .eq(
                      'id',
                      update.productId
                    )
              )
            );

          const failed =
            results.find(
              result =>
                result.error
            );

          if (failed?.error) {
            throw failed.error;
          }
        }

        setCloudSyncStatus(
          'synced'
        );

        setLastSyncedAt(
          getTime()
        );

        return true;
      } catch (error) {
        console.error(
          'Error sincronizando cancelación:',
          error
        );

        setCloudSyncStatus(
          'error'
        );

        return false;
      }
    };

  const updateSettings = (
    newSettings: Partial<StoreSettings>
  ) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
    }));
  };

  const exportBackup = () => {
    const data = {
      products,
      sales,
      settings,
      exportedAt:
        getNow(),
      version:
        '3.0',
    };

    const jsonString =
      `data:application/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(
          data,
          null,
          2
        )
      )}`;

    const downloadAnchor =
      document.createElement(
        'a'
      );

    downloadAnchor.href =
      jsonString;

    downloadAnchor.download =
      `respaldo_tienda_${
        new Date()
          .toISOString()
          .split('T')[0]
      }.json`;

    document.body.appendChild(
      downloadAnchor
    );

    downloadAnchor.click();

    downloadAnchor.remove();
  };

  const importBackup = (
    jsonData: string
  ): boolean => {
    try {
      const parsed =
        JSON.parse(
          jsonData
        );

      if (
        Array.isArray(
          parsed?.products
        )
      ) {
        setProducts(
          parsed.products
        );
      }

      if (
        Array.isArray(
          parsed?.sales
        )
      ) {
        setSales(
          parsed.sales
        );
      }

      if (
        parsed?.settings
      ) {
        setSettings(
          parsed.settings
        );
      }

      return true;
    } catch (error) {
      console.error(
        'Error importando respaldo:',
        error
      );

      return false;
    }
  };

  const resetDemoData = () => {
    setProducts(
      INITIAL_PRODUCTS
    );

    setSales(
      generateInitialSales()
    );

    setSettings(
      INITIAL_SETTINGS
    );

    setCart([]);

    setCloudSyncStatus(
      'offline'
    );
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
        cancelSale,

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
  const context =
    useContext(
      AppContext
    );

  if (!context) {
    throw new Error(
      'useApp must be used within an AppProvider'
    );
  }

  return context;
};