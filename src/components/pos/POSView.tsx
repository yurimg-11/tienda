import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, ProductCategory, CartItem, PaymentMethod, Sale } from '../../types';
import { CATEGORY_LABELS } from '../../data/initialData';
import { getExpirationStatus, getStockStatus } from '../../utils/inventoryUtils';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Barcode,
  Search,
  CheckCircle2,
  Printer,
  Mail,
  DollarSign,
  CreditCard,
  Send,
  Sparkles,
  AlertTriangle,
  Scale,
  Camera
} from 'lucide-react';
import { TicketModal } from '../tickets/TicketModal';
import { EmailTicketModal } from '../tickets/EmailTicketModal';
import { CameraScannerModal } from './CameraScannerModal';

export const POSView: React.FC = () => {
  const {
    products,
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    completeSale,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    settings
  } = useApp();

  const [weightedProduct, setWeightedProduct] = useState<Product | null>(null);
  const [weightMode, setWeightMode] = useState<'weight' | 'money'>('weight'); // 'weight' or 'money'
  const [weightUnit, setWeightUnit] = useState<'g' | 'kg'>('g'); // 'g' for exact grams, 'kg' for decimal kilos
  const [weightValue, setWeightValue] = useState<string>('500'); // e.g. 500 grams or 0.5 kg
  const [moneyValue, setMoneyValue] = useState<string>('10'); // e.g. $10 pesos

  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [cashRendered, setCashRendered] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');

  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [showTicketModal, setShowTicketModal] = useState<boolean>(false);
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [showCameraScanner, setShowCameraScanner] = useState<boolean>(false);

  // Filter products by selected category and search
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'todas' || p.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.barcode.includes(q) ||
      p.category.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  // Calculate cart totals
  const subtotal = cart.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const discounts = cart.reduce((acc, item) => acc + item.discount, 0);
  const total = subtotal - discounts;

  const formatCurrency = (val: number) =>
    `${settings.currencySymbol}${val.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Calculate weight quantity from modal inputs
  const calculateFinalWeightInKg = (): number => {
    if (!weightedProduct) return 1;
    if (weightMode === 'money') {
      const money = parseFloat(moneyValue) || 0;
      if (weightedProduct.sellingPrice <= 0) return 0;
      return Number((money / weightedProduct.sellingPrice).toFixed(3));
    } else {
      const val = parseFloat(weightValue) || 0;
      if (weightUnit === 'g') {
        return Number((val / 1000).toFixed(3));
      } else {
        return Number(val.toFixed(3));
      }
    }
  };

  // Handle clicking a product to add to cart
  const handleProductClick = (product: Product) => {
    if (product.stock <= 0) return;

    if (product.unit === 'kg' || product.unit === 'g') {
      setWeightedProduct(product);
      setWeightMode('weight');
      setWeightUnit('g');
      setWeightValue('500'); // default 500 grams (medista)
      setMoneyValue('10');
    } else {
      addToCart(product, 1);
    }
  };

  const confirmWeightedAddition = () => {
    if (!weightedProduct) return;
    const finalKg = calculateFinalWeightInKg();
    if (finalKg <= 0) return;
    addToCart(weightedProduct, finalKg);
    setWeightedProduct(null);
  };

  // Fast Barcode Scan simulation
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;

    const matched = products.find(p => p.barcode === searchQuery.trim());
    if (matched) {
      handleProductClick(matched);
      setSearchQuery('');
    }
  };

  // Calculate change
  const cashNumber = parseFloat(cashRendered) || 0;
  const changeAmount = Math.max(0, cashNumber - total);

  // Handle Sale completion
  const handleFinishSale = (autoPrint: boolean = false, autoEmail: boolean = false) => {
    if (cart.length === 0) return;

    const sale = completeSale(paymentMethod, cashNumber || total, customerEmail, customerName);
    setCompletedSale(sale);
    setShowCheckoutModal(false);

    if (autoPrint) {
      setShowTicketModal(true);
    } else if (autoEmail && customerEmail) {
      setShowEmailModal(true);
    } else {
      setShowTicketModal(true);
    }

    // Reset state
    setCashRendered('');
    setCustomerEmail('');
    setCustomerName('');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full p-2 sm:p-4 bg-slate-50 min-h-[calc(100vh-65px)]">
      
      {/* LEFT SECTION: Catalog & Category Selector */}
      <div className="flex-1 flex flex-col space-y-3 min-w-0">
        
        {/* Category Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('todas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedCategory === 'todas'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
             Todas
          </button>
          {Object.entries(CATEGORY_LABELS).map(([catKey, catMeta]) => {
            const isActive = selectedCategory === catKey;
            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{catMeta.icon}</span>
                <span>{catMeta.name}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Search & Barcode Form */}
        <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Escanear código de barras o buscar..."
              className="w-full bg-white text-slate-800 placeholder-slate-400 text-sm rounded-xl pl-9 pr-3 py-2 border border-slate-300 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-2xs"
            />
          </div>
          <button
            type="submit"
            className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Buscar por código de barras ingresado"
          >
            <Barcode className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Buscar Código</span>
          </button>
          <button
            type="button"
            onClick={() => setShowCameraScanner(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Escanear con la cámara del dispositivo"
          >
            <Camera className="w-4 h-4 text-white animate-pulse" />
            <span className="hidden sm:inline">Escanear Cámara</span>
          </button>
        </form>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 p-6">
              <p className="text-sm font-medium">No se encontraron productos en esta categoría o búsqueda.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('todas');
                }}
                className="mt-2 text-xs text-emerald-600 hover:underline font-semibold"
              >
                Ver todos los productos
              </button>
            </div>
          ) : (
            filteredProducts.map(product => {
              const expInfo = getExpirationStatus(product, settings.expirationWarningDays);
              const isOutOfStock = product.stock <= 0;
              const isLowStock = product.stock <= product.minStock && !isOutOfStock;

              return (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className={`relative group bg-white rounded-2xl p-2.5 border transition-all cursor-pointer flex flex-col justify-between hover:shadow-md ${
                    isOutOfStock
                      ? 'opacity-60 border-slate-200 bg-slate-50 cursor-not-allowed'
                      : 'border-slate-200 hover:border-emerald-500'
                  }`}
                >
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {CATEGORY_LABELS[product.category]?.icon || '📦'} {product.unit}
                    </span>

                    {/* Expiration warning badge */}
                    {expInfo.status === 'expired' || expInfo.status === 'critical' ? (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${expInfo.badgeBg}`}>
                         {expInfo.daysRemaining === 0 ? 'Hoy' : `${expInfo.daysRemaining}d`}
                      </span>
                    ) : null}
                  </div>

                  {/* Image & Name */}
                  <div className="flex items-center gap-2 mb-2">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-xl border border-slate-100 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-700 font-bold rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                        {product.name.charAt(0)}
                      </div>
                    )}

                    <div className="min-w-0">
                      <h3 className="font-semibold text-xs text-slate-900 line-clamp-2 leading-snug">
                        {product.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Stock: <span className={isLowStock ? 'text-amber-600 font-bold' : ''}>{product.stock}</span>
                      </p>
                    </div>
                  </div>

                  {/* Price & Add Button */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 mt-auto">
                    <div>
                      <span className="text-xs text-slate-400 font-medium leading-none">$</span>
                      <span className="text-sm font-black text-slate-900">
                        {product.sellingPrice.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-500">/{product.unit}</span>
                    </div>

                    <button
                      disabled={isOutOfStock}
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
            })
          )}
        </div>
      </div>

      {/* RIGHT SECTION: Cart & Register Summary */}
      <div className="w-full lg:w-96 bg-white rounded-2xl border border-slate-200 flex flex-col shadow-sm h-full max-h-[calc(100vh-80px)]">
        
        {/* Cart Header */}
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white rounded-t-2xl">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-sm">Ticket de Venta</h2>
          </div>

          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1"
              title="Vaciar ticket"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Vaciar</span>
            </button>
          )}
        </div>

        {/* Cart Itemized List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <ShoppingCart className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">El ticket está vacío</p>
              <p className="text-xs text-slate-400">Haz clic en los productos para agregar al carrito</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-slate-800 truncate">{item.product.name}</h4>
                  <div className="text-[11px] text-slate-500">
                    {item.quantity} {item.product.unit} × {formatCurrency(item.unitPrice)}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button
                    onClick={() => {
                      const step = (item.product.unit === 'kg' || item.product.unit === 'g') ? 0.1 : 1;
                      const nextQty = Math.max(0.01, Number((item.quantity - step).toFixed(3)));
                      updateCartQuantity(item.product.id, nextQty);
                    }}
                    className="w-6 h-6 bg-white text-slate-700 rounded-md flex items-center justify-center text-xs font-bold hover:bg-slate-200 cursor-pointer shadow-2xs"
                    title="Disminuir"
                  >
                    -
                  </button>
                  
                  <input
                    type="number"
                    step={item.product.unit === 'kg' ? '0.05' : '1'}
                    value={item.quantity}
                    onChange={e => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val > 0) {
                        updateCartQuantity(item.product.id, Number(val.toFixed(3)));
                      }
                    }}
                    className="w-12 text-center text-xs font-extrabold text-slate-900 bg-white border border-slate-200 rounded py-0.5 focus:outline-none focus:border-emerald-500"
                  />

                  <button
                    onClick={() => {
                      const step = (item.product.unit === 'kg' || item.product.unit === 'g') ? 0.1 : 1;
                      const nextQty = Number((item.quantity + step).toFixed(3));
                      updateCartQuantity(item.product.id, nextQty);
                    }}
                    className="w-6 h-6 bg-white text-slate-700 rounded-md flex items-center justify-center text-xs font-bold hover:bg-slate-200 cursor-pointer shadow-2xs"
                    title="Aumentar"
                  >
                    +
                  </button>
                </div>

                {/* Item Total */}
                <div className="text-right min-w-[60px]">
                  <span className="text-xs font-bold text-slate-900">{formatCurrency(item.total)}</span>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="block text-[10px] text-slate-400 hover:text-red-500 ml-auto mt-0.5"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Totals & Checkout Panel */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 rounded-b-2xl space-y-2.5">
          <div className="space-y-1 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-800">{formatCurrency(subtotal)}</span>
            </div>
            {discounts > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Descuentos:</span>
                <span className="font-semibold">-{formatCurrency(discounts)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-slate-900 pt-1 border-t border-slate-200">
              <span>TOTAL:</span>
              <span className="text-emerald-700">{formatCurrency(total)}</span>
            </div>
          </div>

          <button
            disabled={cart.length === 0}
            onClick={() => {
              setCashRendered(total.toString());
              setShowCheckoutModal(true);
            }}
            className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
              cart.length === 0
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            <span>COBRAR ({formatCurrency(total)})</span>
          </button>
        </div>
      </div>

      {/* WEIGHT / MONEY DUAL INPUT MODAL */}
      {weightedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-100">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center font-bold">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{weightedProduct.name}</h3>
                  <p className="text-xs text-slate-500">
                    Precio: <span className="font-bold text-emerald-700">{formatCurrency(weightedProduct.sellingPrice)}</span> por {weightedProduct.unit}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWeightedProduct(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setWeightMode('weight')}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  weightMode === 'weight'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>⚖️ Por Peso Exacto</span>
              </button>
              <button
                type="button"
                onClick={() => setWeightMode('money')}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  weightMode === 'money'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>💵 Por Importe ($)</span>
              </button>
            </div>

            {/* TAB 1: POR PESO EXACTO */}
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
                      }}
                      className={`px-3 py-1 rounded-md transition-all ${
                        weightUnit === 'g' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      Gramos (g)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWeightUnit('kg');
                        setWeightValue('0.500');
                      }}
                      className={`px-3 py-1 rounded-md transition-all ${
                        weightUnit === 'kg' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      Kilos (kg)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Cantidad exactas en {weightUnit === 'g' ? 'Gramos (g)' : 'Kilogramos (kg)'}:
                  </label>
                  <input
                    type="number"
                    step={weightUnit === 'g' ? '10' : '0.05'}
                    value={weightValue}
                    onChange={e => setWeightValue(e.target.value)}
                    autoFocus
                    className="w-full text-center text-3xl font-black text-slate-900 border-2 border-emerald-500 rounded-2xl py-2 focus:outline-none bg-emerald-50/20"
                  />
                  
                  {/* Presets */}
                  <div className="grid grid-cols-4 gap-1.5 mt-2">
                    {weightUnit === 'g'
                      ? [
                          { label: '100g', val: '100' },
                          { label: '250g (1/4)', val: '250' },
                          { label: '500g (1/2)', val: '500' },
                          { label: '750g (3/4)', val: '750' },
                          { label: '1000g (1kg)', val: '1000' },
                          { label: '1500g', val: '1500' },
                          { label: '2000g', val: '2000' },
                          { label: '3000g', val: '3000' },
                        ].map(p => (
                          <button
                            key={p.val}
                            type="button"
                            onClick={() => setWeightValue(p.val)}
                            className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
                              weightValue === p.val
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))
                      : [
                          { label: '0.25 kg', val: '0.25' },
                          { label: '0.50 kg', val: '0.5' },
                          { label: '0.75 kg', val: '0.75' },
                          { label: '1.00 kg', val: '1.0' },
                          { label: '1.50 kg', val: '1.5' },
                          { label: '2.00 kg', val: '2.0' },
                          { label: '3.00 kg', val: '3.0' },
                          { label: '5.00 kg', val: '5.0' },
                        ].map(p => (
                          <button
                            key={p.val}
                            type="button"
                            onClick={() => setWeightValue(p.val)}
                            className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
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

            {/* TAB 2: POR IMPORTE EN PESOS */}
            {weightMode === 'money' && (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  ¿Cuánto dinero en pesos ($) solicitó el cliente?
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">$</span>
                  <input
                    type="number"
                    step="1"
                    value={moneyValue}
                    onChange={e => setMoneyValue(e.target.value)}
                    autoFocus
                    placeholder="Ej: 10, 20, 50"
                    className="w-full text-center text-3xl font-black text-slate-900 border-2 border-emerald-500 rounded-2xl py-2 pl-8 focus:outline-none bg-emerald-50/20"
                  />
                </div>

                {/* Quick Money Presets */}
                <div className="grid grid-cols-4 gap-1.5">
                  {['5', '10', '15', '20', '30', '50', '100', '200'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMoneyValue(m)}
                      className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
                        moneyValue === m
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ${m} pesos
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* LIVE CALCULATION SUMMARY BANNER */}
            {(() => {
              const finalKg = calculateFinalWeightInKg();
              const finalGrams = Math.round(finalKg * 1000);
              const itemTotal = Number((finalKg * weightedProduct.sellingPrice).toFixed(2));

              return (
                <div className="bg-slate-900 text-white rounded-2xl p-3.5 space-y-1.5 shadow-sm">
                  <div className="flex justify-between items-center text-xs text-slate-300">
                    <span>Peso equivalente exacto:</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      {finalKg.toFixed(3)} kg ({finalGrams} g)
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-black pt-1 border-t border-slate-800">
                    <span>Importe total ítem:</span>
                    <span className="text-emerald-400 text-base">{formatCurrency(itemTotal)}</span>
                  </div>
                </div>
              );
            })()}

            {/* ACTION BUTTONS */}
            <div className="flex gap-2">
              <button
                onClick={() => setWeightedProduct(null)}
                className="flex-1 py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={confirmWeightedAddition}
                className="flex-2 py-2.5 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md cursor-pointer transition-colors"
              >
                AGREGAR AL TICKET
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CHECKOUT PAYMENT MODAL */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">Cobrar Venta</h3>
                <p className="text-xs text-slate-500">Selecciona el método de pago e imprime o envía el ticket</p>
              </div>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Total Amount Banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
              <div className="text-xs text-emerald-800 font-semibold uppercase tracking-wider">Total a Cobrar</div>
              <div className="text-3xl font-black text-emerald-700">{formatCurrency(total)}</div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Método de Pago:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'efectivo', label: 'Efectivo', icon: DollarSign },
                  { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
                  { id: 'transferencia', label: 'Transferencia', icon: Send },
                ].map(m => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(m.id as PaymentMethod);
                        if (m.id !== 'efectivo') setCashRendered(total.toString());
                      }}
                      className={`py-2.5 px-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-emerald-400" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cash Calculator */}
            {paymentMethod === 'efectivo' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Paga con ($):</label>
                <input
                  type="number"
                  value={cashRendered}
                  onChange={e => setCashRendered(e.target.value)}
                  placeholder="Monto entregado por cliente"
                  className="w-full text-center text-xl font-bold text-slate-900 border-2 border-slate-300 rounded-xl py-2 focus:outline-none focus:border-emerald-500"
                />

                {/* Cash Quick Presets */}
                <div className="flex gap-1.5">
                  {[total, 50, 100, 200, 500, 1000].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCashRendered(preset.toFixed(2))}
                      className="flex-1 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg"
                    >
                      {idx === 0 ? 'Exacto' : `$${preset}`}
                    </button>
                  ))}
                </div>

                {/* Change Calculated */}
                <div className="bg-slate-100 rounded-xl p-3 flex justify-between items-center text-sm">
                  <span className="font-semibold text-slate-700">Cambio a entregar:</span>
                  <span className={`font-black text-lg ${changeAmount >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {formatCurrency(changeAmount)}
                  </span>
                </div>
              </div>
            )}

            {/* Optional Customer Email */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <label className="block text-xs font-bold text-slate-700">
                Ticket Digital por Correo / Nombre (Opcional):
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                placeholder="correo@cliente.com"
                className="w-full text-xs text-slate-800 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Submit Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => handleFinishSale(true, false)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Printer className="w-5 h-5" />
                <span>COMPLETAR E IMPRIMIR TICKET</span>
              </button>

              {customerEmail && (
                <button
                  onClick={() => handleFinishSale(false, true)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Mail className="w-4 h-4 text-sky-400" />
                  <span>Enviar por Correo Electrónico</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE TICKET MODAL */}
      {showTicketModal && completedSale && (
        <TicketModal sale={completedSale} onClose={() => setShowTicketModal(false)} />
      )}

      {/* EMAIL TICKET MODAL */}
      {showEmailModal && completedSale && (
        <EmailTicketModal
          sale={completedSale}
          defaultEmail={customerEmail}
          onClose={() => setShowEmailModal(false)}
        />
      )}

      {/* CAMERA BARCODE SCANNER MODAL */}
      {showCameraScanner && (
        <CameraScannerModal
          products={products}
          onProductScanned={product => {
            handleProductClick(product);
          }}
          onClose={() => setShowCameraScanner(false)}
        />
      )}
    </div>
  );
};
