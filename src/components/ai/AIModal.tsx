import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, Loader2, Lightbulb, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AIInsightResponse } from '../../types';

export const AIModal: React.FC = () => {
  const { products, sales, settings } = useApp();
  const [loading, setLoading] = useState<boolean>(false);
  const [insights, setInsights] = useState<AIInsightResponse | null>(null);

  const handleGenerateInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/inventory-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products, sales: sales.slice(0, 30) }),
      });

      const data = await res.json();
      setInsights(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-5xl mx-auto">
      
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-300" />
            <h2 className="text-xl font-black">Asistente de Negocio e Inteligencia Artificial</h2>
          </div>
          <p className="text-xs text-indigo-200">
            Optimiza la rotación de tu inventario, evita mermas por caducidad y maximiza las ganancias diarias de tu tienda.
          </p>
        </div>

        <button
          onClick={handleGenerateInsights}
          disabled={loading}
          className="py-3 px-5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <Sparkles className="w-4 h-4 text-slate-950" />}
          <span>{loading ? 'Analizando Tienda...' : 'Generar Diagnóstico de IA'}</span>
        </button>
      </div>

      {/* Insights Content Cards */}
      {!insights && !loading && (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-3">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Obtén un Diagnóstico Estratégico</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Presiona el botón de arriba para que Gemini analice la fecha de caducidad de tus productos y ventas recientes.
          </p>
        </div>
      )}

      {insights && (
        <div className="space-y-4">
          
          {/* Executive Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Resumen del Estado de la Tienda</span>
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">{insights.summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Expiration Plan */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 space-y-2">
              <h4 className="font-bold text-amber-900 text-xs uppercase flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Estrategia Mermas y Caducidad</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-amber-950">
                {insights.expiringActionPlan?.map((plan, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{plan}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Restock Recommendations */}
            <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-5 space-y-2">
              <h4 className="font-bold text-sky-900 text-xs uppercase flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-600" />
                <span>Recomendaciones de Reabastecimiento</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-sky-950">
                {insights.restockRecommendations?.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-sky-600 font-bold">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Sales Tip */}
          {insights.salesTip && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
              <Lightbulb className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-xs text-emerald-900">Consejo Comercial del Día:</h4>
                <p className="text-xs text-emerald-800 font-medium">{insights.salesTip}</p>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
