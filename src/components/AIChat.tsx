import { useState, useEffect, useRef } from 'react';
import { Send, Bot, X, ShoppingCart, Plus, Minus, Check } from 'lucide-react';
import { Restaurant, Product, db, Order } from '../store/db';
import { getSalesAssistantResponse } from '../services/ai';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import clsx from 'clsx';
import { GoldCoinIcon } from './GoldCoinIcon';

interface AIChatProps {
  restaurant: Restaurant;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  suggestedProducts?: Product[];
}

export default function AIChat({ restaurant, isOpen, onClose, onAddToCart }: AIChatProps) {
  const { appUser, user } = useAuth();
  const { items } = useCart();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: `¡Hola! Soy el asistente virtual de ${restaurant.name}. ¿En qué puedo ayudarte hoy?`
    }
  ]);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevUserIdRef = useRef<string | undefined>(user?.id);
  const prevItemsLengthRef = useRef(items.reduce((acc, item) => acc + item.quantity, 0));

  useEffect(() => {
    if (user?.id) {
      db.getUserOrders(user.id).then(setOrderHistory);
      db.getUserProductFavorites(user.id).then(setFavoriteProducts);
    }
  }, [user]);

  useEffect(() => {
    // Detect login: transition from guest (undefined) to real user
    if (prevUserIdRef.current === undefined && user?.id !== undefined && isOpen && messages.length > 0) {
      console.log('AIChat: Login detected, triggering greeting');
      handleSend("¡Hola! Acabo de iniciar sesión en mi cuenta. ¿Puedes darme la bienvenida personalizada y ver si tengo pedidos previos aquí?");
    }
    prevUserIdRef.current = user?.id;
  }, [user?.id, isOpen]);

  // Detect manual adds to cart while chat is open
  useEffect(() => {
    const currentQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
    if (isOpen && currentQuantity > prevItemsLengthRef.current) {
      // Find what was added (roughly)
      // If we don't want to get duplicate messages when AI adds, we just skip it if isLoading is true
      if (!isLoading) {
         setMessages(prev => [
           ...prev,
           { id: Date.now().toString(), role: 'model', text: '¡Excelente! He detectado que añadiste un producto a tu carrito.' }
         ]);
      }
    }
    prevItemsLengthRef.current = currentQuantity;
  }, [items, isOpen, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleManualAddToCartFromChat = (product: Product) => {
    onAddToCart(product);
    setMessages(prev => [
      ...prev,
      { id: Date.now().toString(), role: 'model', text: `¡Perfecto! He añadido ${product.name} a tu carrito. ¿Deseas explorar algo más o procedemos a finalizar el pedido?` }
    ]);
  };

  const handleSend = async (overrideText?: string) => {
    const textToSubmit = overrideText || input;
    if (!textToSubmit.trim() || isLoading) return;

    const userMessage = textToSubmit.trim();
    if (!overrideText) setInput('');
    
    const newMessages: Message[] = [
      ...messages,
      { id: Date.now().toString(), role: 'user', text: userMessage }
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const history = newMessages.slice(0, -1).map(m => ({
        role: m.role as 'model'|'user',
        parts: [{ text: m.text }]
      }));

      const response = await getSalesAssistantResponse(
        restaurant,
        history,
        userMessage,
        onAddToCart,
        appUser || undefined,
        orderHistory,
        items.map(i => ({ product: i, quantity: i.quantity })),
        favoriteProducts
      );

      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), role: 'model', text: response.text, suggestedProducts: response.suggestedProducts }
      ]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), role: 'model', text: 'Lo siento, tuve un problema procesando tu solicitud. ¿Puedes intentarlo de nuevo?' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-50 flex flex-col bg-white sm:inset-auto sm:right-4 sm:bottom-4 sm:w-96 sm:h-[600px] sm:rounded-2xl sm:shadow-2xl sm:border sm:border-neutral-200 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-orange-500 p-4 text-on-surface flex items-center justify-between shadow-md z-10">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">Asistente IA</h3>
                <p className="text-orange-100 text-xs font-medium">{restaurant.name}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={clsx(
                  "flex flex-col gap-2 max-w-[85%]",
                  msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div
                  className={clsx(
                    "p-3 rounded-2xl text-sm shadow-sm",
                    msg.role === 'user'
                      ? "bg-orange-500 text-on-surface rounded-tr-none"
                      : "bg-white border border-neutral-200 text-neutral-800 rounded-tl-none whitespace-pre-line"
                  )}
                >
                  {msg.text}
                </div>

                {/* Product Suggestions */}
                {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                  <div className="flex overflow-x-auto gap-2 py-2 px-1 w-full snap-x max-w-[280px]">
                    {msg.suggestedProducts.map(product => (
                      <div key={product.id} className="snap-center shrink-0 w-48 bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
                        <div className="relative h-24 bg-neutral-100 flex-shrink-0">
                          {product.images && product.images.length > 0 ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                              <Bot className="w-8 h-8 opacity-20" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs font-bold text-neutral-800">
                            ${product.price.toLocaleString()}
                          </div>
                        </div>
                        <div className="p-3 flex flex-col flex-1">
                          <h4 className="font-semibold text-sm text-neutral-800 line-clamp-1">{product.name}</h4>
                          {product.pointsMultiplier && product.pointsMultiplier > 1 && (
                             <div className="mt-1 inline-flex items-center gap-1 text-[#FFD700] bg-[#FF8A00]/10 border border-[#FFD700]/30 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest w-fit">
                               <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] animate-pulse shadow-[0_0_8px_rgba(255,215,0,0.8)]" />
                               X{product.pointsMultiplier} Oro 🪙
                             </div>
                          )}
                          <p className="text-xs text-on-surface-variant line-clamp-2 mt-1 mb-3 flex-1">{product.description}</p>
                          <button
                            onClick={() => handleManualAddToCartFromChat(product)}
                            className="mt-auto w-full py-2 bg-orange-50 text-orange-600 font-medium text-xs rounded-lg hover:bg-orange-100 transition-colors flex items-center justify-center gap-1 active:scale-95"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            Añadir Pedido
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex max-w-[80%] mr-auto justify-start">
                <div className="bg-white border border-neutral-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-neutral-200">
            <div className="flex items-center gap-2 bg-neutral-100 rounded-full p-1 pr-2 border border-neutral-200 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-all">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Escribe tu mensaje..."
                className="flex-1 bg-transparent px-4 py-2 focus:outline-none text-sm"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="bg-orange-500 text-on-surface p-2 rounded-full hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500 transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
