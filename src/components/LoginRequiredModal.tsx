import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, UserPlus, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginRequiredModal: React.FC<LoginRequiredModalProps> = ({ isOpen, onClose }) => {
  const { setLoginPromptOpen } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If auth state changes or user somehow logs in via other windows
    const token = localStorage.getItem('supabase.auth.token');
    if (token) {
        onClose();
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-orange-950/20 backdrop-blur-sm z-[99999]"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[100000] pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-[0_20px_60px_-15px_rgba(234,88,12,0.3)] pointer-events-auto border-2 border-orange-100"
            >
              <div className="relative p-6 text-center">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 bg-orange-50 text-orange-400 hover:text-orange-600 rounded-full hover:bg-orange-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-inner relative overflow-hidden">
                    <UserPlus className="w-8 h-8 text-orange-500 z-10" />
                    <motion.div 
                        animate={{ rotate: 360 }} 
                        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"
                    />
                </div>
                
                <h3 className="text-xl font-black text-neutral-800 mb-2 font-display flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                  ¡Hola! ¿Eres nuevo por aquí?
                </h3>
                
                <p className="text-on-surface-variant text-sm leading-relaxed mb-6 font-medium">
                  Para poder elegir este delicioso producto y pedir en nuestros restaurantes, necesitamos que crees una cuenta y nos digas dónde llevar tu pedido.
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      onClose();
                      setLoginPromptOpen(false); // Make sure it's closed
                      navigate('/auth');
                    }}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-on-surface font-bold py-3.5 px-4 rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span>Iniciar sesión o Registrase</span>
                  </button>
                  
                  <button
                    onClick={onClose}
                    className="w-full bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold py-3.5 px-4 rounded-2xl transition-all active:scale-95"
                  >
                    En otro momento
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
