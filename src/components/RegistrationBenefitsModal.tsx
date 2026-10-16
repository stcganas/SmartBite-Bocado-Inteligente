import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Trophy, Star, RefreshCcw, Sparkles, UserPlus, ArrowRight, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RegistrationBenefitsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegistrationBenefitsModal: React.FC<RegistrationBenefitsModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-lg overflow-y-auto max-h-[90vh] shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
              {/* Header Banner */}
              <div className="relative h-48 bg-gradient-to-br from-orange-500 via-rose-500 to-pink-600 overflow-hidden flex items-center justify-center">
                {/* Background decorative circles */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20">
                  <div className="absolute -top-10 -left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
                  <div className="absolute top-20 right-10 w-32 h-32 bg-white rounded-full blur-2xl"></div>
                </div>

                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 text-on-surface rounded-full backdrop-blur-md transition-colors z-10"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="relative z-10 text-center px-6">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-on-surface mb-3 shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                  >
                    <Star className="w-8 h-8 fill-current text-yellow-300" />
                  </motion.div>
                  <h2 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight drop-shadow-md">
                    ¡Únete a SmartBite!
                  </h2>
                  <p className="text-on-surface/90 text-sm font-medium mt-1 drop-shadow">
                    Para hacer un pedido, primero crea tu cuenta gratuita.
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 md:p-8 bg-surface">
                <div className="text-center mb-8">
                  <h3 className="text-lg font-black text-on-surface mb-2">
                    Descubre todos los beneficios
                  </h3>
                  <p className="text-on-surface-variant text-sm font-medium leading-relaxed max-w-[280px] mx-auto">
                    Al registrarte no solo puedes ordenar tu comida favorita, sino que desbloqueas una experiencia completa:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-orange-50/50 border border-orange-100">
                    <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-3">
                      <RefreshCcw className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-neutral-800 text-sm mb-1">Ruleta de Premios</h4>
                    <p className="text-on-surface-variant text-xs">Gana descuentos y regalos girando la ruleta después de comprar.</p>
                  </div>
                  
                  <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-neutral-800 text-sm mb-1">Acumula Monedas de Oro</h4>
                    <p className="text-on-surface-variant text-xs">Por cada compra acumulas monedas de oro que puedes canjear luego.</p>
                  </div>

                  <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-rose-50/50 border border-rose-100">
                    <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
                      <Gift className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-neutral-800 text-sm mb-1">Recompensas</h4>
                    <p className="text-on-surface-variant text-xs">Desbloquea niveles y obtén beneficios exclusivos de cliente frecuente.</p>
                  </div>

                  <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-neutral-800 text-sm mb-1">Compras Seguras</h4>
                    <p className="text-on-surface-variant text-xs">Historial de pedidos, direcciones guardadas y soporte ágil.</p>
                  </div>
                </div>

                {/* Call to action */}
                <div className="flex flex-col items-center relative">
                  <motion.button
                    onClick={() => navigate('/auth?mode=register')}
                    animate={{ 
                      scale: [1, 1.05, 1],
                      boxShadow: [
                        "0 0 0 0 rgba(249, 115, 22, 0.4)",
                        "0 0 20px 10px rgba(249, 115, 22, 0)",
                        "0 0 0 0 rgba(249, 115, 22, 0.0)"
                      ]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 2, 
                      ease: "easeInOut" 
                    }}
                    className="relative w-full overflow-hidden bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-on-surface font-black py-4 px-8 rounded-2xl flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1 group"
                  >
                    <div className="absolute inset-0 w-full h-full bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" />
                    
                    <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>REGÍSTRATE AHORA PARA PEDIR</span>
                    <Sparkles className="w-4 h-4 ml-1 absolute top-3 right-4 opacity-70 animate-pulse" />
                  </motion.button>
                  <button
                    onClick={onClose}
                    className="mt-4 text-xs font-bold text-on-surface-muted hover:text-neutral-600 uppercase tracking-wider transition-colors"
                  >
                    Quizás más tarde, solo quiero mirar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
