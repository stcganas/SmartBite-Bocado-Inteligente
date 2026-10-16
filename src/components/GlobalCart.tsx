import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, X, Minus, Plus, Trash2, ArrowRight, Store, ChevronRight } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { formatCurrency } from "../utils/format";
import { GoldCoinIcon } from './GoldCoinIcon';

export const GlobalCart: React.FC = () => {
  const { items, updateQuantity, removeFromCart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // Do not show on admin/dashboard pages or auth pages
  const isDashboardPage = ["/admin", "/platform", "/profile", "/driver", "/auth"].some((p) =>
    location.pathname.startsWith(p)
  );

  // Also do not show inside RestaurantView since it has its own highly integrated local Cart/Checkout FAB
  const isRestaurantPage = location.pathname.startsWith("/r/");

  if (isDashboardPage || isRestaurantPage || items.length === 0) return null;

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Group items by restaurant to make it extremely clear where they are buying from
  const itemsByRestaurant = items.reduce((acc, item) => {
    const rId = item.restaurantId || "unknown";
    const rName = item.restaurantName || "Restaurante";
    if (!acc[rId]) {
      acc[rId] = { name: rName, products: [] as typeof items };
    }
    acc[rId].products.push(item);
    return acc;
  }, {} as Record<string, { name: string; products: typeof items }>);

  return (
    <>
      {/* Floating Cart FAB */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: 30 }}
            className="fixed bottom-24 left-6 z-[999]"
          >
            <motion.button
              animate={{
                scale: [1, 1.04, 1],
                boxShadow: [
                  "0 15px 25px -5px rgba(249, 115, 22, 0.4)",
                  "0 25px 35px -5px rgba(249, 115, 22, 0.6)",
                  "0 15px 25px -5px rgba(249, 115, 22, 0.4)",
                ],
              }}
              transition={{ repeat: Infinity, duration: 2.2 }}
              onClick={() => setIsOpen(true)}
              className="bg-orange-500 text-on-surface h-16 px-6 rounded-[2rem] flex items-center gap-3.5 hover:bg-orange-600 transition-all active:scale-95 group font-sans. cursor-pointer"
            >
              <div className="relative">
                <ShoppingBag className="w-6 h-6" />
                <span className="absolute -top-3 -right-3 bg-white text-orange-600 text-[10px] font-black w-5.5 h-5.5 rounded-full flex items-center justify-center border border-orange-500 shadow-md">
                  {totalItems}
                </span>
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="font-black text-[9px] uppercase tracking-[0.15em] opacity-90 leading-none mb-0.5">
                  Mi Carrito
                </span>
                <span className="font-black text-sm leading-none">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart bottom drawer / overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-surface-variant/60 backdrop-blur-sm z-[99998]"
            />

            {/* Bottom Sheet Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ 
                type: "spring",
                damping: 30,
                stiffness: 180,
                mass: 0.9
              }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[3rem] z-[99999] shadow-2xl max-h-[85vh] flex flex-col font-sans border-t border-neutral-100"
            >
              {/* Drag bar indicator */}
              <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto mt-4 mb-2" />

              {/* Header */}
              <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-100">
                <div>
                  <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
                    Resumen de Compra
                  </h2>
                  <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mt-0.5">
                    {totalItems} {totalItems === 1 ? "Artículo" : "Artículos"} en total
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-3 bg-neutral-100 hover:bg-neutral-200 rounded-2xl text-neutral-700 transition-colors active:scale-95"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Items List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {Object.entries(itemsByRestaurant).map(([restaurantId, data]) => (
                  <div key={restaurantId} className="space-y-4">
                    {/* Restaurant header badge */}
                    <div className="flex items-center justify-between bg-neutral-50 px-4 py-2 rounded-2xl border border-neutral-100">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-orange-500" />
                        <span className="text-xs font-black text-neutral-800 uppercase tracking-wide">
                          {data.name}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          navigate(`/r/${restaurantId}`);
                        }}
                        className="text-[10px] font-black text-orange-600 uppercase tracking-widest hover:underline flex items-center gap-0.5"
                      >
                        Ir al local <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {data.products.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-neutral-100 shadow-sm"
                        >
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
                            {item.images[0] ? (
                              <img
                                src={item.images[0]}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xl bg-orange-50">🍔</div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-extrabold text-sm text-neutral-900 truncate">
                              {item.name}
                            </h4>
                            <p className="text-xs text-on-surface-muted font-bold mb-1.5 line-clamp-1">
                              {item.category}
                            </p>
                            {item.pointsMultiplier && item.pointsMultiplier > 1 && (
                               <div className="mb-1.5 inline-flex items-center gap-1.5 text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider w-fit">
                                 <span>🎯 Multiplica x{item.pointsMultiplier} <GoldCoinIcon className="w-3.5 h-3.5 -mt-0.5 mx-0.5 inline-block" /> Monedas</span>
                               </div>
                            )}
                            <span className="text-orange-600 font-black text-sm">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                          </div>

                          {/* Control actions */}
                          <div className="flex items-center gap-2 bg-neutral-100 p-1.5 rounded-xl">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-7 h-7 rounded-lg bg-white hover:bg-neutral-50 flex items-center justify-center text-neutral-800 transition-all active:scale-90"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-black text-neutral-900 w-4 text-center text-xs">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-7 h-7 rounded-lg bg-white hover:bg-neutral-50 flex items-center justify-center text-neutral-800 transition-all active:scale-90"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-2 text-on-surface-muted hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Checkout Section */}
              <div className="p-6 border-t border-neutral-100 bg-neutral-50/50 pb-safe">
                <div className="flex justify-between items-baseline mb-5">
                  <span className="text-sm font-black text-on-surface-variant uppercase tracking-wide">
                    Subtotal Estimado
                  </span>
                  <span className="text-2xl font-black text-neutral-900">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {/* Complete purchase in active restaurant button */}
                  {Object.keys(itemsByRestaurant).length > 0 && (() => {
                    const firstRestId = Object.keys(itemsByRestaurant)[0];
                    const firstRestName = itemsByRestaurant[firstRestId].name;
                    return (
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          // Redirect to the first restaurant with openCart property to open check-out sheet!
                          navigate(`/r/${firstRestId}?openCart=true`);
                        }}
                        className="w-full py-4 px-6 bg-orange-500 hover:bg-orange-600 text-on-surface font-black text-sm uppercase tracking-wider rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/10"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Proceder al Pago ({firstRestName})
                      </button>
                    );
                  })()}

                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full py-3.5 px-6 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all active:scale-95"
                  >
                    Seguir Navegando
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
