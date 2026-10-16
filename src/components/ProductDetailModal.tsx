import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, ShoppingCart, Store, Landmark, Info, CheckCircle2 } from "lucide-react";
import { Product } from "../store/db";
import { formatCurrency } from "../utils/format";
import { GoldCoinIcon } from './GoldCoinIcon';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onGoToRestaurant?: (restaurantId: string) => void;
  generalDiscount?: number;
  generalDiscountEnabled?: boolean;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onGoToRestaurant,
  generalDiscount,
  generalDiscountEnabled,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [lastAddedQty, setLastAddedQty] = useState(0);

  // Reset states when modal is closed or product changes
  useEffect(() => {
    if (!isOpen) {
      setJustAdded(false);
      setLastAddedQty(0);
      setQuantity(1);
    }
  }, [isOpen, product]);

  if (!product) return null;

  const handleIncrement = () => setQuantity((prev) => prev + 1);
  const handleDecrement = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  const handleAddClick = () => {
    onAddToCart(product, quantity);
    setLastAddedQty(quantity);
    setJustAdded(true);
    
    // Auto reset the success animation feedback state after a few seconds but keep modal open
    const timer = setTimeout(() => {
      setJustAdded(false);
    }, 2500);
    return () => clearTimeout(timer);
  };

  // Determine standard presentation details
  const presentationInfo = product.isPartOfCombo
    ? "Combo Especial para Compartir"
    : product.price > 35000
    ? "Porción Grande / Premium"
    : "Porción Individual Estándar";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          {/* Backdrop with sophisticated blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-surface-variant/70 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 40 }}
            transition={{ 
              type: "spring",
              damping: 25,
              stiffness: 150,
              mass: 0.8
            }}
            className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl border border-neutral-100 overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-[80vh] z-10"
          >
            {/* Close button with high-contrast background */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-surface-variant/80 text-on-surface hover:bg-surface-variant transition-all active:scale-90 shadow-lg"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Product Image Section */}
            <div className="w-full md:w-1/2 h-44 md:h-auto relative bg-neutral-100 shrink-0">
              {product.images[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-on-surface-muted gap-2">
                  <span className="text-4xl">🍔</span>
                  <span className="text-xs font-bold text-on-surface-muted">Sin Imagen</span>
                </div>
              )}
              {product.isPromotion && (
                <div className="absolute top-4 left-4 bg-orange-500 text-on-surface text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-lg">
                  Oferta Especial
                </div>
              )}
              {product.pointsMultiplier && product.pointsMultiplier > 1 && (
                <div className="absolute top-4 right-4 bg-[#FF8A00]/10 border border-[#FFD700]/30 text-[#FFD700] text-[10px] items-center flex gap-1 font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-[0_4px_20px_rgba(255,215,0,0.2)] animate-bounce hover:animate-none backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] animate-pulse shadow-[0_0_8px_rgba(255,215,0,0.8)]" />
                  X{product.pointsMultiplier} Oro 🪙
                </div>
              )}
              
              {/* Overlay success message on the image section */}
              <AnimatePresence>
                {justAdded && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute inset-0 bg-emerald-600/95 flex flex-col items-center justify-center p-6 text-on-surface text-center z-10"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                    >
                      <CheckCircle2 className="w-16 h-16 mb-3 text-on-surface drop-shadow-md" />
                    </motion.div>
                    <h3 className="text-lg font-black uppercase tracking-wider mb-1">
                      ¡Agregado al Carrito!
                    </h3>
                    <p className="text-xs font-bold text-emerald-100 max-w-[80%] mb-2">
                      Has añadido {lastAddedQty} {lastAddedQty === 1 ? "unidad" : "unidades"} de{" "}
                      <span className="underline">{product.name}</span>. Puedes seguir comprando o cerrar esta vista.
                    </p>
                    <button
                      onClick={() => {
                        onClose();
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="px-5 py-2.5 bg-white text-emerald-800 font-extrabold text-[11px] uppercase tracking-widest rounded-xl hover:bg-neutral-50 transition-all active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer mt-1"
                    >
                      <span>Subir e Ir a Inicio 🚀</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Product Details Section */}
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
              <div className="mb-6">
                {/* Category badge */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-bold uppercase tracking-wider">
                    <Landmark className="w-3.5 h-3.5" />
                    {product.category}
                  </span>
                  
                  {product.pointsMultiplier && product.pointsMultiplier > 1 && (
                    <span className="inline-flex items-center gap-1.5 bg-[#FF8A00]/10 text-[#FFD700] border border-[#FFD700]/30 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] animate-pulse shadow-[0_0_8px_rgba(255,215,0,0.8)]" />
                      X{product.pointsMultiplier} Oro 🪙
                    </span>
                  )}
                  
                  {lastAddedQty > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
                      En Carrito: {lastAddedQty}
                    </span>
                  )}
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-neutral-900 leading-tight mb-2">
                  {product.name}
                </h2>

                {/* Presentation details */}
                <div className="flex items-center gap-2 mb-4 text-xs font-bold text-neutral-600 bg-neutral-50 px-3 py-2 rounded-2xl border border-neutral-100">
                  <Info className="w-4 h-4 text-on-surface-muted shrink-0" />
                  <span>Presentación: <span className="text-neutral-900 font-black">{presentationInfo}</span></span>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-on-surface-muted mb-1.5">
                    Descripción &amp; Ingredientes
                  </h4>
                  <p className="text-sm text-neutral-600 font-medium leading-relaxed">
                    {product.description || "Este exquisito plato está preparado con los más frescos ingredientes seleccionados por el chef para brindarte el mejor sabor único."}
                  </p>
                </div>
              </div>

              {/* Purchase Section */}
              <div className="mt-auto pt-4 border-t border-neutral-100">
                {/* Price display */}
                <div className="flex justify-between items-baseline mb-4">
                  <span className="text-xs font-bold text-on-surface-muted uppercase tracking-wider">
                    Precio Unitario
                  </span>
                  <div className="flex flex-col items-end">
                    {(() => {
                      const hasIndividualDiscount = product.discountPercentage && product.discountPercentage > 0;
                      const hasGeneralDiscount = generalDiscountEnabled && generalDiscount && generalDiscount > 0;
                      
                      if (hasIndividualDiscount || hasGeneralDiscount) {
                        const perc = product.discountPercentage || generalDiscount || 0;
                        const discPrice = product.discountPercentage ? (product.discountPrice || product.price) : Math.round(product.price * (1 - perc / 100));
                        return (
                          <>
                            <span className="text-2xl font-black text-orange-600">
                              {formatCurrency(discPrice)}
                            </span>
                            <div className="flex gap-2">
                              <span className="text-xs text-on-surface-muted line-through font-bold">
                                {formatCurrency(product.price)}
                              </span>
                              <span className="text-xs text-orange-500 font-bold">-{perc}% OFF</span>
                            </div>
                          </>
                        );
                      }
                      
                      return (
                        <span className="text-2xl font-black text-orange-600">
                          {formatCurrency(product.price)}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* Quantity adjustments */}
                <div className="flex items-center justify-between gap-4 mb-5">
                  <span className="text-xs font-bold text-on-surface-muted uppercase tracking-wider">
                    Cantidad
                  </span>
                  <div className="flex items-center gap-4 bg-neutral-100 p-1.5 rounded-2xl">
                    <button
                      onClick={handleDecrement}
                      className="p-2 rounded-xl bg-white hover:bg-neutral-50 text-neutral-800 transition-all active:scale-90 shadow-sm disabled:opacity-50"
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-6 text-center font-black text-neutral-900 text-base">
                      {quantity}
                    </span>
                    <button
                      onClick={handleIncrement}
                      className="p-2 rounded-xl bg-white hover:bg-neutral-50 text-neutral-800 transition-all active:scale-90 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Primary actions */}
                <div className="space-y-3">
                  {/* Add To Cart Button */}
                  <button
                    onClick={handleAddClick}
                    className={`w-full py-4 px-6 font-black text-sm uppercase tracking-wider rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg ${
                      justAdded
                        ? "bg-emerald-600 text-on-surface shadow-emerald-600/20"
                        : "bg-orange-500 hover:bg-orange-600 text-on-surface shadow-orange-500/20"
                    }`}
                  >
                    {justAdded ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 animate-bounce" />
                        ¡Añadido de Nuevo! ({quantity})
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        Añadir al Carrito • {(() => {
                           const hasIndividualDiscount = product.discountPercentage && product.discountPercentage > 0;
                           const hasGeneralDiscount = generalDiscountEnabled && generalDiscount && generalDiscount > 0;
                           const perc = product.discountPercentage || generalDiscount || 0;
                           const discPrice = (hasIndividualDiscount || hasGeneralDiscount) 
                             ? (product.discountPercentage ? (product.discountPrice || product.price) : Math.round(product.price * (1 - perc / 100)))
                             : product.price;
                           return formatCurrency(discPrice * quantity);
                        })()}
                      </>
                    )}
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Go to Restaurant Button */}
                    {onGoToRestaurant && product.restaurantId && (
                      <button
                        onClick={() => onGoToRestaurant(product.restaurantId)}
                        className="py-3.5 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <Store className="w-3.5 h-3.5" />
                        Ver Local
                      </button>
                    )}

                    {/* Continue shopping button */}
                    <button
                      onClick={onClose}
                      className="py-3.5 px-3 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-600 font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all active:scale-95 flex items-center justify-center"
                    >
                      Seguir Viendo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
