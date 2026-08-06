import React, { useState } from 'react';
import { Product, ProductCategory, ProductUnit } from '../../types';
import { CATEGORY_LABELS } from '../../data/initialData';
import { Barcode, Image, Calendar, Package, DollarSign, Sparkles } from 'lucide-react';

interface ProductFormModalProps {
  product?: Product | null;
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  product,
  onClose,
  onSave
}) => {
  const [name, setName] = useState<string>(product?.name || '');
  const [category, setCategory] = useState<ProductCategory>(product?.category || 'verduras');
  const [barcode, setBarcode] = useState<string>(product?.barcode || '');
  const [purchasePrice, setPurchasePrice] = useState<string>(product?.purchasePrice?.toString() || '0');
  const [sellingPrice, setSellingPrice] = useState<string>(product?.sellingPrice?.toString() || '0');
  const [stock, setStock] = useState<string>(product?.stock?.toString() || '10');
  const [minStock, setMinStock] = useState<string>(product?.minStock?.toString() || '3');
  const [unit, setUnit] = useState<ProductUnit>(product?.unit || 'pieza');
  const [expirationDate, setExpirationDate] = useState<string>(product?.expirationDate || '');
  const [imageUrl, setImageUrl] = useState<string>(product?.imageUrl || '');
  const [notes, setNotes] = useState<string>(product?.notes || '');

  const generateBarcode = () => {
    const randomCode = '750' + Math.floor(100000000 + Math.random() * 900000000);
    setBarcode(randomCode);
  };

  const cost = parseFloat(purchasePrice) || 0;
  const price = parseFloat(sellingPrice) || 0;
  const profit = price - cost;
  const marginPercent = price > 0 ? ((profit / price) * 100).toFixed(1) : '0';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      category,
      barcode: barcode.trim() || '750000000000',
      purchasePrice: parseFloat(purchasePrice) || 0,
      sellingPrice: parseFloat(sellingPrice) || 0,
      stock: parseFloat(stock) || 0,
      minStock: parseFloat(minStock) || 1,
      unit,
      expirationDate: expirationDate || undefined,
      imageUrl: imageUrl.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-100 my-auto">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-lg font-black text-slate-900">
              {product ? 'Editar Producto' : 'Nuevo Registro de Producto'}
            </h3>
            <p className="text-xs text-slate-500">
              Completa los datos para control de inventario y margen de ganancia
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-lg"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Producto *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Jitomate Saladette, Detergente 1kg..."
              className="w-full text-sm font-semibold text-slate-900 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Category Selection Visual Cards */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
              <span>Selecciona la Categoría Correspondiente *</span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Categoría seleccionada: {CATEGORY_LABELS[category]?.icon} {CATEGORY_LABELS[category]?.name}
              </span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(CATEGORY_LABELS).map(([catKey, catMeta]) => {
                const isSelected = category === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => {
                      setCategory(catKey as ProductCategory);
                      // Auto suggest default unit based on category
                      if (catKey === 'verduras' || catKey === 'frutas' || catKey === 'carnes') {
                        if (unit !== 'kg' && unit !== 'g') setUnit('kg');
                      } else if (catKey === 'bebidas') {
                        if (unit !== 'pieza' && unit !== 'litro') setUnit('pieza');
                      } else {
                        if (unit === 'kg' || unit === 'g') setUnit('pieza');
                      }
                    }}
                    className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-emerald-400'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl">{catMeta.icon}</span>
                      {isSelected && (
                        <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.5 rounded-md">
                          SELECCIONADO
                        </span>
                      )}
                    </div>
                    <span className={`text-xs font-bold mt-1 leading-snug ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                      {catMeta.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Unit of Measurement */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Unidad de Medida / Venta *</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {[
                { id: 'kg', label: 'Kilogramo (kg)', short: ' kg' },
                { id: 'g', label: 'Gramo (g)', short: ' g' },
                { id: 'pieza', label: 'Pieza (pz)', short: ' Piece' },
                { id: 'litro', label: 'Litro (L)', short: ' Litro' },
                { id: 'paquete', label: 'Paquete', short: ' Paq' },
                { id: 'caja', label: 'Caja', short: ' Caja' },
              ].map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setUnit(u.id as ProductUnit)}
                  className={`py-2 px-2 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    unit === u.id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {u.short}
                </button>
              ))}
            </div>
          </div>

          {/* Barcode & Expiration */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex justify-between">
                <span>Código de Barras</span>
                <button
                  type="button"
                  onClick={generateBarcode}
                  className="text-[10px] text-emerald-600 hover:underline font-bold"
                >
                  Generar
                </button>
              </label>
              <div className="relative">
                <Barcode className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={barcode}
                  onChange={e => setBarcode(e.target.value)}
                  placeholder="750100000001"
                  className="w-full text-xs text-slate-900 border border-slate-300 rounded-xl pl-8 pr-2 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Fecha de Caducidad <span className="text-amber-600 font-normal">(Opcional)</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={expirationDate}
                  onChange={e => setExpirationDate(e.target.value)}
                  className="w-full text-xs text-slate-900 border border-slate-300 rounded-xl pl-8 pr-2 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Profit Calculation */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Precio Compra (Costo $)</label>
                <input
                  type="number"
                  step="0.01"
                  value={purchasePrice}
                  onChange={e => setPurchasePrice(e.target.value)}
                  className="w-full text-sm font-bold text-slate-900 border border-slate-300 rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Precio Venta ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={sellingPrice}
                  onChange={e => setSellingPrice(e.target.value)}
                  className="w-full text-sm font-bold text-emerald-700 border border-slate-300 rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Calculated Profit Badge */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/80">
              <span className="text-slate-600 font-semibold">Ganancia Neta por unidad:</span>
              <span className={`font-black ${profit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                ${profit.toFixed(2)} ({marginPercent}% margen)
              </span>
            </div>
          </div>

          {/* Stock Levels */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Stock Actual</label>
              <input
                type="number"
                step="0.01"
                value={stock}
                onChange={e => setStock(e.target.value)}
                className="w-full text-xs font-bold text-slate-900 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Stock Mínimo (Alerta)</label>
              <input
                type="number"
                step="0.01"
                value={minStock}
                onChange={e => setMinStock(e.target.value)}
                className="w-full text-xs font-bold text-amber-700 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">URL de Imagen (Opcional)</label>
            <input
              type="text"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full text-xs text-slate-800 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
            >
              {product ? 'Guardar Cambios' : 'Registrar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
