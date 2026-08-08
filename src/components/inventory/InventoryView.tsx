import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, ProductCategory } from '../../types';
import { CATEGORY_LABELS } from '../../data/initialData';
import { getExpirationStatus, getStockStatus } from '../../utils/inventoryUtils';
import { ProductFormModal } from './ProductFormModal';
import { RoleSwitchModal } from '../auth/RoleSwitchModal';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  Barcode,
  ArrowUpDown,
  Download,
  Calendar,
  DollarSign,
  Lock,
  ShieldCheck
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const {
    products = [],
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    searchQuery = '',
    setSearchQuery = () => {},
    selectedCategory = 'todas',
    setSelectedCategory = () => {},
    settings = {},
    currentUserRole = 'admin'
  } = useApp() as any;

  const [filterStatus, setFilterStatus] = useState<'all' | 'expiring' | 'expired' | 'low_stock'>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [showRoleModal, setShowRoleModal] = useState<boolean>(false);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<Product | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>('5');

  // Filter products
  const filteredProducts = (products || []).filter((p: any) => {
    const matchesCategory = selectedCategory === 'todas' || p?.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p?.name?.toLowerCase().includes(q) ||
      p?.barcode?.includes(q) ||
      p?.category?.toLowerCase().includes(q);

    const expInfo = getExpirationStatus(p, settings?.expirationWarningDays || 7);
    const stockInfo = getStockStatus(p);

    let matchesStatus = true;
    if (filterStatus === 'expiring') {
      matchesStatus = expInfo?.status === 'critical' || expInfo?.status === 'warning';
    } else if (filterStatus === 'expired') {
      matchesStatus = expInfo?.status === 'expired';
    } else if (filterStatus === 'low_stock') {
      matchesStatus = stockInfo?.status === 'low' || stockInfo?.status === 'out';
    }

    return matchesCategory && matchesSearch && matchesStatus;
  });

  const formatCurrency = (val: number) =>
    `${settings?.currencySymbol || '$'}${val.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleExportCSV = () => {
    const headers = ['Nombre', 'Categoria', 'Codigo', 'Precio Compra', 'Precio Venta', 'Stock', 'Unidad', 'Caducidad'];
    const rows = (products || []).map((p: any) => [
      `"${p?.name || ''}"`,
      p?.category || '',
      p?.barcode || '',
      p?.purchasePrice || 0,
      p?.sellingPrice || 0,
      p?.stock || 0,
      p?.unit || 'pieza',
      p?.expirationDate || 'N/A'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventario_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleSaveStockAdjust = () => {
    if (!stockAdjustProduct) return;
    const amount = parseFloat(adjustAmount) || 0;
    adjustStock(stockAdjustProduct.id, amount);
    setStockAdjustProduct(null);
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 max-w-7xl mx-auto">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600" />
            <span>Control de Inventario ({products.length} Productos)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Gestiona stock, precios de compra/venta, alertas de caducidad y códigos de barras
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex-1 sm:flex-initial py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (currentUserRole === 'cashier') {
                setShowRoleModal(true);
              } else {
                setEditingProduct(null);
                setShowFormModal(true);
              }
            }}
            className="flex-1 sm:flex-initial py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span> Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Filters & Category Pills */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
        
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('todas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedCategory === 'todas'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            🏪 Todas las Categorías
          </button>
          {Object.entries(CATEGORY_LABELS).map(([catKey, catMeta]: [string, any]) => (
            <button
              key={catKey}
              type="button"
              onClick={() => setSelectedCategory(catKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                selectedCategory === catKey
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>{catMeta?.icon}</span>
              <span>{catMeta?.name}</span>
            </button>
          ))}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
          <div className="flex items-center gap-1">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'expiring', label: ' Caduca Pronto' },
              { id: 'expired', label: ' Caducados' },
              { id: 'low_stock', label: ' Stock Bajo' },
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterStatus(f.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  filterStatus === f.id
                    ? 'bg-emerald-100 text-emerald-900 font-extrabold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filtrar por nombre o código..."
              className="w-full bg-slate-50 text-slate-800 text-xs rounded-xl pl-8 pr-2 py-1.5 border border-slate-300 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Products Catalog Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-900 text-slate-200 uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-3">Categoría</th>
                <th className="py-3 px-3">Código</th>
                <th className="py-3 px-3 text-right">Costo</th>
                <th className="py-3 px-3 text-right">Precio Venta</th>
                <th className="py-3 px-3 text-center">Stock</th>
                <th className="py-3 px-3">Caducidad</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No se encontraron productos coincidentes.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product: any) => {
                  const expInfo = getExpirationStatus(product, settings?.expirationWarningDays || 7);
                  const stockInfo = getStockStatus(product);
                  const unit = product?.unit || 'pieza';
                  const sellingPrice = product?.sellingPrice || 0;
                  const purchasePrice = product?.purchasePrice || 0;
                  const stock = product?.stock || 0;

                  return (
                    <tr key={product?.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Product Name & Image */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {product?.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product?.name || 'Producto'}
                              className="w-9 h-9 object-cover rounded-lg border border-slate-200"
                            />
                          ) : (
                            <div className="w-9 h-9 bg-emerald-100 text-emerald-800 font-bold rounded-lg flex items-center justify-center text-xs">
                              {product?.name?.charAt(0) || '?'}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-900 text-xs block">{product?.name}</span>
                            <span className="text-[10px] text-slate-400">
                              Margen: {currentUserRole === 'admin' 
                                ? `${(((sellingPrice - purchasePrice) / (sellingPrice || 1)) * 100).toFixed(0)}%` 
                                : ' Admin'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {CATEGORY_LABELS[product?.category]?.icon} {CATEGORY_LABELS[product?.category]?.name}
                        </span>
                      </td>

                      {/* Barcode */}
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                        {product?.barcode}
                      </td>

                      {/* Purchase Price (Costo) */}
                      <td className="py-2.5 px-3 text-right font-medium text-slate-500">
                        {currentUserRole === 'admin' ? (
                          formatCurrency(purchasePrice)
                        ) : (
                          <span className="text-slate-400 font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">🔒 Oculto</span>
                        )}
                      </td>

                      {/* Selling Price */}
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                        {formatCurrency(sellingPrice)}
                        <span className="text-[10px] text-slate-400 font-normal">/{unit}</span>
                      </td>

                      {/* Stock */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] border ${stockInfo?.badgeBg}`}>
                            {stock} {unit}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (currentUserRole === 'cashier') {
                                setShowRoleModal(true);
                              } else {
                                setStockAdjustProduct(product);
                                setAdjustAmount('10');
                              }
                            }}
                            className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded border border-slate-300 cursor-pointer"
                            title="Reabastecer / Ajustar Stock"
                          >
                             Reabastecer
                          </button>
                        </div>
                      </td>

                      {/* Expiration Date */}
                      <td className="py-2.5 px-3">
                        {product?.expirationDate ? (
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${expInfo?.badgeBg}`}>
                            {expInfo?.label}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (currentUserRole === 'cashier') {
                                setShowRoleModal(true);
                              } else {
                                setEditingProduct(product);
                                setShowFormModal(true);
                              }
                            }}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Editar producto"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (currentUserRole === 'cashier') {
                                setShowRoleModal(true);
                              } else {
                                if (confirm(`¿Eliminar definitivamente "${product?.name}"?`)) {
                                  deleteProduct(product?.id);
                                }
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD/EDIT MODAL */}
      {showFormModal && (
        <ProductFormModal
          products={products}
          productToEdit={editingProduct}
          onClose={() => {
            setShowFormModal(false);
            setEditingProduct(null);
          }}
          onSave={(data: any) => {
            if (editingProduct) {
              updateProduct(editingProduct.id, data);
            } else {
              addProduct(data);
            }
            setShowFormModal(false);
            setEditingProduct(null);
          }}
        />
      )}

      {/* QUICK STOCK RE-STOCK MODAL */}
      {stockAdjustProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">
              Reabastecer / Ajustar Stock: {stockAdjustProduct?.name}
            </h3>
            <p className="text-xs text-slate-500">
              Ingresa la cantidad a SUMAR al inventario (o un número negativo para reducir)
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cantidad a Agregar ({stockAdjustProduct?.unit || 'pieza'}):
              </label>
              <input
                type="number"
                value={adjustAmount}
                onChange={e => setAdjustAmount(e.target.value)}
                className="w-full text-center text-xl font-bold text-slate-900 border-2 border-emerald-500 rounded-xl py-2 focus:outline-none"
              />
              <div className="flex gap-1.5 mt-2">
                {['5', '10', '20', '50'].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAdjustAmount(val)}
                    className="flex-1 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg cursor-pointer"
                  >
                    +{val}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStockAdjustProduct(null)}
                className="flex-1 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveStockAdjust}
                className="flex-1 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer"
              >
                Guardar Nuevo Stock
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ROLE SWITCH MODAL */}
      {showRoleModal && <RoleSwitchModal onClose={() => setShowRoleModal(false)} />}
    </div>
  );
};