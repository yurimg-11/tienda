import React, { useState } from 'react';
import { Product, ProductCategory, ProductUnit } from '../../types';
import { CATEGORY_LABELS } from '../../data/initialData';
import { CameraScannerModal } from '../pos/CameraScannerModal';
import { X, Camera, RefreshCw } from 'lucide-react';

interface ProductFormModalProps {
  products: Product[];
  productToEdit?: Product | null;
  onSave: (productData: Omit<Product, 'id'>) => void;
  onClose: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  products,
  productToEdit,
  onSave,
  onClose
}) => {
  const [name, setName] = useState<string>(productToEdit?.name || '');
  const [category, setCategory] = useState<ProductCategory>(productToEdit?.category || 'abarrotes');
  const [unit, setUnit] = useState<ProductUnit>(productToEdit?.unit || 'pieza');
  const [barcode, setBarcode] = useState<string>(productToEdit?.barcode || '');
  const [costPrice, setCostPrice] = useState<string>('0');
  const [sellingPrice, setSellingPrice] = useState<string>('0');
  const [stock, setStock] = useState<string>(productToEdit?.stock?.toString() || '10');
  const [minStock, setMinStock] = useState<string>(productToEdit?.minStock?.toString() || '2');
  const [expirationDate, setExpirationDate] = useState<string>(productToEdit?.expirationDate || '');
  const [imageUrl, setImageUrl] = useState<string>(productToEdit?.imageUrl || '');
  
  const [showCameraScanner, setShowCameraScanner] = useState<boolean>(false);

  const generateRandomBarcode = () => {
    const randomCode = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    setBarcode(randomCode);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      category,
      unit,
      barcode: barcode.trim() || generateRandomBarcodeValue(),
      costPrice: parseFloat(costPrice) || 0,
      sellingPrice: parseFloat(sellingPrice) || 0,
      stock: parseFloat(stock) || 0,
      minStock: parseFloat(minStock) || 0,
      expirationDate: expirationDate.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
    } as unknown as Omit<Product, 'id'>);
  };

  const generateRandomBarcodeValue = () => {
    return Math.floor(100000000000 + Math.random() * 900000000000).toString();
  };

  const costNum = parseFloat(costPrice) || 0;
  const sellNum = parseFloat(sellingPrice) || 0;
  const margin = sellNum > 0 ? (((sellNum - costNum) / sellNum) * 100).toFixed(0) : '0';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-100 my-auto max-h-[92vh] overflow-y-auto">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900">
              {productToEdit ? 'Editar Producto' : 'Nuevo Registro de Producto'}
            </h3>
            <p className="text-xs text-slate-500">Completa los datos para control de inventario</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Nombre del producto */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Producto *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Leche Entera 1L"
              className="w-full text-sm border border-slate-300 rounded-xl py-2 px-3 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Categoría</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {Object.entries(CATEGORY_LABELS).map(([key, meta]: [string, any]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key as ProductCategory)}
                  className={`p-2 rounded-xl text-xs font-bold border text-left transition-all cursor-pointer flex items-center gap-1.5 ${
                    category === key
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{meta.icon}</span>
                  <span className="truncate">{meta.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Unidad de medida */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Unidad de Medida</label>
            <div className="flex gap-1.5 flex-wrap">
              {(['pieza', 'kg', 'g', 'litro', 'paquete', 'caja'] as ProductUnit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer uppercase ${
                    unit === u
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Código de barras con cámara integrada */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Código de Barras</label>
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <div className="relative flex-1 min-w-[150px]">
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Escanea o ingresa código"
                  className="w-full text-sm font-mono border border-slate-300 rounded-xl py-2 px-3 focus:outline-none focus:border-emerald-500"
                />
              </div>
              
              <button
                type="button"
                onClick={generateRandomBarcode}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                Generar
              </button>

              <button
                type="button"
                onClick={() => setShowCameraScanner(true)}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
              >
                <Camera className="w-4 h-4" />
                <span>Escanear</span>
              </button>
            </div>
          </div>

          {/* Precios y Margen */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Precio Compra ($)</label>
              <input
                type="number"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-xl py-2 px-3 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Precio Venta ($)</label>
              <input
                type="number"
                step="0.01"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-xl py-2 px-3 focus:outline-none focus:border-emerald-500 font-bold text-emerald-700"
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Margen de ganancia estimado: <span className="font-bold text-emerald-600">{margin}%</span></p>

          {/* Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Stock Inicial</label>
              <input
                type="number"
                step="any"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-xl py-2 px-3 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Stock Mínimo (Alerta)</label>
              <input
                type="number"
                step="any"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-xl py-2 px-3 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Botones de Guardar */}
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-2 py-2.5 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md cursor-pointer transition-colors"
            >
              Guardar Producto
            </button>
          </div>

        </form>

      </div>

      {/* Modal de Cámara para escanear en inventario */}
      {showCameraScanner && (
        <CameraScannerModal
          products={products}
          onProductScanned={(prod) => {
            setBarcode(prod.barcode);
            setShowCameraScanner(false);
          }}
          onUnknownBarcode={(unknownCode) => {
            setBarcode(unknownCode);
            setShowCameraScanner(false);
          }}
          onClose={() => setShowCameraScanner(false)}
        />
      )}
    </div>
  );
};