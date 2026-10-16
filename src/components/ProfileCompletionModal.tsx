import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, MapPin, Calendar, Mail, Camera, Save, Home, Briefcase, ChevronRight, AlertCircle, Loader2, Heart, Trash2, Plus, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db, Address } from '../store/db';
import { ImageSizeInfo } from './ImageSizeInfo';
import { toast } from 'sonner';

export const ProfileCompletionModal: React.FC = () => {
    const { appUser, refreshAppUser, loading } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [hasSaved, setHasSaved] = useState(false);
    const [step, setStep] = useState(1);
    
    // Form State
    const [formData, setFormData] = useState({
        displayName: '',
        phone: '',
        birthDate: '',
        age: 0,
        avatarUrl: '',
        addresses: [] as Address[],
        anniversaries: [] as { type: string; date: string }[]
    });

    const [homeAddress, setHomeAddress] = useState({
        address: '',
        neighborhood: '',
        city: 'Cúcuta' // Default value
    });

    const [workAddress, setWorkAddress] = useState({
        address: '',
        neighborhood: '',
        city: 'Cúcuta'
    });

    useEffect(() => {
        const isDashboard = window.location.pathname.startsWith('/admin') || 
                           window.location.pathname.startsWith('/platform') || 
                           window.location.pathname.startsWith('/driver');

        const isCustomer = appUser?.role === 'user';

        // Check if user is a guest or has dismissed the modal
        const isGuest = 
            appUser?.isGuest || 
            (appUser as any)?.is_guest || 
            appUser?.email?.includes('@smartbite.guest.com') || 
            appUser?.email?.startsWith('guest_') ||
            Boolean(localStorage.getItem('smartbite_is_guest')) ||
            Boolean(sessionStorage.getItem('smartbite_is_guest')) ||
            sessionStorage.getItem('dismissed_profile_modal') === 'true';

        // Guests must NEVER be prompted to complete a profile
        if (isGuest) {
            setIsOpen(false);
            return;
        }

        if (!loading && appUser && isCustomer && !hasSaved && !isDashboard) {
            const isMissingData = !appUser.profileCompleted;
            
            if (isMissingData) {
                setIsOpen(true);
                // Pre-fill data
                setFormData({
                    displayName: appUser.displayName || '',
                    phone: appUser.phone || '',
                    birthDate: appUser.birthDate || '',
                    age: appUser.age || 0,
                    avatarUrl: appUser.avatarUrl || '',
                    addresses: appUser.addresses || [],
                    anniversaries: appUser.anniversaries || []
                });

                // Pre-fill addresses if they exist
                const home = appUser.addresses?.find(a => a.name === 'Casa' || a.name === 'Principal' || a.name === 'Hogar');
                if (home) setHomeAddress({ address: home.address || '', neighborhood: home.neighborhood || '', city: home.city || 'Cúcuta' });

                const work = appUser.addresses?.find(a => a.name === 'Trabajo' || a.name === 'Oficina');
                if (work) setWorkAddress({ address: work.address || '', neighborhood: work.neighborhood || '', city: work.city || 'Cúcuta' });
            } else {
                setIsOpen(false);
            }
        }
    }, [appUser, loading, hasSaved]);

    const calculateAge = (birthDate: string) => {
        if (!birthDate) return 0;
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const date = e.target.value;
        const age = calculateAge(date);
        setFormData(prev => ({ ...prev, birthDate: date, age }));
    };

    const handleAddAnniversary = () => {
        setFormData(prev => ({
            ...prev,
            anniversaries: [...(prev.anniversaries || []), { type: 'Aniversario de Bodas', date: '' }]
        }));
    };

    const handleRemoveAnniversary = (index: number) => {
        setFormData(prev => ({
            ...prev,
            anniversaries: prev.anniversaries.filter((_, i) => i !== index)
        }));
    };

    const updateAnniversary = (index: number, field: 'type' | 'date', value: string) => {
        setFormData(prev => {
            const up = [...prev.anniversaries];
            up[index] = { ...up[index], [field]: value };
            return { ...prev, anniversaries: up };
        });
    };

    const handleSave = async () => {
        if (!appUser) return;
        
        // Basic validation
        if (!formData.displayName || !formData.phone || !formData.birthDate) {
            toast.error("Por favor completa los campos básicos");
            setStep(1);
            return;
        }

        if (!homeAddress.address) {
            toast.error("La dirección de casa es obligatoria");
            setStep(2);
            return;
        }

        setIsSaving(true);
        try {
            // Maintain existing addresses but update or add Casa
            const otherAddresses = (appUser.addresses || []).filter(a => a.name !== 'Casa' && a.name !== 'Trabajo' && a.name !== 'Principal');
            
            const finalAddresses: Address[] = [
                ...otherAddresses,
                { id: 'home', name: 'Casa', address: homeAddress.address, neighborhood: homeAddress.neighborhood, city: homeAddress.city },
            ];

            if (workAddress.address) {
                finalAddresses.push({ id: 'work', name: 'Trabajo', address: workAddress.address, neighborhood: workAddress.neighborhood, city: workAddress.city });
            }

            const { error } = await db.updateAppUser(appUser.id, {
                displayName: formData.displayName,
                phone: formData.phone,
                birthDate: formData.birthDate,
                age: formData.age,
                addresses: finalAddresses,
                avatarUrl: formData.avatarUrl,
                anniversaries: formData.anniversaries,
                profileCompleted: true
            });

            if (error) throw error;

            if (refreshAppUser) {
                await refreshAppUser();
            }
            
            // Set saved and close with a small delay to ensure states are synced
            setHasSaved(true);
            setTimeout(() => {
                setIsOpen(false);
            }, 100);
        } catch (err) {
            console.error(err);
            toast.error("Error al actualizar el perfil");
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0] || !appUser) return;
        
        const file = e.target.files[0];
        try {
            const { url, error } = await db.uploadImage(file, `avatars/${appUser.id}`);
            if (error) throw error;
            if (url) setFormData(prev => ({ ...prev, avatarUrl: url }));
        } catch (err) {
            toast.error("Error al subir la imagen");
        }
    };

    const handleDismiss = () => {
        setIsOpen(false);
        try {
            sessionStorage.setItem('dismissed_profile_modal', 'true');
        } catch (e) {}
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="bg-orange-600 p-6 text-on-surface flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Completa tu Perfil</h2>
                            <p className="text-orange-100 text-sm">Personaliza tus datos de entrega</p>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
                        title="Cerrar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[70vh]">
                    {/* Stepper Visual */}
                    <div className="flex items-center gap-2 mb-4">
                        <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-orange-500' : 'bg-neutral-100'}`} />
                        <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-orange-500' : 'bg-neutral-100'}`} />
                        <div className={`h-1.5 flex-1 rounded-full ${step >= 3 ? 'bg-orange-500' : 'bg-neutral-100'}`} />
                    </div>

                    {step === 1 && (
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-4"
                        >
                            <div className="text-center mb-6">
                                <div className="relative inline-block group">
                                    <div className="w-24 h-24 rounded-full bg-neutral-100 border-4 border-orange-50 overflow-hidden relative">
                                        {formData.avatarUrl ? (
                                            <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-on-surface-muted">
                                                <User className="w-10 h-10" />
                                            </div>
                                        )}
                                        <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                            <Camera className="w-6 h-6 text-on-surface" />
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                        </label>
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 bg-orange-500 p-1.5 rounded-full border-2 border-white text-on-surface">
                                        <Camera className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-center gap-1 mt-2">
                                    <p className="text-xs text-on-surface-variant uppercase font-black tracking-widest">Foto de perfil</p>
                                    <ImageSizeInfo type="profile" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-on-surface-variant mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                                        <User className="w-3.5 h-3.5" /> Nombres y Apellidos *
                                    </label>
                                    <input 
                                        type="text" 
                                        value={formData.displayName}
                                        onChange={e => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                                        placeholder="Ej: Juan Pérez"
                                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-neutral-900"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-on-surface-variant mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                                            <Phone className="w-3.5 h-3.5" /> Teléfono *
                                        </label>
                                        <input 
                                            type="tel" 
                                            value={formData.phone}
                                            onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                            placeholder="300 123 4567"
                                            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-neutral-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-on-surface-variant mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                                            <AlertCircle className="w-3.5 h-3.5" /> Email
                                        </label>
                                        <input 
                                            type="text" 
                                            value={appUser?.email}
                                            disabled
                                            className="w-full px-4 py-3 bg-neutral-100 border border-neutral-200 rounded-xl text-on-surface-variant cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-on-surface-variant mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                                            <Calendar className="w-3.5 h-3.5" /> Nacimiento *
                                        </label>
                                        <input 
                                            type="date" 
                                            value={formData.birthDate}
                                            onChange={handleBirthDateChange}
                                            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-neutral-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-on-surface-variant mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                                            Edad
                                        </label>
                                        <div className="w-full px-4 py-3 bg-neutral-100 border border-neutral-200 rounded-xl text-on-surface-variant font-bold">
                                            {formData.age} años
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-6"
                        >
                            {/* Home Address */}
                            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 space-y-3">
                                <div className="flex items-center gap-2 text-orange-600 font-bold mb-1">
                                    <Home className="w-4 h-4" /> Dirección Principal (Casa) *
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-1 block">Dirección</label>
                                    <input 
                                        type="text" 
                                        placeholder="Calle 1 # 2-3"
                                        value={homeAddress.address}
                                        onChange={e => setHomeAddress(prev => ({ ...prev, address: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-sm text-neutral-900"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-1 block">Barrio</label>
                                        <input 
                                            type="text" 
                                            placeholder="Nombre del barrio"
                                            value={homeAddress.neighborhood}
                                            onChange={e => setHomeAddress(prev => ({ ...prev, neighborhood: e.target.value }))}
                                            className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-sm text-neutral-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-1 block">Ciudad</label>
                                        <input 
                                            type="text" 
                                            value={homeAddress.city}
                                            onChange={e => setHomeAddress(prev => ({ ...prev, city: e.target.value }))}
                                            className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-sm text-neutral-900"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Work Address */}
                            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 space-y-3">
                                <div className="flex items-center gap-2 text-blue-600 font-bold mb-1">
                                    <Briefcase className="w-4 h-4" /> Dirección Secundaria (Trabajo)
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-1 block">Dirección</label>
                                    <input 
                                        type="text" 
                                        placeholder="Opcional"
                                        value={workAddress.address}
                                        onChange={e => setWorkAddress(prev => ({ ...prev, address: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-neutral-900"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-1 block">Barrio</label>
                                        <input 
                                            type="text" 
                                            value={workAddress.neighborhood}
                                            onChange={e => setWorkAddress(prev => ({ ...prev, neighborhood: e.target.value }))}
                                            className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-neutral-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-1 block">Ciudad</label>
                                        <input 
                                            type="text" 
                                            value={workAddress.city}
                                            onChange={e => setWorkAddress(prev => ({ ...prev, city: e.target.value }))}
                                            className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-neutral-900"
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-6"
                        >
                            <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 space-y-4">
                                <div className="flex items-center gap-2 text-rose-600 font-bold">
                                    <Heart className="w-5 h-5 fill-rose-600" /> Fechas Especiales
                                </div>
                                <p className="text-xs text-rose-800 leading-relaxed">
                                    ¡Queremos celebrar contigo! Registra tus aniversarios y recibe sorpresas especiales del restaurante.
                                </p>

                                <div className="space-y-3">
                                    {formData.anniversaries.map((ann, idx) => (
                                        <div key={idx} className="flex gap-2 items-end">
                                            <div className="flex-1 space-y-1">
                                                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest pl-1 text-left block">Tipo de Fecha</label>
                                                <select 
                                                    value={ann.type}
                                                    onChange={e => updateAnniversary(idx, 'type', e.target.value)}
                                                    className="w-full px-3 py-2 bg-white border border-rose-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 text-sm text-neutral-900"
                                                >
                                                    <option>Aniversario de Bodas</option>
                                                    <option>Aniversario de Novios</option>
                                                    <option>Otro Aniversario</option>
                                                </select>
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest pl-1 text-left block">Fecha</label>
                                                <input 
                                                    type="date" 
                                                    value={ann.date}
                                                    onChange={e => updateAnniversary(idx, 'date', e.target.value)}
                                                    className="w-full px-3 py-2 bg-white border border-rose-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 text-sm text-neutral-900"
                                                />
                                            </div>
                                            <button 
                                                onClick={() => handleRemoveAnniversary(idx)}
                                                className="p-2.5 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}

                                    <button 
                                        onClick={handleAddAnniversary}
                                        className="w-full py-3 border-2 border-dashed border-rose-200 rounded-xl flex items-center justify-center gap-2 text-rose-600 font-bold text-sm hover:bg-rose-50 transition-all mt-2"
                                    >
                                        <Plus className="w-4 h-4" /> Agregar Fecha Especial
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-neutral-50 flex items-center justify-between border-t border-neutral-100">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setStep(s => Math.max(1, s - 1))}
                            disabled={step === 1 || isSaving}
                            className={`text-on-surface-variant font-bold text-sm ${step === 1 ? 'opacity-0' : ''}`}
                        >
                            Atrás
                        </button>
                        <button
                            onClick={handleDismiss}
                            disabled={isSaving}
                            className="text-xs text-neutral-400 hover:text-neutral-600 font-medium underline transition-colors"
                        >
                            Completar más tarde
                        </button>
                    </div>

                    <div className="flex gap-2">
                        {step < 3 ? (
                            <button 
                                onClick={() => setStep(s => s + 1)}
                                className="bg-surface-base text-on-surface px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-all"
                            >
                                Siguiente <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-orange-500 text-on-surface px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                                ) : (
                                    <><Save className="w-4 h-4" /> Completar Perfil</>
                                )}
                            </button>
                        ) }
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
