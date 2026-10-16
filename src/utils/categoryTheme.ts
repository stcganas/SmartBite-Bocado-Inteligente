import React from "react";
import {
  UtensilsCrossed,
  Carrot,
  Wine,
  Beef,
  Pill,
  Store,
  IceCream,
  Croissant,
  Fish,
  Coffee,
  Pizza,
  Salad,
  Sparkles,
  Sandwich,
  CupSoda,
  Cake,
  ShoppingBag,
  Package,
  LucideIcon,
} from "lucide-react";

export interface CategoryVisualConfig {
  id: string;
  name: string;
  shortName: string;
  icon: LucideIcon;
  emoji: string;
  imageUrl: string;
  gradient: string;
  activeBorder: string;
  glowColor: string;
  badgeBg: string;
  accentColor: string;
}

// Diccionario centralizado de categorías y tipos de negocios con diseño moderno y representativo
export const CATEGORY_THEMES: Record<string, CategoryVisualConfig> = {
  all: {
    id: "all",
    name: "Todos",
    shortName: "Inicio",
    icon: Sparkles,
    emoji: "✨",
    imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80",
    gradient: "from-amber-500 to-orange-600",
    activeBorder: "border-orange-400",
    glowColor: "rgba(249, 115, 22, 0.4)",
    badgeBg: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    accentColor: "#F97316",
  },
  restaurant: {
    id: "restaurant",
    name: "Restaurantes",
    shortName: "Restaurante",
    icon: UtensilsCrossed,
    emoji: "🍽️",
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80",
    gradient: "from-amber-500 via-orange-600 to-red-600",
    activeBorder: "border-orange-500",
    glowColor: "rgba(234, 88, 12, 0.4)",
    badgeBg: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    accentColor: "#EA580C",
  },
  grocery: {
    id: "grocery",
    name: "Verdulerías y Frutas",
    shortName: "Verdulería",
    icon: Carrot,
    emoji: "🥦",
    imageUrl: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=400&q=80",
    gradient: "from-emerald-500 via-green-600 to-teal-700",
    activeBorder: "border-emerald-500",
    glowColor: "rgba(16, 185, 129, 0.4)",
    badgeBg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    accentColor: "#10B981",
  },
  verduleria: {
    id: "verduleria",
    name: "Verdulerías",
    shortName: "Verdulería",
    icon: Carrot,
    emoji: "🥦",
    imageUrl: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=400&q=80",
    gradient: "from-emerald-500 via-green-600 to-teal-700",
    activeBorder: "border-emerald-500",
    glowColor: "rgba(16, 185, 129, 0.4)",
    badgeBg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    accentColor: "#10B981",
  },
  liquor: {
    id: "liquor",
    name: "Licores y Bebidas",
    shortName: "Licores",
    icon: Wine,
    emoji: "🍾",
    imageUrl: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=400&q=80",
    gradient: "from-purple-500 via-violet-600 to-indigo-700",
    activeBorder: "border-violet-500",
    glowColor: "rgba(139, 92, 246, 0.4)",
    badgeBg: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    accentColor: "#8B5CF6",
  },
  licores: {
    id: "licores",
    name: "Licores",
    shortName: "Licores",
    icon: Wine,
    emoji: "🍾",
    imageUrl: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=400&q=80",
    gradient: "from-purple-500 via-violet-600 to-indigo-700",
    activeBorder: "border-violet-500",
    glowColor: "rgba(139, 92, 246, 0.4)",
    badgeBg: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    accentColor: "#8B5CF6",
  },
  salsamentaria: {
    id: "salsamentaria",
    name: "Salsamentarías y Carnes Frías",
    shortName: "Salsamentaría",
    icon: Beef,
    emoji: "🥓",
    imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80",
    gradient: "from-rose-500 via-red-600 to-orange-700",
    activeBorder: "border-rose-500",
    glowColor: "rgba(244, 63, 94, 0.4)",
    badgeBg: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    accentColor: "#F43F5E",
  },
  pharmacy: {
    id: "pharmacy",
    name: "Farmacias",
    shortName: "Farmacia",
    icon: Pill,
    emoji: "💊",
    imageUrl: "https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=600&q=80",
    gradient: "from-cyan-500 via-blue-600 to-indigo-700",
    activeBorder: "border-cyan-500",
    glowColor: "rgba(6, 182, 212, 0.4)",
    badgeBg: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    accentColor: "#06B6D4",
  },
  general_store: {
    id: "general_store",
    name: "Víveres y Abarrotes",
    shortName: "Víveres",
    icon: Store,
    emoji: "🛒",
    imageUrl: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=600&q=80",
    gradient: "from-amber-400 via-yellow-500 to-orange-600",
    activeBorder: "border-amber-400",
    glowColor: "rgba(245, 158, 11, 0.4)",
    badgeBg: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    accentColor: "#F59E0B",
  },
  ice_cream: {
    id: "ice_cream",
    name: "Heladerías",
    shortName: "Helados",
    icon: IceCream,
    emoji: "🍦",
    imageUrl: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=600&q=80",
    gradient: "from-pink-400 via-rose-500 to-purple-600",
    activeBorder: "border-pink-500",
    glowColor: "rgba(236, 72, 153, 0.4)",
    badgeBg: "bg-pink-500/15 text-pink-400 border-pink-500/30",
    accentColor: "#EC4899",
  },
  bakery: {
    id: "bakery",
    name: "Panaderías y Pastelerías",
    shortName: "Panadería",
    icon: Croissant,
    emoji: "🥐",
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
    gradient: "from-amber-500 via-orange-500 to-amber-700",
    activeBorder: "border-amber-500",
    glowColor: "rgba(217, 119, 6, 0.4)",
    badgeBg: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    accentColor: "#D97706",
  },
  cevicheria: {
    id: "cevicheria",
    name: "Cevicherías y Mariscos",
    shortName: "Cevichería",
    icon: Fish,
    emoji: "🍤",
    imageUrl: "https://images.unsplash.com/photo-1535400255456-984241443b29?auto=format&fit=crop&w=600&q=80",
    gradient: "from-teal-400 via-cyan-500 to-blue-600",
    activeBorder: "border-teal-400",
    glowColor: "rgba(20, 184, 166, 0.4)",
    badgeBg: "bg-teal-500/15 text-teal-400 border-teal-500/30",
    accentColor: "#14B8A6",
  },
  seafood: {
    id: "seafood",
    name: "Pescados y Mariscos",
    shortName: "Mariscos",
    icon: Fish,
    emoji: "🐟",
    imageUrl: "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?auto=format&fit=crop&w=600&q=80",
    gradient: "from-cyan-500 via-blue-600 to-teal-700",
    activeBorder: "border-cyan-500",
    glowColor: "rgba(6, 182, 212, 0.4)",
    badgeBg: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    accentColor: "#0284C7",
  },
  coffee: {
    id: "coffee",
    name: "Cafeterías",
    shortName: "Café",
    icon: Coffee,
    emoji: "☕",
    imageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80",
    gradient: "from-stone-600 via-amber-800 to-stone-900",
    activeBorder: "border-amber-600",
    glowColor: "rgba(180, 83, 9, 0.4)",
    badgeBg: "bg-amber-800/20 text-amber-300 border-amber-700/30",
    accentColor: "#78350F",
  },

  // Categorías de Platos / Comida Específicas:
  pizza: {
    id: "pizza",
    name: "Pizzas",
    shortName: "Pizza",
    icon: Pizza,
    emoji: "🍕",
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80",
    gradient: "from-amber-500 via-red-500 to-rose-600",
    activeBorder: "border-red-500",
    glowColor: "rgba(239, 68, 68, 0.4)",
    badgeBg: "bg-red-500/15 text-red-400 border-red-500/30",
    accentColor: "#EF4444",
  },
  burger: {
    id: "burger",
    name: "Hamburguesas",
    shortName: "Burgers",
    icon: Sandwich,
    emoji: "🍔",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80",
    gradient: "from-amber-600 via-orange-600 to-red-600",
    activeBorder: "border-orange-500",
    glowColor: "rgba(249, 115, 22, 0.4)",
    badgeBg: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    accentColor: "#F97316",
  },
  sushi: {
    id: "sushi",
    name: "Sushi",
    shortName: "Sushi",
    icon: Fish,
    emoji: "🍣",
    imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=400&q=80",
    gradient: "from-rose-500 via-pink-600 to-red-700",
    activeBorder: "border-rose-500",
    glowColor: "rgba(244, 63, 94, 0.4)",
    badgeBg: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    accentColor: "#F43F5E",
  },
  healthy: {
    id: "healthy",
    name: "Saludable y Bowls",
    shortName: "Saludable",
    icon: Salad,
    emoji: "🥗",
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80",
    gradient: "from-emerald-500 via-green-600 to-teal-700",
    activeBorder: "border-emerald-400",
    glowColor: "rgba(16, 185, 129, 0.4)",
    badgeBg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    accentColor: "#10B981",
  },
  tacos: {
    id: "tacos",
    name: "Tacos y Mexicana",
    shortName: "Tacos",
    icon: UtensilsCrossed,
    emoji: "🌮",
    imageUrl: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=80",
    gradient: "from-amber-500 via-orange-500 to-yellow-600",
    activeBorder: "border-amber-400",
    glowColor: "rgba(245, 158, 11, 0.4)",
    badgeBg: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    accentColor: "#F59E0B",
  },
  dessert: {
    id: "dessert",
    name: "Postres y Dulces",
    shortName: "Postres",
    icon: Cake,
    emoji: "🍰",
    imageUrl: "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=400&q=80",
    gradient: "from-pink-500 via-rose-500 to-purple-600",
    activeBorder: "border-pink-400",
    glowColor: "rgba(236, 72, 153, 0.4)",
    badgeBg: "bg-pink-500/15 text-pink-400 border-pink-500/30",
    accentColor: "#EC4899",
  },
  drinks: {
    id: "drinks",
    name: "Bebidas y Jugos",
    shortName: "Bebidas",
    icon: CupSoda,
    emoji: "🥤",
    imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80",
    gradient: "from-blue-500 via-cyan-500 to-indigo-600",
    activeBorder: "border-cyan-400",
    glowColor: "rgba(6, 182, 212, 0.4)",
    badgeBg: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    accentColor: "#06B6D4",
  },
  hotdogs: {
    id: "hotdogs",
    name: "Perros Calientes",
    shortName: "Perros",
    icon: Sandwich,
    emoji: "🌭",
    imageUrl: "https://images.unsplash.com/photo-1619740455993-9e612b1af08a?auto=format&fit=crop&w=400&q=80",
    gradient: "from-amber-500 via-orange-500 to-red-600",
    activeBorder: "border-orange-500",
    glowColor: "rgba(249, 115, 22, 0.4)",
    badgeBg: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    accentColor: "#F97316",
  },
  wings: {
    id: "wings",
    name: "Alitas de Pollo",
    shortName: "Alitas",
    icon: Beef,
    emoji: "🍗",
    imageUrl: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=400&q=80",
    gradient: "from-orange-500 via-red-500 to-amber-700",
    activeBorder: "border-orange-500",
    glowColor: "rgba(249, 115, 22, 0.4)",
    badgeBg: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    accentColor: "#F97316",
  },
  salchipapas: {
    id: "salchipapas",
    name: "Salchipapas",
    shortName: "Salchipapas",
    icon: UtensilsCrossed,
    emoji: "🍟",
    imageUrl: "https://images.unsplash.com/photo-1623653387945-2fd25214f8fc?auto=format&fit=crop&w=600&q=80",
    gradient: "from-yellow-400 via-amber-500 to-orange-600",
    activeBorder: "border-amber-500",
    glowColor: "rgba(245, 158, 11, 0.4)",
    badgeBg: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    accentColor: "#F59E0B",
  },
  asados: {
    id: "asados",
    name: "Asados y Parrilla",
    shortName: "Asados",
    icon: Beef,
    emoji: "🥩",
    imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
    gradient: "from-rose-600 via-red-700 to-neutral-900",
    activeBorder: "border-red-600",
    glowColor: "rgba(220, 38, 38, 0.4)",
    badgeBg: "bg-red-500/15 text-red-400 border-red-500/30",
    accentColor: "#DC2626",
  },
  arepas: {
    id: "arepas",
    name: "Arepas",
    shortName: "Arepas",
    icon: Croissant,
    emoji: "🫓",
    imageUrl: "https://images.unsplash.com/photo-1628294895950-9805252327bc?auto=format&fit=crop&w=600&q=80",
    gradient: "from-amber-400 via-yellow-500 to-amber-600",
    activeBorder: "border-yellow-500",
    glowColor: "rgba(234, 179, 8, 0.4)",
    badgeBg: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    accentColor: "#EAB308",
  },
  empanadas: {
    id: "empanadas",
    name: "Empanadas",
    shortName: "Empanadas",
    icon: Croissant,
    emoji: "🥟",
    imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80",
    gradient: "from-amber-500 via-orange-500 to-yellow-600",
    activeBorder: "border-orange-500",
    glowColor: "rgba(249, 115, 22, 0.4)",
    badgeBg: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    accentColor: "#F97316",
  },
  sopas: {
    id: "sopas",
    name: "Sopas y Sancochos",
    shortName: "Sopas",
    icon: UtensilsCrossed,
    emoji: "🥣",
    imageUrl: "https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?auto=format&fit=crop&w=600&q=80",
    gradient: "from-amber-600 via-orange-700 to-yellow-800",
    activeBorder: "border-orange-600",
    glowColor: "rgba(217, 119, 6, 0.4)",
    badgeBg: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    accentColor: "#D97706",
  },
  pollo: {
    id: "pollo",
    name: "Pollo Asado",
    shortName: "Pollo",
    icon: Beef,
    emoji: "🍗",
    imageUrl: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=400&q=80",
    gradient: "from-orange-500 via-amber-600 to-red-700",
    activeBorder: "border-orange-500",
    glowColor: "rgba(249, 115, 22, 0.4)",
    badgeBg: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    accentColor: "#F97316",
  },
  pastas: {
    id: "pastas",
    name: "Pastas",
    shortName: "Pastas",
    icon: UtensilsCrossed,
    emoji: "🍝",
    imageUrl: "https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=400&q=80",
    gradient: "from-amber-500 via-red-500 to-yellow-600",
    activeBorder: "border-orange-400",
    glowColor: "rgba(249, 115, 22, 0.4)",
    badgeBg: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    accentColor: "#F97316",
  },
  acompanamientos: {
    id: "acompanamientos",
    name: "Porciones y Papas",
    shortName: "Porciones",
    icon: Package,
    emoji: "🍟",
    imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=400&q=80",
    gradient: "from-stone-600 via-amber-700 to-stone-800",
    activeBorder: "border-amber-600",
    glowColor: "rgba(180, 83, 9, 0.3)",
    badgeBg: "bg-stone-500/15 text-stone-300 border-stone-500/30",
    accentColor: "#78350F",
  },
};

export function getCategoryVisual(categoryIdOrName?: string): CategoryVisualConfig {
  if (!categoryIdOrName) return CATEGORY_THEMES.restaurant;
  const normalized = categoryIdOrName.toLowerCase().trim();

  // Búsqueda directa por ID o normalizada
  if (CATEGORY_THEMES[normalized]) {
    return CATEGORY_THEMES[normalized];
  }

  // Búsqueda aproximada por palabras clave
  if (normalized.includes("verdu") || normalized.includes("frut") || normalized.includes("legum")) {
    return CATEGORY_THEMES.grocery;
  }
  if (normalized.includes("licor") || normalized.includes("cervez") || normalized.includes("vino") || normalized.includes("bar")) {
    return CATEGORY_THEMES.liquor;
  }
  if (normalized.includes("salsa") || normalized.includes("embutid") || normalized.includes("carne fria") || normalized.includes("charcut")) {
    return CATEGORY_THEMES.salsamentaria;
  }
  if (normalized.includes("farma") || normalized.includes("medic") || normalized.includes("droguer")) {
    return CATEGORY_THEMES.pharmacy;
  }
  if (normalized.includes("viver") || normalized.includes("abarrot") || normalized.includes("super") || normalized.includes("tiend")) {
    return CATEGORY_THEMES.general_store;
  }
  if (normalized.includes("helad") || normalized.includes("palet")) {
    return CATEGORY_THEMES.ice_cream;
  }
  if (normalized.includes("panad") || normalized.includes("pasteler") || normalized.includes("bakery")) {
    return CATEGORY_THEMES.bakery;
  }
  if (normalized.includes("cevich") || normalized.includes("marisc") || normalized.includes("pescad")) {
    return CATEGORY_THEMES.cevicheria;
  }
  if (normalized.includes("cafe") || normalized.includes("cafeter")) {
    return CATEGORY_THEMES.coffee;
  }
  if (normalized.includes("pizz")) {
    return CATEGORY_THEMES.pizza;
  }
  if (normalized.includes("hamburg") || normalized.includes("burger")) {
    return CATEGORY_THEMES.burger;
  }
  if (normalized.includes("perro") || normalized.includes("hot dog") || normalized.includes("hotdog") || normalized.includes("rapida") || normalized.includes("rápida")) {
    return CATEGORY_THEMES.hotdogs;
  }
  if (normalized.includes("alita") || normalized.includes("wing") || normalized.includes("chicken wing")) {
    return CATEGORY_THEMES.wings;
  }
  if (normalized.includes("salchipapa") || normalized.includes("papa frita") || normalized.includes("fritas") || normalized.includes("papas")) {
    return CATEGORY_THEMES.salchipapas;
  }
  if (normalized.includes("asado") || normalized.includes("parrill") || normalized.includes("carne") || normalized.includes("res") || normalized.includes("churrasco") || normalized.includes("lomo")) {
    return CATEGORY_THEMES.asados;
  }
  if (normalized.includes("arepa")) {
    return CATEGORY_THEMES.arepas;
  }
  if (normalized.includes("empanada") || normalized.includes("pastel")) {
    return CATEGORY_THEMES.empanadas;
  }
  if (normalized.includes("sopa") || normalized.includes("caldo") || normalized.includes("sancocho") || normalized.includes("mondongo") || normalized.includes("ajiaco")) {
    return CATEGORY_THEMES.sopas;
  }
  if (normalized.includes("pollo") || normalized.includes("pechuga")) {
    return CATEGORY_THEMES.pollo;
  }
  if (normalized.includes("pasta") || normalized.includes("espagueti") || normalized.includes("lasa") || normalized.includes("lasagna")) {
    return CATEGORY_THEMES.pastas;
  }
  if (normalized.includes("porcion") || normalized.includes("acompaña") || normalized.includes("adicion") || normalized.includes("extra")) {
    return CATEGORY_THEMES.acompanamientos;
  }
  if (normalized.includes("sushi") || normalized.includes("asian") || normalized.includes("oriental")) {
    return CATEGORY_THEMES.sushi;
  }
  if (normalized.includes("salud") || normalized.includes("fit") || normalized.includes("ensalada")) {
    return CATEGORY_THEMES.healthy;
  }
  if (normalized.includes("taco") || normalized.includes("mexic")) {
    return CATEGORY_THEMES.tacos;
  }
  if (normalized.includes("postr") || normalized.includes("dulce") || normalized.includes("torta") || normalized.includes("repost")) {
    return CATEGORY_THEMES.dessert;
  }
  if (normalized.includes("bebid") || normalized.includes("jugo") || normalized.includes("soda") || normalized.includes("refresc")) {
    return CATEGORY_THEMES.drinks;
  }

  // Fallback elegante con icono de restaurante o tienda
  return {
    id: normalized,
    name: categoryIdOrName,
    shortName: categoryIdOrName.replace("Explorar ", ""),
    icon: UtensilsCrossed,
    emoji: "🍽️",
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80",
    gradient: "from-neutral-800 via-neutral-700 to-neutral-900",
    activeBorder: "border-orange-500",
    glowColor: "rgba(255, 138, 0, 0.3)",
    badgeBg: "bg-white/10 text-white border-white/20",
    accentColor: "#FF8A00",
  };
}

/**
 * Normaliza e infiere automáticamente la categoría de negocio correcta a partir
 * de la categoría asignada, especialidad (type), nombre y descripción del comercio.
 */
export function normalizeBusinessCategory(
  rawCategory?: string,
  type?: string,
  name?: string,
  description?: string
): string {
  const norm = (str?: string) => (str || "").toLowerCase().trim();
  const c = norm(rawCategory);
  const t = norm(type);
  const n = norm(name);
  const d = norm(description);

  // 1. Coincidencia directa exacta o parcial sobre rawCategory si no es el default genérico
  if (c === "salsamentaria" || c.includes("salsa") || c.includes("embutid") || c.includes("charcut")) return "salsamentaria";
  if (c === "grocery" || c === "verduleria" || c.includes("verdu") || c.includes("frut") || c.includes("fruver") || c.includes("legumb")) return "grocery";
  if (c === "bakery" || c === "panaderia" || c.includes("panad") || c.includes("pastel") || c.includes("repost")) return "bakery";
  if (c === "liquor" || c === "licores" || c.includes("licor") || c.includes("estanco") || c.includes("cervez") || c.includes("vinos")) return "liquor";
  if (c === "pharmacy" || c === "farmacia" || c.includes("farma") || c.includes("droguer") || c.includes("medic")) return "pharmacy";
  if (c === "ice_cream" || c === "heladeria" || c.includes("helad") || c.includes("palet") || c.includes("gelat")) return "ice_cream";
  if (c === "general_store" || c.includes("viver") || c.includes("abarrot") || c.includes("super") || c.includes("minimarket")) return "general_store";
  if (c === "cevicheria" || c.includes("cevich")) return "cevicheria";
  if (c === "seafood" || c.includes("marisc") || c.includes("pescad")) return "seafood";
  if (c === "coffee" || c.includes("cafe") || c.includes("cafeter")) return "coffee";

  // 2. Si rawCategory no está definido o es "restaurant", inferir de forma inteligente por type, name y description
  // Salsamentarias (embutidos, carnes frías)
  if (t.includes("salsa") || t.includes("embutid") || t.includes("charcut") || n.includes("salsa") || n.includes("embutid") || n.includes("charcut") || d.includes("salsament")) {
    return "salsamentaria";
  }
  // Verdulerías (frutas, verduras, fruver)
  if (t.includes("verdu") || t.includes("frut") || t.includes("fruver") || t.includes("legumb") || n.includes("verdul") || n.includes("fruter") || n.includes("fruver") || d.includes("verdul") || d.includes("fruter")) {
    return "grocery";
  }
  // Panaderías y pastelerías
  if (t.includes("panad") || t.includes("pastel") || t.includes("bakery") || t.includes("repost") || n.includes("panad") || n.includes("pasteler") || n.includes("bakery") || d.includes("panad") || d.includes("pasteler")) {
    return "bakery";
  }
  // Licores
  if (t.includes("licor") || t.includes("estanco") || t.includes("cervez") || t.includes("bar") || n.includes("licor") || n.includes("estanco") || d.includes("licor")) {
    return "liquor";
  }
  // Farmacia
  if (t.includes("farma") || t.includes("droguer") || t.includes("medic") || n.includes("farmac") || n.includes("droguer") || d.includes("farmac")) {
    return "pharmacy";
  }
  // Heladerías
  if (t.includes("helad") || t.includes("palet") || t.includes("gelat") || n.includes("helad") || n.includes("palet") || d.includes("helad")) {
    return "ice_cream";
  }
  // Víveres y Abarrotes
  if (t.includes("viver") || t.includes("abarrot") || t.includes("minimarket") || t.includes("supermerc") || n.includes("viver") || n.includes("abarrot") || d.includes("viver")) {
    return "general_store";
  }
  // Cevicherías
  if (t.includes("cevich") || n.includes("cevich") || d.includes("cevich")) {
    return "cevicheria";
  }
  // Mariscos y pescados
  if (t.includes("marisc") || t.includes("pescad") || t.includes("seafood") || n.includes("marisc") || n.includes("pescad") || d.includes("marisc")) {
    return "seafood";
  }
  // Cafeterías
  if (t.includes("cafe") || t.includes("cafeter") || t.includes("coffee") || n.includes("cafeter") || n.includes("cafe ") || d.includes("cafeter")) {
    return "coffee";
  }

  // 3. Si tiene una categoría personalizada que no sea vacía
  if (c && c !== "restaurant") {
    return c;
  }

  return "restaurant";
}

/**
 * Comprueba si un negocio coincide con una categoría activa de forma sincronizada y precisa.
 */
export function matchRestaurantToCategory(
  restaurant: { businessCategory?: string; type?: string; name?: string; description?: string },
  targetCategoryId: string
): boolean {
  if (!targetCategoryId || targetCategoryId === "all") return true;

  const target = targetCategoryId.toLowerCase().trim();
  const rawCat = (restaurant.businessCategory || "").toLowerCase().trim();

  // 1. Coincidencia directa con la categoría asignada
  if (rawCat === target) return true;

  // 2. Coincidencia por inferencia normalizada
  const inferred = normalizeBusinessCategory(
    restaurant.businessCategory,
    restaurant.type,
    restaurant.name,
    restaurant.description
  );

  if (inferred === target) return true;

  // 3. Coincidencia directa por tipo de negocio o nombre
  const t = (restaurant.type || "").toLowerCase().trim();
  const n = (restaurant.name || "").toLowerCase().trim();
  if (t === target || (t.length > 3 && target.includes(t)) || (target.length > 3 && t.includes(target))) return true;
  if (n.includes(target)) return true;

  // Si la categoría objetivo es "restaurant" y el negocio no encaja en otra categoría especializada
  if (target === "restaurant" && (inferred === "restaurant" || !inferred || rawCat === "restaurant")) {
    return true;
  }

  // Comprobar si el ID objetivo es un sinónimo directo
  if (target === "verduleria" && (inferred === "grocery" || rawCat === "grocery")) return true;
  if (target === "grocery" && (inferred === "verduleria" || rawCat === "verduleria")) return true;
  if (target === "licores" && (inferred === "liquor" || rawCat === "liquor")) return true;
  if (target === "liquor" && (inferred === "licores" || rawCat === "licores")) return true;
  if (target === "panaderia" && (inferred === "bakery" || rawCat === "bakery")) return true;
  if (target === "bakery" && (inferred === "panaderia" || rawCat === "panaderia")) return true;

  return false;
}

