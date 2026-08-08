
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, CartItem, PaymentMethod, Sale } from '../../types';
import { CATEGORY_LABELS } from '../../data/initialData';
import { getExpirationStatus } from '../../utils/inventoryUtils';
import { TicketModal } from '../tickets/TicketModal';
import { CameraScannerModal } from './CameraScannerModal';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Barcode,
  Search,
  DollarSign,
  Scale,
  Camera,
  RefreshCw,
  X
} from 'lucide-react';

export const POSView: React.FC = () => {
  const appContext = useApp() as any;

  const {
    products = [],
    cart = [],
    addToCart = () => {},
    updateCartQuantity = () => {},
    removeFromCart = () => {},
    clearCart = () => {},
    completeSale = () => {},
    searchQuery = '',
    setSearchQuery = () => {},
    selectedCategory = 'todas',
    setSelectedCategory = () => {},
    settings = {},
    refreshProducts
  } = appContext || {};

  const [weightedProduct, setWeightedProduct] = useState<Product | null>(null);

  const [weightMode, setWeightMode] = useState<'weight' | 'money'>('money');

  const [weightUnit, setWeightUnit] = useState<'g' | 'kg'>('g');

  const [weightValue, setWeightValue] = useState('500');

  const [moneyValue, setMoneyValue] = useState('20');

  const [weightedError, setWeightedError] = useState('');

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('efectivo');

  const [cashRendered, setCashRendered] = useState('');

  const [customerEmail, setCustomerEmail] = useState('');

  const [customerName, setCustomerName] = useState('');

  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  const [showTicketModal, setShowTicketModal] = useState(false);

  const [showCameraScanner, setShowCameraScanner] = useState(false);

  const handleRefreshData = async () => {
    if (refreshProducts) {
      await refreshProducts();
    } else {
      window.location.reload();
    }
  };

  const filteredProducts = products.filter((p: Product) => {
    const matchesCategory =
      selectedCategory === 'todas' ||
      p?.category === selectedCategory;

    const q = searchQuery.toLowerCase().trim();

    const matchesSearch =
      !q ||
      p?.name?.toLowerCase().includes(q) ||
      p?.barcode?.includes(q) ||
      p?.category?.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  const subtotal = cart.reduce(
    (acc: number, item: CartItem) =>
      acc + (item?.quantity || 0) * (item?.unitPrice || 0),
    0
  );

  const discounts = cart.reduce(
    (acc: number, item: CartItem) =>
      acc + (item?.discount || 0),
    0
  );

  const total = subtotal - discounts;

  const formatCurrency = (val: number) =>
    `${settings?.currencySymbol || '$'}${val.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

  /*
   * Convierte el valor introducido por el usuario
   * a kilogramos.
   *
   * Por importe:
   *   importe / precio por kg = kg
   *
   * Por peso:
   *   gramos / 1000 = kg
   */
  const calculateFinalWeightInKg = (): number => {
    if (!weightedProduct) return 0;

    if (weightMode === 'money') {
      const money =
        Number.parseFloat(
          String(moneyValue ?? '').replace(',', '.')
        ) || 0;

      const sellingPrice =
        Number.parseFloat(
          String(weightedProduct.sellingPrice ?? '').replace(',', '.')
        ) || 0;

      if (money <= 0 || sellingPrice <= 0) {
        return 0;
      }

      return Number((money / sellingPrice).toFixed(3));
    }

    const val =
      Number.parseFloat(
        String(weightValue ?? '').replace(',', '.')
      ) || 0;

    if (val <= 0) {
      return 0;
    }

    if (weightUnit === 'g') {
      return Number((val / 1000).toFixed(3));
    }

    return Number(val.toFixed(3));
  };

  const handleProductClick = (product: Product) => {
    if ((product?.stock || 0) <= 0) return;

    const unit = product?.unit || 'pieza';

    if (unit === 'kg' || unit === 'g') {
      setWeightedProduct(product);

      setWeightedError('');

      setWeightMode('money');

      setMoneyValue('20');

      setWeightUnit('g');

      setWeightValue('500');
    } else {
      addToCart(product, 1);
    }
  };

  /*
   * Confirma la venta de un producto vendido por peso.
   *
   * También valida el precio para evitar que el botón
   * parezca no responder cuando el producto no tiene
   * precio válido.
   */
  const confirmWeightedAddition = () => {
    if (!weightedProduct) return;

    const sellingPrice =
      Number.parseFloat(
        String(weightedProduct.sellingPrice ?? '').replace(',', '.')
      ) || 0;

    const finalKg = calculateFinalWeightInKg();

    if (weightMode === 'money' && sellingPrice <= 0) {
      setWeightedError(
        'Este producto no tiene un precio de venta válido. Ingresa un precio mayor a $0 en Inventario.'
      );
      return;
    }

    if (finalKg <= 0) {
      setWeightedError(
        weightMode === 'money'
          ? 'Ingresa un importe mayor a $0.'
          : 'Ingresa un peso mayor a 0.'
      );
      return;
    }

    setWeightedError('');

    addToCart(weightedProduct, finalKg);

    setWeightedProduct(null);
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchQuery) return;

    const matched = products.find(
      (p: Product) =>
        p?.barcode === searchQuery.trim()
    );

    if (matched) {
      handleProductClick(matched);
      setSearchQuery('');
    }
  };

  const cashNumber =
    parseFloat(cashRendered) || 0;

  const changeAmount =
    Math.max(0, cashNumber - total);

  const handleFinishSale = () => {
    if (cart.length === 0) return;

    const sale = completeSale(
      paymentMethod,
      cashNumber || total,
      customerEmail,
      customerName
    );

    setCompletedSale(sale);

    setShowCheckoutModal(false);

    setShowTicketModal(true);

    setCashRendered('');

    setCustomerEmail('');

    setCustomerName('');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">

      {/* SECCIÓN IZQUIERDA: Catálogo y Categorías */}

      <div className="flex-1 flex flex-col space-y-3 min-w-0">

        {/* Filtros de Categoría */}

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">

          <button
            type="button"
            onClick={() => setSelectedCategory('todas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedCategory === 'todas'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Todas
          </button>

          {Object.entries(CATEGORY_LABELS).map(
            ([catKey, catMeta]: [string, any]) => {

              const isActive =
                selectedCategory === catKey;

              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() =>
                    setSelectedCategory(catKey)
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{catMeta?.icon}</span>

                  <span>{catMeta?.name}</span>
                </button>
              );
            }
          )}

        </div>

        {/* Buscador y Código de Barras */}

        <form
          onSubmit={handleBarcodeSubmit}
          className="flex gap-2 flex-wrap sm:flex-nowrap"
        >

          <div className="relative flex-1 min-w-[200px]">

            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />

            <input
              type="text"
              value={searchQuery}
              onChange={e =>
                setSearchQuery(e.target.value)
              }
              placeholder="Escanear código de barras o buscar..."
              className="w-full bg-white text-slate-800 placeholder-slate-400 text-sm rounded-xl pl-9 pr-3 py-2 border border-slate-300 focus:outline-none focus:border-emerald-500 shadow-2xs"
            />

          </div>

          <button
            type="button"
            onClick={handleRefreshData}
            className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refrescar catálogo desde la base de datos"
          >
            <RefreshCw className="w-4 h-4 text-emerald-400" />

            <span className="hidden sm:inline">
              Actualizar
            </span>
          </button>

          <button
            type="submit"
            className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Buscar por código de barras ingresado"
          >
            <Barcode className="w-4 h-4 text-emerald-400" />

            <span className="hidden sm:inline">
              Buscar Código
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setShowCameraScanner(true)
            }
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Escanear con la cámara del dispositivo"
          >
            <Camera className="w-4 h-4 text-white animate-pulse" />

            <span className="hidden sm:inline">
              Cámara
            </span>
          </button>

        </form>

        {/* Grid de Tarjetas de Producto */}

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">

          {filteredProducts.length === 0 ? (

            <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 p-6">

              <p className="text-sm font-medium">
                No se encontraron productos en esta categoría o búsqueda.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('todas');
                }}
                className="mt-2 text-xs text-emerald-600 hover:underline font-semibold cursor-pointer"
              >
                Ver todos los productos
              </button>

            </div>

          ) : (

            filteredProducts.map(
              (product: Product) => {

                const expInfo =
                  getExpirationStatus(
                    product,
                    settings?.expirationWarningDays || 7
                  );

                const isOutOfStock =
                  (product?.stock || 0) <= 0;

                const isLowStock =
                  (product?.stock || 0) <=
                    (product?.minStock || 0) &&
                  !isOutOfStock;

                const unit =
                  product?.unit || 'pieza';

                return (
                  <div
                    key={product?.id}
                    onClick={() =>
                      handleProductClick(product)
                    }
                    className={`relative group bg-white rounded-2xl p-2.5 border transition-all cursor-pointer flex flex-col justify-between hover:shadow-md ${
                      isOutOfStock
                        ? 'opacity-60 border-slate-200 bg-slate-50 cursor-not-allowed'
                        : 'border-slate-200 hover:border-emerald-500'
                    }`}
                  >

                    <div className="flex items-center justify-between gap-1 mb-1.5">

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                        {CATEGORY_LABELS[
                          product?.category
                        ]?.icon || '📦'}{' '}
                        {unit}
                      </span>

                      {expInfo?.status === 'expired' ||
                      expInfo?.status === 'critical' ? (

                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${expInfo?.badgeBg}`}
                        >
                          {expInfo?.daysRemaining === 0
                            ? 'Hoy'
                            : `${expInfo?.daysRemaining}d`}
                        </span>

                      ) : null}

                    </div>

                    <div className="flex items-center gap-2 mb-2">

                      {product?.imageUrl ? (

                        <img
                          src={product.imageUrl}
                          alt={product?.name || 'Producto'}
                          className="w-12 h-12 object-cover rounded-xl border border-slate-100 flex-shrink-0"
                        />

                      ) : (

                        <div className="w-12 h-12 bg-emerald-50 text-emerald-700 font-bold rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                          {product?.name?.charAt(0) || '?'}
                        </div>

                      )}

                      <div className="min-w-0">

                        <h3 className="font-semibold text-xs text-slate-900 line-clamp-2 leading-snug">
                          {product?.name}
                        </h3>

                        <p className="text-[11px] text-slate-500 font-medium">
                          Stock:{' '}

                          <span
                            className={
                              isLowStock
                                ? 'text-amber-600 font-bold'
                                : ''
                            }
                          >
                            {product?.stock}
                          </span>

                        </p>

                      </div>

                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 mt-auto">

                      <div>

                        <span className="text-xs text-slate-400 font-medium leading-none">
                          $
                        </span>

                        <span className="text-sm font-black text-slate-900">
                          {(Number(product?.sellingPrice) || 0).toFixed(2)}
                        </span>

                        <span className="text-[10px] text-slate-500">
                          /{unit}
                        </span>

                      </div>

                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={e => {
                          e.stopPropagation();

                          if (!isOutOfStock) {
                            handleProductClick(product);
                          }
                        }}
                        className={`p-1.5 rounded-xl transition-all ${
                          isOutOfStock
                            ? 'bg-slate-200 text-slate-400'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs group-hover:scale-105'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>

                    </div>

                  </div>
                );
              }
            )

          )}

        </div>

      </div>

      {/* SECCIÓN DERECHA: Carrito y Resumen */}

      <div className="w-full lg:w-96 bg-white rounded-2xl border border-slate-200 flex flex-col shadow-sm h-full max-h-[calc(100vh-80px)]">

        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white rounded-t-2xl">

          <div className="flex items-center gap-2">

            <ShoppingCart className="w-5 h-5 text-emerald-400" />

            <h2 className="font-bold text-sm">
              Ticket de Venta
            </h2>

          </div>

          {cart.length > 0 && (

            <button
              type="button"
              onClick={clearCart}
              className="text-xs text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
              title="Vaciar ticket"
            >
              <Trash2 className="w-3.5 h-3.5" />

              <span>Vaciar</span>
            </button>

          )}

        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-slate-100">

          {cart.length === 0 ? (

            <div className="py-16 text-center text-slate-400">

              <ShoppingCart className="w-10 h-10 mx-auto text-slate-300 mb-2" />

              <p className="text-sm font-medium">
                El ticket está vacío
              </p>

              <p className="text-xs text-slate-400">
                Toca un producto para agregar al carrito
              </p>

            </div>

          ) : (

            cart.map((item: CartItem) => {

              const itemUnit =
                item?.product?.unit || 'pieza';

              const itemName =
                item?.product?.name || 'Artículo';

              const itemId =
                item?.product?.id;

              return (

                <div
                  key={itemId}
                  className="pt-2 first:pt-0 flex items-center justify-between gap-2"
                >

                  <div className="flex-1 min-w-0">

                    <h4 className="text-xs font-semibold text-slate-800 truncate">
                      {itemName}
                    </h4>

                    <div className="text-[11px] text-slate-500">
                      {item?.quantity} {itemUnit} ×{' '}
                      {formatCurrency(item?.unitPrice || 0)}
                    </div>

                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">

                    <button
                      type="button"
                      onClick={() => {

                        const step =
                          itemUnit === 'kg' ||
                          itemUnit === 'g'
                            ? 0.1
                            : 1;

                        const nextQty =
                          Math.max(
                            0.01,
                            Number(
                              (
                                (item?.quantity || 0) -
                                step
                              ).toFixed(3)
                            )
                          );

                        if (itemId) {
                          updateCartQuantity(
                            itemId,
                            nextQty
                          );
                        }

                      }}
                      className="w-6 h-6 bg-white text-slate-700 rounded-md flex items-center justify-center text-xs font-bold hover:bg-slate-200 cursor-pointer shadow-2xs"
                    >
                      -
                    </button>

                    <input
                      type="number"
                      step={
                        itemUnit === 'kg'
                          ? '0.05'
                          : '1'
                      }
                      value={item?.quantity || 1}
                      onChange={e => {

                        const val =
                          parseFloat(
                            e.target.value
                          );

                        if (
                          !isNaN(val) &&
                          val > 0 &&
                          itemId
                        ) {
                          updateCartQuantity(
                            itemId,
                            Number(
                              val.toFixed(3)
                            )
                          );
                        }

                      }}
                      className="w-12 text-center text-xs font-extrabold text-slate-900 bg-white border border-slate-200 rounded py-0.5 focus:outline-none focus:border-emerald-500"
                    />

                    <button
                      type="button"
                      onClick={() => {

                        const step =
                          itemUnit === 'kg' ||
                          itemUnit === 'g'
                            ? 0.1
                            : 1;

                        const nextQty =
                          Number(
                            (
                              (item?.quantity || 0) +
                              step
                            ).toFixed(3)
                          );

                        if (itemId) {
                          updateCartQuantity(
                            itemId,
                            nextQty
                          );
                        }

                      }}
                      className="w-6 h-6 bg-white text-slate-700 rounded-md flex items-center justify-center text-xs font-bold hover:bg-slate-200 cursor-pointer shadow-2xs"
                    >
                      +
                    </button>

                  </div>

                  <div className="text-right min-w-[60px]">

                    <span className="text-xs font-bold text-slate-900">
                      {formatCurrency(
                        item?.total || 0
                      )}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        itemId &&
                        removeFromCart(itemId)
                      }
                      className="block text-[10px] text-slate-400 hover:text-red-500 ml-auto mt-0.5 cursor-pointer"
                    >
                      Eliminar
                    </button>

                  </div>

                </div>
              );
            })

          )}

        </div>

        {/* Panel Inferior de Cobro */}

        <div className="p-3.5 bg-slate-50 border-t border-slate-200 rounded-b-2xl space-y-2.5">

          <div className="space-y-1 text-xs text-slate-600">

            <div className="flex justify-between">

              <span>Subtotal:</span>

              <span className="font-semibold text-slate-800">
                {formatCurrency(subtotal)}
              </span>

            </div>

            {discounts > 0 && (

              <div className="flex justify-between text-emerald-600">

                <span>Descuentos:</span>

                <span className="font-semibold">
                  -{formatCurrency(discounts)}
                </span>

              </div>

            )}

            <div className="flex justify-between text-base font-black text-slate-900 pt-1 border-t border-slate-200">

              <span>TOTAL:</span>

              <span className="text-emerald-700">
                {formatCurrency(total)}
              </span>

            </div>

          </div>

          <button
            type="button"
            disabled={cart.length === 0}
            onClick={() => {

              setCashRendered(
                total.toString()
              );

              setShowCheckoutModal(true);

            }}
            className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
              cart.length === 0
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
            }`}
          >

            <DollarSign className="w-5 h-5" />

            <span>
              COBRAR ({formatCurrency(total)})
            </span>

          </button>

        </div>

      </div>

      {/* MODAL DE PESAJE / IMPORTE */}

      {weightedProduct && (

        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">

          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-100">

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center font-bold">

                  <Scale className="w-5 h-5" />

                </div>

                <div>

                  <h3 className="font-bold text-slate-900 text-sm">
                    {weightedProduct?.name}
                  </h3>

                  <p className="text-xs text-slate-500">

                    Precio:{' '}

                    <span className="font-bold text-emerald-700">
                      {formatCurrency(
                        Number(
                          weightedProduct?.sellingPrice
                        ) || 0
                      )}
                    </span>{' '}

                    por {weightedProduct?.unit || 'pieza'}

                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() => {

                  setWeightedProduct(null);

                  setWeightedError('');

                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 cursor-pointer"
              >

                <X className="w-5 h-5" />

              </button>

            </div>

            {/* Pestañas de Cambio de Modo */}

            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">

              <button
                type="button"
                onClick={() => {

                  setWeightMode('money');

                  setWeightedError('');

                }}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  weightMode === 'money'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>
                  💵 Por Importe ($)
                </span>
              </button>

              <button
                type="button"
                onClick={() => {

                  setWeightMode('weight');

                  setWeightedError('');

                }}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  weightMode === 'weight'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>
                  ⚖️ Por Peso Exacto
                </span>
              </button>

            </div>

            {/* PESTAÑA: POR IMPORTE */}

            {weightMode === 'money' && (

              <div className="space-y-3">

                <label className="block text-xs font-bold text-slate-700">
                  ¿Cuánto marcó la báscula en pesos ($)?
                </label>

                <div className="relative">

                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">
                    $
                  </span>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={moneyValue}
                    onChange={e => {

                      setMoneyValue(
                        e.target.value
                      );

                      setWeightedError('');

                    }}
                    autoFocus
                    placeholder="Ej: 20, 35, 50"
                    className="w-full text-center text-3xl font-black text-slate-900 border-2 border-emerald-500 rounded-2xl py-2 pl-8 focus:outline-none bg-emerald-50/20"
                  />

                </div>

                <div className="grid grid-cols-4 gap-1.5">

                  {[
                    '10',
                    '15',
                    '20',
                    '25',
                    '30',
                    '35',
                    '40',
                    '50',
                    '70',
                    '100',
                    '150',
                    '200'
                  ].map(m => (

                    <button
                      key={m}
                      type="button"
                      onClick={() => {

                        setMoneyValue(m);

                        setWeightedError('');

                      }}
                      className={`py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        moneyValue === m
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ${m}
                    </button>

                  ))}

                </div>

              </div>

            )}

            {/* PESTAÑA: POR PESO EXACTO */}

            {weightMode === 'weight' && (

              <div className="space-y-3">

                <div className="flex items-center justify-between">

                  <label className="text-xs font-bold text-slate-700">
                    Unidad de Medición:
                  </label>

                  <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-xs font-bold">

                    <button
                      type="button"
                      onClick={() => {

                        setWeightUnit('g');

                        setWeightValue('500');

                        setWeightedError('');

                      }}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                        weightUnit === 'g'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600'
                      }`}
                    >
                      Gramos (g)
                    </button>

                    <button
                      type="button"
                      onClick={() => {

                        setWeightUnit('kg');

                        setWeightValue('0.500');

                        setWeightedError('');

                      }}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                        weightUnit === 'kg'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600'
                      }`}
                    >
                      Kilos (kg)
                    </button>

                  </div>

                </div>

                <div>

                  <input
                    type="number"
                    min="0"
                    step={
                      weightUnit === 'g'
                        ? '10'
                        : '0.05'
                    }
                    value={weightValue}
                    onChange={e => {

                      setWeightValue(
                        e.target.value
                      );

                      setWeightedError('');

                    }}
                    autoFocus
                    className="w-full text-center text-3xl font-black text-slate-900 border-2 border-emerald-500 rounded-2xl py-2 focus:outline-none bg-emerald-50/20"
                  />

                  <div className="grid grid-cols-4 gap-1.5 mt-2">

                    {(weightUnit === 'g'
                      ? [
                          {
                            label: '250g',
                            val: '250'
                          },
                          {
                            label: '500g',
                            val: '500'
                          },
                          {
                            label: '750g',
                            val: '750'
                          },
                          {
                            label: '1000g',
                            val: '1000'
                          }
                        ]
                      : [
                          {
                            label: '0.25 kg',
                            val: '0.25'
                          },
                          {
                            label: '0.50 kg',
                            val: '0.5'
                          },
                          {
                            label: '0.75 kg',
                            val: '0.75'
                          },
                          {
                            label: '1.00 kg',
                            val: '1.0'
                          }
                        ]
                    ).map(p => (

                      <button
                        key={p.val}
                        type="button"
                        onClick={() => {

                          setWeightValue(
                            p.val
                          );

                          setWeightedError('');

                        }}
                        className={`py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          weightValue === p.val
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {p.label}
                      </button>

                    ))}

                  </div>

                </div>

              </div>

            )}

            {/* MENSAJE DE ERROR */}

            {weightedError && (

              <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-xs font-semibold">
                {weightedError}
              </div>

            )}

            {/* CÁLCULO EN TIEMPO REAL */}

            {(() => {

              const finalKg =
                calculateFinalWeightInKg();

              const finalGrams =
                Math.round(finalKg * 1000);

              const itemTotal =
                Number(
                  (
                    finalKg *
                    (
                      Number(
                        weightedProduct?.sellingPrice
                      ) || 0
                    )
                  ).toFixed(2)
                );

              return (

                <div className="bg-slate-900 text-white rounded-2xl p-3.5 space-y-1.5 shadow-sm">

                  <div className="flex justify-between items-center text-xs text-slate-300">

                    <span>
                      Peso equivalente exacto:
                    </span>

                    <span className="font-bold text-emerald-400 text-sm">

                      {finalKg.toFixed(3)} kg (
                      {finalGrams} g)

                    </span>

                  </div>

                  <div className="flex justify-between items-center text-sm font-black pt-1 border-t border-slate-800">

                    <span>
                      Importe total a cobrar:
                    </span>

                    <span className="text-emerald-400 text-base">
                      {formatCurrency(itemTotal)}
                    </span>

                  </div>

                </div>

              );

            })()}

            {/* BOTONES DE ACCIÓN */}

            <div className="flex gap-2">

              <button
                type="button"
                onClick={() => {

                  setWeightedProduct(null);

                  setWeightedError('');

                }}
                className="flex-1 py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmWeightedAddition}
                className="flex-2 py-2.5 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md cursor-pointer transition-colors"
              >
                AGREGAR AL TICKET
              </button>

            </div>

          </div>

        </div>

      )}

      {/* MODAL DE PAGO Y COBRO */}

      {showCheckoutModal && (

        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">

          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100">

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">

              <div>

                <h3 className="text-lg font-black text-slate-900">
                  Cobrar Venta
                </h3>

                <p className="text-xs text-slate-500">

                  Total a Pagar:{' '}

                  <span className="font-bold text-emerald-600">
                    {formatCurrency(total)}
                  </span>

                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCheckoutModal(false)
                }
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

            </div>

            {/* Selección de Método de Pago */}

            <div className="grid grid-cols-2 gap-2">

              <button
                type="button"
                onClick={() =>
                  setPaymentMethod('efectivo')
                }
                className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  paymentMethod === 'efectivo'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >

                <DollarSign className="w-4 h-4 text-emerald-400" />

                <span>Efectivo</span>

              </button>

              <button
                type="button"
                onClick={() =>
                  setPaymentMethod('tarjeta')
                }
                className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  paymentMethod === 'tarjeta'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <span>Tarjeta</span>
              </button>

            </div>

            {/* Cálculo de Cambio en Efectivo */}

            {paymentMethod === 'efectivo' && (

              <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">

                <label className="block text-xs font-bold text-slate-700">
                  Efectivo Recibido ($):
                </label>

                <input
                  type="number"
                  value={cashRendered}
                  onChange={e =>
                    setCashRendered(
                      e.target.value
                    )
                  }
                  placeholder="0.00"
                  autoFocus
                  className="w-full text-center text-2xl font-black text-slate-900 border border-slate-300 rounded-xl py-2 bg-white focus:outline-none focus:border-emerald-500"
                />

                <div className="flex justify-between items-center text-xs pt-1 font-semibold text-slate-700">

                  <span>
                    Cambio a Devolver:
                  </span>

                  <span
                    className={`text-sm font-black ${
                      changeAmount < 0
                        ? 'text-red-500'
                        : 'text-emerald-600'
                    }`}
                  >
                    {formatCurrency(
                      changeAmount
                    )}
                  </span>

                </div>

              </div>

            )}

            {/* Datos del Cliente */}

            <div className="space-y-2">

              <label className="block text-xs font-bold text-slate-700">
                Datos del Cliente (Opcional):
              </label>

              <input
                type="text"
                value={customerName}
                onChange={e =>
                  setCustomerName(
                    e.target.value
                  )
                }
                placeholder="Nombre del cliente"
                className="w-full text-xs border border-slate-300 rounded-xl py-2 px-3 focus:outline-none focus:border-emerald-500"
              />

              <input
                type="email"
                value={customerEmail}
                onChange={e =>
                  setCustomerEmail(
                    e.target.value
                  )
                }
                placeholder="Correo electrónico para ticket digital"
                className="w-full text-xs border border-slate-300 rounded-xl py-2 px-3 focus:outline-none focus:border-emerald-500"
              />

            </div>

            <div className="flex gap-2 pt-2">

              <button
                type="button"
                onClick={() =>
                  setShowCheckoutModal(false)
                }
                className="flex-1 py-3 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleFinishSale}
                className="flex-2 py-3 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md cursor-pointer transition-colors"
              >
                CONFIRMAR Y FINALIZAR
              </button>

            </div>

          </div>

        </div>

      )}

      {/* MODAL DEL TICKET FINALIZADO */}

      {showTicketModal && completedSale && (

        <TicketModal
          sale={completedSale}
          onClose={() => {

            setShowTicketModal(false);

            setCompletedSale(null);

          }}
        />

      )}

      {/* MODAL DE CÁMARA */}

      {showCameraScanner && (

        <CameraScannerModal
          products={products}
          onProductScanned={prod => {

            handleProductClick(prod);

            setShowCameraScanner(false);

          }}
          onUnknownBarcode={code => {

            setSearchQuery(code);

            setShowCameraScanner(false);

          }}
          onClose={() =>
            setShowCameraScanner(false)
          }
        />

      )}

    </div>
  );
};