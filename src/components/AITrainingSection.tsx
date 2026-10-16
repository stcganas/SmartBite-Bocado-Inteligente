import { useState } from 'react';
import { Brain, Save, Info, Clock, Utensils, AlertTriangle, Star, Zap, Tag, Loader2, Sparkles } from 'lucide-react';
import { Restaurant, db } from '../store/db';
import { generateAITrainingText } from '../services/ai';
import { toast } from 'sonner';

interface AITrainingSectionProps {
  restaurant: Restaurant;
  onUpdate: () => void;
}

export default function AITrainingSection({ restaurant, onUpdate }: AITrainingSectionProps) {
  const [loading, setLoading] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [knowledge, setKnowledge] = useState(restaurant.aiKnowledge || {
    instructions: '',
    openingHours: '',
    allergens: '',
    popularDishes: '',
    peakHours: '',
    foodTypes: '',
    promotions: '',
    coupons: ''
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      await db.updateRestaurant(restaurant.id, { aiKnowledge: knowledge });
      toast.success('Conocimiento de IA actualizado correctamente');
      onUpdate();
    } catch (error) {
      console.error('Error saving AI knowledge:', error);
      toast.error('Error al guardar la configuración de IA');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateWithAI = async (fieldId: keyof typeof knowledge) => {
    setGeneratingId(fieldId as string);
    try {
      const generatedText = await generateAITrainingText(
        fieldId as string,
        restaurant.name,
        restaurant.type || 'restaurante',
        (knowledge[fieldId] as string) || ''
      );
      setKnowledge(prev => ({ ...prev, [fieldId]: generatedText }));
      toast.success('¡Texto generado con éxito!');
    } catch (error) {
      toast.error('Error al generar el texto con IA.');
    } finally {
      setGeneratingId(null);
    }
  };

  const sections: {
    id: keyof typeof knowledge;
    label: string;
    description: string;
    icon: any;
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
  }[] = [
    {
      id: 'instructions',
      label: 'Instrucciones Generales',
      description: 'Cómo debe comportarse la IA y qué tono debe usar.',
      icon: Brain,
      placeholder: 'Ej: Eres un asistente amable y servicial. Siempre saluda con entusiasmo.',
      value: knowledge.instructions,
      onChange: (v: string) => setKnowledge({ ...knowledge, instructions: v })
    },
    {
      id: 'openingHours',
      label: 'Horarios de Apertura',
      description: 'Detalla los horarios para que la IA informe correctamente.',
      icon: Clock,
      placeholder: 'Ej: Lunes a Viernes de 8:00 AM a 10:00 PM.',
      value: knowledge.openingHours,
      onChange: (v: string) => setKnowledge({ ...knowledge, openingHours: v })
    },
    {
      id: 'allergens',
      label: 'Alérgenos e Información Dietética',
      description: 'Información crucial sobre ingredientes y restricciones.',
      icon: AlertTriangle,
      placeholder: 'Ej: Tenemos opciones sin gluten.',
      value: knowledge.allergens,
      onChange: (v: string) => setKnowledge({ ...knowledge, allergens: v })
    },
    {
      id: 'popularDishes',
      label: 'Platos Preferidos',
      description: 'Lo que más piden los clientes para que la IA lo recomiende.',
      icon: Star,
      placeholder: 'Ej: La Hamburguesa Especial es la favorita.',
      value: knowledge.popularDishes,
      onChange: (v: string) => setKnowledge({ ...knowledge, popularDishes: v })
    },
    {
      id: 'peakHours',
      label: 'Horas de Mayor Demanda',
      description: 'Para que la IA pueda gestionar expectativas de tiempo.',
      icon: Zap,
      placeholder: 'Ej: De 12:30 PM a 2:00 PM suele estar muy lleno.',
      value: knowledge.peakHours,
      onChange: (v: string) => setKnowledge({ ...knowledge, peakHours: v })
    },
    {
      id: 'foodTypes',
      label: 'Tipos de Comida',
      description: 'Especialidades y categorías de tu cocina.',
      icon: Utensils,
      placeholder: 'Ej: Comida Mexicana auténtica.',
      value: knowledge.foodTypes,
      onChange: (v: string) => setKnowledge({ ...knowledge, foodTypes: v })
    },
    {
      id: 'promotions',
      label: 'Promociones Vigentes',
      description: 'Ofertas especiales que la IA debe mencionar.',
      icon: Tag,
      placeholder: 'Ej: 2x1 en margaritas los jueves.',
      value: knowledge.promotions,
      onChange: (v: string) => setKnowledge({ ...knowledge, promotions: v })
    },
    {
      id: 'coupons',
      label: 'Cupones de Descuento',
      description: 'Códigos válidos que la IA puede aplicar.',
      icon: Tag,
      placeholder: 'Ej: Usa BIENVENIDO10 para un 10% en tu primera compra.',
      value: knowledge.coupons,
      onChange: (v: string) => setKnowledge({ ...knowledge, coupons: v })
    }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-orange-50 border border-orange-100 p-6 rounded-2xl flex items-start gap-4">
        <div className="bg-orange-100 p-3 rounded-2xl text-orange-600">
          <Info className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-lg font-black text-orange-900 mb-1">Entrena a tu Asistente IA</h4>
          <p className="text-orange-800 text-sm leading-relaxed">
            Proporciona detalles específicos sobre tu restaurante. Cuanta más información des, 
            mejor podrá la IA atender a tus clientes, responder dudas y aumentar tus ventas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => (
          <div key={section.id} className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex flex-col transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-neutral-50 p-2.5 rounded-xl text-neutral-600">
                <section.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h5 className="font-black text-neutral-900">{section.label}</h5>
                <p className="text-xs text-on-surface-variant">{section.description}</p>
              </div>
              <button
                onClick={() => handleGenerateWithAI(section.id)}
                disabled={generatingId === section.id}
                className="shrink-0 flex items-center justify-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-100 active:scale-95 disabled:opacity-50"
                title="Generar con IA (Gemini)"
              >
                {generatingId === section.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">IA</span>
              </button>
            </div>
            <textarea
              value={section.value}
              onChange={(e) => section.onChange(e.target.value)}
              placeholder={section.placeholder}
              className="w-full h-32 p-4 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm focus:ring-2 focus:ring-orange-500 transition-all resize-none mt-auto"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 bg-orange-600 text-on-surface px-8 py-4 rounded-2xl font-black hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          Guardar Configuración IA
        </button>
      </div>
    </div>
  );
}
