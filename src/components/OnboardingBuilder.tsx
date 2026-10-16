import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlatformSettings, OnboardingScreen, OnboardingConfig, CustomOnboardingFlow } from '../store/db';
import { db } from '../store/db';
import { toast } from 'sonner';
import { Plus, Trash2, Image as ImageIcon, Save, ArrowRight, ArrowLeft, Video, Music, Type, Palette, LayoutList, Link as LinkIcon, Settings, Copy, Star } from 'lucide-react';

interface OnboardingBuilderProps {
  settings: PlatformSettings;
  onUpdate: (settings: PlatformSettings) => void;
}

const defaultScreen: OnboardingScreen = {
  id: '',
  title: 'Nueva Pantalla VIP',
  description: 'Describe el beneficio...',
  image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80',
  mediaType: 'image',
  bgFrom: '#FF8A00',
  bgTo: '#FFB347',
  status: 'active',
  textColor: '#FFFFFF',
  typography: 'sans-serif',
  titleEffect: 'none',
  descriptionEffect: 'none',
  imageEffect: 'none',
  layout: 'split'
};

export const OnboardingBuilder: React.FC<OnboardingBuilderProps> = ({ settings, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [uploadingScreens, setUploadingScreens] = useState<Record<string, boolean>>({});
  const [uploadProgresses, setUploadProgresses] = useState<Record<string, number>>({});
  
  const [config, setConfig] = useState<OnboardingConfig>(() => {
    return settings.onboardingSettings || {
      user: [],
      restaurant: [],
      driver: [],
      customFlows: []
    };
  });

  const [activeTab, setActiveTab] = useState<'user' | 'restaurant' | 'driver' | string>('user');
  const [editingFlowMode, setEditingFlowMode] = useState<boolean>(false);
  const [editingScreenId, setEditingScreenId] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setLoading(true);
      const newSettings = { ...settings, onboardingSettings: config };
      await db.updatePlatformSettings(newSettings);
      onUpdate(newSettings);
      toast.success('Configuración de onboarding guardada');
    } catch (error) {
      toast.error('Error al guardar onboarding');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getActiveFlowScreens = (): OnboardingScreen[] => {
    if (activeTab === 'user' || activeTab === 'restaurant' || activeTab === 'driver') {
      return config[activeTab] || [];
    }
    const custom = config.customFlows?.find(f => f.id === activeTab);
    return custom ? custom.screens : [];
  };

  const updateActiveFlowScreens = (screens: OnboardingScreen[]) => {
    if (activeTab === 'user' || activeTab === 'restaurant' || activeTab === 'driver') {
      setConfig(prev => ({ ...prev, [activeTab]: screens }));
    } else {
      setConfig(prev => ({
        ...prev,
        customFlows: prev.customFlows?.map(f => f.id === activeTab ? { ...f, screens } : f)
      }));
    }
  };

  const addScreen = () => {
    const newScreen = { ...defaultScreen, id: crypto.randomUUID() };
    const arr = [...getActiveFlowScreens(), newScreen];
    updateActiveFlowScreens(arr);
    setEditingScreenId(newScreen.id);
  };

  const removeScreen = (id: string) => {
    const arr = getActiveFlowScreens().filter(s => s.id !== id);
    updateActiveFlowScreens(arr);
    if (editingScreenId === id) setEditingScreenId(null);
  };

  const updateScreen = (id: string, field: keyof OnboardingScreen, value: any) => {
    const arr = getActiveFlowScreens().map(s => s.id === id ? { ...s, [field]: value } : s);
    updateActiveFlowScreens(arr);
  };

  const moveScreen = (index: number, direction: 'up' | 'down') => {
    const arr = [...getActiveFlowScreens()];
    if (direction === 'up' && index > 0) {
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    } else if (direction === 'down' && index < arr.length - 1) {
      [arr[index + 1], arr[index]] = [arr[index], arr[index + 1]];
    }
    updateActiveFlowScreens(arr);
  };

  const createCustomFlow = () => {
    const id = crypto.randomUUID();
    const newFlow: CustomOnboardingFlow = {
      id,
      name: 'Nuevo Curso / Tutorial Premium',
      description: 'Descripción del curso',
      screens: [],
      isActive: true
    };
    setConfig(prev => ({ ...prev, customFlows: [...(prev.customFlows || []), newFlow] }));
    setActiveTab(id);
  };

  const updateCustomFlow = (id: string, updates: Partial<CustomOnboardingFlow>) => {
    setConfig(prev => ({
      ...prev,
      customFlows: prev.customFlows?.map(f => f.id === id ? { ...f, ...updates } : f)
    }));
  };

  const deleteCustomFlow = (id: string) => {
    setConfig(prev => ({
      ...prev,
      customFlows: prev.customFlows?.filter(f => f.id !== id)
    }));
    setActiveTab('user');
  };

  const isCurrentFlowActive = (): boolean => {
    if (activeTab === 'user') return config.isUserActive !== false;
    if (activeTab === 'restaurant') return config.isRestaurantActive !== false;
    if (activeTab === 'driver') return config.isDriverActive !== false;
    return config.customFlows?.find(f => f.id === activeTab)?.isActive !== false;
  };

  const toggleCurrentFlowActive = () => {
    if (activeTab === 'user') setConfig(prev => ({ ...prev, isUserActive: !(prev.isUserActive !== false) }));
    else if (activeTab === 'restaurant') setConfig(prev => ({ ...prev, isRestaurantActive: !(prev.isRestaurantActive !== false) }));
    else if (activeTab === 'driver') setConfig(prev => ({ ...prev, isDriverActive: !(prev.isDriverActive !== false) }));
    else {
      updateCustomFlow(activeTab, { isActive: !(config.customFlows?.find(f => f.id === activeTab)?.isActive !== false) });
    }
  };

  const currentActiveState = isCurrentFlowActive();

  const handleCopyLink = (id: string) => {
     const url = `${window.location.origin}/onboarding/${id}`;
     navigator.clipboard.writeText(url);
     toast.success('Enlace copiado al portapapeles');
  };

  const getYoutubeEmbedUrl = (url: string) => {
    let videoId = '';
    try {
      if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
      else if (url.includes('youtube.com/watch')) videoId = new URL(url).searchParams.get('v') || '';
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}` : url;
    } catch { return url; }
  };

  const currentScreens = getActiveFlowScreens();
  const screenEditing = currentScreens.find(s => s.id === editingScreenId) || currentScreens[0];

  const TextSelectEffect = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => (
    <select value={value} onChange={e => onChange(e.target.value)} className="w-full mt-1 bg-surface-base border border-outline rounded-lg px-3 py-2 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none">
      <option value="none">Ninguno</option>
      <option value="fade">Fade In</option>
      <option value="bounce">Rebote</option>
      <option value="typing">Máquina de Escribir</option>
      <option value="slideUp">Deslizar Arriba</option>
      <option value="slideDown">Deslizar Abajo</option>
      <option value="slideLeft">Deslizar Izquierda</option>
      <option value="slideRight">Deslizar Derecha</option>
      <option value="zoom">Zoom</option>
      <option value="flip">Volteo</option>
    </select>
  );

  return (
    <div className="glass-card overflow-hidden min-h-[800px] flex flex-col md:flex-row shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
       {/* Sidebar */}
       <div className="w-full md:w-64 bg-surface-variant border-r border-outline flex flex-col overflow-y-auto">
          <div className="p-6 pb-2">
            <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
              <Star className="w-6 h-6 text-gold glow-text" /> Onboarding Elite
            </h2>
          </div>

          <div className="p-4 space-y-1">
             <div className="text-[10px] font-black text-on-surface-muted uppercase tracking-widest px-4 mb-3">Base</div>
             {[
               { id: 'user', label: 'Clientes VIP' },
               { id: 'restaurant', label: 'Top Restaurantes' },
               { id: 'driver', label: 'Repartidores Elite' }
             ].map(tab => (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id)}
                   className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all border ${activeTab === tab.id ? 'glass-button text-on-surface border-primary/50' : 'text-on-surface hover:bg-surface-light border-transparent hover:border-outline'}`}
                 >
                   {tab.label}
                 </button>
             ))}
          </div>

          <div className="p-4 space-y-1 flex-1">
             <div className="flex items-center justify-between px-4 mb-3">
               <div className="text-[10px] font-black text-on-surface-muted uppercase tracking-widest">Cursos Premium</div>
               <button onClick={createCustomFlow} className="text-primary hover:text-on-surface p-1 hover:bg-primary/20 rounded-md transition-colors">
                  <Plus className="w-4 h-4"/>
               </button>
             </div>
             
             {config.customFlows?.map(flow => (
                 <div key={flow.id} className="relative group">
                   <button
                     onClick={() => setActiveTab(flow.id)}
                     className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all truncate pr-16 border ${activeTab === flow.id ? 'bg-primary/20 border-primary text-primary glow-text' : 'text-on-surface hover:bg-surface-light border-transparent hover:border-outline'}`}
                   >
                     {flow.name}
                   </button>
                   {activeTab === flow.id && (
                     <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        <button onClick={(e) => { e.stopPropagation(); deleteCustomFlow(flow.id); }} className="p-1.5 text-error hover:bg-error/20 rounded-lg">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                     </div>
                   )}
                 </div>
             ))}
             {(!config.customFlows || config.customFlows.length === 0) && (
               <div className="px-4 py-4 bg-surface-base border border-outline border-dashed rounded-xl text-xs text-on-surface-muted text-center font-bold">Sin cursos extra.</div>
             )}
          </div>

          <div className="p-4 border-t border-outline">
             <button
               onClick={handleSave}
               disabled={loading}
               className="w-full flex items-center justify-center gap-2 glass-button text-on-surface px-4 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
             >
               {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
               Guardar Cambios
             </button>
          </div>
       </div>

       {/* Editor Content */}
       <div className="flex-1 bg-surface-base relative overflow-hidden flex flex-col md:flex-row">
          
          {/* Work Area */}
          <div className="flex-1 p-6 lg:p-10 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 100px)' }}>
             
             {/* Flow Settings (If custom) */}
             {activeTab !== 'user' && activeTab !== 'restaurant' && activeTab !== 'driver' && (
                <div className="bg-surface-variant border border-outline rounded-[2rem] p-6 mb-8 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent blur-2xl" />
                  <h3 className="font-bold text-on-surface mb-6 flex items-center gap-2 relative z-10"><Settings className="w-5 h-5 text-primary"/> Propiedades del Curso VIP</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                     <div>
                       <label className="text-[10px] font-black text-on-surface-muted uppercase tracking-widest">Nombre del Curso</label>
                       <input 
                         type="text" 
                         value={config.customFlows?.find(f => f.id === activeTab)?.name || ''} 
                         onChange={(e) => updateCustomFlow(activeTab, { name: e.target.value })}
                         className="w-full bg-surface-base border border-outline rounded-xl px-4 py-3 mt-1.5 focus:border-primary focus:ring-1 focus:ring-primary text-on-surface outline-none"
                       />
                     </div>
                     <div>
                       <label className="text-[10px] font-black text-on-surface-muted uppercase tracking-widest">Enlace Directo</label>
                       <div className="flex items-center gap-2 mt-1.5">
                          <input 
                            type="text" 
                            readOnly 
                            value={`${window.location.origin}/onboarding/${activeTab}`}
                            className="flex-1 bg-surface-base border border-outline rounded-xl px-4 py-3 text-sm text-on-surface-muted select-all outline-none font-mono"
                          />
                          <button onClick={() => handleCopyLink(activeTab)} className="glass-button text-on-surface p-3 rounded-xl">
                             <Copy className="w-4 h-4"/>
                          </button>
                       </div>
                     </div>
                  </div>
                </div>
             )}

             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
               <h3 className="font-bold text-on-surface text-xl flex items-center gap-2">
                 Pantallas
                 <span className="bg-surface-variant border border-outline px-2 py-0.5 rounded-md text-xs font-mono text-primary">{currentScreens.length}</span>
               </h3>
               <div className="flex items-center gap-3">
                 <button 
                   onClick={toggleCurrentFlowActive}
                   className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${currentActiveState ? 'bg-error/20 text-error border border-error/30 hover:bg-error hover:text-white' : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white'}`}
                 >
                   {currentActiveState ? 'Desactivar Onboarding' : 'Activar Onboarding'}
                 </button>
                 <button onClick={addScreen} className="bg-primary/20 text-primary border border-primary/30 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary hover:text-on-surface transition-all flex items-center justify-center gap-2">
                   <Plus className="w-4 h-4"/> Añadir Pantalla
                 </button>
               </div>
             </div>

             {/* Screen List (Horizontal scroll or wrap) */}
             <div className="flex gap-4 overflow-x-auto pb-6 mb-8 no-scrollbar">
                {currentScreens.map((screen, idx) => (
                  <button
                    key={screen.id}
                    onClick={() => setEditingScreenId(screen.id)}
                    className={`shrink-0 w-[140px] h-[180px] rounded-[2rem] p-2 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 border ${editingScreenId === screen.id ? 'border-primary ring-2 ring-primary/50 shadow-[0_0_20px_rgba(255,138,0,0.3)] scale-105' : 'border-outline hover:border-primary/50 opacity-70 hover:opacity-100 bg-surface-variant'}`}
                    style={{ background: `linear-gradient(135deg, ${screen.bgFrom}, ${screen.bgTo})` }}
                  >
                     {screen.mediaType === 'video' ? (
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-on-surface"><Video className="w-8 h-8 opacity-60 drop-shadow-lg"/></div>
                     ) : (
                        screen.image && <img src={screen.image} className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60" />
                     )}
                     <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-on-surface text-[10px] w-6 h-6 flex items-center justify-center rounded-full font-bold">{idx + 1}</div>
                     <span className="relative z-10 text-on-surface font-black text-sm text-center line-clamp-2 px-2 drop-shadow-md leading-tight">{screen.title || 'Vacío'}</span>
                  </button>
                ))}
                {currentScreens.length === 0 && (
                  <div className="w-full text-center py-16 bg-surface-variant rounded-[2rem] border border-outline border-dashed text-on-surface-muted font-bold flex flex-col items-center gap-3">
                    <Palette className="w-8 h-8 opacity-50" />
                    No hay pantallas en esta secuencia
                  </div>
                )}
             </div>

             {/* Screen Editor Form */}
             {screenEditing && (
                <div className="bg-surface-variant border border-outline rounded-[2.5rem] p-6 lg:p-8 relative mt-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-6 border-b border-outline gap-4">
                     <span className="font-bold text-on-surface text-xl flex items-center gap-3 glow-text">
                       <Settings className="w-6 h-6 text-primary"/> Editar Pantalla Elite
                     </span>
                     <div className="flex gap-2">
                       <button onClick={() => moveScreen(currentScreens.findIndex(s => s.id === screenEditing.id), 'up')} className="p-2.5 bg-surface-base border border-outline hover:border-primary rounded-xl text-on-surface transition-all"><ArrowLeft className="w-4 h-4"/></button>
                       <button onClick={() => moveScreen(currentScreens.findIndex(s => s.id === screenEditing.id), 'down')} className="p-2.5 bg-surface-base border border-outline hover:border-primary rounded-xl text-on-surface transition-all"><ArrowRight className="w-4 h-4"/></button>
                       <button onClick={() => removeScreen(screenEditing.id)} className="p-2.5 bg-error/10 hover:bg-error/20 border border-error/20 text-error rounded-xl transition-all"><Trash2 className="w-4 h-4"/></button>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
                     
                     {/* Left Column: Media & Background */}
                     <div className="space-y-6">
                        <div className="bg-surface-base p-6 rounded-3xl border border-outline">
                           <h4 className="font-bold text-on-surface mb-5 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-primary"/> Elemento Visual</h4>
                           
                           <div className="flex bg-surface-variant p-1 rounded-xl mb-4 border border-outline">
                              <button 
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${screenEditing.mediaType === 'image' || !screenEditing.mediaType ? 'glass-button text-on-surface shadow-md shadow-primary/20' : 'text-on-surface-muted hover:text-on-surface'}`}
                                onClick={() => updateScreen(screenEditing.id, 'mediaType', 'image')}
                              >
                                Imagen
                              </button>
                              <button 
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${screenEditing.mediaType === 'video' ? 'glass-button text-on-surface shadow-md shadow-primary/20' : 'text-on-surface-muted hover:text-on-surface'}`}
                                onClick={() => updateScreen(screenEditing.id, 'mediaType', 'video')}
                              >
                                Video
                              </button>
                           </div>
                           
                           <input
                             type="text"
                             value={screenEditing.image}
                             onChange={(e) => updateScreen(screenEditing.id, 'image', e.target.value)}
                             placeholder={screenEditing.mediaType === 'video' ? "URL de YouTube o MP4" : "URL de la imagen"}
                             className="w-full px-4 py-3 bg-surface-variant border border-outline rounded-xl text-sm mb-4 text-on-surface focus:ring-1 focus:ring-primary outline-none"
                           />
                           
                           {(!screenEditing.mediaType || screenEditing.mediaType === 'image') && (
                              <div className="relative">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setUploadingScreens(prev => ({ ...prev, [screenEditing.id]: true }));
                                    const { url, error } = await db.uploadImage(file, 'onboarding');
                                    if (url) updateScreen(screenEditing.id, 'image', url);
                                    setUploadingScreens(prev => ({ ...prev, [screenEditing.id]: false }));
                                  }}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <button className="w-full py-3 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all">
                                  {uploadingScreens[screenEditing.id] ? <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin"/> : <ImageIcon className="w-5 h-5"/>}
                                  Subir desde dispositivo
                                </button>
                                <p className="text-center text-[11px] text-on-surface-muted/70 mt-2 font-medium">
                                  Recomendado: {screenEditing.layout === 'full' ? 'ratio 9:16 o 1080x1920px (pantalla completa)' : 'ratio 4:5 o 1080x1350px (vertical)'}
                                </p>
                              </div>
                           )}
                           
                           <div className="mt-5">
                              <label className="text-[10px] uppercase text-on-surface-muted font-black tracking-widest">Efecto Visual</label>
                              <select value={screenEditing.imageEffect || 'none'} onChange={(e) => updateScreen(screenEditing.id, 'imageEffect', e.target.value)} className="w-full mt-1.5 bg-surface-variant border border-outline text-on-surface rounded-xl px-4 py-3 text-sm focus:ring-1 outline-none">
                                <option value="none">Ninguno</option>
                                <option value="zoom">Zoom Suave</option>
                                <option value="pan">Panorámico</option>
                              </select>
                           </div>
                        </div>

                        <div className="bg-surface-base p-6 rounded-3xl border border-outline">
                           <h4 className="font-bold text-on-surface mb-5 flex items-center gap-2"><Palette className="w-4 h-4 text-gold"/> Paleta Premium</h4>
                           <div className="grid grid-cols-2 gap-5">
                             <div>
                               <label className="text-[10px] uppercase text-on-surface-muted font-black tracking-widest">Gradiente (Inicio)</label>
                               <div className="flex items-center gap-3 mt-1.5 border border-outline rounded-xl p-1.5 bg-surface-variant">
                                 <input type="color" value={screenEditing.bgFrom} onChange={(e) => updateScreen(screenEditing.id, 'bgFrom', e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"/>
                                 <span className="text-xs font-mono text-on-surface flex-1">{screenEditing.bgFrom}</span>
                               </div>
                             </div>
                             <div>
                               <label className="text-[10px] uppercase text-on-surface-muted font-black tracking-widest">Gradiente (Fin)</label>
                               <div className="flex items-center gap-3 mt-1.5 border border-outline rounded-xl p-1.5 bg-surface-variant">
                                 <input type="color" value={screenEditing.bgTo} onChange={(e) => updateScreen(screenEditing.id, 'bgTo', e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"/>
                                 <span className="text-xs font-mono text-on-surface flex-1">{screenEditing.bgTo}</span>
                               </div>
                             </div>
                             <div>
                               <label className="text-[10px] uppercase text-on-surface-muted font-black tracking-widest">Color de Texto</label>
                               <div className="flex items-center gap-3 mt-1.5 border border-outline rounded-xl p-1.5 bg-surface-variant">
                                 <input type="color" value={screenEditing.textColor || '#ffffff'} onChange={(e) => updateScreen(screenEditing.id, 'textColor', e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"/>
                                 <span className="text-xs font-mono text-on-surface flex-1">{screenEditing.textColor || '#fff'}</span>
                               </div>
                             </div>
                             <div>
                               <label className="text-[10px] uppercase text-on-surface-muted font-black tracking-widest">Tipografía</label>
                               <select value={screenEditing.typography || 'sans-serif'} onChange={(e) => updateScreen(screenEditing.id, 'typography', e.target.value)} className="w-full mt-1.5 bg-surface-variant border border-outline text-on-surface rounded-xl px-4 py-3 text-sm focus:ring-1 outline-none">
                                 <option value="sans-serif">System Sans</option>
                                 <option value="serif">System Serif</option>
                                 <option value="'Space Grotesk', sans-serif">Space Grotesk</option>
                                 <option value="'Inter', sans-serif">Inter V</option>
                               </select>
                             </div>
                           </div>
                        </div>

                        <div className="bg-surface-base p-6 rounded-3xl border border-outline">
                           <h4 className="font-bold text-on-surface mb-4 flex items-center gap-2"><Music className="w-4 h-4 text-primary"/> Paisaje Sonoro</h4>
                           <div className="flex gap-2">
                             <input type="text" value={screenEditing.audioUrl || ''} onChange={(e) => updateScreen(screenEditing.id, 'audioUrl', e.target.value)} placeholder="URL del audio (mp3, wav)" className="flex-1 px-4 py-3 bg-surface-variant border border-outline rounded-xl text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"/>
                             <label className="glass-button text-on-surface p-3 rounded-xl cursor-pointer flex items-center justify-center min-w-[48px]">
                               {uploadingScreens[screenEditing.id + '_audio'] ? (
                                 <div className="flex flex-col items-center gap-1">
                                   <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                   {uploadProgresses[screenEditing.id + '_audio'] !== undefined && (
                                     <span className="text-[8px] font-bold">{uploadProgresses[screenEditing.id + '_audio']}%</span>
                                   )}
                                 </div>
                               ) : (
                                 <Music className="w-5 h-5" />
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
                                   setUploadingScreens(prev => ({ ...prev, [screenEditing.id + '_audio']: true }));
                                   setUploadProgresses(prev => ({ ...prev, [screenEditing.id + '_audio']: 0 }));
                                   const { url, error } = await db.uploadAudio(file, 'onboarding/audio', (p) => {
                                      setUploadProgresses(prev => ({ ...prev, [screenEditing.id + '_audio']: p }));
                                   });
                                   if (error) toast.error('Error al subir audio');
                                   else if (url) updateScreen(screenEditing.id, 'audioUrl', url);
                                   setUploadingScreens(prev => ({ ...prev, [screenEditing.id + '_audio']: false }));
                                   setUploadProgresses(prev => {
                                      const next = { ...prev };
                                      delete next[screenEditing.id + '_audio'];
                                      return next;
                                   });
                                 }} 
                               />
                             </label>
                           </div>
                        </div>
                     </div>

                     {/* Right Column: Texts */}
                     <div className="space-y-6">
                        <div className="bg-surface-base p-6 rounded-3xl border border-outline">
                            <h4 className="font-bold text-on-surface mb-5 flex items-center gap-2"><Type className="w-4 h-4 text-primary"/> Compositor</h4>
                            
                            <div className="space-y-5">
                               <div>
                                  <label className="text-[10px] uppercase text-on-surface-muted font-black tracking-widest block mb-1.5">Diseño de Pantalla</label>
                                   <select 
                                     value={screenEditing.layout || 'split'} 
                                     onChange={(e) => updateScreen(screenEditing.id, 'layout', e.target.value)} 
                                     className="w-full bg-surface-variant border border-outline rounded-xl px-4 py-3 text-sm text-on-surface outline-none"
                                   >
                                     <option value="split">Dividido (70% Imagen / 30% Texto)</option>
                                     <option value="full">100% Solo Imagen (Sin texto adicional)</option>
                                   </select>
                                   <p className="text-[11px] text-on-surface-muted mt-1 mb-5 leading-relaxed">
                                     {screenEditing.layout === 'full' 
                                       ? "La imagen abarcará el 100% de la pantalla. El título y la descripción son opcionales y no se renderizarán." 
                                       : "La imagen ocupará el 70% de la pantalla y el texto se presentará en el 30% inferior."}
                                   </p>
                                </div>
                                <div className="pt-5 border-t border-outline">
                                   <label className="text-[10px] uppercase text-on-surface-muted font-black tracking-widest">Headline Principal (Opcional)</label>
                                  <input type="text" value={screenEditing.title || ''} onChange={(e) => updateScreen(screenEditing.id, 'title', e.target.value)} className="w-full px-4 py-3 bg-surface-variant border border-outline rounded-xl text-sm mt-1.5 text-on-surface focus:ring-1 focus:ring-primary outline-none"/>
                                  <div className="mt-3">
                                     <label className="text-[10px] uppercase text-on-surface-muted font-bold mb-1 block">Animación de Entrada</label>
                                     <TextSelectEffect value={screenEditing.titleEffect || 'none'} onChange={(v) => updateScreen(screenEditing.id, 'titleEffect', v)} />
                                  </div>
                               </div>

                               <div className="pt-5 border-t border-outline">
                                  <label className="text-[10px] uppercase text-on-surface-muted font-black tracking-widest">Argumento Descriptivo (Opcional)</label>
                                  <textarea value={screenEditing.description || ''} onChange={(e) => updateScreen(screenEditing.id, 'description', e.target.value)} className="w-full px-4 py-3 bg-surface-variant border border-outline rounded-xl text-sm mt-1.5 h-28 max-h-40 text-on-surface focus:ring-1 focus:ring-primary outline-none" placeholder="Descripción opcional de la pantalla..."/>
                                  <div className="mt-3">
                                     <label className="text-[10px] uppercase text-on-surface-muted font-bold mb-1 block">Animación de Entrada</label>
                                      <TextSelectEffect value={screenEditing.descriptionEffect || 'none'} onChange={(v) => updateScreen(screenEditing.id, 'descriptionEffect', v)} />
                                  </div>
                               </div>
                            </div>
                        </div>

                        <div className="bg-surface-base p-6 rounded-3xl border border-outline">
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                   <label className="text-[10px] uppercase text-on-surface-muted font-black tracking-widest mb-1.5 block">Estado de Pantalla</label>
                                   <select value={screenEditing.status || 'active'} onChange={(e) => updateScreen(screenEditing.id, 'status', e.target.value)} className="w-full bg-surface-variant border border-outline rounded-xl px-4 py-3 text-sm text-on-surface outline-none">
                                     <option value="active">Activo</option>
                                     <option value="paused">Pausado</option>
                                     <option value="inactive">Inactivo</option>
                                   </select>
                                </div>
                             </div>
                        </div>

                     </div>
                     
                  </div>
                </div>
             )}
          </div>

          {/* Side Mobile Preview Panel */}
          <div className="w-full md:w-[360px] bg-[#000000] flex flex-col pt-8 pb-8 px-6 items-center shrink-0 border-l border-outline/50 z-10 sticky top-0 shadow-[inset_10px_0_30px_-5px_rgba(0,0,0,0.5)]" style={{ maxHeight: 'calc(100vh - 100px)' }}>
              {/* iPhone Frame Mockup */}
              <div className="w-[300px] h-[610px] bg-[#0c0c0c] rounded-[3.5rem] p-3 shadow-2xl relative shrink-0 border-4 border-[#1f1f1f] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                  {/* Notch */}
                  <div className="absolute top-0 inset-x-0 h-6 bg-transparent z-[100] flex justify-center">
                    <div className="w-32 h-6 bg-[#1f1f1f] rounded-b-2xl relative">
                       <div className="absolute top-1 right-8 w-2 h-2 rounded-full bg-blue-900/40"></div>
                    </div>
                  </div>
                  
                  {screenEditing ? (
                    <div 
                      className="w-full h-full rounded-[2.8rem] overflow-hidden flex flex-col relative bg-surface-base"
                      style={{ 
                        fontFamily: screenEditing.typography || 'sans-serif'
                      }}
                    >
                       <div className="absolute inset-0 opacity-[0.1]" style={{ background: `linear-gradient(to bottom right, ${screenEditing.bgFrom}, ${screenEditing.bgTo})` }} />
                       
                       <div className={`flex flex-col items-center justify-center relative ${screenEditing.layout === 'full' ? 'absolute inset-0 w-full h-full z-11 bg-black' : 'flex-1 max-h-[55%] mt-6 px-4'}`}>
                          <div className={`absolute bottom-0 w-full pointer-events-none ${screenEditing.layout === 'full' ? 'h-48 z-30 bg-gradient-to-t from-black via-black/40 to-transparent' : 'h-[60%] bg-gradient-to-t from-surface-base to-transparent z-30'}`} />
                          {screenEditing.mediaType === 'video' ? (
                             <iframe src={getYoutubeEmbedUrl(screenEditing.image)} className={`z-20 pointer-events-none object-cover ${screenEditing.layout === 'full' ? 'w-full h-full scale-[1.3]' : 'w-[120%] h-[120%] aspect-video rounded-xl shadow-md transform scale-110'}`} allow="autoplay; encrypted-media" />
                          ) : (
                             screenEditing.image && <img src={screenEditing.image} className={`${screenEditing.layout === 'full' ? 'w-full h-full object-cover' : 'w-full h-[120%] object-cover'} z-20 mix-blend-screen opacity-90 ${screenEditing.imageEffect==='zoom'?'scale-110':''}`} />
                          )}
                       </div>
                       
<div className={`flex flex-col z-40 items-center justify-between relative ${screenEditing.layout === 'full' ? 'absolute bottom-0 inset-x-0 px-6 pb-8 pt-0 mt-auto' : 'flex-1 px-6 pt-0 pb-8'}`}>
                           <div className="absolute -top-10 inset-0 bg-surface-base mix-blend-normal z-10" />
                           
                           {screenEditing.layout !== 'full' ? (
                              <div className="mt-8 text-center w-full z-20 leading-tight flex flex-col items-center" style={{ color: screenEditing.textColor && screenEditing.textColor !== '#ffffff' ? screenEditing.textColor : '#ffffff' }}>
                                 <h3 className="text-[22px] font-black mb-3 drop-shadow-md text-balance leading-[1.1]">{screenEditing.title || 'Nueva Pantalla VIP'}</h3>
                                 <p className="opacity-80 text-[13px] leading-relaxed max-w-[90%] font-medium text-balance">{screenEditing.description || 'Describe el beneficio de esta pantalla...'}</p>
                              </div>
                           ) : (
                              <div className="h-0 opacity-0 pointer-events-none" />
                           )}

                           <div className="w-full z-20 mt-auto">
                              {/* Progress bar Dots */}
                              <div className="flex justify-center gap-1.5 mb-8">
                                 {currentScreens.map((_, i) => (
                                   <div key={i} className={`h-1 rounded-full transition-all duration-300 ${currentScreens.findIndex(s=>s.id===screenEditing.id) === i ? 'w-8' : 'w-2 bg-on-surface-muted/30'}`} style={currentScreens.findIndex(s=>s.id===screenEditing.id) === i ? { background: `linear-gradient(to right, ${screenEditing.bgFrom}, ${screenEditing.bgTo})` } : undefined} />
                                 ))}
                              </div>
                               <button className={`w-full py-4 rounded-2xl flex items-center justify-center font-bold text-[15px] uppercase tracking-wider transition-transform active:scale-95 ${screenEditing.layout === 'full' ? 'bg-white text-black shadow-lg shadow-black/30 animate-fade-in' : 'shadow-[0_5px_20px_rgba(255,138,0,0.4)]'}`} style={screenEditing.layout === 'full' ? undefined : { background: `linear-gradient(135deg, ${screenEditing.bgFrom}, ${screenEditing.bgTo})`, color: screenEditing.textColor || '#fff' }}>
                                Continuar
                              </button>
                          </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full rounded-[2.8rem] bg-surface-variant flex flex-col items-center justify-center text-on-surface-muted font-bold border-2 border-dashed border-outline gap-3">
                       <Palette className="w-10 h-10 opacity-30" />
                       Vista Previa VIP
                    </div>
                  )}
              </div>
          </div>
       </div>

    </div>
  );
};
