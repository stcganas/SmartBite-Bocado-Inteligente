import React, { useState, useEffect } from 'react';
import { PlatformSettings, SplashSettings, SplashRecord } from '../store/db';
import { db } from '../store/db';
import { toast } from 'sonner';
import { Save, Plus, Trash2, Sliders, Image as ImageIcon, Video, Music, Type, Palette, Folder, CheckCircle, Tag, Info, Play } from 'lucide-react';
import { CustomSplashScreen } from './CustomSplashScreen';

import { SplashTextConfig } from '../store/db';

interface TextConfigEditorProps {
  label: string;
  config: SplashTextConfig;
  onChange: (config: SplashTextConfig) => void;
  onRemove?: () => void;
}

const TextConfigEditor: React.FC<TextConfigEditorProps> = ({ label, config, onChange, onRemove }) => {
  return (
    <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 space-y-4">
      <div className="flex items-center justify-between">
         <h4 className="font-semibold text-neutral-800 text-sm">{label}</h4>
         {onRemove && (
           <button onClick={onRemove} className="text-red-500 hover:text-red-700">
             <Trash2 className="w-4 h-4" />
           </button>
         )}
      </div>
      <div>
        <label className="block text-xs font-medium text-neutral-600 mb-1">Texto</label>
        <input
          type="text"
          value={config.text}
          onChange={(e) => onChange({ ...config, text: e.target.value })}
          placeholder="Escribe el texto aquí..."
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm text-neutral-900"
        />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
         <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Posición</label>
            <select
              value={config.position}
              onChange={(e) => onChange({ ...config, position: e.target.value as any })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm text-neutral-900"
            >
              <option value="top">Superior</option>
              <option value="middle">Medio (Centro)</option>
              <option value="bottom">Inferior</option>
              <option value="image-caption">Pie de Imagen</option>
              <option value="footer">Pie de Página</option>
            </select>
         </div>
         <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Efecto</label>
            <select
              value={config.effect}
              onChange={(e) => onChange({ ...config, effect: e.target.value as any })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm text-neutral-900"
            >
              <option value="none">Ninguno</option>
              <option value="fade">Aparición (Fade)</option>
              <option value="bounce">Rebote (Bounce)</option>
              <option value="typing">Máquina de (Typing)</option>
              <option value="slideUp">Desliz. Arriba</option>
              <option value="slideDown">Desliz. Abajo</option>
              <option value="slideLeft">Desliz. Izquierda</option>
              <option value="slideRight">Desliz. Derecha</option>
              <option value="zoom">Zoom In/Out</option>
              <option value="flip">Volteo (Flip)</option>
            </select>
         </div>
         <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Tamaño</label>
            <select
              value={config.size || 'base'}
              onChange={(e) => onChange({ ...config, size: e.target.value as any })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm text-neutral-900"
            >
              <option value="xs">XS</option>
              <option value="sm">SM</option>
              <option value="base">Normal</option>
              <option value="lg">Grande (LG)</option>
              <option value="xl">XL</option>
              <option value="2xl">2XL</option>
              <option value="3xl">3XL</option>
            </select>
         </div>
      </div>
    </div>
  );
};

interface SplashBuilderProps {
  settings: PlatformSettings;
  onUpdate: (settings: PlatformSettings) => void;
}

const defaultSplash: SplashSettings = {
  enabled: true,
  type: 'image',
  slides: [{ url: '' }],
  duration: 3500,
  backgroundColor: '#000000',
  globalTextColor: '#ffffff',
  globalTypography: 'sans-serif',
  imageEffect: 'none',
  imageScale: 50,
  title: {
    id: 'title',
    text: '',
    effect: 'none',
    position: 'middle',
    size: '3xl',
    weight: 'bold'
  },
  subtitle: {
    id: 'subtitle',
    text: '',
    effect: 'none',
    position: 'middle',
    size: 'lg',
    weight: 'normal'
  },
  floatingTexts: []
};

export const SplashBuilder: React.FC<SplashBuilderProps> = ({ settings, onUpdate }) => {
  const [splashes, setSplashes] = useState<SplashRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const [splashSettings, setSplashSettings] = useState<SplashSettings>(defaultSplash);
  
  const [loading, setLoading] = useState(false);
  const [uploadingSlideIdx, setUploadingSlideIdx] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const fetchSplashes = async () => {
    const { data } = await db.getSplashes();
    if (data) {
      setSplashes(data);
      if (data.length > 0 && !selectedId && !isCreating) {
        const active = data.find(d => d.is_active) || data[0];
        handleSelect(active);
      }
    }
  };

  useEffect(() => {
    fetchSplashes();
  }, []);

  const handleSelect = (splash: SplashRecord) => {
    setIsCreating(false);
    setSelectedId(splash.id);
    setName(splash.name);
    setCategory(splash.category);
    setSplashSettings(splash.settings);
  };

  const handleStartCreate = () => {
    setIsCreating(true);
    setSelectedId(null);
    setName('Nuevo Splash');
    setCategory('General');
    setSplashSettings(defaultSplash);
  };

  const handleSave = async () => {
    setLoading(true);
    if (!name.trim() || !category.trim()) {
      toast.error('El nombre y la categoría son requeridos');
      setLoading(false);
      return;
    }

    if (isCreating) {
      const { data, error } = await db.createSplash({
        name,
        category,
        is_active: false,
        settings: splashSettings
      });
      if (error) toast.error('Error al crear el splash');
      else {
        toast.success('Splash creado correctamente');
        setIsCreating(false);
        if (data) setSelectedId(data.id);
        fetchSplashes();
      }
    } else if (selectedId) {
      const { error } = await db.updateSplash(selectedId, {
        name,
        category,
        settings: splashSettings
      });
      if (error) {
         toast.error('Error al actualizar');
      } else {
         toast.success('Splash actualizado correctamente');
         fetchSplashes();
         
         // If it is active, we also need to update the platformSettings cached in App.tsx
         const current = splashes.find(s => s.id === selectedId);
         if (current?.is_active) {
            onUpdate({ ...settings, splashSettings });
         }
      }
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este splash?")) return;
    const { error } = await db.deleteSplash(id);
    if (error) {
      toast.error('Error al eliminar');
    } else {
      toast.success('Splash eliminado');
      if (selectedId === id) {
        setSelectedId(null);
        setIsCreating(false);
      }
      
      // Clear fallback settings if it was the active one
      const deletedSplash = splashes.find(s => s.id === id);
      if (deletedSplash?.is_active) {
         try {
             // Reset splashSettings in platform config to disabled to avoid phantom splashes
             await db.updatePlatformSettings({
                 splashSettings: { ...defaultSplash, enabled: false }
             });
         } catch (e) {
             console.error(e);
         }
      }
      
      fetchSplashes();
    }
  };

  const handleSetActive = async (id: string | null) => {
    setLoading(true);
    await db.setActiveSplash(id);
    if (id) {
       toast.success('Splash establecido como activo');
    } else {
       toast.success('Splash del sistema activado');
    }
    
    // Refresh to get new active state
    const { data } = await db.getSplashes();
    if (data) {
       setSplashes(data);
       const active = data.find(d => d.is_active);
       if (active) {
          onUpdate({ ...settings, splashSettings: active.settings, isCustomSplashActive: true });
       } else {
          onUpdate({ ...settings, isCustomSplashActive: false });
       }
    }
    setLoading(false);
  };

  const addSlide = () => {
    setSplashSettings(prev => ({
      ...prev,
      slides: [...prev.slides, { url: '' }]
    }));
  };

  const updateSlide = (index: number, url: string) => {
    setSplashSettings(prev => {
      const newSlides = [...prev.slides];
      newSlides[index] = { ...newSlides[index], url };
      return { ...prev, slides: newSlides };
    });
  };

  const removeSlide = (index: number) => {
    setSplashSettings(prev => {
      const newSlides = [...prev.slides];
      newSlides.splice(index, 1);
      return { ...prev, slides: newSlides };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSlideIdx(index);
    const { url, error } = await db.uploadImage(file, 'splash');
    if (error) {
      toast.error('Error al subir imagen');
    } else if (url) {
      updateSlide(index, url);
    }
    setUploadingSlideIdx(null);
  };

  // Agrupar por categorías
  const categories = Array.from(new Set(splashes.map(s => s.category)));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-100 pb-4 gap-4">
        <h2 className="text-xl font-bold text-neutral-800 flex items-center gap-2">
          <Sliders className="w-6 h-6 text-orange-500" />
          Biblioteca de Splash Screens
        </h2>
        <div className="flex items-center gap-2">
          {splashes.some(s => s.is_active) && (
            <button
              onClick={() => handleSetActive(null)}
              className="bg-neutral-100 text-neutral-600 hover:bg-neutral-200 font-bold py-2 px-4 rounded-xl transition-all shadow-sm flex items-center gap-2 text-sm"
              disabled={loading}
            >
              Usar Splash del Sistema
            </button>
          )}
          <button
            onClick={handleStartCreate}
            className="bg-orange-100 text-orange-700 hover:bg-orange-200 font-bold py-2 px-4 rounded-xl transition-all shadow-sm flex items-center gap-2 text-sm"
          >
            <Plus className="w-5 h-5" /> Nuevo Splash
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: List of Splashes */}
        <div className="lg:col-span-1 space-y-6 border-r border-neutral-100 pr-4 max-h-[800px] overflow-y-auto">
          {categories.length === 0 && !isCreating && (
             <p className="text-on-surface-muted text-sm italic">No hay splash screens todavía. ¡Crea uno nuevo!</p>
          )}

          {categories.map(cat => (
            <div key={cat} className="space-y-2">
              <h3 className="font-bold text-neutral-800 uppercase tracking-wider text-xs flex items-center gap-1">
                <Folder className="w-3 h-3" /> {cat}
              </h3>
              {splashes.filter(s => s.category === cat).map(splash => (
                <div
                  key={splash.id}
                  className={`p-3 rounded-xl border transition-all cursor-pointer group ${
                    selectedId === splash.id && !isCreating
                      ? 'border-orange-500 bg-orange-50/50'
                      : 'border-neutral-200 hover:border-orange-300 hover:bg-neutral-50'
                  }`}
                  onClick={() => handleSelect(splash)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-neutral-900 text-sm line-clamp-1">{splash.name}</p>
                      {splash.is_active && (
                        <p className="text-[10px] text-green-600 font-black uppercase tracking-wider mt-1 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Activo
                        </p>
                      )}
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(splash.id); }}
                      className="text-red-400 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      title="Eliminar splash"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
          
          {isCreating && (
             <div className="p-3 rounded-xl border border-orange-500 bg-orange-50/50">
               <p className="font-semibold text-orange-700 text-sm line-clamp-1">Nuevo Splash</p>
               <p className="text-[10px] text-orange-600 font-bold uppercase mt-1">Modo Creación</p>
             </div>
          )}
        </div>

        {/* Right Column: Form builder and preview */}
        <div className="lg:col-span-3 space-y-6">
          {(selectedId || isCreating) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Form Settings */}
              <div className="space-y-6 max-h-[800px] overflow-y-auto pr-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1 flex items-center gap-1">
                      <Tag className="w-4 h-4 text-on-surface-muted" /> Nombre
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej. Promo Verano"
                      className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-orange-500 text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1 flex items-center gap-1">
                      <Folder className="w-4 h-4 text-on-surface-muted" /> Categoría
                    </label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="Ej. Promociones"
                      className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-orange-500 text-neutral-900"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <h3 className="font-bold text-neutral-700 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-blue-500" />
                    Tipo de Medios y Duración
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Tipo</label>
                      <select
                        value={splashSettings.type}
                        onChange={(e) => setSplashSettings({ ...splashSettings, type: e.target.value as any })}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-orange-500 text-neutral-900"
                      >
                        <option value="image">Imagen / Logo Único</option>
                        <option value="slideshow">Carrusel de Imágenes</option>
                        <option value="video">Video (URL)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Duración (ms)</label>
                      <input
                        type="number"
                        value={splashSettings.duration}
                        onChange={(e) => setSplashSettings({ ...splashSettings, duration: parseInt(e.target.value) || 2000 })}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-orange-500 text-neutral-900"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                      <label className="block text-sm font-medium text-neutral-700">
                        {splashSettings.type === 'video' ? 'Video (URL de YouTube o MP4)' : 'Imágenes / Medios'}
                      </label>
                      {splashSettings.slides.map((slide, idx) => (
                         <div key={idx} className="flex flex-col gap-3 p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
                           <div className="flex items-center gap-2">
                             <input
                               type="text"
                               value={slide.url}
                               onChange={(e) => updateSlide(idx, e.target.value)}
                               placeholder={splashSettings.type === 'video' ? "https://youtube.com/watch?v=..." : "URL de la imagen"}
                               className="flex-1 px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-orange-500 text-neutral-900 text-sm"
                             />
                             {splashSettings.type === 'slideshow' && idx > 0 && (
                               <button onClick={() => removeSlide(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                 <Trash2 className="w-5 h-5" />
                               </button>
                             )}
                           </div>

                           {(splashSettings.type === 'image' || splashSettings.type === 'slideshow') && (
                             <div className="flex flex-wrap gap-2">
                               <label className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border-2 border-dashed border-orange-200 text-orange-600 hover:bg-orange-50 rounded-xl cursor-pointer transition-all active:scale-[0.98]">
                                 {uploadingSlideIdx === idx ? (
                                   <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                 ) : (
                                   <ImageIcon className="w-5 h-5" />
                                 )}
                                 <span className="font-bold text-sm">
                                   {uploadingSlideIdx === idx ? 'Subiendo...' : 'Subir desde Galería'}
                                 </span>
                                 <input 
                                   type="file" 
                                   accept="image/*" 
                                   className="hidden" 
                                   onChange={(e) => handleImageUpload(e, idx)} 
                                 />
                               </label>

                               <label className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border-2 border-dashed border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl cursor-pointer transition-all active:scale-[0.98]">
                                 <Video className="w-5 h-5" />
                                 <span className="font-bold text-sm">Tomar Foto</span>
                                 <input 
                                   type="file" 
                                   accept="image/*" 
                                   capture="environment"
                                   className="hidden" 
                                   onChange={(e) => handleImageUpload(e, idx)} 
                                 />
                               </label>
                             </div>
                           )}

                           {slide.url && (
                             <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-neutral-200 bg-white">
                                {splashSettings.type === 'video' ? (
                                  <div className="w-full h-full flex items-center justify-center bg-neutral-100 text-[10px] font-bold">VIDEO</div>
                                ) : (
                                  <img src={slide.url} alt="Preview" className="w-full h-full object-contain" />
                                )}
                                <button 
                                  onClick={() => updateSlide(idx, '')}
                                  className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-bl-lg"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                             </div>
                           )}
                         </div>
                      ))}
                     {splashSettings.type === 'slideshow' && (
                       <button onClick={addSlide} className="text-sm text-orange-600 font-medium flex items-center gap-1 hover:text-orange-700">
                          <Plus className="w-4 h-4"/> Añadir otra imagen
                       </button>
                     )}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-neutral-100">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-neutral-700 flex items-center gap-2">
                      <Type className="w-4 h-4 text-green-500" />
                      Textos y Tipografía
                    </h3>
                    <select
                      value={splashSettings.globalTypography || 'sans-serif'}
                      onChange={(e) => setSplashSettings({ ...splashSettings, globalTypography: e.target.value })}
                      className="px-3 py-1.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm text-neutral-900"
                    >
                      <option value="sans-serif">Sans-serif</option>
                      <option value="serif">Serif</option>
                      <option value="monospace">Monospace</option>
                      <option value="'Space Grotesk', sans-serif">Space Grotesk</option>
                      <option value="'Playfair Display', serif">Playfair Display</option>
                    </select>
                  </div>

                  <TextConfigEditor
                    label="Título Principal"
                    config={splashSettings.title || defaultSplash.title!}
                    onChange={(c) => setSplashSettings({ ...splashSettings, title: c })}
                  />

                  <TextConfigEditor
                    label="Subtítulo"
                    config={splashSettings.subtitle || defaultSplash.subtitle!}
                    onChange={(c) => setSplashSettings({ ...splashSettings, subtitle: c })}
                  />

                  {splashSettings.floatingTexts?.map((txt, idx) => (
                    <TextConfigEditor
                      key={txt.id}
                      label={`Texto Flotante ${idx + 1}`}
                      config={txt}
                      onChange={(c) => {
                        const newTexts = [...(splashSettings.floatingTexts || [])];
                        newTexts[idx] = c;
                        setSplashSettings({ ...splashSettings, floatingTexts: newTexts });
                      }}
                      onRemove={() => {
                        const newTexts = [...(splashSettings.floatingTexts || [])];
                        newTexts.splice(idx, 1);
                        setSplashSettings({ ...splashSettings, floatingTexts: newTexts });
                      }}
                    />
                  ))}

                  <button
                    onClick={() => {
                       setSplashSettings({
                         ...splashSettings,
                         floatingTexts: [
                           ...(splashSettings.floatingTexts || []), 
                           { id: Date.now().toString(), text: '', position: 'bottom', effect: 'none', size: 'base', weight: 'normal' }
                         ]
                       })
                    }}
                    className="w-full text-sm text-orange-600 font-medium py-2 border border-dashed border-orange-200 rounded-xl hover:bg-orange-50 flex items-center justify-center gap-1 transition-colors"
                  >
                     <Plus className="w-4 h-4"/> Añadir Texto Flotante Extra
                  </button>
                </div>
                
                <div className="space-y-4 pt-4 border-t border-neutral-100">
                  <h3 className="font-bold text-neutral-700 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-purple-500" />
                    Estilos y Efectos Extra
                  </h3>

                   <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Color de Fondo</label>
                      <input
                        type="color"
                        value={splashSettings.backgroundColor || '#ffffff'}
                        onChange={(e) => setSplashSettings({ ...splashSettings, backgroundColor: e.target.value })}
                        className="w-full h-10 px-1 py-1 border border-neutral-300 rounded-xl cursor-pointer"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Color de Texto Global</label>
                      <input
                        type="color"
                        value={splashSettings.globalTextColor || '#000000'}
                        onChange={(e) => setSplashSettings({ ...splashSettings, globalTextColor: e.target.value })}
                        className="w-full h-10 px-1 py-1 border border-neutral-300 rounded-xl cursor-pointer"
                      />
                    </div>
                  </div>

                   <div className="grid grid-cols-2 gap-4">
                       <div>
                        <label className="text-sm font-medium text-neutral-700 mb-1 flex items-center justify-between">
                           <span>Escala de Imagen</span>
                           <div className="relative group cursor-help text-neutral-400 hover:text-orange-500">
                             <Info className="w-4 h-4" />
                             <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-neutral-900 text-xs text-white rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center">
                               Recomendado: Imágenes transparentes de 512x512 px. Usa el slider para ajustarla.
                             </div>
                           </div>
                        </label>
                        <input
                          type="range"
                          min="5"
                          max="100"
                          step="1"
                          value={splashSettings.imageScale ?? 50}
                          onChange={(e) => setSplashSettings({ ...splashSettings, imageScale: parseInt(e.target.value) })}
                          className="w-full accent-orange-500 h-2 mt-2"
                        />
                        <div className="text-xs text-center text-neutral-500 mt-1">{splashSettings.imageScale ?? 50}%</div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Efecto en Imagen</label>
                        <select
                          value={splashSettings.imageEffect}
                          onChange={(e) => setSplashSettings({ ...splashSettings, imageEffect: e.target.value as any })}
                          className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-orange-500 text-neutral-900"
                        >
                          <option value="none">Ninguno</option>
                          <option value="zoom">Zoom Suave (Ken Burns)</option>
                          <option value="pan">Desplazamiento Horizontal</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                         <label className="block text-sm font-medium text-neutral-700 mb-1 flex items-center gap-1">
                            <Music className="w-3 h-3"/> Audio (URL)
                         </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={splashSettings.audioUrl || ''}
                              onChange={(e) => setSplashSettings({ ...splashSettings, audioUrl: e.target.value })}
                              placeholder="URL MP3 (Opcional)"
                              className="flex-1 px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-orange-500 text-sm text-neutral-900"
                            />
                            <label className="bg-orange-50 text-orange-600 hover:bg-orange-100 p-2 rounded-xl cursor-pointer border border-orange-200 transition-colors flex items-center justify-center min-w-[40px]">
                              {uploadingSlideIdx === -1 ? (
                                <div className="flex flex-col items-center gap-1">
                                  <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                  {uploadProgress !== null && <span className="text-[8px] font-bold">{uploadProgress}%</span>}
                                </div>
                              ) : (
                                <Music className="w-4 h-4" />
                              )}
                              <input 
                                type="file" 
                                accept="audio/*" 
                                className="hidden" 
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  if (file.size > 50 * 1024 * 1024) {
                                    toast.error("El audio es demasiado grande. Máximo 50MB.");
                                    return;
                                  }
                                  setUploadingSlideIdx(-1); // Special index for audio
                                  setUploadProgress(0);
                                  const { url, error } = await db.uploadAudio(file, 'splash/audio', (p) => setUploadProgress(p));
                                  if (error) toast.error('Error al subir audio');
                                  else if (url) setSplashSettings({ ...splashSettings, audioUrl: url });
                                  setUploadingSlideIdx(null);
                                  setUploadProgress(null);
                                }} 
                              />
                            </label>
                          </div>
                      </div>
                  </div>
                </div>

                <div className="pt-6 flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-on-surface font-bold py-3 px-6 rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
                    Guardar Configuración
                  </button>
                  
                  {!isCreating && selectedId && (
                     <button
                        onClick={() => handleSetActive(selectedId)}
                        disabled={loading || splashes.find(s => s.id === selectedId)?.is_active}
                        className="flex-[0.5] bg-surface-variant disabled:opacity-50 hover:bg-black text-on-surface font-bold py-3 px-6 rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
                     >
                       <CheckCircle className="w-5 h-5" />
                       Usar como Activo
                     </button>
                  )}
                </div>
              </div>

              {/* Preview Simulator */}
              <div className="flex flex-col items-center justify-start sticky top-0">
                  <h3 className="font-bold text-neutral-700 mb-4 w-full px-4">Previsualización</h3>
                  <div 
                    className="w-[320px] h-[568px] rounded-[3rem] border-8 border-neutral-800 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center p-4 text-center pointer-events-none"
                    style={{ backgroundColor: splashSettings.backgroundColor, color: splashSettings.globalTextColor, fontFamily: splashSettings.globalTypography }}
                  >
                      {splashSettings.title?.position === 'top' && splashSettings.title.text && (
                         <h1 className="text-3xl font-bold mb-auto mt-8" style={{ color: splashSettings.title.color || splashSettings.globalTextColor }}>{splashSettings.title.text}</h1>
                      )}
                      
                      {splashSettings.slides[0]?.url && splashSettings.type === 'video' ? (
                          (splashSettings.slides[0].url.includes('youtube.com') || splashSettings.slides[0].url.includes('youtu.be')) ? (
                            <div className="w-full aspect-video bg-surface-variant rounded-xl flex items-center justify-center text-on-surface text-xs whitespace-pre-wrap">Video\nYouTube</div>
                          ) : (
                             <video src={splashSettings.slides[0].url} className="w-full aspect-video rounded-xl object-cover" muted />
                          )
                      ) : splashSettings.slides[0]?.url && (
                          <img 
                            src={splashSettings.slides[0].url} 
                            alt="Logo/Image" 
                            style={{ 
                               width: `${splashSettings.imageScale ?? 50}%`,
                               height: `${splashSettings.imageScale ?? 50}%`,
                               maxHeight: '100%',
                               maxWidth: '100%',
                               objectFit: splashSettings.imageScale === 100 ? 'cover' : 'contain'
                            }}
                            className={`${splashSettings.imageEffect === 'zoom' ? 'scale-110' : ''}`}
                          />
                      )}
                      
                      {splashSettings.title?.position === 'middle' && splashSettings.title.text && (
                         <h1 className="text-3xl font-bold mt-4" style={{ color: splashSettings.title.color || splashSettings.globalTextColor }}>{splashSettings.title.text}</h1>
                      )}
                      {splashSettings.subtitle?.text && (
                         <p className="text-lg mt-2 opacity-90" style={{ color: splashSettings.subtitle.color || splashSettings.globalTextColor }}>{splashSettings.subtitle.text}</p>
                      )}
                      
                      {splashSettings.title?.position === 'bottom' && splashSettings.title.text && (
                         <h1 className="text-3xl font-bold mt-auto mb-8" style={{ color: splashSettings.title.color || splashSettings.globalTextColor }}>{splashSettings.title.text}</h1>
                      )}
                  </div>
                  
                  <button
                    onClick={() => setIsPreviewing(true)}
                    className="mt-6 flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-6 py-3 rounded-full font-bold transition-all shadow-lg active:scale-95"
                  >
                    <Play className="w-4 h-4" /> Reproducir Splash
                  </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      
      {isPreviewing && (
        <CustomSplashScreen 
          onComplete={() => setIsPreviewing(false)} 
          platformSettings={{...settings, splashSettings}} 
        />
      )}
    </div>
  );
};
