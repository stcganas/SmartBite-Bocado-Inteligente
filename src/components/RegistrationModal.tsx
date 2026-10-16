import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { db } from '../store/db';
import { Mail, Lock, AlertCircle, Loader2, X } from 'lucide-react';

interface RegistrationModalProps {
  onClose: () => void;
  onSuccess: () => void;
  defaultName: string;
  defaultPhone: string;
  defaultAddress: string;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({ onClose, onSuccess, defaultName, defaultPhone, defaultAddress }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: defaultName,
            role: 'user',
          }
        }
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        // Create app_users profile
        const { error: userError } = await supabase.from('app_users').upsert({
          id: data.user.id,
          email: email,
          role: 'user',
          status: 'active',
          display_name: defaultName,
        });

        if (userError) console.error('Error creating app profile:', userError);
        
        // Ensure db app user is patched with phone and address
        await db.updateAppUser(data.user.id, {
          phone: defaultPhone,
          addresses: defaultAddress ? [{
            id: Date.now().toString(),
            name: 'Principal',
            address: defaultAddress
          }] : []
        });

        onSuccess();
      }
    } catch (err: any) {
      console.error("Registration UI error", err);
      setError(err.message || "Error al completar el registro");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-sm overflow-hidden bg-white shadow-2xl rounded-3xl z-10"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold font-sans text-neutral-900 tracking-tight">Finalizar Registro</h3>
            <button onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors rounded-full hover:bg-neutral-100">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-sm text-neutral-600 mb-6">Hemos guardado tus datos ({defaultName}). Por favor, crea un correo y contraseña para terminar.</p>

          {error && (
            <div className="flex items-start gap-3 p-4 mb-6 text-red-800 bg-red-50 rounded-2xl">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5 border border-neutral-200 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary rounded-2xl p-3 bg-neutral-50 transition-all">
              <label className="text-xs font-bold tracking-wider text-neutral-500 uppercase flex items-center gap-2">
                <Mail className="w-4 h-4" /> Correo Electrónico
              </label>
              <input
                type="email"
                required
                className="w-full bg-transparent border-0 outline-none p-0 text-neutral-900 font-medium placeholder-neutral-400 focus:ring-0"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5 border border-neutral-200 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary rounded-2xl p-3 bg-neutral-50 transition-all">
              <label className="text-xs font-bold tracking-wider text-neutral-500 uppercase flex items-center gap-2">
                <Lock className="w-4 h-4" /> Contraseña
              </label>
              <input
                type="password"
                required
                className="w-full bg-transparent border-0 outline-none p-0 text-neutral-900 font-medium placeholder-neutral-400 focus:ring-0"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative py-4 px-6 text-white font-bold rounded-2xl transition-all shadow-md active:scale-[0.98] mt-4 overflow-hidden bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> Registrando...
                </span>
              ) : (
                "Completar Registro"
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
