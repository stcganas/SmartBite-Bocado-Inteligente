import { formatCurrency } from '../utils/format';
import React, { createContext, useContext, useState } from 'react';
import { Product } from '../store/db';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => { success: boolean; error?: string; existingRestaurantName?: string };
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  getSummary: () => string;
  couponCode: string | null;
  applyCoupon: (code: string, discount: number) => void;
  discount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [discount, setDiscount] = useState<number>(0);
  const { user, setLoginPromptOpen } = useAuth();

  const addToCart = (product: Product, quantity: number = 1): { success: boolean; error?: string; existingRestaurantName?: string } => {
    // Look for any existing item in the cart that belongs to a different restaurant
    const activeDifferentItem = items.find(
      (item) => item.restaurantId && product.restaurantId && item.restaurantId !== product.restaurantId
    );

    if (activeDifferentItem) {
      return {
        success: false,
        error: "DIFFERENT_RESTAURANT",
        existingRestaurantName: activeDifferentItem.restaurantName || "otro local",
      };
    }

    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { ...product, quantity }];
    });

    return { success: true };
  };

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(i => i.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setItems(prev => prev.map(i => {
      if (i.id === productId) {
        const newQuantity = Math.max(0, i.quantity + delta);
        return { ...i, quantity: newQuantity };
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const clearCart = () => {
    setItems([]);
    setCouponCode(null);
    setDiscount(0);
  };

  const applyCoupon = (code: string, discountValue: number) => {
    setCouponCode(code);
    setDiscount(discountValue);
  };

  const getSummary = () => {
    if (items.length === 0) return "Tu carrito está vacío.";
    let summary = "Resumen de tu pedido:\n";
    items.forEach(i => {
      summary += `- ${i.quantity}x ${i.name} (${formatCurrency((i.price * i.quantity))})\n`;
    });
    const subtotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const total = subtotal - discount;
    summary += `\nSubtotal: ${formatCurrency(subtotal)}`;
    if (couponCode) summary += `\nDescuento (${couponCode}): -${formatCurrency(discount)}`;
    summary += `\nTotal: ${formatCurrency(total)}`;
    return summary;
  };

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, getSummary, couponCode, applyCoupon, discount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
