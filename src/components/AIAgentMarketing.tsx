import React, { useState, useEffect } from "react";
import { 
  BrainCircuit, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Sparkles, 
  Target, 
  Lightbulb, 
  RefreshCcw,
  Loader2,
  Gift,
  CheckCircle2,
  Archive,
  Trash2,
  PlusCircle,
  Calendar,
  Check,
  Activity,
  Database,
  Plus,
  FileText
} from "lucide-react";
import { db, Restaurant, Product, Order, AIMarketingStrategy } from "../store/db";
import { formatCurrency } from "../utils/format";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface AIAgentMarketingProps {
  restaurant: Restaurant;
  orders: Order[];
  products: Product[];
}

interface SalesAnalysis {
  mostSold: { product: Product; quantity: number }[];
  leastSold: { product: Product; quantity: number }[];
  neverSold: Product[];
}

interface AIMarketingInsights {
  suggestedTasks: { title: string; description: string; impact: string }[];
  strategies: { title: string; description: string; targetProducts: string[] }[];
  newDishSuggestions: { name: string; reason: string; potentialPrice: string }[];
}

export default function AIAgentMarketing({ restaurant, orders, products }: AIAgentMarketingProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<SalesAnalysis | null>(null);
  const [insights, setInsights] = useState<AIMarketingInsights | null>(null);
  const [history, setHistory] = useState<{date: string, strategy: string}[]>([]);
  
  // New States for Supabase Integration
  const [savedStrategies, setSavedStrategies] = useState<AIMarketingStrategy[]>([]);
  const [loadingStrategies, setLoadingStrategies] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'draft' | 'applied' | 'archived'>('all');
  
  // Custom strategy form states
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newImpact, setNewImpact] = useState<string>("Alto");
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);

  // Initialize and perform analysis on orders & products
  useEffect(() => {
    const salesCount: Record<string, number> = {};
    orders.forEach(order => {
      if (!['cancelled', 'rejected', 'failed'].includes(order.status)) {
         order.items.forEach(item => {
           salesCount[item.product.id] = (salesCount[item.product.id] || 0) + item.quantity;
         });
      }
    });

    const productSales = products.map(p => ({
      product: p,
      quantity: salesCount[p.id] || 0
    })).sort((a, b) => b.quantity - a.quantity);

    const mostSold = productSales.slice(0, 3).filter(p => p.quantity > 0);
    const leastSold = productSales.filter(p => p.quantity > 0).slice(-3).reverse();
    const neverSold = productSales.filter(p => p.quantity === 0).map(p => p.product);

    const salesAnalysis = { mostSold, leastSold, neverSold };
    setAnalysis(salesAnalysis);
    
    // Load historical action logs
    if (restaurant.aiKnowledge?.marketingHistory) {
      setHistory(restaurant.aiKnowledge.marketingHistory);
    } else {
      setHistory([]);
    }
  }, [orders, products, restaurant.id, restaurant.aiKnowledge?.marketingHistory]);

  // Fetch Supabase strategies on mount
  useEffect(() => {
    const fetchStrategies = async () => {
      setLoadingStrategies(true);
      try {
        const data = await db.getAIMarketingStrategies(restaurant.id);
        setSavedStrategies(data);
        
        // AUTO-ANALYSIS TRIGGER: If we have sales calculations ready but NO saved marketing strategies,
        // automatically trigger the AI agent to run analysis and save initial strategies to Supabase!
        if (data.length === 0 && analysis && !isAnalyzing) {
          console.log("No saved strategies found. Initiating automatic AI Marketing Agent analysis...");
          runAutoAnalysis(analysis);
        }
      } catch (err) {
        console.error("Error fetching strategies from Supabase:", err);
      } finally {
        setLoadingStrategies(false);
      }
    };

    if (analysis) {
      fetchStrategies();
    }
  }, [analysis, restaurant.id]);

  // Reusable Auto-Analysis execution & auto-saving
  const runAutoAnalysis = async (currentAnalysis: SalesAnalysis) => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const topProductsStr = currentAnalysis.mostSold.map(p => `${p.product.name} (${p.quantity} ventas)`).join(", ");
      const lowProductsStr = currentAnalysis.leastSold.map(p => `${p.product.name} (${p.quantity} ventas)`).join(", ");
      const neverSoldStr = currentAnalysis.neverSold.map(p => p.name).join(", ");

      const prompt = `
Eres un agente de marketing e IA estratégica experto en restaurantes.
Analiza la siguiente información de ventas del restaurante "${restaurant.name}" (Tipo: ${restaurant.type}):

Productos más vendidos (Best-Sellers): ${topProductsStr || "Ninguno aún"}
Productos menos vendidos (Bajo Rendimiento): ${lowProductsStr || "Ninguno aún"}
Productos sin ventas (Nunca vendidos): ${neverSoldStr || "Ninguno"}

Genera un JSON ESTRUCTURADO (sin markdown ni bloques de código extra) con las siguientes claves exactas:
{
  "suggestedTasks": [
    { "title": "Nombre de tarea", "description": "Qué hacer", "impact": "Alto/Medio" }
  ],
  "strategies": [
    { "title": "Estrategia de ventas", "description": "Cómo aplicar dinámica de promoción, combo o cupón", "targetProducts": ["producto1", "producto2"] }
  ],
  "newDishSuggestions": [
    { "name": "Nombre de plato", "reason": "Por qué", "potentialPrice": "$XX.XXX" }
  ]
}

En "suggestedTasks", sugiere al menos 3 tareas operativas (ej. revisar stock ingredientes de los más vendidos, actualizar fotos de los menos vendidos).
En "strategies", crea exactamente 2 dinámicas atractivas (ej. promociones, combos, gamificación) diseñadas específicamente para darle salida a los productos menos vendidos o nunca vendidos.
En "newDishSuggestions", sugiere 2 platos nuevos demandados basados en tendencias del tipo de restaurante que complementen el menú actual.

RESPONDE ÚNICAMENTE CON UN JSON VÁLIDO.
      `;

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: prompt }]
          }],
          config: {
             temperature: 0.7,
             responseMimeType: "application/json"
          }
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API falló: ${errText}`);
      }
      const data = await res.json();
      const rawText = data.text || data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      const cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedInsights = JSON.parse(cleanText) as AIMarketingInsights;
      setInsights(parsedInsights);

      // AUTOMATIC SAVING: Save each generated strategy to 'ai_marketing_strategies' in Supabase
      const savedList: AIMarketingStrategy[] = [];
      for (const strat of parsedInsights.strategies) {
        try {
          const saved = await db.saveAIMarketingStrategy({
            restaurantId: restaurant.id,
            title: strat.title,
            description: strat.description,
            targetProducts: strat.targetProducts,
            status: 'draft',
            impact: 'Alto'
          });
          savedList.push(saved);
        } catch (err) {
          console.error("Error auto-saving strategy to Supabase:", err);
        }
      }

      // Prepend newly saved strategies to list
      setSavedStrategies(prev => {
        const existingIds = new Set(prev.map(s => s.id));
        const uniqueNew = savedList.filter(s => !existingIds.has(s.id));
        return [...uniqueNew, ...prev];
      });

    } catch (error) {
      console.error("Error generating/saving insights:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Manual Trigger Button Handler
  const generateInsights = async () => {
    if (!analysis) return;
    await runAutoAnalysis(analysis);
  };

  // Apply/Change strategy status tracking (syncs to Supabase 'ai_marketing_strategies')
  const handleUpdateStatus = async (strategyId: string, title: string, newStatus: 'draft' | 'applied' | 'archived') => {
    try {
      await db.updateAIMarketingStrategyStatus(strategyId, restaurant.id, newStatus);
      setSavedStrategies(prev => prev.map(s => s.id === strategyId ? { ...s, status: newStatus } : s));
      
      // If applied, log to administrative actions logs
      if (newStatus === 'applied') {
        const newHistory = [{ date: new Date().toISOString(), strategy: `Estrategia Aplicada: ${title}` }, ...history];
        setHistory(newHistory);
        const currentKnowledge = restaurant.aiKnowledge || {
           instructions: "", openingHours: "", allergens: "", popularDishes: "", peakHours: "", foodTypes: "", promotions: "", coupons: ""
        };
        await db.updateRestaurant(restaurant.id, { 
          aiKnowledge: { ...currentKnowledge, marketingHistory: newHistory } 
        });
      }
    } catch (err) {
      console.error("Error updating strategy status:", err);
    }
  };

  // Delete strategy from Supabase Tracking Table
  const handleDeleteStrategy = async (strategyId: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta estrategia de marketing del panel de seguimiento?")) {
      try {
        await db.deleteAIMarketingStrategy(strategyId, restaurant.id);
        setSavedStrategies(prev => prev.filter(s => s.id !== strategyId));
      } catch (err) {
        console.error("Error deleting strategy:", err);
      }
    }
  };

  // Manual addition of promotional strategy
  const handleAddCustomStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    setIsSubmittingCustom(true);
    try {
      const targets = newTarget.split(',').map(t => t.trim()).filter(Boolean);
      const saved = await db.saveAIMarketingStrategy({
        restaurantId: restaurant.id,
        title: newTitle,
        description: newDesc,
        targetProducts: targets,
        status: 'draft',
        impact: newImpact
      });
      setSavedStrategies(prev => [saved, ...prev]);
      setNewTitle("");
      setNewDesc("");
      setNewTarget("");
      setNewImpact("Alto");
      setIsAddingCustom(false);
    } catch (err) {
      console.error("Error adding custom strategy:", err);
    } finally {
      setIsSubmittingCustom(false);
    }
  };

  // Filtered strategies helper
  const filteredStrategies = savedStrategies.filter(s => {
    if (activeFilter === 'all') return true;
    return s.status === activeFilter;
  });

  return (
    <div className="space-y-6">
      {/* Premium Header Banner */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-white/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 text-xs font-black uppercase tracking-wider bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Agente Activo: Monitoreo en Tiempo Real
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 flex items-center gap-3">
              <BrainCircuit className="w-9 h-9 text-purple-300" />
              Agente IA de Marketing
            </h2>
            <p className="text-slate-300 text-base max-w-2xl leading-relaxed">
              Analiza el rendimiento del menú, detecta automáticamente los platos con menor demanda y genera dinámicas de promoción personalizadas, guardando todo de forma segura en Supabase para su seguimiento comercial.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setIsAddingCustom(!isAddingCustom)}
              className="bg-indigo-800/60 hover:bg-indigo-800 text-white border border-indigo-500/30 px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Plus className="w-5 h-5 text-indigo-300" />
              Crear Dinámica
            </button>
            <button 
              onClick={generateInsights}
              disabled={isAnalyzing || !analysis}
              className="bg-white text-indigo-950 hover:bg-indigo-50 px-6 py-3.5 rounded-xl font-black flex items-center justify-center gap-2.5 transition-all hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                  Analizando Datos...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
                  Escanear Menú con IA
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Manual strategy form */}
      <AnimatePresence>
        {isAddingCustom && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleAddCustomStrategy} className="bg-white rounded-3xl border-2 border-outline-variant p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <h4 className="font-black text-lg text-black flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-indigo-600" />
                  Registrar Estrategia de Marketing Personalizada
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddingCustom(false)}
                  className="text-gray-400 hover:text-black text-sm font-bold"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Título de la Dinámica</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Sábado de 2x1 en hamburguesas clásicas"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-black text-sm rounded-xl px-4 py-3 outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Nivel de Impacto</label>
                    <select
                      value={newImpact}
                      onChange={(e) => setNewImpact(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-black text-sm rounded-xl px-3 py-3 outline-none transition-all"
                    >
                      <option value="Alto">Alto</option>
                      <option value="Medio">Medio</option>
                      <option value="Bajo">Bajo</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Platos Objetivo</label>
                    <input
                      type="text"
                      placeholder="Separados por comas"
                      value={newTarget}
                      onChange={(e) => setNewTarget(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-black text-sm rounded-xl px-3 py-3 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Descripción o Plan de Acción</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explica en detalle de qué trata la promoción y cómo se ejecutará para incentivar la salida del producto..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-black text-sm rounded-xl px-4 py-3 outline-none transition-all resize-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingCustom}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-3 rounded-xl text-sm flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
                >
                  {isSubmittingCustom ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4" /> Guardar en Supabase
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Database tracking follow-up dashboard */}
      <div className="bg-white rounded-3xl border-2 border-outline-variant p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-black text-black flex items-center gap-2">
              <Database className="w-6 h-6 text-indigo-600" />
              Seguimiento de Estrategias IA (Supabase DB)
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Registro histórico y operacional de dinámicas promocionales sincronizadas en la nube.
            </p>
          </div>

          {/* Filtering tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl self-start">
            {(['all', 'draft', 'applied', 'archived'] as const).map(filter => {
              const count = filter === 'all' 
                ? savedStrategies.length 
                : savedStrategies.filter(s => s.status === filter).length;
              const label = {
                all: 'Todas',
                draft: 'Borrador',
                applied: 'Aplicadas',
                archived: 'Archivadas'
              }[filter];

              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`text-xs px-3.5 py-2 font-bold rounded-lg transition-all ${
                    activeFilter === filter 
                      ? "bg-white text-indigo-950 shadow-sm" 
                      : "text-gray-500 hover:text-black"
                  }`}
                >
                  {label} <span className="text-[10px] opacity-70 ml-0.5">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Strategies items lists */}
        {loadingStrategies ? (
          <div className="py-12 text-center flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            <p className="text-sm font-medium text-gray-500">Conectando con Supabase...</p>
          </div>
        ) : filteredStrategies.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600">No se encontraron estrategias en este filtro.</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Utiliza el botón "Escanear Menú con IA" de arriba para generar de forma automática estrategias basadas en tus productos menos vendidos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredStrategies.map((strat) => {
              const badgeColors = {
                draft: 'bg-blue-50 text-blue-700 border-blue-200',
                applied: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                archived: 'bg-slate-100 text-slate-600 border-slate-200'
              }[strat.status];

              const badgeText = {
                draft: 'Borrador',
                applied: 'Activa y Aplicada',
                archived: 'Archivada'
              }[strat.status];

              return (
                <div 
                  key={strat.id} 
                  className={`bg-slate-50/50 rounded-2xl p-5 border transition-all hover:shadow-md flex flex-col justify-between ${
                    strat.status === 'applied' ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${badgeColors}`}>
                        {badgeText}
                      </span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(strat.createdAt).toLocaleDateString("es-CO", { dateStyle: 'short' })}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-950 text-base">{strat.title}</h4>
                      <p className="text-slate-700 text-xs mt-1.5 leading-relaxed">{strat.description}</p>
                    </div>

                    {strat.targetProducts && strat.targetProducts.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Productos objetivo</span>
                        <div className="flex flex-wrap gap-1">
                          {strat.targetProducts.map((p, i) => (
                            <span key={i} className="bg-white text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-200/50">
                    <button
                      onClick={() => handleDeleteStrategy(strat.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                      title="Eliminar del seguimiento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {strat.status === 'draft' && (
                      <button
                        onClick={() => handleUpdateStatus(strat.id, strat.title, 'applied')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3.5 rounded-lg text-xs flex items-center gap-1 transition-all hover:scale-[1.02] active:scale-95"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Aplicar y Ejecutar
                      </button>
                    )}

                    {strat.status === 'applied' && (
                      <button
                        onClick={() => handleUpdateStatus(strat.id, strat.title, 'archived')}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-1.5 px-3.5 rounded-lg text-xs flex items-center gap-1 transition-all hover:scale-[1.02] active:scale-95"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        Archivar Estrategia
                      </button>
                    )}

                    {strat.status === 'archived' && (
                      <button
                        onClick={() => handleUpdateStatus(strat.id, strat.title, 'draft')}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-1.5 px-3.5 rounded-lg text-xs flex items-center gap-1 transition-all hover:scale-[1.02] active:scale-95"
                      >
                        <RefreshCcw className="w-3.5 h-3.5" />
                        Restaurar a Borrador
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* On-demand generation display details (if exists) */}
      {insights && (
        <AnimatePresence mode="wait">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Suggested Operational Tasks */}
            <div className="bg-white rounded-3xl border-2 border-outline-variant p-6 shadow-sm flex flex-col h-full">
              <h3 className="text-xl font-black text-black mb-6 flex items-center gap-2">
                <Target className="w-6 h-6 text-purple-600" />
                Tareas Operativas Sugeridas
              </h3>
              <div className="space-y-4 flex-1">
                {insights.suggestedTasks.map((task, idx) => (
                  <div key={idx} className="bg-purple-50 rounded-2xl p-4 border border-purple-100 flex items-start gap-4">
                     <div className="bg-purple-200 p-2 rounded-xl text-purple-700 shrink-0">
                       <Lightbulb className="w-5 h-5" />
                     </div>
                     <div>
                       <h4 className="font-bold text-purple-900 text-sm mb-1">{task.title}</h4>
                       <p className="text-purple-800/80 text-xs leading-relaxed">{task.description}</p>
                       <span className="inline-block mt-2 px-2 py-0.5 bg-white text-purple-600 text-[10px] font-bold rounded-md border border-purple-200 uppercase tracking-wider">
                         Impacto {task.impact}
                       </span>
                     </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested Menu Additions */}
            <div className="bg-white rounded-3xl border-2 border-outline-variant p-6 shadow-sm flex flex-col h-full">
              <h3 className="text-xl font-black text-black mb-6 flex items-center gap-2">
                <Gift className="w-6 h-6 text-pink-500" />
                Sugerencias de Expansión de Menú
              </h3>
              <div className="space-y-4 flex-1">
                {insights.newDishSuggestions.map((dish, idx) => (
                  <div key={idx} className="bg-pink-50 rounded-2xl p-4 border border-pink-100 flex items-start gap-4">
                    <div className="flex-1">
                       <h4 className="font-black text-pink-900 text-sm mb-1">{dish.name}</h4>
                       <p className="text-pink-800/80 text-xs leading-relaxed mb-2"><b>Por qué:</b> {dish.reason}</p>
                       <span className="inline-block bg-white text-pink-600 px-2 py-1 rounded text-xs font-bold border border-pink-200">
                         Precio Estimado: {dish.potentialPrice}
                       </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Sales performance analytics visualization charts */}
      {analysis && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border-2 border-outline-variant p-6 shadow-sm">
            <h3 className="text-xl font-black text-black mb-6 flex items-center gap-2">
              <TrendingDown className="w-6 h-6 text-orange-500" /> Gráfico de Alerta: Necesitan Esfuerzo de Ventas
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...analysis.leastSold, ...analysis.neverSold.map(p => ({ product: p, quantity: 0 }))].slice(0, 10)}>
                  <XAxis dataKey="product.name" tick={{fontSize: 10}} interval={0} angle={-30} textAnchor="end" />
                  <YAxis allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px' }} />
                  <Bar dataKey="quantity" name="Unidades Vendidas" radius={[4, 4, 0, 0]}>
                    {
                      [...analysis.leastSold, ...analysis.neverSold.map(p => ({ product: p, quantity: 0 }))].slice(0, 10).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.quantity === 0 ? '#ef4444' : '#f97316'} />
                      ))
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Most Sold */}
            <div className="bg-white rounded-3xl border-2 border-outline-variant overflow-hidden shadow-sm">
              <div className="bg-emerald-50 border-b border-emerald-100 px-5 py-4">
                <h4 className="font-black text-emerald-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" /> Los Más Vendidos
                </h4>
              </div>
              <div className="p-5 space-y-3">
                {analysis.mostSold.map((p, idx) => (
                  <div key={p.product.id} className="flex justify-between items-center text-sm">
                    <span className="font-bold text-black truncate">{idx + 1}. {p.product.name}</span>
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-black text-xs shrink-0">{p.quantity} unid.</span>
                  </div>
                ))}
                {analysis.mostSold.length === 0 && <p className="text-sm text-gray-500 italic">Sin ventas aún.</p>}
              </div>
            </div>

            {/* Least Sold */}
            <div className="bg-white rounded-3xl border-2 border-outline-variant overflow-hidden shadow-sm">
               <div className="bg-orange-50 border-b border-orange-100 px-5 py-4">
                <h4 className="font-black text-orange-900 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-orange-600" /> Los Menos Vendidos
                </h4>
              </div>
              <div className="p-5 space-y-3">
                {analysis.leastSold.map((p, idx) => (
                  <div key={p.product.id} className="flex justify-between items-center text-sm">
                    <span className="font-medium text-black truncate">{idx + 1}. {p.product.name}</span>
                    <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-black text-xs shrink-0">{p.quantity} unid.</span>
                  </div>
                ))}
                {analysis.leastSold.length === 0 && <p className="text-sm text-gray-500 italic">Sin ventas aún.</p>}
              </div>
            </div>

            {/* Never Sold */}
            <div className="bg-white rounded-3xl border-2 border-outline-variant overflow-hidden shadow-sm">
              <div className="bg-red-50 border-b border-red-100 px-5 py-4">
                <h4 className="font-black text-red-900 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" /> Nunca Vendidos
                </h4>
              </div>
              <div className="p-5 space-y-3 max-h-[200px] overflow-y-auto">
                {analysis.neverSold.map((p, idx) => (
                  <div key={p.id} className="flex justify-between items-center text-sm">
                    <span className="font-medium text-black truncate">- {p.name}</span>
                    <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold text-[10px] shrink-0">0 unid.</span>
                  </div>
                ))}
                {analysis.neverSold.length === 0 && <p className="text-sm text-gray-500 italic">Buen trabajo, todo se vende.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Administrative actions History logs */}
      {history.length > 0 && (
         <div className="bg-white rounded-3xl border-2 border-outline-variant p-6 shadow-sm">
           <h3 className="text-xl font-black text-black mb-6 flex items-center gap-2">
             <RefreshCcw className="w-6 h-6 text-gray-400" />
             Historial de Acciones de Marketing
           </h3>
           <div className="space-y-4">
             {history.slice(0, 5).map((h, idx) => (
               <div key={idx} className="flex gap-4 items-start pb-4 border-b border-outline-variant/50 last:border-0 last:pb-0">
                 <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500 shrink-0" />
                 <div>
                   <p className="font-bold text-sm text-black">{h.strategy}</p>
                   <p className="text-xs text-gray-500 font-medium mt-1">
                     Aplicada el {new Date(h.date).toLocaleString("es-CO", { dateStyle: 'medium', timeStyle: 'short' })}
                   </p>
                 </div>
               </div>
             ))}
           </div>
         </div>
      )}

    </div>
  );
}
