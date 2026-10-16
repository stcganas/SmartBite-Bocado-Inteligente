import { formatCurrency } from '../utils/format';
import { supabase } from "../lib/supabase";
import { formatImageUrl } from '../lib/utils';
import { normalizeBusinessCategory } from '../utils/categoryTheme';


export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  type: "free" | "fixed" | "commission";
  commission_percentage: number;
  billingCycle: "weekly" | "biweekly" | "monthly" | "yearly";
  features: Record<string, any>;
  isActive: boolean;
  isDefault: boolean;
  createdAt?: string;
}

export interface RestaurantSubscription {
  id: string;
  restaurantId: string;
  planId: string;
  status: "active" | "past_due" | "canceled" | "unpaid";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  plan?: Plan;
  createdAt?: string;
}

export interface PlatformInvoice {
  id: string;
  restaurantId: string;
  amount: number;
  description: string;
  type: "subscription" | "commission";
  status: "pending" | "paid" | "failed";
  dueDate: string;
  paidAt?: string;
  paymentMethod?: string;
  createdAt?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  categoryId?: string;
  images: string[];
  available: boolean;
  hasDiscount: boolean;
  discountPercentage?: number;
  discountPrice?: number;
  isPromotion: boolean;
  isPartOfCombo: boolean;
  isFeatured?: boolean;
  recommendedProductIds?: string[];
  restaurantId?: string;
  restaurantName?: string;
  pointsMultiplier?: number;
}

export interface Category {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
}

export interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  subtitle?: string;
  link?: string;
  active: boolean;
  location?: "hero" | "general" | "interstitial";
  type?: "image" | "video" | "text";
  content?: string;
  videoUrl?: string;
  startDate?: string | null;
  endDate?: string | null;
  durationSeconds?: number;
  actionUrl?: string;
  actionText?: string;
}

export interface AIKnowledge {
  instructions: string;
  openingHours: string;
  allergens: string;
  popularDishes: string;
  peakHours: string;
  foodTypes: string;
  promotions: string;
  coupons: string;
  marketingHistory?: { date: string; strategy: string }[];
}

export interface Restaurant {
  id: string;
  name: string;
  type: string;
  description: string;
  logo: string;
  coverImage: string;
  phone: string;
  address?: string;
  department?: string;
  city?: string;
  businessType?: "physical" | "online";
  businessCategory?: string;
  handlesPromotions?: boolean;
  hasDelivery?: boolean;
  deliveryFee?: number;
  openingHours?: string;
  detailedHours?: any;
  whatsappNumber?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  anniversaryProgramEnabled?: boolean;
  menu: Product[];
  ownerId?: string;
  ownerEmail?: string;
  status?: "active" | "inactive";
  isFeatured?: boolean;
  commissionRate?: number;
  banners?: Banner[];
  aiKnowledge?: AIKnowledge;
  tables?: string[];
  latitude?: number;
  longitude?: number;
  highlightMessage?: string;
  rating?: number;
  reviewsCount?: number;
  paymentGateways?: {
    nequi?: {
      clientId: string;
      clientSecret: string;
      apiKey: string;
      active: boolean;
      merchantId: string;
    };
    mercadoPago?: { publicKey: string; accessToken: string; active: boolean };
    paypal?: { clientId: string; secret: string; active: boolean };
    cash?: { active: boolean };
    cardTerminal?: { active: boolean };
    transfer?: { active: boolean };
    gamificationEnabled?: boolean;
  };
  loyaltyPointsPerDollar?: number;
  loyaltyEnabled?: boolean;
  referralEnabled?: boolean;
  referralCommissionType?: "fixed" | "percentage";
  referralCommissionValue?: number;
  generalDiscount?: number;
  generalDiscountEnabled?: boolean;
  luckyWheelEnabled?: boolean;
  gamificationEnabled?: boolean;
}

export interface LoyaltyPoints {
  id: string;
  userId: string;
  restaurantId: string;
  pointsBalance: number;
  totalEarned: number;
  updatedAt: string;
}

export interface GamificationLevel {
  id: string;
  restaurantId: string;
  name: string;
  pointsRequired: number;
  icon: string;
  color: string;
  benefits: string[];
}

export interface GamificationTask {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  pointsReward: number;
  type: "daily" | "one-time";
  actionUrl?: string;
  icon: string;
}

export interface LoyaltyReward {
  id: string;
  restaurantId: string;
  title: string;
  description: string;
  pointsCost: number;
  rewardType: "item" | "coupon" | "service";
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface LoyaltyRedemption {
  id: string;
  userId: string;
  restaurantId: string;
  rewardId: string;
  pointsSpent: number;
  status: "pending" | "completed" | "cancelled";
  createdAt: string;
  reward?: LoyaltyReward;
}

export interface WheelSegment {
  text: string;
  color: string;
  value: string;
  isPrize?: boolean;
}

export interface WheelConfig {
  id: string;
  restaurantId: string;
  isActive: boolean;
  minOrderAmount: number;
  countdownSeconds: number;
  spinDuration: number;
  segments: WheelSegment[];
  createdAt: string;
}

export interface WheelPrize {
  id: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  restaurantId: string;
  prizeText: string;
  isPrize?: boolean;
  status: "pending" | "delivered";
  createdAt: string;
  restaurantName?: string;
}

export interface OrderItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  restaurantId: string;
  customerId?: string;
  customerType?: "registered" | "guest";
  customerName: string;
  items: OrderItem[];
  total: number;
  status:
    | "pending"
    | "accepted"
    | "approved"
    | "preparing"
    | "shipped"
    | "on_the_way"
    | "assigned"
    | "completed"
    | "cancelled"
    | "rejected";
  createdAt: string;
  driverId?: string;
  paymentMethod?: "cash" | "card" | "transfer";
  paymentStatus?: "pending" | "paid" | "failed";
  deliveryLat?: number;
  deliveryLng?: number;
  tableNumber?: string;
  isWaiterCalled?: boolean;
  tipAmount?: number;
  tipPercentage?: number;
  tipType?: "waiter" | "driver" | "none";
  refundStatus?: "none" | "requested" | "approved" | "rejected";
  refundReason?: string;
  refundOption?: "money" | "resend" | "exchange";
  refundRequestedAt?: string;
  restaurantName?: string;
  customerPhone?: string;
  recipientName?: string;
  address?: string;
  note?: string;
  couponCode?: string;
  discountAmount?: number;
}

export interface SupportTicket {
  id: string;
  userId: string;
  restaurantId?: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  createdAt: string;
  restaurant?: Restaurant;
  userName?: string;
}

export interface Address {
  id: string;
  name: string; // e.g., 'Casa', 'Trabajo'
  address: string;
  neighborhood?: string;
  details?: string;
  city?: string;
}


export interface ReferralRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  restaurantId: string;
  restaurantName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}


export interface AppVisit {
  id: string;
  restaurant_id?: string;
  user_id?: string;
  visit_date: string;
  created_at: string;
  device_info?: string;
  city?: string;
  gender?: string;
  age_range?: string;
}

export interface AppUser {
  id: string;
  email: string;
  role: "admin" | "restaurant" | "user" | "driver" | "representative";
  status: "active" | "paused";
  createdAt: string;
  displayName?: string;
  phone?: string;
  addresses?: Address[];
  birthDate?: string;
  anniversaries?: { type: string; date: string }[];
  age?: number;
  avatarUrl?: string;
  pushToken?: string;
  profileCompleted?: boolean;
  isGuest?: boolean;
  referralCode?: string;
  referredBy?: string;
  referralBalance?: number;
  maxReferralInvites?: number;
  maxRestaurantAffiliations?: number;
}

export interface DriverProfile {
  id: string;
  vehicleType: "motorcycle" | "motocarro" | "bicycle" | "car";
  licensePlate?: string;
  vehicleColor?: string;
  currentLat?: number;
  currentLng?: number;
  isOnline: boolean;
  documentNumber?: string;
  birthDate?: string;
  documentPhoto?: string;
  licensePhoto?: string;
  tecnomecanicaPhoto?: string;
  profilePhoto?: string;
  approvalStatus: "pending" | "approved" | "rejected";
  restaurantId?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  orderId: string;
  restaurantId: string;
  userId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  status?: "pending" | "approved" | "rejected";
}

export interface Coupon {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  value: number;
  minOrderAmount: number;
  startDate?: string;
  endDate?: string;
  active: boolean;
  restaurantId?: string;
  usageLimit?: number;
  timesUsed: number;
}

export interface LoyaltyTransaction {
  id: string;
  userId: string;
  points: number;
  type: "earned" | "spent" | "expired";
  description: string;
  orderId?: string;
  createdAt: string;
}

export interface FoodCategory {
  id: string;
  name: string;
  icon?: string;
  imageUrl?: string;
}

export interface BusinessCategory {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  active: boolean;
  fromColor?: string;
  toColor?: string;
  shadowColor?: string;
  dotColor?: string;
}

export interface OnboardingScreen {
  id: string;
  title: string;
  description: string;
  image: string; // URL for image or video
  mediaType?: 'image' | 'video'; // To differentiate
  audioUrl?: string; // Optional audio per screen
  bgFrom: string;
  bgTo: string;

  // Customization
  textColor?: string;
  typography?: string;
  titleEffect?: 'none' | 'fade' | 'bounce' | 'typing' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'zoom' | 'flip';
  descriptionEffect?: 'none' | 'fade' | 'bounce' | 'typing' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'zoom' | 'flip';
  imageEffect?: 'none' | 'zoom' | 'pan';

  status?: 'active' | 'inactive' | 'paused';
  publishDate?: string;
  expiryDate?: string;
  layout?: 'split' | 'full';
}

export interface CustomOnboardingFlow {
  id: string;
  name: string;
  description?: string;
  screens: OnboardingScreen[];
  isActive: boolean;
}

export interface OnboardingConfig {
  user: OnboardingScreen[];
  isUserActive?: boolean;
  restaurant: OnboardingScreen[];
  isRestaurantActive?: boolean;
  driver: OnboardingScreen[];
  isDriverActive?: boolean;
  customFlows?: CustomOnboardingFlow[];
}

export interface SplashTextConfig {
  id: string;
  text: string;
  effect: 'none' | 'fade' | 'bounce' | 'typing' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'zoom' | 'flip';
  position: 'top' | 'middle' | 'image-caption' | 'bottom' | 'footer';
  color?: string;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'black';
  fontFamily?: string;
}

export interface SplashSettings {
  enabled: boolean;
  type: 'image' | 'video' | 'slideshow';
  slides: { url: string; delay?: number }[];
  audioUrl?: string; // Audio or Youtube URL
  duration: number; // in milliseconds
  backgroundColor: string;
  globalTextColor: string;
  globalTypography: string;
  imageEffect?: 'none' | 'zoom' | 'pan';
  imageScale?: number; // scale percent (10-100)
  
  title?: SplashTextConfig;
  subtitle?: SplashTextConfig;
  floatingTexts?: SplashTextConfig[];
}

export interface SplashRecord {
  id: string;
  name: string;
  category: string;
  is_active: boolean;
  settings: SplashSettings;
  created_at?: string;
}

export interface BackgroundMusicTrack {
  id: string;
  name: string;
  url: string;
  is_active: boolean;
}

export interface PlatformSettings { 
  appName?: string;
  productionUrl?: string;
  splashSettings?: SplashSettings;
  isCustomSplashActive?: boolean;
  appLogo?: string;
  systemSplashLogo?: string;
  pwaIconUrl?: string;
  pwaVersion?: number;
  onboardingSettings?: OnboardingConfig;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  heroImageOpacity?: number;
  groceryHeroImage?: string;
  liquorHeroImage?: string;
  salsamentariaHeroImage?: string;
  groceryHeroImageOpacity?: number;
  liquorHeroImageOpacity?: number;
  salsamentariaHeroImageOpacity?: number;
  showWorkWithUsBanner?: boolean;
  assistantIcon?: string;
  assistantCustomIconUrl?: string;
  heroBanners?: Banner[];
  authPageImage?: string;
  authPromoTitle?: string;
  authPromoDescription?: string;
  backgroundMusicUrl?: string;
  backgroundMusicTracks?: BackgroundMusicTrack[];
  hideMusicPlayer?: boolean;
  hideHeroSlider?: boolean;
  hideBusinessCategoryNav?: boolean;
  hideFoodCategoryChips?: boolean;
  footerBannerImage: string;
  footerBannerLink: string;
  banners: Banner[];
  foodCategories?: FoodCategory[];
  businessCategories?: BusinessCategory[];
  bannerAnimationSpeed?: number;
  featuredRestaurantsLimit?: number;
  billingCutDay?: number; // Day of the month
  commissionCycle?: "weekly" | "biweekly" | "monthly";
  paymentGateways?: {
    nequi?: {
      clientId: string;
      clientSecret: string;
      apiKey: string;
      active: boolean;
      merchantId: string;
    };
    mercadoPago?: { publicKey: string; accessToken: string; active: boolean };
    paypal?: { clientId: string; secret: string; active: boolean };
    authClientBanner?: string;
    authRestaurantBanner?: string;
    authDriverBanner?: string;
  };
  referralSettings?: {
    maxFreeAffiliations: number;
    defaultMaxReferralLinks?: number;
  };
  gamificationSettings?: {
    dailyTasks?: any[];
    weeklyMissions?: any[];
    ruletaPay?: any;
    parchisConfig?: any;
  };
  logoScale?: number;
  logoOffsetX?: number;
  logoOffsetY?: number;
  logoWidth?: number;
  logoHeight?: number;
  logoBorderRadius?: number;
}

export const defaultSettings: PlatformSettings = {
  appName: "SmartBite",
  productionUrl: "https://ais-pre-vwxtz7i5u6etdfshis6t4s-122130928241.us-east1.run.app",
  showWorkWithUsBanner: true,
  pwaIconUrl: undefined,
  pwaVersion: 1,
  assistantIcon: "Smile",
  assistantCustomIconUrl: undefined,
  logoScale: 100,
  logoOffsetX: 8,
  logoOffsetY: 0,
  logoWidth: 200,
  logoHeight: 60,
  logoBorderRadius: 16,
  splashSettings: {
    enabled: true,
    type: 'image',
    slides: [{ url: '' }],
    duration: 2500,
    backgroundColor: '#000000',
    globalTextColor: '#ffffff',
    globalTypography: 'sans-serif',
    imageEffect: 'none',
    title: {
      id: 'default-title',
      text: '',
      position: 'middle',
      effect: 'none',
      size: '3xl',
      weight: 'bold'
    }
  },
  onboardingSettings: {
    user: [
      {
        id: "user-1",
        title: "Bienvenido a SmartBite",
        description: "La forma más inteligente de pedir tu comida favorita. Regístrate ahora y descubre un mundo de beneficios exclusivos diseñados especialmente para ti.",
        image: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&q=80",
        bgFrom: "#fb923c",
        status: "active",
        bgTo: "#f59e0b"
      },
      {
        id: "user-2",
        title: "Juega y Gana Siempre",
        description: "Por cada compra que realices, acumularás monedas de oro y podrás participar en nuestra increíble Ruleta de Premios. ¡Gana descuentos y productos gratis!",
        image: "https://images.unsplash.com/photo-1512418490979-9ce792d5e1f9?auto=format&fit=crop&q=80",
        bgFrom: "#34d399",
        status: "active",
        bgTo: "#14b8a6"
      },
      {
        id: "user-3",
        title: "Sube de Nivel y Desbloquea",
        description: "¡Gamifica tu experiencia! A medida que acumulas puntos XP realizando tareas, subirás de nivel en la aplicación, desbloqueando increíbles recompensas y beneficios VIP.",
        image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80",
        bgFrom: "#f97316",
        status: "active",
        bgTo: "#f87171"
      },
      {
        id: "user-4",
        title: "Gana Dinero Refiriendo",
        description: "Invita a tus amigos con nuestro potente programa de referidos. Gana dinero por cada compra que ellos hagan. ¡Monetiza tu paladar!",
        image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80",
        bgFrom: "#10b981",
        status: "active",
        bgTo: "#34d399"
      }
    ],
    restaurant: [],
    driver: []
  },
  heroTitle: "Descubre los Mejores Sabores",
  heroSubtitle:
    "Pide a domicilio de los mejores restaurantes de tu ciudad. Rápido, fácil y delicioso.",
  heroImage:
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80",
  heroImageOpacity: 60,
  heroBanners: [],
  authPageImage: "https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?auto=format&fit=crop&q=80",
  authPromoTitle: "Gana Monedas de Oro en cada pedido \ud83e\ude99",
  authPromoDescription: "Cada vez que pidas en tus restaurantes favoritos, ganar\u00e1s Monedas de Oro autom\u00e1ticamente. \u00a1\u00dasalas para canjear productos gratis o compra giros especiales en nuestra incre\u00edble Ruleta Pay para ganar grandes sorpresas!",
  backgroundMusicUrl: "",
  backgroundMusicTracks: [],
  hideMusicPlayer: false,
  hideHeroSlider: false,
  hideBusinessCategoryNav: false,
  hideFoodCategoryChips: false,
  footerBannerImage:
    "https://images.unsplash.com/photo-1493770348161-369560ae357d?auto=format&fit=crop&q=80",
  footerBannerLink: "/auth",
  banners: [],
  foodCategories: [
    { id: "pizza", name: "Pizza", icon: "🍕", imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80" },
    { id: "burger", name: "Hamburguesas", icon: "🍔", imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80" },
    { id: "sushi", name: "Sushi", icon: "🍣", imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80" },
    { id: "healthy", name: "Saludable", icon: "🥗", imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80" },
    { id: "tacos", name: "Tacos", icon: "🌮", imageUrl: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80" },
    { id: "empanadas", name: "Empanadas", icon: "🥟", imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80" },
    { id: "arepas", name: "Arepas", icon: "🫓", imageUrl: "https://images.unsplash.com/photo-1628294895950-9805252327bc?auto=format&fit=crop&w=600&q=80" },
    { id: "salchipapas", name: "Salchipapas", icon: "🍟", imageUrl: "https://images.unsplash.com/photo-1623653387945-2fd25214f8fc?auto=format&fit=crop&w=600&q=80" },
    { id: "asados", name: "Asados", icon: "🥩", imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80" },
    { id: "dessert", name: "Postres", icon: "🍰", imageUrl: "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80" },
    { id: "drinks", name: "Bebidas", icon: "🥤", imageUrl: "https://images.unsplash.com/photo-1513558162293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80" },
  ],
  businessCategories: [
    {
      id: "restaurant",
      title: "Explorar Restaurantes",
      subtitle: "Tus comidas favoritas a la puerta de tu casa.",
      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1000&auto=format&fit=crop",
      active: true,
      fromColor: "from-neutral-900 via-neutral-800",
      toColor: "to-[#FF8A00]/60",
      shadowColor: "shadow-[0_4px_20px_rgba(255,138,0,0.3)] border-[#FF8A00]/40",
      dotColor: "bg-[#FF8A00]",
    },
    {
      id: "salsamentaria",
      title: "Explorar Salsamentarías",
      subtitle: "Los mejores embutidos, quesos y carnes frías.",
      image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=1000&auto=format&fit=crop",
      active: true,
      fromColor: "from-neutral-900 via-neutral-800",
      toColor: "to-rose-600/60",
      shadowColor: "shadow-[0_4px_20px_rgba(244,63,94,0.3)] border-rose-500/40",
      dotColor: "bg-rose-500",
    },
    {
      id: "grocery",
      title: "Explorar Verdulerías",
      subtitle: "Frutas, verduras y legumbres frescas cada día.",
      image: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?q=80&w=1000&auto=format&fit=crop",
      active: true,
      fromColor: "from-neutral-900 via-neutral-800",
      toColor: "to-[#10B981]/60",
      shadowColor: "shadow-[0_4px_20px_rgba(16,185,129,0.3)] border-[#10B981]/40",
      dotColor: "bg-[#10B981]",
    },
    {
      id: "bakery",
      title: "Explorar Panaderías",
      subtitle: "Pan recién horneado, repostería y pastelería.",
      image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1000&auto=format&fit=crop",
      active: true,
      fromColor: "from-neutral-900 via-neutral-800",
      toColor: "to-amber-600/60",
      shadowColor: "shadow-[0_4px_20px_rgba(217,119,6,0.3)] border-amber-500/40",
      dotColor: "bg-amber-500",
    },
    {
      id: "liquor",
      title: "Explorar Licores",
      subtitle: "Bebidas, vinos, cervezas y licores para toda ocasión.",
      image: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?q=80&w=1000&auto=format&fit=crop",
      active: true,
      fromColor: "from-neutral-900 via-neutral-800",
      toColor: "to-[#8B5CF6]/60",
      shadowColor: "shadow-[0_4px_20px_rgba(139,92,246,0.3)] border-[#8B5CF6]/40",
      dotColor: "bg-[#8B5CF6]",
    },
    {
      id: "pharmacy",
      title: "Farmacias y Salud",
      subtitle: "Medicamentos y productos de salud y cuidado personal.",
      image: "https://images.unsplash.com/photo-1576602976047-174e57a47881?q=80&w=1000&auto=format&fit=crop",
      active: true,
      fromColor: "from-neutral-900 via-neutral-800",
      toColor: "to-cyan-600/60",
      shadowColor: "shadow-[0_4px_20px_rgba(6,182,212,0.3)] border-cyan-500/40",
      dotColor: "bg-cyan-500",
    },
    {
      id: "ice_cream",
      title: "Heladerías y Postres",
      subtitle: "Tus helados favoritos y postres refrescantes.",
      image: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?q=80&w=1000&auto=format&fit=crop",
      active: true,
      fromColor: "from-neutral-900 via-neutral-800",
      toColor: "to-pink-500/60",
      shadowColor: "shadow-[0_4px_20px_rgba(236,72,153,0.3)] border-pink-500/40",
      dotColor: "bg-pink-500",
    },
    {
      id: "general_store",
      title: "Víveres y Abarrotes",
      subtitle: "Todo para tu despensa y hogar en un solo lugar.",
      image: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?q=80&w=1000&auto=format&fit=crop",
      active: true,
      fromColor: "from-neutral-900 via-neutral-800",
      toColor: "to-yellow-600/60",
      shadowColor: "shadow-[0_4px_20px_rgba(202,138,4,0.3)] border-yellow-500/40",
      dotColor: "bg-yellow-500",
    },
    {
      id: "cevicheria",
      title: "Cevicherías",
      subtitle: "Los mejores ceviches frescos y cocteles.",
      image: "https://images.unsplash.com/photo-1535400255456-984241443b29?q=80&w=1000&auto=format&fit=crop",
      active: true,
      fromColor: "from-neutral-900 via-neutral-800",
      toColor: "to-teal-500/60",
      shadowColor: "shadow-[0_4px_20px_rgba(20,184,166,0.3)] border-teal-400/40",
      dotColor: "bg-teal-500",
    },
    {
      id: "seafood",
      title: "Pescados y Mariscos",
      subtitle: "Frescura y sabor del mar en tu mesa.",
      image: "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?q=80&w=1000&auto=format&fit=crop",
      active: true,
      fromColor: "from-neutral-900 via-neutral-800",
      toColor: "to-blue-600/60",
      shadowColor: "shadow-[0_4px_20px_rgba(2,132,199,0.3)] border-blue-500/40",
      dotColor: "bg-blue-500",
    },
    {
      id: "coffee",
      title: "Cafeterías",
      subtitle: "El mejor café especial, repostería y desayunos.",
      image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=1000&auto=format&fit=crop",
      active: true,
      fromColor: "from-neutral-900 via-neutral-800",
      toColor: "to-amber-800/60",
      shadowColor: "shadow-[0_4px_20px_rgba(120,53,15,0.3)] border-amber-700/40",
      dotColor: "bg-amber-700",
    },
  ],
  bannerAnimationSpeed: 3,
  featuredRestaurantsLimit: 2,
  billingCutDay: 1,
  commissionCycle: "weekly",
  paymentGateways: {
    authClientBanner: "",
    authRestaurantBanner: "",
    authDriverBanner: ""
  },
  referralSettings: {
    maxFreeAffiliations: 5,
    defaultMaxReferralLinks: 20,
  },
  gamificationSettings: {
    dailyTasks: [],
    weeklyMissions: [],
    ruletaPay: {
      isActive: true,
      minOrderAmount: 1, // Start from 1 point onwards
      countdownSeconds: 0,
      spinDuration: 4,
      segments: [
        { text: "1 Moneda de Oro", isPrize: true, color: "#9c27b0" },
        { text: "Sigue Participando", isPrize: false, color: "#3f51b5" },
        { text: "10 Monedas de Oro", isPrize: true, color: "#e91e63" },
        { text: "Sin Suerte", isPrize: false, color: "#f44336" },
        { text: "5 Monedas de Oro", isPrize: true, color: "#ff9800" },
        { text: "Intenta de Nuevo", isPrize: false, color: "#009688" },
        { text: "20 Monedas de Oro", isPrize: true, color: "#4caf50" },
        { text: "Mejor Suerte", isPrize: false, color: "#607d8b" }
      ]
    },
    parchisConfig: {
      boardImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Parchis_board.svg/1024px-Parchis_board.svg.png"
    }
  }
};

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  orderId?: string;
  url?: string;
  isRead: boolean;
  createdAt: string;
  metadata?: any;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  restaurantId: string;
  status: "active" | "completed";
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  restaurantId: string;
  amount: number;
  method: "nequi" | "cash" | "product";
  nequiNumber?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  processedAt?: string;
}

export interface NotificationCampaign {
  id: string;
  senderId: string;
  restaurantId?: string;
  title: string;
  body: string;
  targetSegment: string;
  sentCount: number;
  createdAt: string;
}

export interface ScheduledNotification {
  id: string;
  senderId: string;
  title: string;
  body: string;
  category: string;
  targetSegment: string;
  restaurantId?: string;
  scheduledFor: string;
  isSent: boolean;
  createdAt: string;
}

export interface RewardModule {
  id?: string;
  title: string;
  description: string;
  imageUrl: string;
  buttonText: string;
  path: string;
  isActive: boolean;
  sortOrder: number;
}

export interface AIMarketingStrategy {
  id: string;
  restaurantId: string;
  title: string;
  description: string;
  targetProducts: string[];
  status: 'draft' | 'applied' | 'archived';
  impact?: string;
  createdAt: string;
}

const LOCAL_TICKETS_KEY = "smartbite_local_support_tickets";

export function getLocalTickets(): any[] {
  try {
    const data = localStorage.getItem(LOCAL_TICKETS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveLocalTickets(tickets: any[]) {
  try {
    localStorage.setItem(LOCAL_TICKETS_KEY, JSON.stringify(tickets));
  } catch (e) {
    console.error("Failed to save local tickets:", e);
  }
}

function formatLocalTicketToSupportTicket(t: any): SupportTicket {
  return {
    id: t.id || t.ticket_id,
    userId: t.user_id,
    restaurantId: t.restaurant_id || undefined,
    subject: t.subject || "Sin Asunto",
    description: t.description || "",
    status: t.status || "open",
    priority: t.priority || "medium",
    createdAt: t.created_at || t.createdAt || new Date().toISOString(),
    userName: t.userName || t.app_users?.display_name || t.app_users?.email,
  };
}

export const db = {
  getAIMarketingStrategies: async (restaurantId: string): Promise<AIMarketingStrategy[]> => {
    try {
      const { data, error } = await supabase
        .from('ai_marketing_strategies')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id,
        restaurantId: d.restaurant_id,
        title: d.title,
        description: d.description,
        targetProducts: d.target_products || [],
        status: d.status || 'draft',
        impact: d.impact || 'Medio',
        createdAt: d.created_at
      }));
    } catch (error) {
      console.warn("getAIMarketingStrategies error, falling back to localStorage", error);
      const local = JSON.parse(localStorage.getItem(`ai_marketing_strategies_${restaurantId}`) || '[]');
      return local;
    }
  },

  saveAIMarketingStrategy: async (strategy: Omit<AIMarketingStrategy, 'id' | 'createdAt'>): Promise<AIMarketingStrategy> => {
    const newId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const now = new Date().toISOString();
    const formatted = {
      restaurant_id: strategy.restaurantId,
      title: strategy.title,
      description: strategy.description,
      target_products: strategy.targetProducts,
      status: strategy.status || 'draft',
      impact: strategy.impact || 'Medio',
      created_at: now
    };

    try {
      const { data, error } = await supabase
        .from('ai_marketing_strategies')
        .insert([formatted])
        .select()
        .single();
      if (error) throw error;
      return {
        id: data.id,
        restaurantId: data.restaurant_id,
        title: data.title,
        description: data.description,
        targetProducts: data.target_products || [],
        status: data.status || 'draft',
        impact: data.impact || 'Medio',
        createdAt: data.created_at
      };
    } catch (error) {
      console.warn("saveAIMarketingStrategy error, falling back to localStorage", error);
      const localStrategies = JSON.parse(localStorage.getItem(`ai_marketing_strategies_${strategy.restaurantId}`) || '[]');
      const newStrategy: AIMarketingStrategy = {
        id: newId,
        restaurantId: strategy.restaurantId,
        title: strategy.title,
        description: strategy.description,
        targetProducts: strategy.targetProducts,
        status: strategy.status || 'draft',
        impact: strategy.impact || 'Medio',
        createdAt: now
      };
      localStrategies.unshift(newStrategy);
      localStorage.setItem(`ai_marketing_strategies_${strategy.restaurantId}`, JSON.stringify(localStrategies));
      return newStrategy;
    }
  },

  updateAIMarketingStrategyStatus: async (id: string, restaurantId: string, status: 'draft' | 'applied' | 'archived'): Promise<void> => {
    try {
      const { error } = await supabase
        .from('ai_marketing_strategies')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.warn("updateAIMarketingStrategyStatus error, falling back to localStorage", error);
    }
    // Always sync locally as well
    const localStrategies = JSON.parse(localStorage.getItem(`ai_marketing_strategies_${restaurantId}`) || '[]');
    const index = localStrategies.findIndex((s: any) => s.id === id);
    if (index !== -1) {
      localStrategies[index].status = status;
      localStorage.setItem(`ai_marketing_strategies_${restaurantId}`, JSON.stringify(localStrategies));
    }
  },

  deleteAIMarketingStrategy: async (id: string, restaurantId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('ai_marketing_strategies')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.warn("deleteAIMarketingStrategy error, falling back to localStorage", error);
    }
    // Always sync locally as well
    const localStrategies = JSON.parse(localStorage.getItem(`ai_marketing_strategies_${restaurantId}`) || '[]');
    const filtered = localStrategies.filter((s: any) => s.id !== id);
    localStorage.setItem(`ai_marketing_strategies_${restaurantId}`, JSON.stringify(filtered));
  },

  recordVisit: async (data: { 
    restaurantId?: string; 
    userId?: string; 
    pagePath?: string;
    sessionId?: string;
    ipAddress?: string;
    browser?: string;
    os?: string;
    screenResolution?: string;
    deviceInfo?: string; 
    city?: string; 
    gender?: string; 
    ageRange?: string;
    esBot?: boolean;
    botSignals?: string[];
    fingerprint?: string;
    metadata?: any;
  }): Promise<void> => {
    try {
      const todayDate = new Date().toISOString().split('T')[0];
      const payload: any = {
        restaurant_id: data.restaurantId || null,
        user_id: data.userId || null,
        visit_date: todayDate,
        page_path: data.pagePath || '/',
        session_id: data.sessionId || null,
        ip_address: data.ipAddress || 'Unknown',
        browser: data.browser || 'Unknown',
        os: data.os || 'Unknown',
        screen_resolution: data.screenResolution || null,
        device_info: data.deviceInfo || null,
        city: data.city || null,
        gender: data.gender || null,
        age_range: data.ageRange || null,
        es_bot: data.esBot !== undefined ? data.esBot : false,
        bot_signals: data.botSignals || [],
        fingerprint: data.fingerprint || null,
        metadata: data.metadata || {}
      };

      const { error } = await supabase.from('restaurant_visits').insert(payload);

      if (error) {
        // Fallback for older table schema if new columns are not yet created
        const fallBackDeviceInfo = JSON.stringify({
          original_device: data.deviceInfo || 'Desktop',
          browser: data.browser || 'Unknown',
          os: data.os || 'Unknown',
          ip: data.ipAddress || 'Unknown',
          page_path: data.pagePath || '/',
          session_id: data.sessionId,
          fingerprint: data.fingerprint || 'unknown',
          es_bot: data.esBot || false,
          botSignals: data.botSignals || []
        });

        await supabase.from('restaurant_visits').insert({
          restaurant_id: data.restaurantId || null,
          user_id: data.userId || null,
          visit_date: todayDate,
          device_info: fallBackDeviceInfo,
          city: data.city || null,
          gender: data.gender || null,
          age_range: data.ageRange || null,
        });
      }
    } catch (error) {
      console.error("Error recording visit telemetry:", error);
    }
  },

  getTrafficStats: async (
    restaurantId?: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<{ 
    visits: any[]; 
    ageGroups: any[]; 
    genderStats: any[]; 
    cities: any[]; 
    topPages: any[];
    deviceStats: any[];
    osStats: any[];
    browserStats: any[];
  }> => {
    try {
      let query = supabase.from('restaurant_visits').select('*');
      
      if (restaurantId) {
        query = query.eq('restaurant_id', restaurantId);
      }

      if (startDate) {
        query = query.gte('visit_date', startDate);
      }
      if (endDate) {
        query = query.lte('visit_date', endDate);
      }

      const { data, error } = await query.order('created_at', { ascending: true });
      
      if (error || !data) {
        return { 
          visits: [], 
          ageGroups: [], 
          genderStats: [], 
          cities: [],
          topPages: [],
          deviceStats: [],
          osStats: [],
          browserStats: []
        };
      }
      
      // Process data for charts
      const visitsByDate: Record<string, { visits: number; unique: Set<string> }> = {};
      const ageGroups: Record<string, number> = {};
      const genderStats: Record<string, number> = {};
      const cities: Record<string, number> = {};
      const pagesCount: Record<string, number> = {};
      const osCount: Record<string, number> = {};
      const browserCount: Record<string, number> = {};
      const deviceCount: Record<string, number> = { 'Móvil': 0, 'Escritorio': 0, 'Tablet': 0 };
      
      data.forEach(v => {
        const dateKey = v.visit_date || (v.created_at ? v.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);
        
        // Timeline
        if (!visitsByDate[dateKey]) {
          visitsByDate[dateKey] = { visits: 0, unique: new Set() };
        }
        visitsByDate[dateKey].visits++;
        
        // Unique visitor resolution (prefer user_id -> session_id -> fingerprint -> id)
        const uniqueKey = v.user_id || v.session_id || v.fingerprint || v.id;
        visitsByDate[dateKey].unique.add(uniqueKey);
        
        // Age Demographics
        if (v.age_range) {
          ageGroups[v.age_range] = (ageGroups[v.age_range] || 0) + 1;
        }
        
        // Gender Demographics
        if (v.gender) {
          const gNorm = v.gender.toLowerCase().startsWith('m') ? 'Masculino' : v.gender.toLowerCase().startsWith('f') ? 'Femenino' : 'Otro';
          genderStats[gNorm] = (genderStats[gNorm] || 0) + 1;
        }
        
        // City / Geo
        if (v.city && v.city !== 'Unknown') {
          const cleanCity = v.city.split(',')[0].trim();
          cities[cleanCity] = (cities[cleanCity] || 0) + 1;
        }

        // Pages
        const pPath = v.page_path || '/';
        pagesCount[pPath] = (pagesCount[pPath] || 0) + 1;

        // OS
        let osName = v.os || 'Unknown';
        if (osName === 'Unknown' && v.device_info) {
          try {
            const parsed = JSON.parse(v.device_info);
            osName = parsed.os || 'Desconocido';
          } catch {
            osName = 'Desconocido';
          }
        }
        if (osName && osName !== 'Unknown') {
          osCount[osName] = (osCount[osName] || 0) + 1;
        }

        // Browser
        let browserName = v.browser || 'Unknown';
        if (browserName === 'Unknown' && v.device_info) {
          try {
            const parsed = JSON.parse(v.device_info);
            browserName = parsed.browser || 'Desconocido';
          } catch {
            browserName = 'Desconocido';
          }
        }
        if (browserName && browserName !== 'Unknown') {
          browserCount[browserName] = (browserCount[browserName] || 0) + 1;
        }

        // Device Type
        const devStr = (v.device_info || '') + ' ' + (v.os || '') + ' ' + (v.screen_resolution || '');
        if (/Android|iPhone|iPod|Mobile/i.test(devStr)) {
          deviceCount['Móvil']++;
        } else if (/iPad|Tablet/i.test(devStr)) {
          deviceCount['Tablet']++;
        } else {
          deviceCount['Escritorio']++;
        }
      });
      
      const visits = Object.entries(visitsByDate).map(([date, stats]) => ({
        date,
        visits: stats.visits,
        unique: stats.unique.size
      })).sort((a, b) => a.date.localeCompare(b.date));
      
      // Provide default age buckets if empty
      const defaultAgeKeys = ['18-24', '25-34', '35-44', '45-54', '55+'];
      const ageGroupsArr = Object.keys(ageGroups).length > 0 
        ? Object.entries(ageGroups).map(([age, users]) => ({ age, users }))
        : defaultAgeKeys.map(age => ({ age, users: 0 }));

      const genderArr = Object.keys(genderStats).length > 0
        ? Object.entries(genderStats).map(([name, value]) => ({ name, value }))
        : [
            { name: 'Masculino', value: 0 },
            { name: 'Femenino', value: 0 },
            { name: 'Otro', value: 0 }
          ];

      return { 
        visits,
        ageGroups: ageGroupsArr,
        genderStats: genderArr,
        cities: Object.entries(cities).map(([city, visits]) => ({ city, municipality: "Guajira / Nacional", visits })).sort((a,b) => b.visits - a.visits).slice(0, 10),
        topPages: Object.entries(pagesCount).map(([path, visits]) => ({ path, visits })).sort((a,b) => b.visits - a.visits).slice(0, 8),
        deviceStats: Object.entries(deviceCount).map(([name, value]) => ({ name, value })),
        osStats: Object.entries(osCount).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 5),
        browserStats: Object.entries(browserCount).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 5),
      };
      
    } catch (error) {
      console.error("Error fetching traffic stats:", error);
      return { 
        visits: [], 
        ageGroups: [], 
        genderStats: [], 
        cities: [],
        topPages: [],
        deviceStats: [],
        osStats: [],
        browserStats: []
      };
    }
  },

  getAllRestaurantVisits: async (): Promise<any[]> => {
    try {
      const { data, error } = await supabase.from('restaurant_visits')
        .select('restaurant_id, created_at, restaurants(id, name, type)')
        .not('restaurant_id', 'is', null);
        
      if (error || !data) return [];
      
      const restStats: Record<string, any> = {};
      data.forEach((v: any) => {
        const rId = v.restaurant_id;
        const rName = v.restaurants?.name || 'Restaurante';
        const rType = v.restaurants?.type || 'General';
        if (!restStats[rId]) {
          restStats[rId] = {
            id: rId,
            name: rName,
            type: rType,
            visits: 0
          };
        }
        restStats[rId].visits++;
      });
      
      return Object.values(restStats)
        .sort((a: any, b: any) => b.visits - a.visits)
        .map((r: any) => ({ ...r, trend: '+12%' }));
        
    } catch (error) {
      console.error("Error fetching all restaurant visits:", error);
      return [];
    }
  },


  createReferralRequest: async (data: Omit<ReferralRequest, 'id' | 'createdAt' | 'status'>): Promise<void> => {
    try {
      const { error } = await supabase.from('referral_requests').insert({
        user_id: data.userId,
        user_name: data.userName,
        user_email: data.userEmail,
        user_phone: data.userPhone,
        restaurant_id: data.restaurantId,
        restaurant_name: data.restaurantName,
        status: 'pending',
        created_at: new Date().toISOString()
      });
      if (error) throw error;
      
      // Notify Super Admins
      try {
        await fetch("/api/notifications/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: "all_admins",
            title: `Nueva Solicitud: ${data.restaurantName}`,
            body: `${data.userName} ha solicitado una acción en el programa de referidos.`,
            data: { type: "referral_request" }
          })
        });
      } catch (notifErr) {
        console.warn("Failed to notify admins of new referral request", notifErr);
      }
    } catch (error) {
      console.warn("createReferralRequest error, proceeding with local stub", error);
      // Stub
      const requests = JSON.parse(localStorage.getItem('referral_requests') || '[]');
      requests.push({
        id: Math.random().toString(36).substring(7),
        ...data,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('referral_requests', JSON.stringify(requests));
    }
  },
  
  getReferralRequests: async (): Promise<ReferralRequest[]> => {
    try {
      const { data, error } = await supabase.from('referral_requests').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id,
        userId: d.user_id,
        userName: d.user_name,
        userEmail: d.user_email,
        userPhone: d.user_phone,
        restaurantId: d.restaurant_id,
        restaurantName: d.restaurant_name,
        status: d.status,
        createdAt: d.created_at
      }));
    } catch (error) {
       console.warn("getReferralRequests error", error);
       return JSON.parse(localStorage.getItem('referral_requests') || '[]');
    }
  },

  updateReferralRequestStatus: async (requestId: string, status: 'approved' | 'rejected'): Promise<void> => {
     try {
       const { error } = await supabase.from('referral_requests').update({ status }).eq('id', requestId);
       if (error) throw error;
     } catch (err) {
       console.warn("updateReferralRequestStatus error", err);
       const requests = JSON.parse(localStorage.getItem('referral_requests') || '[]');
       const reqIndex = requests.findIndex((r: any) => r.id === requestId);
       if (reqIndex !== -1) {
         requests[reqIndex].status = status;
         localStorage.setItem('referral_requests', JSON.stringify(requests));
       }
     }
  },

  _mapOrder: (data: any): Order => ({
    id: data.id,
    restaurantId: data.restaurant_id,
    customerId: data.customer_id,
    customerName: data.customer_name,
    customerPhone: data.customer_phone,
    recipientName: data.recipient_name,
    driverId: data.driver_id,
    items: data.items,
    total: data.total,
    status: data.status,
    paymentMethod: data.payment_method,
    paymentStatus: data.payment_status,
    address: data.address,
    note: data.note,
    tableNumber: data.table_number,
    refundStatus: data.refund_status,
    refundReason: data.refund_reason,
    couponCode: data.coupon_code,
    discountAmount: data.discount_amount,
    createdAt: data.created_at,
    restaurantName: data.restaurants?.name,
  }),

  getSplashes: async () => {
    const { data, error } = await supabase.from('splash_screens').select('*').order('created_at', { ascending: false });
    return { data: data as SplashRecord[] | null, error };
  },

  createSplash: async (splash: Omit<SplashRecord, 'id' | 'created_at'>) => {
    const { data, error } = await supabase.from('splash_screens').insert([splash]).select().single();
    return { data: data as SplashRecord | null, error };
  },

  updateSplash: async (id: string, splash: Partial<SplashRecord>) => {
    const { data, error } = await supabase.from('splash_screens').update(splash).eq('id', id).select().single();
    return { data: data as SplashRecord | null, error };
  },

  deleteSplash: async (id: string) => {
    const { error } = await supabase.from('splash_screens').delete().eq('id', id);
    return { error };
  },

  setActiveSplash: async (id: string | null) => {
    // If id is null, we set all to false
    if (!id) {
       await supabase.from('splash_screens').update({ is_active: false }).neq('id', 'placeholder-uuid-that-doesnt-exist');
       return;
    }
    // Set all to false except the selected one
    await supabase.from('splash_screens').update({ is_active: false }).neq('id', id);
    // Set selected to true
    await supabase.from('splash_screens').update({ is_active: true }).eq('id', id);
  },

  getBackgroundMusicTracks: async (): Promise<BackgroundMusicTrack[]> => {
    const { data, error } = await supabase.from('background_music').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error("Error fetching music tracks:", error);
      return [];
    }
    return data as BackgroundMusicTrack[];
  },

  addBackgroundMusicTrack: async (track: Omit<BackgroundMusicTrack, 'id'>) => {
    try {
      const resp = await fetch("/api/music-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(track)
      });
      const resData = await resp.json();
      if (!resp.ok) throw new Error(resData.error || "Error adding track");
      
      const res = { data: resData.data, error: null };
      if (res.data && track.is_active) {
         await db.setActiveMusicTrack(res.data.id);
      }
      return res;
    } catch(err: any) {
      return { data: null, error: err };
    }
  },

  updateBackgroundMusicTrack: async (id: string, updates: Partial<BackgroundMusicTrack>) => {
    return await supabase.from('background_music').update(updates).eq('id', id);
  },

  deleteBackgroundMusicTrack: async (id: string) => {
    try {
      const res = await fetch(`/api/music-item/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete track");
      
      if (data.is_active) {
         // if active track was deleted, try to get remaining tracks
         const { data: remainingTracks, error: fetchErr } = await supabase.from('background_music').select('*').order('created_at', { ascending: false });
         if (!fetchErr && remainingTracks && remainingTracks.length > 0) {
           // set the first remaining track as active
           await db.setActiveMusicTrack(remainingTracks[0].id);
         } else {
           await db.updatePlatformSettings({ backgroundMusicUrl: "" });
         }
      }
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  },

  setActiveMusicTrack: async (id: string) => {
    try {
      const res = await fetch(`/api/music-item/${id}/active`, { method: 'PUT' });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to set active");
      
      if (resData.data) {
        await db.updatePlatformSettings({ backgroundMusicUrl: resData.data.url });
      }
      return { data: resData.data, error: null };
    } catch(err: any) {
      return { data: null, error: err };
    }
  },

  getPlatformSettings: async (): Promise<PlatformSettings> => {
    try {
      const fetchWithTimeout = async (fn: () => Promise<any> | any): Promise<any> => {
        return Promise.race([
          fn(),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000))
        ]);
      };

      const [platformRes, splashRes] = await Promise.all([
        fetchWithTimeout(() => supabase.from("platform_settings").select("*").single()),
        fetchWithTimeout(() => supabase.from('splash_screens').select('*').eq('is_active', true).maybeSingle())
      ]);
      
      const { data, error } = platformRes;
      if (error || !data) return defaultSettings;
      
      const { data: splashData, error: splashError } = splashRes;
      
      return {
        appName: data.payment_gateways?.appName || defaultSettings.appName,
        splashSettings: (splashData && !splashError) ? splashData.settings : (data.payment_gateways?.splashSettings || defaultSettings.splashSettings),
        isCustomSplashActive: !!(splashData && !splashError),
        appLogo: formatImageUrl(data.payment_gateways?.appLogo),
        systemSplashLogo: formatImageUrl(data.payment_gateways?.systemSplashLogo),
        onboardingSettings: data.onboarding_settings || defaultSettings.onboardingSettings,
        productionUrl: data.payment_gateways?.productionUrl || defaultSettings.productionUrl,
        heroTitle: data.hero_title || defaultSettings.heroTitle,
        heroSubtitle: data.hero_subtitle || defaultSettings.heroSubtitle,
        heroImage: formatImageUrl(data.hero_image || defaultSettings.heroImage),
        heroImageOpacity: data.payment_gateways?.heroImageOpacity ?? defaultSettings.heroImageOpacity,
        groceryHeroImage: formatImageUrl(data.payment_gateways?.groceryHeroImage),
        liquorHeroImage: formatImageUrl(data.payment_gateways?.liquorHeroImage),
        groceryHeroImageOpacity: data.payment_gateways?.groceryHeroImageOpacity,
        liquorHeroImageOpacity: data.payment_gateways?.liquorHeroImageOpacity,
        heroBanners: (data.banners || [])
          .filter((b: any) => b.location === "hero")
          .map((b: any) => ({ ...b, imageUrl: formatImageUrl(b.imageUrl) })),
        authPageImage: formatImageUrl(data.payment_gateways?.authPageImage || defaultSettings.authPageImage),
        authPromoTitle: data.payment_gateways?.authPromoTitle || defaultSettings.authPromoTitle,
        authPromoDescription: data.payment_gateways?.authPromoDescription || defaultSettings.authPromoDescription,
        backgroundMusicUrl: (data.payment_gateways?.backgroundMusicUrl?.includes('pixabay.com') ? defaultSettings.backgroundMusicUrl : data.payment_gateways?.backgroundMusicUrl) || defaultSettings.backgroundMusicUrl,
        backgroundMusicTracks: (data.payment_gateways?.backgroundMusicTracks || defaultSettings.backgroundMusicTracks).map((t: any) => t.url.includes('pixabay.com') ? { ...t, url: defaultSettings.backgroundMusicUrl } : t),
        hideMusicPlayer: data.payment_gateways?.hideMusicPlayer ?? false,
        hideHeroSlider: data.payment_gateways?.hideHeroSlider ?? false,
        hideBusinessCategoryNav: data.payment_gateways?.hideBusinessCategoryNav ?? false,
        hideFoodCategoryChips: data.payment_gateways?.hideFoodCategoryChips ?? false,
        footerBannerImage:
          formatImageUrl(data.footer_banner_image || defaultSettings.footerBannerImage),
        footerBannerLink:
          data.footer_banner_link || defaultSettings.footerBannerLink,
        banners: (data.banners || [])
          .filter((b: any) => b.location !== "hero")
          .map((b: any) => ({ ...b, imageUrl: formatImageUrl(b.imageUrl) })),
        foodCategories: (Array.isArray(data.food_categories) && data.food_categories.length > 0)
          ? data.food_categories
          : defaultSettings.foodCategories,
        businessCategories: ((Array.isArray(data.business_categories) && data.business_categories.length > 0)
          ? data.business_categories
          : (Array.isArray(data.payment_gateways?.businessCategories) && data.payment_gateways.businessCategories.length > 0)
            ? data.payment_gateways.businessCategories
            : defaultSettings.businessCategories
        ).map((bc: any) => ({
          ...bc,
          image: formatImageUrl(bc.image)
        })),
        bannerAnimationSpeed:
          data.banner_animation_speed || defaultSettings.bannerAnimationSpeed,
        featuredRestaurantsLimit:
          data.featured_restaurants_limit || defaultSettings.featuredRestaurantsLimit,
        paymentGateways:
          data.payment_gateways || defaultSettings.paymentGateways,
        referralSettings: data.referral_settings || data.payment_gateways?.referralSettings || defaultSettings.referralSettings,
        gamificationSettings: {
          ...defaultSettings.gamificationSettings,
          ...(data.gamification_settings || data.payment_gateways?.gamificationSettings || {})
        },
        assistantIcon: data.payment_gateways?.assistantIcon || defaultSettings.assistantIcon,
        assistantCustomIconUrl: formatImageUrl(data.payment_gateways?.assistantCustomIconUrl) || defaultSettings.assistantCustomIconUrl,
        showWorkWithUsBanner: data.payment_gateways?.showWorkWithUsBanner ?? defaultSettings.showWorkWithUsBanner,
        pwaIconUrl: formatImageUrl(data.payment_gateways?.pwaIconUrl),
        pwaVersion: data.payment_gateways?.pwaVersion ?? defaultSettings.pwaVersion,
      };
    } catch {
      return defaultSettings;
    }
  },

  updatePlatformSettings: async (settings: Partial<PlatformSettings>) => {
    const { data: existing } = await supabase.from("platform_settings").select("*").single();
    const existingGateways = existing?.payment_gateways || {};

    const payload: any = { id: 1 }; // Assuming a single row with id=1
    payload.payment_gateways = { ...existingGateways };

    if (settings.paymentGateways !== undefined) {
      payload.payment_gateways = { ...payload.payment_gateways, ...settings.paymentGateways };
    }

    if (settings.heroTitle !== undefined)
      payload.hero_title = settings.heroTitle;
    if (settings.heroSubtitle !== undefined)
      payload.hero_subtitle = settings.heroSubtitle;
    if (settings.appLogo !== undefined) {
      payload.payment_gateways.appLogo = settings.appLogo;
    }
    if (settings.systemSplashLogo !== undefined) {
      payload.payment_gateways.systemSplashLogo = settings.systemSplashLogo;
    }
    if (settings.authPageImage !== undefined) {
      payload.payment_gateways.authPageImage = settings.authPageImage;
    }
    if (settings.authPromoTitle !== undefined) {
      payload.payment_gateways.authPromoTitle = settings.authPromoTitle;
    }
    if (settings.authPromoDescription !== undefined) {
      payload.payment_gateways.authPromoDescription = settings.authPromoDescription;
    }
    if (settings.backgroundMusicUrl !== undefined) {
      payload.payment_gateways.backgroundMusicUrl = settings.backgroundMusicUrl;
    }
    if (settings.hideMusicPlayer !== undefined) {
      payload.payment_gateways.hideMusicPlayer = settings.hideMusicPlayer;
    }
    if (settings.hideHeroSlider !== undefined) {
      payload.payment_gateways.hideHeroSlider = settings.hideHeroSlider;
    }
    if (settings.hideBusinessCategoryNav !== undefined) {
      payload.payment_gateways.hideBusinessCategoryNav = settings.hideBusinessCategoryNav;
    }
    if (settings.hideFoodCategoryChips !== undefined) {
      payload.payment_gateways.hideFoodCategoryChips = settings.hideFoodCategoryChips;
    }
    if (settings.productionUrl !== undefined) {
      payload.payment_gateways.productionUrl = settings.productionUrl;
    }
    if (settings.appName !== undefined) {
      payload.payment_gateways.appName = settings.appName;
    }
    if (settings.assistantIcon !== undefined) {
      payload.payment_gateways.assistantIcon = settings.assistantIcon;
    }
    if (settings.pwaIconUrl !== undefined) {
      payload.payment_gateways.pwaIconUrl = settings.pwaIconUrl;
    }
    if (settings.pwaVersion !== undefined) {
      payload.payment_gateways.pwaVersion = settings.pwaVersion;
    }
    if (settings.assistantCustomIconUrl !== undefined) {
      payload.payment_gateways.assistantCustomIconUrl = settings.assistantCustomIconUrl;
    }
    if (settings.backgroundMusicTracks !== undefined) {
      payload.payment_gateways.backgroundMusicTracks = settings.backgroundMusicTracks;
    }
    if (settings.splashSettings !== undefined) {
      payload.payment_gateways.splashSettings = settings.splashSettings;
    }
    if (settings.showWorkWithUsBanner !== undefined) {
      payload.payment_gateways.showWorkWithUsBanner = settings.showWorkWithUsBanner;
    }
    if (settings.heroImageOpacity !== undefined) {
      payload.payment_gateways.heroImageOpacity = settings.heroImageOpacity;
    }
    if (settings.groceryHeroImageOpacity !== undefined) {
      payload.payment_gateways.groceryHeroImageOpacity = settings.groceryHeroImageOpacity;
    }
    if (settings.liquorHeroImageOpacity !== undefined) {
      payload.payment_gateways.liquorHeroImageOpacity = settings.liquorHeroImageOpacity;
    }
    if (settings.groceryHeroImage !== undefined) {
      payload.payment_gateways.groceryHeroImage = settings.groceryHeroImage;
    }
    if (settings.liquorHeroImage !== undefined) {
      payload.payment_gateways.liquorHeroImage = settings.liquorHeroImage;
    }
    if (settings.heroImage !== undefined)
      payload.hero_image = settings.heroImage;
    if (settings.footerBannerImage !== undefined)
      payload.footer_banner_image = settings.footerBannerImage;
    if (settings.footerBannerLink !== undefined)
      payload.footer_banner_link = settings.footerBannerLink;

    if (settings.onboardingSettings !== undefined) {
      payload.onboarding_settings = settings.onboardingSettings;
    }

    if (settings.heroBanners !== undefined || settings.banners !== undefined) {
      // Because we fetch both and split them, if either is undefined, 
      // we must get the existing ones... wait, this is tricky if they do partial updates.
      // updatePlatformSettings is usually called with the WHOLE settings object in PlatformAdmin.
      // So we can assume both are present if either is.
      const rawBanners = [
        ...(settings.heroBanners || []).map(b => ({ ...b, location: "hero" })),
        ...(settings.banners || []).map(b => ({ ...b, location: "general" })),
      ];
      payload.banners = rawBanners;
    }
    
    if (settings.bannerAnimationSpeed !== undefined)
      payload.banner_animation_speed = settings.bannerAnimationSpeed;
    if (settings.featuredRestaurantsLimit !== undefined)
      payload.featured_restaurants_limit = settings.featuredRestaurantsLimit;
    if (settings.foodCategories !== undefined)
      payload.food_categories = settings.foodCategories;
    if (settings.businessCategories !== undefined) {
      payload.payment_gateways.businessCategories = settings.businessCategories;
      payload.business_categories = settings.businessCategories;
    }

    if (settings.referralSettings !== undefined) {
      payload.payment_gateways.referralSettings = settings.referralSettings;
    }
    if (settings.gamificationSettings !== undefined) {
      payload.payment_gateways.gamificationSettings = settings.gamificationSettings;
      payload.gamification_settings = settings.gamificationSettings;
    }

    const { error } = await supabase.from("platform_settings").upsert(payload);
    if (error) {
      console.error("Error updating platform settings:", error);
      return { error };
    }
    return { error: null };
  },

  syncBusinessCategories: async (categories?: BusinessCategory[]): Promise<{ data: BusinessCategory[]; error: any }> => {
    try {
      if (categories && Array.isArray(categories) && categories.length > 0) {
        const updateRes = await db.updatePlatformSettings({ businessCategories: categories });
        if (updateRes.error) throw updateRes.error;
      }
      const refreshedSettings = await db.getPlatformSettings();
      return { 
        data: refreshedSettings.businessCategories || defaultSettings.businessCategories, 
        error: null 
      };
    } catch (err: any) {
      console.error("Error in syncBusinessCategories:", err);
      return { data: defaultSettings.businessCategories, error: err };
    }
  },

  getAppUser: async (id: string): Promise<AppUser | null> => {
    const { data, error } = await supabase
      .from("app_users")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id,
      email: data.email,
      role: data.role,
      status: data.status,
      createdAt: data.created_at,
      displayName: data.display_name,
      phone: data.phone,
      birthDate: data.birth_date,
      anniversaries: data.extra_anniversaries || [],
      age: data.age,
      avatarUrl: data.avatar_url,
      addresses: data.addresses || [],
      profileCompleted: (data.email?.includes('@smartbite.guest.com') || data.email?.startsWith('guest_') || data.is_guest === true) ? true : (data.profile_completed || false),
      isGuest: Boolean(data.email?.includes('@smartbite.guest.com') || data.email?.startsWith('guest_') || data.is_guest === true),
      referralCode: data.referral_code,
      referredBy: data.referred_by,
      referralBalance: data.referral_balance || 0,
      maxReferralInvites: data.max_referral_invites || 20,
      maxRestaurantAffiliations: data.max_restaurant_affiliations || 5,
    };
  },

  getAppUsers: async (): Promise<AppUser[]> => {
    try {
      console.log("db.getAppUsers: Fetching from Supabase...");
      const { data, error, status } = await supabase
        .from("app_users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(
          "db.getAppUsers: Supabase error:",
          error,
          "Status:",
          status,
        );
        return [];
      }

      if (!data || data.length === 0) {
        console.warn(
          "db.getAppUsers: No users found in table app_users. Status:",
          status,
        );
        return [];
      }

      console.log("db.getAppUsers: Success, found", data.length, "users");
      return data.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        status: u.status,
        createdAt: u.created_at,
        displayName: u.display_name,
        phone: u.phone,
        birthDate: u.birth_date,
        anniversaries: u.extra_anniversaries || [],
        age: u.age,
        avatarUrl: u.avatar_url,
        addresses: u.addresses || [],
        profileCompleted: u.profile_completed || false,
        referralCode: u.referral_code,
        referredBy: u.referred_by,
        referralBalance: u.referral_balance || 0,
        maxReferralInvites: u.max_referral_invites || 20,
      }));
    } catch (err) {
      console.error("db.getAppUsers: Unexpected error:", err);
      return [];
    }
  },

  updateAppUser: async (id: string, updates: Partial<AppUser>) => {
    const payload: any = {};
    if (updates.role) payload.role = updates.role;
    if (updates.status) payload.status = updates.status;
    if (updates.displayName !== undefined)
      payload.display_name = updates.displayName;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.addresses !== undefined) payload.addresses = updates.addresses;
    if (updates.birthDate !== undefined) payload.birth_date = updates.birthDate;
    if (updates.anniversaries !== undefined)
      payload.extra_anniversaries = updates.anniversaries;
    if (updates.age !== undefined) payload.age = updates.age;
    if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;
    if (updates.profileCompleted !== undefined) payload.profile_completed = updates.profileCompleted;
    if (updates.referralCode !== undefined) payload.referral_code = updates.referralCode;
    if (updates.referredBy !== undefined) payload.referred_by = updates.referredBy;
    if (updates.referralBalance !== undefined) payload.referral_balance = updates.referralBalance;
    if (updates.maxReferralInvites !== undefined) payload.max_referral_invites = updates.maxReferralInvites;
    if (updates.maxRestaurantAffiliations !== undefined) payload.max_restaurant_affiliations = updates.maxRestaurantAffiliations;

    console.log("db: Updating app_user with payload:", payload);
    const { data, error, status, statusText } = await supabase
      .from("app_users")
      .update(payload)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("db: Error updating app_user:", error);
      return { error };
    }

    if (!data) {
      console.error(
        "db: No user updated. Status:",
        status,
        statusText,
        "ID:",
        id,
      );
      // If we got 200/204 but no data, it's usually RLS or row not found
      return {
        error: new Error(
          `No se pudo actualizar el usuario (Status: ${status}). Verifica que tu perfil exista y tengas permisos.`,
        ),
      };
    }

    console.log("db: Update successful, returned data:", data);
    return { data, error: null };
  },

  deleteAppUser: async (id: string) => {
    console.log(`db.deleteAppUser: Calling backend to delete user ${id}...`);
    
    // Call backend API to delete from auth.users, app_users, and restaurants via Service Role
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        let errorData: any = {};
        try {
           errorData = await response.json();
        } catch(e) {}
        console.warn(`db.deleteAppUser: Non-OK response from backend: ${response.status}`, errorData);
        return { error: errorData.error || new Error(`Status ${response.status}`) };
      }
      return { error: null };
    } catch (apiErr) {
      console.error("db.deleteAppUser: Error calling delete user API:", apiErr);
      return { error: apiErr };
    }
  },

  getRestaurants: async (): Promise<Restaurant[]> => {
    console.log("db.getRestaurants: Fetching all restaurants...", import.meta.env.VITE_SUPABASE_URL);
    const { data, error, status } = await supabase.from("restaurants").select("*, wheel_configs(is_active)");
    
    if (error) {
      if (status !== 0 && !error.message?.includes('Failed to fetch')) {
        console.error(`db.getRestaurants: Error [${status}]:`, error.message, error.details);
      } else {
        console.warn(`db.getRestaurants: Network issue or missing Supabase backend. Returning empty data.`);
      }
      return [];
    }
    
    if (!data || data.length === 0) {
      console.warn("db.getRestaurants: No restaurants found in the database. Check RLS or filters.");
      return [];
    }

    console.log(`db.getRestaurants: Success. Found ${data.length} restaurants.`);
    return data.map((r: any) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      description: r.description,
      logo: formatImageUrl(r.logo),
      coverImage: formatImageUrl(r.cover_image),
      phone: r.phone,
      address: r.address,
      department: r.department,
      city: r.city,
      businessType: r.business_type,
      businessCategory: normalizeBusinessCategory(r.payment_gateways?.businessCategory || r.business_category, r.type, r.name, r.description),
      handlesPromotions: r.handles_promotions,
      hasDelivery: r.has_delivery,
      deliveryFee: r.delivery_fee,
      openingHours: r.opening_hours,
      detailedHours: r.detailed_hours,
      whatsappNumber: r.whatsapp_number,
      anniversaryProgramEnabled: r.anniversary_program_enabled,
      loyaltyPointsPerDollar: r.loyalty_points_per_dollar,
      loyaltyEnabled: r.loyalty_enabled,
      referralEnabled: r.referral_enabled,
      referralCommissionType: r.referral_commission_type,
      referralCommissionValue: r.referral_commission_value,
      generalDiscount: r.general_discount,
      generalDiscountEnabled: r.general_discount_enabled,
      luckyWheelEnabled: Array.isArray(r.wheel_configs) ? r.wheel_configs[0]?.is_active : (r.wheel_configs as any)?.is_active,
      gamificationEnabled: r.gamification_enabled === true || r.payment_gateways?.gamificationEnabled === true,
      status: r.status,
      isFeatured: r.is_featured,
      rating: r.rating || 0,
      reviewsCount: r.reviews_count || 0,
      commissionRate: r.commission_rate || 5,
      highlightMessage: r.highlight_message || "",
      ownerId: r.owner_id,
      banners: r.banners || [],
      tables: r.tables || [],
      latitude: r.latitude,
      longitude: r.longitude,
      paymentGateways: r.payment_gateways,
      aiKnowledge: r.ai_knowledge || {
        instructions: "",
        openingHours: "",
        allergens: "",
        popularDishes: "",
        peakHours: "",
        foodTypes: "",
        promotions: "",
        coupons: "",
        marketingHistory: [],
      },
      menu: [],
    }));
  },

  getRestaurantByOwner: async (ownerId: string): Promise<Restaurant | null> => {
    console.log("db.getRestaurantByOwner: Fetching for owner", ownerId);
    const { data, error, status, statusText } = await supabase
      .from("restaurants")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(
        "db.getRestaurantByOwner: Supabase Error:",
        error,
        "Status:",
        status,
        statusText
      );
      return null;
    }

    console.log("db.getRestaurantByOwner: Query completed. Status:", status, "Rows found:", data?.length);

    if (!data || data.length === 0) {
      console.warn(
        "db.getRestaurantByOwner: No rows returned for owner",
        ownerId
      );
      return null;
    }

    // Use the first (most recent) restaurant found
    const restaurant = data[0];
    console.log("db.getRestaurantByOwner: Successfully found restaurant", restaurant.id);

    return {
      id: restaurant.id,
      name: restaurant.name,
      type: restaurant.type,
      description: restaurant.description,
      logo: formatImageUrl(restaurant.logo),
      coverImage: formatImageUrl(restaurant.cover_image),
      phone: restaurant.phone,
      address: restaurant.address,
      department: restaurant.department,
      city: restaurant.city,
      businessType: restaurant.business_type,
      businessCategory: normalizeBusinessCategory(restaurant.payment_gateways?.businessCategory || restaurant.business_category, restaurant.type, restaurant.name, restaurant.description),
      handlesPromotions: restaurant.handles_promotions,
      hasDelivery: restaurant.has_delivery,
      deliveryFee: restaurant.delivery_fee,
      openingHours: restaurant.opening_hours,
      detailedHours: restaurant.detailed_hours,
      whatsappNumber: restaurant.whatsapp_number,
      anniversaryProgramEnabled: restaurant.anniversary_program_enabled,
      loyaltyPointsPerDollar: restaurant.loyalty_points_per_dollar,
      ownerId: restaurant.owner_id,
      loyaltyEnabled: restaurant.loyalty_enabled,
      referralEnabled: restaurant.referral_enabled,
      referralCommissionType: restaurant.referral_commission_type,
      referralCommissionValue: restaurant.referral_commission_value,
      generalDiscount: restaurant.general_discount,
      generalDiscountEnabled: restaurant.general_discount_enabled,
      luckyWheelEnabled: Array.isArray(restaurant.wheel_configs)
        ? restaurant.wheel_configs[0]?.is_active
        : (restaurant.wheel_configs as any)?.is_active,
      gamificationEnabled:
        restaurant.gamification_enabled === true ||
        restaurant.payment_gateways?.gamificationEnabled === true,
      commissionRate: restaurant.commission_rate || 5,
      highlightMessage: restaurant.highlight_message || "",
      banners: restaurant.banners || [],
      tables: restaurant.tables || [],
      paymentGateways: restaurant.payment_gateways,
      aiKnowledge: restaurant.ai_knowledge || {
        instructions: "",
        openingHours: "",
        allergens: "",
        popularDishes: "",
        peakHours: "",
        foodTypes: "",
        promotions: "",
        coupons: "",
        marketingHistory: [],
      },
      menu: [],
    };
  },

  getRestaurant: async (id: string): Promise<Restaurant | null> => {
    console.log("db.getRestaurant: Fetching restaurant with ID:", id);

    // Basic UUID format check to avoid Supabase 400 errors
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.warn("db.getRestaurant: Invalid UUID format:", id);
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*, wheel_configs(is_active)")
        .eq("id", id)
        .maybeSingle();
      if (error) {
        console.error("db.getRestaurant: Error fetching restaurant:", error);
        return null;
      }
      if (!data) {
        console.log("db.getRestaurant: No restaurant found with ID:", id);
        return null;
      }

      console.log("db.getRestaurant: Restaurant found:", data.name);
      return {
        id: data.id,
        name: data.name,
        type: data.type,
        description: data.description,
        logo: formatImageUrl(data.logo),
        coverImage: formatImageUrl(data.cover_image),
        phone: data.phone,
        address: data.address,
        department: data.department,
        city: data.city,
        businessType: data.business_type,
        businessCategory: normalizeBusinessCategory(data.payment_gateways?.businessCategory || data.business_category, data.type, data.name, data.description),
        handlesPromotions: data.handles_promotions,
        hasDelivery: data.has_delivery,
        deliveryFee: data.delivery_fee,
        openingHours: data.opening_hours,
        detailedHours: data.detailed_hours,
        whatsappNumber: data.whatsapp_number,
        anniversaryProgramEnabled: data.anniversary_program_enabled,
        loyaltyPointsPerDollar: data.loyalty_points_per_dollar,
        ownerId: data.owner_id,
        loyaltyEnabled: data.loyalty_enabled,
        referralEnabled: data.referral_enabled,
        referralCommissionType: data.referral_commission_type,
        referralCommissionValue: data.referral_commission_value,
        generalDiscount: data.general_discount,
        generalDiscountEnabled: data.general_discount_enabled,
        luckyWheelEnabled: Array.isArray((data as any).wheel_configs) ? (data as any).wheel_configs[0]?.is_active : ((data as any).wheel_configs as any)?.is_active,
        gamificationEnabled: data.gamification_enabled === true || data.payment_gateways?.gamificationEnabled === true,
        commissionRate: data.commission_rate || 5,
        highlightMessage: data.highlight_message || "",
        banners: data.banners || [],
        tables: data.tables || [],
        paymentGateways: data.payment_gateways,
        aiKnowledge: data.ai_knowledge || {
          instructions: "",
          openingHours: "",
          allergens: "",
          popularDishes: "",
          peakHours: "",
          foodTypes: "",
          promotions: "",
          coupons: "",
          marketingHistory: [],
        },
        menu: [],
      };
    } catch (e) {
      console.error("db.getRestaurant: Unexpected error:", e);
      return null;
    }
  },

  getRestaurantMenu: async (restaurantId: string): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("restaurant_id", restaurantId);
    if (error) return [];

    return data.map((p) => {
      const desc = p.description || "";
      let pointsMultiplier = p.points_multiplier || 1;
      let cleanDesc = desc;
      const match = desc.match(/__multiplier::(\d+)__/);
      if (match) {
        if (pointsMultiplier === 1) pointsMultiplier = parseInt(match[1]) || 1;
        cleanDesc = desc.replace(/__multiplier::(\d+)__/, "").trim();
      }

      return {
        id: p.id,
        name: p.name,
        description: cleanDesc,
        price: p.price,
        category: p.category,
        categoryId: p.category_id,
        images: (p.images || []).map((img: string) => formatImageUrl(img)),
        available: p.available,
        hasDiscount: p.has_discount,
        discountPercentage: p.discount_percentage,
        discountPrice: p.discount_price,
        isPromotion: p.is_promotion,
        isPartOfCombo: p.is_part_of_combo,
        recommendedProductIds: p.recommended_product_ids || [],
        restaurantId: p.restaurant_id || restaurantId,
        pointsMultiplier,
      };
    });
  },

  getPopularProducts: async (limit: number = 10): Promise<(Product & { restaurantId: string; restaurantName: string })[]> => {
    try {
      const { data, error } = await supabase.from("products").select(`
        *,
        restaurants (
          id,
          name,
          status
        )
      `)
      .eq('available', true)
      .limit(50); // Fetch a small pool to randomize from

      if (error) return [];

      const filtered = (data || [])
        .filter((p: any) => p.restaurants?.status === 'active')
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          category: p.category,
          images: (p.images || []).map((img: string) => formatImageUrl(img)),
          available: p.available,
          hasDiscount: p.has_discount,
          discountPercentage: p.discount_percentage,
          discountPrice: p.discount_price,
          isPromotion: p.is_promotion,
          isPartOfCombo: p.is_part_of_combo,
          restaurantId: p.restaurants?.id || "",
          restaurantName: p.restaurants?.name || "",
          pointsMultiplier: p.points_multiplier || 1,
        }));

      return filtered.sort(() => Math.random() - 0.5).slice(0, limit);
    } catch (e) {
      return [];
    }
  },

  getAllProducts: async (): Promise<
    (Product & { restaurantId: string; restaurantName: string })[]
  > => {
    const { data, error } = await supabase.from("products").select(`
      *,
      restaurants (
        id,
        name
      )
    `).limit(2000);
    if (error) return [];

    return data.map((p) => {
      const desc = p.description || "";
      let pointsMultiplier = p.points_multiplier || 1;
      let cleanDesc = desc;
      const match = desc.match(/__multiplier::(\d+)__/);
      if (match) {
        if (pointsMultiplier === 1) pointsMultiplier = parseInt(match[1]) || 1;
        cleanDesc = desc.replace(/__multiplier::(\d+)__/, "").trim();
      }

      return {
        id: p.id,
        name: p.name,
        description: cleanDesc,
        price: p.price,
        category: p.category,
        images: (p.images || []).map((img: string) => formatImageUrl(img)),
        available: p.available,
        hasDiscount: p.has_discount,
        discountPercentage: p.discount_percentage,
        discountPrice: p.discount_price,
        isPromotion: p.is_promotion,
        isPartOfCombo: p.is_part_of_combo,
        restaurantId: p.restaurants?.id || "",
        restaurantName: p.restaurants?.name || "",
        pointsMultiplier,
      };
    });
  },

  saveRestaurant: async (
    restaurant: Omit<Restaurant, "menu">,
    ownerId?: string,
  ) => {
    console.log("db.saveRestaurant: Starting...", { restaurant, ownerId });
    const payload: any = {
      status: restaurant.status || "inactive",
      name: restaurant.name,
      type: restaurant.type,
      description: restaurant.description,
      logo: restaurant.logo,
      cover_image: restaurant.coverImage,
      phone: restaurant.phone,
      address: restaurant.address,
      department: restaurant.department,
      city: restaurant.city,
      business_type: restaurant.businessType,
      business_category: restaurant.businessCategory,
      handles_promotions: restaurant.handlesPromotions,
      has_delivery: restaurant.hasDelivery,
      delivery_fee: restaurant.deliveryFee || 0,
      opening_hours: restaurant.openingHours || "",
      detailed_hours: restaurant.detailedHours,
      whatsapp_number: restaurant.whatsappNumber,
      highlight_message: restaurant.highlightMessage || "",
      banners: restaurant.banners || [],
      tables: restaurant.tables || [],
      ai_knowledge: restaurant.aiKnowledge,
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
      anniversary_program_enabled: restaurant.anniversaryProgramEnabled,
      referral_enabled: restaurant.referralEnabled,
      referral_commission_type: restaurant.referralCommissionType,
      referral_commission_value: restaurant.referralCommissionValue,
      general_discount: restaurant.generalDiscount,
      general_discount_enabled: restaurant.generalDiscountEnabled,
    };

    if (restaurant.id && restaurant.id !== "") {
      payload.id = restaurant.id;
    }

    if (ownerId) {
      payload.owner_id = ownerId;
    }

    console.log("db.saveRestaurant: Payload prepared", payload);

    if (payload.business_category) {
      if (!payload.payment_gateways) {
        payload.payment_gateways = restaurant.paymentGateways || {};
      }
      payload.payment_gateways.businessCategory = payload.business_category;
      delete payload.business_category;
    }

    // If it's a new restaurant, use upsert on owner_id to avoid conflicts with the trigger.
    // If it has an ID, use update.
    let query;
    if (payload.id) {
      console.log("db.saveRestaurant: Updating existing restaurant by ID");
      query = supabase.from("restaurants").update(payload).eq("id", payload.id);
    } else if (payload.owner_id) {
      console.log("db.saveRestaurant: Upserting restaurant by owner_id");
      query = supabase
        .from("restaurants")
        .upsert(payload, { onConflict: "owner_id" });
    } else {
      console.log("db.saveRestaurant: Inserting new restaurant");
      query = supabase.from("restaurants").insert(payload);
    }

    const { data, error } = await query.select().maybeSingle();

    if (error) {
      console.error("db.saveRestaurant: Error:", error);
    } else {
      console.log("db.saveRestaurant: Success", data);
      
      if (!payload.id && data) { // New restaurant created
        // Check if a subscription exists
        const { data: existingSub } = await supabase.from('restaurant_subscriptions').select('id').eq('restaurant_id', data.id).maybeSingle();
        if (!existingSub) {
           // Assign default plan (prefer free plan)
           let { data: defaultPlan } = await supabase.from('plans').select('id').eq('type', 'free').maybeSingle();
           
           if (!defaultPlan) {
              // Fallback: look for plan with name containing 'gratis' or 'free'
              const { data: gratisPlan } = await supabase.from('plans').select('id').ilike('name', '%gratis%').maybeSingle();
              defaultPlan = gratisPlan;
           }

           if (!defaultPlan) {
              // Fallback to old is_default logic if no free plan explicitly found
              const { data: fallbackPlan } = await supabase.from('plans').select('id').eq('is_default', true).maybeSingle();
              defaultPlan = fallbackPlan;
           }

           if (!defaultPlan) {
              // Still not found, look for any plan
              const { data: anyPlan } = await supabase.from('plans').select('id').limit(1).maybeSingle();
              defaultPlan = anyPlan;
           }

           if (!defaultPlan) {
              // Create a default free plan if absolutely none exists
              const { data: insertedPlan, error: insertError } = await supabase.from('plans').insert({
                 name: 'Plan Gratis (30 Días)',
                 description: 'Acceso gratuito a la plataforma por 30 días.',
                 price: 0,
                 type: 'free',
                 commission_percentage: 0,
                 billing_cycle: 'monthly',
                 features: {
                    max_categories: 10,
                    max_products: 100,
                    max_orders_per_month: 200,
                    allow_loyalty: true,
                    allow_coupons: true,
                    allow_pos: true,
                    allow_roulette: true,
                    allow_points_rewards: true,
                    allow_gamification: true,
                    allow_referrals: true,
                    allow_qr_menu: true,
                    allow_waiter_call: true,
                    allow_ai_assistant: true,
                    allow_own_drivers: true,
                    allow_marketing: true
                 },
                 is_active: true,
                 is_default: true
              }).select().maybeSingle();
              if (!insertError && insertedPlan) {
                 defaultPlan = insertedPlan;
              }
           }

           if (defaultPlan) {
              const now = new Date();
              const nextMonth = new Date();
              nextMonth.setDate(now.getDate() + 30); // Exactly 30 days as requested!
              
              await supabase.from('restaurant_subscriptions').insert({
                 restaurant_id: data.id,
                 plan_id: defaultPlan.id,
                 status: 'active',
                 current_period_start: now.toISOString(),
                 current_period_end: nextMonth.toISOString(),
              });
           }
        }
      }
    }

    return { data, error };
  },

  saveProduct: async (product: Product, restaurantId: string) => {
    const isNew =
      !product.id || product.id.startsWith("p") || product.id === "";
    
    let finalDescription = product.description || "";
    if (product.pointsMultiplier && product.pointsMultiplier > 1) {
      finalDescription = finalDescription.replace(/__multiplier::(\d+)__/, "").trim();
      finalDescription = `${finalDescription} __multiplier::${product.pointsMultiplier}__`.trim();
    } else {
      finalDescription = finalDescription.replace(/__multiplier::(\d+)__/, "").trim();
    }

    const { data, error } = await supabase
      .from("products")
      .upsert({
        id: isNew ? undefined : product.id,
        restaurant_id: restaurantId,
        name: product.name,
        description: finalDescription,
        price: product.price,
        category: product.category,
        category_id: product.categoryId || null,
        images: product.images,
        available: product.available,
        has_discount: product.hasDiscount,
        discount_percentage: product.discountPercentage,
        discount_price: product.discountPrice,
        is_promotion: product.isPromotion,
        is_part_of_combo: product.isPartOfCombo,
        recommended_product_ids: product.recommendedProductIds || [],
        points_multiplier: product.pointsMultiplier || 1,
      })
      .select()
      .single();
    return { data, error };
  },

  uploadAudio: async (
    file: File,
    path: string,
    onProgress?: (progress: number) => void
  ): Promise<{ url: string | null; error: any }> => {
    console.log("db.uploadAudio: Starting upload for", file.name, "size:", file.size);
    try {
      const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunk size for better reliability with large files
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      console.log("db.uploadAudio: Total chunks:", totalChunks);
      const uploadId = Math.random().toString(36).substring(7);
      
      let finalUrl = null;

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append("chunk", chunk, file.name || "chunk.mp3");
        formData.append("uploadId", uploadId);
        formData.append("chunkIndex", i.toString());
        formData.append("totalChunks", totalChunks.toString());
        formData.append("fileName", file.name);
        formData.append("mimeType", file.type || "audio/mpeg");
        formData.append("path", path);

        let retryCount = 0;
        let chunkRes = null;
        
        console.log(`db.uploadAudio: Sending chunk ${i + 1}/${totalChunks}...`);
        
        while (retryCount < 3) {
          try {
            chunkRes = await fetch("/api/upload-chunk", {
              method: "POST",
              body: formData
            });
            if (chunkRes.ok) break;
          } catch (err) {
            console.warn(`Chunk ${i} upload attempt ${retryCount + 1} failed:`, err);
          }
          retryCount++;
          if (retryCount < 3) await new Promise(r => setTimeout(r, 1000 * retryCount));
        }

        if (!chunkRes || !chunkRes.ok) {
          const errorData = chunkRes ? await chunkRes.json().catch(() => ({})) : { error: "No response from server" };
          throw new Error(errorData.error || `Upload failed for chunk ${i} after 3 attempts`);
        }

        const data = await chunkRes.json();
        if (data.url) {
          finalUrl = data.url;
        }

        // Report progress
        if (onProgress) {
          const percent = Math.round(((i + 1) / totalChunks) * 100);
          onProgress(percent);
        }
      }

      return { url: finalUrl, error: null };
    } catch (err: any) {
      console.error("Audio upload error:", err.message || err);
      return { url: null, error: err };
    }
  },

  uploadImage: async (
    file: File,
    path: string,
  ): Promise<{ url: string | null; error: any }> => {
    const bucketName = "restaurant-assets";

    // Helper function to compress and convert to base64 as fallback
    const getBase64Fallback = (file: File): Promise<string> => {
      const isImage = file.type.startsWith('image/');
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        // If it's not an image, is a PNG, or is a cropped file, return the lossless raw base64 data URL directly
        if (!isImage || file.type === 'image/png' || file.name.startsWith('crop_')) {
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
          return;
        }

        reader.readAsDataURL(file);
        reader.onload = () => {
          const img = new Image();
          img.src = reader.result as string;
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 600;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.7));
          };
        };
        reader.onerror = (error) => reject(error);
      });
    };

    try {
      const fileExt = file.name.split(".").pop() || "jpg";
      const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${path}/${fileName}`;

      // Try to upload to Supabase Storage natively
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          contentType: file.type || "image/jpeg",
          upsert: true
        });

      if (uploadError) {
        // If bucket not found or other storage error, use base64 fallback
        console.warn(
          "Storage upload failed, using base64 fallback:",
          uploadError.message,
        );
        const base64 = await getBase64Fallback(file);
        return { url: base64, error: null };
      }

      const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);

      return { url: formatImageUrl(data.publicUrl), error: null };
    } catch (err) {
      console.error("Upload process error, trying base64 fallback:", err);
      try {
        const base64 = await getBase64Fallback(file);
        return { url: base64, error: null };
      } catch (fallbackErr) {
        return { url: null, error: fallbackErr };
      }
    }
  },

  deleteProduct: async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    return { error };
  },

  getWheelConfig: async (restaurantId: string): Promise<WheelConfig | null> => {
    try {
      if (restaurantId === "global_ruleta_pay" || restaurantId === "00000000-0000-0000-0000-000000000000") {
        const settings = await db.getPlatformSettings();
        const rp = (settings.gamificationSettings as any)?.ruletaPay;
        if (rp) {
          return {
            id: "global_ruleta_pay",
            restaurantId: "global_ruleta_pay",
            isActive: rp.isActive ?? true,
            minOrderAmount: rp.minOrderAmount ?? 100,
            countdownSeconds: rp.countdownSeconds ?? 0,
            spinDuration: rp.spinDuration ?? 4,
            segments: rp.segments || [],
            createdAt: new Date().toISOString(),
          };
        }
        return null;
      }

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(restaurantId);
      if (!isUuid) {
        console.warn(`getWheelConfig: Invalid UUID restaurantId "${restaurantId}". Returning null.`);
        return null;
      }

      const { data, error } = await supabase
        .from("wheel_configs")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        restaurantId: data.restaurant_id,
        isActive: data.is_active,
        minOrderAmount: parseFloat(data.min_order_amount),
        countdownSeconds: data.countdown_seconds,
        spinDuration: data.spin_duration || 5,
        segments: data.segments || [],
        createdAt: data.created_at,
      };
    } catch (e) {
      console.error("Error fetching wheel config:", e);
      return null;
    }
  },

  saveWheelConfig: async (config: Partial<WheelConfig> & { restaurantId: string }) => {
    console.log("Saving wheel config:", config);
    if (config.restaurantId === "global_ruleta_pay" || config.restaurantId === "00000000-0000-0000-0000-000000000000") {
      const settings = await db.getPlatformSettings();
      const currentGamification = settings.gamificationSettings || {};
      const updatedGamification = {
        ...currentGamification,
        ruletaPay: {
          isActive: config.isActive ?? true,
          minOrderAmount: config.minOrderAmount ?? 100,
          countdownSeconds: config.countdownSeconds ?? 0,
          spinDuration: config.spinDuration ?? 4,
          segments: config.segments || [],
        }
      };
      await db.updatePlatformSettings({ gamificationSettings: updatedGamification });
      return { id: "global_ruleta_pay", ...config } as any;
    }

    const payload: any = {
      restaurant_id: config.restaurantId,
    };

    if (config.isActive !== undefined) payload.is_active = config.isActive;
    if (config.minOrderAmount !== undefined) payload.min_order_amount = config.minOrderAmount;
    if (config.countdownSeconds !== undefined) payload.countdown_seconds = config.countdownSeconds;
    if (config.spinDuration !== undefined) payload.spin_duration = config.spinDuration;
    if (config.segments !== undefined) payload.segments = config.segments;

    const { data, error } = await supabase
      .from("wheel_configs")
      .upsert(payload, { onConflict: "restaurant_id" })
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error saving wheel config:", error);
      throw new Error(error.message || "Error saving wheel configuration");
    }
    return data;
  },

  saveWheelPrize: async (prize: Omit<WheelPrize, "id" | "createdAt">) => {
    const { data, error } = await supabase
      .from("wheel_prizes")
      .insert({
        user_id: prize.userId,
        restaurant_id: prize.restaurantId,
        prize_text: prize.prizeText,
        is_prize: prize.isPrize,
        status: prize.status,
      })
      .select()
      .maybeSingle();

    if (!error && prize.isPrize !== false) {
      /*
      // Notify the user
      db.saveNotification({
        userId: prize.userId,
        title: "¡Has ganado un premio! 🎡",
        body: `Felicidades, ganaste: ${prize.prizeText}. Reclámalo en tu próximo pedido.`,
        type: "wheel_prize"
      }).catch(err => console.error("Error sending wheel notification", err));
      */
    }

    return { data, error };
  },

  addPrizeToOrder: async (orderId: string, prize: any) => {
    const { data: order } = await supabase
      .from("orders")
      .select("items")
      .eq("id", orderId)
      .maybeSingle();

    if (order && order.items) {
      const isRealPrize = prize.is_prize !== false && prize.isPrize !== false;
      const newItem = {
        product: {
          id: 'prize-' + prize.id,
          name: (isRealPrize ? '🎁 Giro de la ruleta: Ganó un premio (' : '💬 Giro de la ruleta: Mensaje (') + (prize.prize_text || prize.prizeText) + ')',
          description: isRealPrize ? 'Premio ganado en la ruleta' : 'Mensaje de la ruleta',
          price: 0,
          image: '',
          categoryId: 'prize',
          restaurantId: prize.restaurant_id || prize.restaurantId,
          isActive: true,
          type: 'prize'
        },
        quantity: 1
      };
      
      const updatedItems = [...(order.items as any[]), newItem];
      
      const { data: updatedOrder, error: updateError } = await supabase
        .from("orders")
        .update({ items: updatedItems })
        .eq("id", orderId)
        .select()
        .maybeSingle();
        
      if (updateError) {
        console.error("Error adding prize to order:", updateError);
      } else if (!updatedOrder) {
        console.error("addPrizeToOrder: Update succeeded but returned no rows! RLS might be blocking the UPDATE for orderId", orderId);
      } else {
        console.log("Prize added to order successfully:", updatedOrder);
      }
      
      return { data: updatedOrder, error: updateError };
    } else {
      console.error("Could not find order or items array block: ", order);
    }
  },

  getRestaurantWheelPrizes: async (restaurantId: string): Promise<WheelPrize[]> => {
    const { data: prizes, error } = await supabase
      .from("wheel_prizes")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (error || !prizes) return [];

    // Optimize user fetching by only picking unique IDs
    const userIds = [...new Set(prizes.map((p) => p.user_id).filter(Boolean))];
    let usersData: any[] = [];
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("app_users")
        .select("id, display_name, email, phone")
        .in("id", userIds);
      if (users) usersData = users;
    }

    const userMap = new Map(usersData.map((u) => [u.id, u]));

    return prizes.map((d: any) => {
      const user = userMap.get(d.user_id);
      return {
        id: d.id,
        userId: d.user_id,
        userName: user?.display_name || user?.email,
        userPhone: user?.phone,
        restaurantId: d.restaurant_id,
        prizeText: d.prize_text,
        isPrize: d.is_prize,
        status: d.status,
        createdAt: d.created_at,
      };
    });
  },

  getAllPlatformWheelPrizes: async (): Promise<WheelPrize[]> => {
    const { data: prizes, error } = await supabase
      .from("wheel_prizes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !prizes) return [];

    const userIds = [...new Set(prizes.map((p) => p.user_id).filter(Boolean))];
    let usersData: any[] = [];
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("app_users")
        .select("id, display_name, email, phone")
        .in("id", userIds);
      if (users) usersData = users;
    }

    const userMap = new Map(usersData.map((u) => [u.id, u]));

    return prizes.map((d: any) => {
      const user = userMap.get(d.user_id);
      return {
        id: d.id,
        userId: d.user_id,
        userName: user?.display_name || user?.email || "Usuario de la App",
        userPhone: user?.phone,
        restaurantId: d.restaurant_id,
        restaurantName: d.restaurant_name || "Bite Club",
        prizeText: d.prize_text,
        isPrize: d.is_prize,
        status: d.status,
        createdAt: d.created_at,
      };
    });
  },

  subscribeToWheelPrizes: (restaurantId: string, callback: (prizes: WheelPrize[]) => void) => {
    const subscription = supabase
      .channel(`wheel-prizes-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wheel_prizes",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        async () => {
          const prizes = await db.getRestaurantWheelPrizes(restaurantId);
          callback(prizes);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  },

  getUserWheelPrizes: async (userId: string): Promise<WheelPrize[]> => {
    const { data: prizes, error } = await supabase
      .from("wheel_prizes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !prizes) return [];

    const restaurantIds = [...new Set(prizes.map((p) => p.restaurant_id).filter(Boolean))];
    let restaurantsData: any[] = [];
    if (restaurantIds.length > 0) {
      const { data: restaurants } = await supabase
        .from("restaurants")
        .select("id, name")
        .in("id", restaurantIds);
      if (restaurants) restaurantsData = restaurants;
    }

    const restaurantMap = new Map(restaurantsData.map((r) => [r.id, r]));

    return prizes.map((d: any) => {
      const restaurant = restaurantMap.get(d.restaurant_id);
      return {
        id: d.id,
        userId: d.user_id,
        restaurantId: d.restaurant_id,
        prizeText: d.prize_text,
        isPrize: d.is_prize,
        status: d.status,
        createdAt: d.created_at,
        restaurantName: restaurant?.name
      };
    });
  },

  updateWheelPrizeStatus: async (prizeId: string, status: "pending" | "delivered") => {
    const { data, error } = await supabase
      .from("wheel_prizes")
      .update({ status })
      .eq("id", prizeId)
      .select()
      .maybeSingle();

    /*
    if (!error && status === "delivered" && data?.user_id) {
      await db.saveNotification({
        userId: data.user_id,
        title: "Premio Entregado ✅",
        body: `Tu premio "${data.prize_text}" ha sido marcado como entregado. ¡Esperamos que lo disfrutes!`,
        type: "wheel_prize_delivered"
      }).catch(err => console.warn("Error notifying prize delivery", err));
    }
    */

    return { data, error };
  },

  deleteDeliveredWheelPrizes: async (restaurantId: string) => {
    try {
      const response = await fetch(`/api/wheel_prizes/delivered/${restaurantId}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        throw new Error("Failed to delete prizes");
      }
      return { error: null };
    } catch (error: any) {
      console.error("Error deleting delivered prizes:", error);
      return { error };
    }
  },

  saveOrder: async (order: Omit<Order, "id" | "createdAt" | "paymentStatus"> & { paymentStatus?: string }) => {
    // 1. Insert the order
    const { data, error } = await supabase
      .from("orders")
      .insert({
        restaurant_id: order.restaurantId,
        customer_id: order.customerId,
        customer_type: order.customerType || (order.customerId ? 'registered' : 'guest'),
        customer_name: order.customerName,
        items: order.items,
        total: order.total,
        status: order.status,
        driver_id: order.driverId,
        payment_method: order.paymentMethod || "cash",
        payment_status: order.paymentStatus || "pending",
        delivery_lat: order.deliveryLat,
        delivery_lng: order.deliveryLng,
        table_number: order.tableNumber,
        is_waiter_called: order.isWaiterCalled,
        tip_amount: order.tipAmount || 0,
        tip_percentage: order.tipPercentage || 0,
        tip_type: order.tipType || "none",
        customer_phone: order.customerPhone,
        recipient_name: order.recipientName,
        address: order.address,
        note: order.couponCode ? `${order.note ? order.note + '\n\n' : ''}[Cupón aplicado: ${order.couponCode} - Descuento: $${order.discountAmount}]` : order.note,
      })
      .select();

    if (error) {
      console.error("Error saving order:", error);
      return { data: null, error };
    }

    const savedOrder = data?.[0];
    const orderId = savedOrder?.id;

    // 2. Notify restaurant admin about new order
    try {
      const isWaiterCall = !!order.isWaiterCalled;
      const title = isWaiterCall ? "🔔 ¡Llamado de Mesero!" : "¡Nuevo Pedido en SmartBite!";

      // B. Explicitly notify the restaurant owner's app panel
      const { data: restaurantData } = await supabase
        .from("restaurants")
        .select("owner_id, name")
        .eq("id", order.restaurantId)
        .single();

      if (restaurantData?.owner_id) {
        console.log(`[db.saveOrder] Sending notification to restaurant owner_id: ${restaurantData.owner_id}`);
        await db.saveNotification({
          userId: restaurantData.owner_id,
          title,
          body: isWaiterCall
            ? `Atención requerida: Mesa ${order.tableNumber || "N/A"} solicita un mesero en ${restaurantData.name}.`
            : `Pedido #${orderId?.substring(0, 8)} de ${order.customerName} registrado para ${restaurantData.name}.`,
          type: "direct",
          orderId: orderId,
        });
      } else {
        console.warn(`[db.saveOrder] Restaurant ${order.restaurantId} has NO owner_id! Notification will not be sent.`);
      }
    } catch (notifErr) {
      console.error("Error triggering notifications in saveOrder:", notifErr);
    }

    return { data: savedOrder, error: null };
  },

  getRestaurantOrders: async (restaurantId: string) => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (error) return [];
    return data.map((o) => ({
      id: o.id,
      restaurantId: o.restaurant_id,
      customerId: o.customer_id,
      customerName: o.customer_name,
      items: o.items,
      total: o.total,
      status: o.status,
      createdAt: o.created_at,
      driverId: o.driver_id,
      paymentMethod: o.payment_method,
      paymentStatus: o.payment_status,
      deliveryLat: o.delivery_lat,
      deliveryLng: o.delivery_lng,
      tableNumber: o.table_number,
      isWaiterCalled: o.is_waiter_called,
      tipAmount: o.tip_amount,
      tipType: o.tip_type,
      customerPhone: o.customer_phone,
      recipientName: o.recipient_name,
      address: o.address,
      note: o.note,
      refundStatus: o.refund_status,
      refundReason: o.refund_reason,
      refundOption: o.refund_option,
      refundRequestedAt: o.refund_requested_at,
    }));
  },

  getUserOrders: async (userId: string) => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, restaurants(name)")
      .eq("customer_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === '42P01') {
        console.warn("orders table missing. Please check your Supabase schema.");
      } else {
        console.warn("Error fetching user orders:", error);
      }
      return [];
    }
    return data.map((o) => ({
      id: o.id,
      restaurantId: o.restaurant_id,
      customerId: o.customer_id,
      customerName: o.customer_name,
      items: o.items,
      total: o.total,
      status: o.status,
      createdAt: o.created_at,
      driverId: o.driver_id,
      paymentMethod: o.payment_method,
      paymentStatus: o.payment_status,
      deliveryLat: o.delivery_lat,
      deliveryLng: o.delivery_lng,
      tableNumber: o.table_number,
      isWaiterCalled: o.is_waiter_called,
      tipAmount: o.tip_amount,
      tipType: o.tip_type,
      customerPhone: o.customer_phone,
      recipientName: o.recipient_name,
      address: o.address,
      note: o.note,
      refundStatus: o.refund_status,
      refundReason: o.refund_reason,
      refundOption: o.refund_option,
      refundRequestedAt: o.refund_requested_at,
      restaurantName: o.restaurants?.name,
    }));
  },

  getOrder: async (
    orderId: string,
  ): Promise<{ data: Order | null; error: any }> => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, restaurants(name)")
      .eq("id", orderId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { data: null, error: null }; // Not found is not an error
      }
      return { data: null, error };
    }

    return {
      data: {
        id: data.id,
        restaurantId: data.restaurant_id,
        customerId: data.customer_id,
        customerName: data.customer_name,
        items: data.items,
        total: data.total,
        status: data.status,
        createdAt: data.created_at,
        driverId: data.driver_id,
        paymentMethod: data.payment_method,
        paymentStatus: data.payment_status,
        deliveryLat: data.delivery_lat,
        deliveryLng: data.delivery_lng,
        tableNumber: data.table_number,
        isWaiterCalled: data.is_waiter_called,
        tipAmount: data.tip_amount,
        tipPercentage: data.tip_percentage,
        tipType: data.tip_type,
        customerPhone: data.customer_phone,
        recipientName: data.recipient_name,
        address: data.address,
        note: data.note,
        refundStatus: data.refund_status,
        refundReason: data.refund_reason,
        refundOption: data.refund_option,
        refundRequestedAt: data.refund_requested_at,
        restaurantName: data.restaurants?.name,
      },
      error: null,
    };
  },

  createGuestAccount: async (name: string, phone: string) => {
    try {
      const timestamp = Date.now();
      const guestEmail = `guest_${timestamp}@smartbite.guest.com`;
      const guestPassword = `guestPass_${timestamp}_${Math.random().toString(36).substring(7)}`;

      const { data, error } = await supabase.auth.signUp({
        email: guestEmail,
        password: guestPassword,
        options: {
          data: {
            full_name: name || 'Invitado',
            phone: phone || '',
            role: 'user',
            is_guest: true
          }
        }
      });

      if (error) throw error;

      if (data?.user) {
        // Explicitly populate public.app_users for immediate downstream joins and consistency
        const { error: upsertErr } = await supabase.from('app_users').upsert({
          id: data.user.id,
          email: guestEmail,
          role: 'user',
          status: 'active',
          display_name: name || 'Invitado',
          phone: phone || '',
          profile_completed: true,
          is_guest: true
        });
        if (upsertErr) {
          console.error("Error upserting app_users for guest:", upsertErr);
        }

        try {
          localStorage.setItem('smartbite_is_guest', 'true');
          sessionStorage.setItem('dismissed_profile_modal', 'true');
        } catch (e) {}
      }

      return { user: data.user, error: null };
    } catch (error) {
      console.error("Error creating guest account:", error);
      return { user: null, error };
    }
  },

  createSupportTicket: async (
    ticket: Omit<SupportTicket, "id" | "createdAt" | "status">,
  ) => {
    const localId = `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tempTicket = {
      id: localId,
      user_id: ticket.userId,
      restaurant_id: ticket.restaurantId || null,
      subject: ticket.subject,
      description: ticket.description,
      status: "open" as const,
      priority: ticket.priority || "medium",
      created_at: new Date().toISOString()
    };

    // Always keep a local copy
    try {
      const current = getLocalTickets();
      saveLocalTickets([...current, tempTicket]);
    } catch (e) {
      console.warn("localStorage copy failed", e);
    }

    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .insert({
          user_id: ticket.userId,
          restaurant_id: ticket.restaurantId,
          subject: ticket.subject,
          description: ticket.description,
          priority: ticket.priority || "medium",
        })
        .select()
        .single();
      
      if (!error && data) {
        // Replace temporary ticket with the actual database-assigned ticket to prevent duplicates!
        try {
          const current = getLocalTickets();
          const filtered = current.filter((t: any) => t.id !== localId);
          const realLocalTicket = {
            id: data.id,
            user_id: data.user_id,
            restaurant_id: data.restaurant_id,
            subject: data.subject,
            description: data.description,
            status: data.status,
            priority: data.priority,
            created_at: data.created_at
          };
          saveLocalTickets([...filtered, realLocalTicket]);
        } catch (e) {
          console.warn("Failed updating local storage copy with database version:", e);
        }
      }

      if (error && (error.message?.includes("Could not find the table") || error.message?.includes("does not exist") || error.code === "PGRST116" || error.code === "42P01")) {
        console.info("Supabase support_tickets missing. Successfully saved to localStorage instead.");
        return { data: formatLocalTicketToSupportTicket(tempTicket), error: null };
      }
      return { data, error };
    } catch (err: any) {
      console.warn("Failed inserting into public.support_tickets, using localStorage.", err);
      return { data: formatLocalTicketToSupportTicket(tempTicket), error: null };
    }
  },

  getUserSupportTickets: async (userId: string): Promise<SupportTicket[]> => {
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*, restaurants(id, name, logo)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        if (error.message?.includes("Could not find the table") || error.message?.includes("does not exist") || error.code === "PGRST116" || error.code === "42P01") {
          const filtered = getLocalTickets()
            .filter((t: any) => t.user_id === userId)
            .map(formatLocalTicketToSupportTicket);
          return filtered;
        }
        return [];
      }
      return (data || []).map((t) => ({
        id: t.id,
        userId: t.user_id,
        restaurantId: t.restaurant_id,
        subject: t.subject,
        description: t.description,
        status: t.status,
        priority: t.priority,
        createdAt: t.created_at,
        restaurant: t.restaurants
          ? ({
              id: t.restaurants.id,
              name: t.restaurants.name,
              logo: t.restaurants.logo,
            } as any)
          : undefined,
      }));
    } catch {
      return getLocalTickets()
        .filter((t: any) => t.user_id === userId)
        .map(formatLocalTicketToSupportTicket);
    }
  },

  getRestaurantSupportTickets: async (
    restaurantId: string,
  ): Promise<SupportTicket[]> => {
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*, app_users(display_name, email)")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

      if (error) {
        if (error.message?.includes("Could not find the table") || error.message?.includes("does not exist") || error.code === "PGRST116" || error.code === "42P01") {
          return getLocalTickets()
            .filter((t: any) => t.restaurant_id === restaurantId)
            .map(formatLocalTicketToSupportTicket);
        }
        return [];
      }
      return (data || []).map((t) => ({
        id: t.id,
        userId: t.user_id,
        restaurantId: t.restaurant_id,
        subject: t.subject,
        description: t.description,
        status: t.status,
        priority: t.priority,
        createdAt: t.created_at,
        userName: t.app_users?.display_name || t.app_users?.email,
      }));
    } catch {
      return getLocalTickets()
        .filter((t: any) => t.restaurant_id === restaurantId)
        .map(formatLocalTicketToSupportTicket);
    }
  },

  updateSupportTicketStatus: async (
    ticketId: string,
    status: SupportTicket["status"],
  ) => {
    // Always update local storage status representation
    try {
      const local = getLocalTickets();
      const updated = local.map((t: any) => {
        if (t.id === ticketId || t.ticket_id === ticketId) {
          return { ...t, status };
        }
        return t;
      });
      saveLocalTickets(updated);
    } catch (e) {
      console.warn("localStorage status update failed", e);
    }

    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({ status })
        .eq("id", ticketId);
      
      if (error && (error.message?.includes("Could not find the table") || error.message?.includes("does not exist") || error.code === "PGRST116" || error.code === "42P01")) {
        return { error: null };
      }
      return { error };
    } catch (err: any) {
      console.warn("Failed updating support_tickets table status, using localStorage.", err);
      return { error: null };
    }
  },

  getSupportTicketById: async (id: string): Promise<SupportTicket | null> => {
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*, restaurants(id, name, logo), app_users(display_name, email)")
        .eq("id", id)
        .single();

      if (error) {
        if (error.message?.includes("Could not find the table") || error.message?.includes("does not exist") || error.code === "PGRST116" || error.code === "42P01") {
          const match = getLocalTickets().find((t: any) => t.id === id || t.ticket_id === id);
          return match ? formatLocalTicketToSupportTicket(match) : null;
        }
        return null;
      }
      if (!data) return null;
      return {
        id: data.id,
        userId: data.user_id,
        restaurantId: data.restaurant_id,
        subject: data.subject,
        description: data.description,
        status: data.status,
        priority: data.priority,
        createdAt: data.created_at,
        userName: data.app_users?.display_name || data.app_users?.email,
        restaurant: data.restaurants
          ? ({
              id: data.restaurants.id,
              name: data.restaurants.name,
              logo: data.restaurants.logo,
            } as any)
          : undefined,
      };
    } catch {
      const match = getLocalTickets().find((t: any) => t.id === id || t.ticket_id === id);
      return match ? formatLocalTicketToSupportTicket(match) : null;
    }
  },

  getAllOrders: async () => {
    try {
      // Try with join first
      const { data, error } = await supabase
        .from("orders")
        .select("*, restaurants(name)")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn(
          "db.getAllOrders: Error with join, falling back to simple select",
          error,
        );
        const { data: simpleData, error: simpleError } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });

        if (simpleError) {
          console.error(
            "db.getAllOrders: Simple select also failed",
            simpleError,
          );
          return [];
        }
        return simpleData.map((o) => ({
          id: o.id,
          restaurantId: o.restaurant_id,
          restaurantName: "Restaurante",
          customerId: o.customer_id,
          customerType: o.customer_type,
          customerName: o.customer_name,
          items: o.items,
          total: o.total,
          status: o.status,
          createdAt: o.created_at,
          tableNumber: o.table_number,
          isWaiterCalled: o.is_waiter_called,
          customerPhone: o.customer_phone,
          recipientName: o.recipient_name,
          address: o.address,
          note: o.note,
        }));
      }

      return data.map((o) => ({
        id: o.id,
        restaurantId: o.restaurant_id,
        restaurantName: o.restaurants?.name || "Restaurante",
        customerId: o.customer_id,
        customerType: o.customer_type,
        customerName: o.customer_name,
        items: o.items,
        total: o.total,
        status: o.status,
        createdAt: o.created_at,
        tableNumber: o.table_number,
        isWaiterCalled: o.is_waiter_called,
        customerPhone: o.customer_phone,
        recipientName: o.recipient_name,
        address: o.address,
        note: o.note,
      }));
    } catch (err) {
      console.error("db.getAllOrders: Unexpected error", err);
      return [];
    }
  },

  updateRestaurant: async (id: string, updates: Partial<Restaurant>) => {
    console.log("db.updateRestaurant: Updating restaurant", id, updates);
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.businessType !== undefined)
      updateData.business_type = updates.businessType;
    if (updates.handlesPromotions !== undefined)
      updateData.handles_promotions = updates.handlesPromotions;
    if (updates.logo !== undefined) updateData.logo = updates.logo;
    if ((updates as any).logo_url !== undefined) updateData.logo = (updates as any).logo_url;
    if (updates.coverImage !== undefined)
      updateData.cover_image = updates.coverImage;
    if ((updates as any).cover_image !== undefined)
      updateData.cover_image = (updates as any).cover_image;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.department !== undefined)
      updateData.department = updates.department;
    if (updates.city !== undefined) updateData.city = updates.city;
    if (updates.hasDelivery !== undefined)
      updateData.has_delivery = updates.hasDelivery;
    if (updates.deliveryFee !== undefined)
      updateData.delivery_fee = updates.deliveryFee;
    if (updates.openingHours !== undefined)
      updateData.opening_hours = updates.openingHours;
    if (updates.detailedHours !== undefined)
      updateData.detailed_hours = updates.detailedHours;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.isFeatured !== undefined)
      updateData.is_featured = updates.isFeatured;
    if (updates.commissionRate !== undefined)
      updateData.commission_rate = updates.commissionRate;
    if (updates.whatsappNumber !== undefined)
      updateData.whatsapp_number = updates.whatsappNumber;
    if (updates.anniversaryProgramEnabled !== undefined)
      updateData.anniversary_program_enabled = updates.anniversaryProgramEnabled;
    if (updates.loyaltyPointsPerDollar !== undefined)
      updateData.loyalty_points_per_dollar = updates.loyaltyPointsPerDollar;
    if (updates.loyaltyEnabled !== undefined)
      updateData.loyalty_enabled = updates.loyaltyEnabled;
    if (updates.referralEnabled !== undefined)
      updateData.referral_enabled = updates.referralEnabled;
    if (updates.referralCommissionType !== undefined)
      updateData.referral_commission_type = updates.referralCommissionType;
    if (updates.referralCommissionValue !== undefined)
      updateData.referral_commission_value = updates.referralCommissionValue;
    if (updates.tables !== undefined) updateData.tables = updates.tables;
    if (updates.banners !== undefined) updateData.banners = updates.banners;
    if (updates.paymentGateways !== undefined)
      updateData.payment_gateways = updates.paymentGateways;
    if (updates.aiKnowledge !== undefined)
      updateData.ai_knowledge = updates.aiKnowledge;
    if (updates.highlightMessage !== undefined)
      updateData.highlight_message = updates.highlightMessage;
    if (updates.generalDiscount !== undefined)
      updateData.general_discount = updates.generalDiscount;
    if (updates.generalDiscountEnabled !== undefined)
      updateData.general_discount_enabled = updates.generalDiscountEnabled;

    if (updates.businessCategory !== undefined) {
      const normalizedCat = normalizeBusinessCategory(
        updates.businessCategory,
        updates.type,
        updates.name,
        updates.description
      );
      updateData.business_category = normalizedCat;
      let currentGateways = updateData.payment_gateways;
      if (currentGateways === undefined) {
        const { data: res } = await supabase.from("restaurants").select("payment_gateways").eq("id", id).single();
        currentGateways = res?.payment_gateways || {};
      }
      updateData.payment_gateways = { ...currentGateways, businessCategory: normalizedCat };
    }

    if (updates.gamificationEnabled !== undefined) {
      // Use existing payment_gateways in updateData if already set by updates.paymentGateways
      let currentGateways = updateData.payment_gateways;
      
      if (currentGateways === undefined) {
        // If not in updateData, fetch the very latest gateways from DB
        const { data: res } = await supabase.from("restaurants").select("payment_gateways").eq("id", id).single();
        currentGateways = res?.payment_gateways || {};
      }
      
      const gateways = { ...currentGateways };
      gateways.gamificationEnabled = updates.gamificationEnabled;
      updateData.payment_gateways = gateways;
      
      // Also log it for debugging
      console.log("db.updateRestaurant: Setting gamificationEnabled to", updates.gamificationEnabled, "inside payment_gateways");
    }

    console.log("db.updateRestaurant: Final payload", updateData);

    const { error } = await supabase
      .from("restaurants")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("db.updateRestaurant: Error updating restaurant:", error);
    } else {
      console.log("db.updateRestaurant: Success");
    }
    return { error };
  },

  deleteRestaurant: async (id: string) => {
    console.log("db.deleteRestaurant: Deleting restaurant", id);

    // 1. Get owner ID before deletion
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("owner_id")
      .eq("id", id)
      .maybeSingle();

    const ownerId = restaurant?.owner_id;

    // 2. Delete the restaurant
    const { error } = await supabase.from("restaurants").delete().eq("id", id);

    // 3. If there was an owner, demote them to 'user' role in app_users
    if (ownerId && !error) {
      console.log("db.deleteRestaurant: Demoting owner to user role", ownerId);
      await supabase
        .from("app_users")
        .update({ role: "user" })
        .eq("id", ownerId);
    }

    return { error };
  },

  updateOrderStatus: async (orderId: string, status: string) => {
    let customerId = "";
    let driverId = "";
    let restaurantName = "El restaurante";
    let restaurantId = "";
    let items: any = null;
    let total = 0;
    let note = "";
    let loyaltyPointsPerDollar = 1;
    let loyaltyEnabled = false;

    try {
      const { data: oDetails, error: fetchErr } = await supabase
        .from("orders")
        .select("customer_id, restaurant_id, driver_id, items, total, note")
        .eq("id", orderId)
        .single();
      
      if (fetchErr) {
        console.warn("[updateOrderStatus] Error fetching basic order details:", fetchErr);
      }

      if (oDetails) {
        customerId = oDetails.customer_id;
        driverId = oDetails.driver_id;
        restaurantId = oDetails.restaurant_id;
        items = oDetails.items;
        total = oDetails.total;
        note = oDetails.note;

        if (oDetails.restaurant_id) {
          const { data: rDetails, error: rErr } = await supabase
            .from("restaurants")
            .select("name, loyalty_points_per_dollar, loyalty_enabled")
            .eq("id", oDetails.restaurant_id)
            .single();
          
          if (rDetails) {
            restaurantName = rDetails.name || "El restaurante";
            loyaltyPointsPerDollar = rDetails.loyalty_points_per_dollar || 1;
            loyaltyEnabled = !!rDetails.loyalty_enabled;
          } else if (rErr) {
            console.warn("[updateOrderStatus] Error fetching restaurant details:", rErr);
          }
        }
      }
    } catch (err) {
      console.error("[updateOrderStatus] Failed to retrieve order details:", err);
    }

    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    // --- UNIFIED NOTIFICATION BLOCK ---
    if (!error && customerId) {
      let statusMessage = "";

      switch (status) {
        case "accepted": statusMessage = "ha sido aceptado por el restaurante."; break;
        case "approved": statusMessage = "ha sido aprobado. Pronto comenzaremos a prepararlo."; break;
        case "preparing": statusMessage = "está ahora mismo en preparación ¡Pronto estará listo!"; break;
        case "assigned": statusMessage = "ya tiene un repartidor asignado y se dirigirá pronto a tu ubicación"; break;
        case "shipped":
        case "on_the_way": statusMessage = "ya está en camino a tu ubicación"; break;
        case "completed": statusMessage = "ha sido entregado con éxito. ¡Que lo disfrutes!"; break;
        case "rejected": statusMessage = "ha sido rechazado. Por favor, contacta con el restaurante"; break;
        case "cancelled": statusMessage = "ha sido cancelado"; break;
      }

      if (statusMessage) {
        const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
        // Executed asynchronously in background to ensure zero screen blocking
        db.saveNotification({
          userId: customerId,
          title: `¡Actualización de tu pedido en ${restaurantName}! 🍔🛵`,
          body: `El estado de tu delicioso pedido ha cambiado: ${statusMessage}. ¡Prepárate para disfrutar! 😋✨`,
          type: "order_status",
          orderId: orderId,
          url: `${appUrl}/orders`,
        }).catch(e => console.warn("Status push failed:", e));
      }
    }

    if (!error && driverId) {
      let driverMessage = "";
      switch (status) {
        case "completed": driverMessage = `El pedido #${orderId.substring(0, 8)} ha sido entregado.`; break;
        case "cancelled": driverMessage = `El pedido #${orderId.substring(0, 8)} ha sido cancelado.`; break;
        case "preparing": driverMessage = `El pedido #${orderId.substring(0, 8)} está en preparación.`; break;
        case "shipped":
        case "on_the_way": driverMessage = `El pedido #${orderId.substring(0, 8)} está en camino.`; break;
      }

      if (driverMessage) {
        const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
        // Executed asynchronously in background to ensure zero screen blocking
        db.saveNotification({
          userId: driverId,
          title: "¡Actualización Urgente de Pedido! 🚨🛵",
          body: `${driverMessage} ¡Presta atención a los detalles para dar un servicio de estrellas! ⭐`,
          type: "order_status",
          orderId: orderId,
          url: `${appUrl}/driver`,
        }).catch(e => console.warn("Driver status push failed:", e));
      }
    }
    // --- END UNIFIED NOTIFICATION BLOCK ---

    if (!error && status === "completed") {

      // 1. Award Loyalty Points
      if (customerId && loyaltyEnabled) {
        try {
          const restMultiplier = loyaltyPointsPerDollar || 1;
          let exactPointsEarned = total / 10000;
          let hasMultiplier = restMultiplier > 1;

          const itemsList = items as any;
          if (Array.isArray(itemsList) && itemsList.length > 0) {
            for (const item of itemsList) {
              if (item && item.product) {
                let itemMultiplier = 1;
                if (typeof item.product.pointsMultiplier === "number" && item.product.pointsMultiplier > 1) {
                  itemMultiplier = item.product.pointsMultiplier;
                } else if (item.product.description) {
                  const descMatch = String(item.product.description).match(/__multiplier::(\d+)__/);
                  if (descMatch) {
                    itemMultiplier = parseInt(descMatch[1]) || 1;
                  }
                }

                if (itemMultiplier > 1) {
                  const itemPrice = (item.product.hasDiscount && item.product.discountPrice)
                    ? item.product.discountPrice
                    : (item.product.price || 0);
                  const quantity = item.quantity || 1;
                  const itemTotal = itemPrice * quantity;
                  exactPointsEarned += (itemTotal * (itemMultiplier - 1)) / 10000;
                  hasMultiplier = true;
                }
              }
            }
          }

          const pointsEarned = Math.floor(exactPointsEarned * restMultiplier);

          if (pointsEarned > 0) {
            let customDesc = `Pedido #${orderId.substring(0, 8)} completado`;
            if (hasMultiplier) {
              customDesc += " con Multiplicador de Monedas Activo";
            }
            // Executed asynchronously in background to ensure zero screen blocking
            db.addLoyaltyPoints(
              customerId,
              pointsEarned,
              customDesc,
              orderId,
              restaurantId
            ).catch(lpErr => console.error("Error executing background addLoyaltyPoints:", lpErr));
            console.log(`Monedas de Oro otorgados: ${pointsEarned} a ${customerId}`);
          }
        } catch (lpErr) {
          console.error("Error awarding loyalty points on completion:", lpErr);
        }
      }

      // 2. Increment Coupon Usage
      let extractedCouponCode = "";
      if (note) {
        const match = note.match(/\[Cupón aplicado:\s*([A-Za-z0-9_-]+)/i);
        if (match) {
          extractedCouponCode = match[1];
        }
      }

      if (extractedCouponCode) {
        try {
          const { data: coupon } = await supabase
            .from("coupons")
            .select("id, times_used")
            .eq("code", extractedCouponCode.toUpperCase())
            .maybeSingle();
          
          if (coupon) {
            await supabase
              .from("coupons")
              .update({ times_used: (coupon.times_used || 0) + 1 })
              .eq("id", coupon.id);
          }
        } catch (couponErr) {
          console.error("Error updating coupon usage on completion:", couponErr);
        }
      }

      // 3. Update Prize Status
      if (items) {
        try {
          const itemsList = items as any[];
          const prizeIds = itemsList
            .filter(item => item.product?.id?.startsWith('prize-'))
            .map(item => item.product.id.replace('prize-', ''));
          
          if (prizeIds.length > 0) {
            await Promise.all(prizeIds.map(prizeId => 
               supabase.from("wheel_prizes").update({ status: "delivered" }).eq("id", prizeId)
            ));
          }
        } catch (err) {
          console.error("Error updating wheel prize status:", err);
        }
      }

      // 4. Process Referral Commission
      if (customerId && restaurantId) {
        try {
          const { referralService } = await import('../services/referralService');
          await referralService.processOrderCommission({
            id: orderId,
            customerId: customerId,
            restaurantId: restaurantId,
            total: total,
            status: 'completed'
          } as any);
        } catch (refErr) {
          console.error("Error processing referral commission in updateOrderStatus:", refErr);
        }
      }
    }

    return { error };
  },

  cancelOrderByCustomer: async (orderId: string, customerName: string) => {
    // 1. Get the restaurant details & owner_id
    const { data: orderDetails, error: selectError } = await supabase
      .from("orders")
      .select("restaurant_id, total, status, created_at, restaurants(name, owner_id)")
      .eq("id", orderId)
      .single();

    if (selectError || !orderDetails) {
      throw new Error("Pedido no encontrado");
    }

    // 2. Validate countdown window (5 minutes)
    const createdAt = new Date(orderDetails.created_at).getTime();
    const now = Date.now();
    const diffMin = (now - createdAt) / (60 * 1000);
    
    if (diffMin > 5) {
      throw new Error("El tiempo reglamentario para cancelar este pedido (5 minutos) ha expirado.");
    }

    if (orderDetails.status === "cancelled" || orderDetails.status === "completed") {
      throw new Error(`El pedido ya está ${orderDetails.status === "completed" ? "completado" : "cancelado"}.`);
    }

    // 3. Update the order status in DB
    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", orderId);

    if (updateError) {
      throw updateError;
    }

    // 4. Send notification to restaurant owner indicating order was cancelled by user
    const rest = orderDetails.restaurants as any;
    if (rest?.owner_id) {
      const title = "⚠️ ¡Pedido Cancelado por el Cliente! 🛑";
      const body = `El cliente ${customerName} lamentablemente ha cancelado el Pedido #${orderId.substring(0, 8)} de ${rest.name || "tu restaurante"} ($${orderDetails.total.toLocaleString()}). ¡Mantente atento a tus próximos pedidos! 🔄💼`;
      
      console.log(`[db.cancelOrderByCustomer] Sending push to restaurant owner: ${rest.owner_id}`);
      await db.saveNotification({
        userId: rest.owner_id,
        title,
        body,
        type: "direct",
        orderId: orderId,
      });
    }

    return { success: true };
  },

  subscribeToOrderUpdates: (
    orderId: string,
    callback: (order: Order) => void,
  ) => {
    const channel = supabase
      .channel(`order-updates-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        async () => {
          await new Promise((r) => setTimeout(r, 400)); // Mitigate replica lag
          // Fetch the full order again to ensure we have restaurant info if needed
          const { data } = await supabase
            .from("orders")
            .select("*, restaurants(name)")
            .eq("id", orderId)
            .single();

          if (data) {
            callback(db._mapOrder(data));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeToUserOrders: (
    userId: string,
    callback: (orders: (Order & { restaurantName?: string })[]) => void,
  ) => {
    const subscription = supabase
      .channel(`user-orders-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `customer_id=eq.${userId}`,
        },
        async () => {
          await new Promise((r) => setTimeout(r, 600)); // Delay to mitigate read replica lag
          const orders = await db.getUserOrders(userId);
          callback(orders);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  },

  subscribeToRestaurantOrders: (
    restaurantId: string,
    callback: (orders: Order[]) => void,
  ) => {
    const subscription = supabase
      .channel(`restaurant-orders-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        async () => {
          await new Promise((r) => setTimeout(r, 600)); // Mitigate replica lag
          const orders = await db.getRestaurantOrders(restaurantId);
          callback(orders);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  },

  subscribeEmail: async (email: string) => {
    const { error } = await supabase
      .from("email_subscriptions")
      .insert({ email });
    return { error };
  },

  // --- Plans & Subscriptions ---
  getPlans: async (): Promise<Plan[]> => {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) return [];
    return data.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      type: p.type || "fixed",
      commission_percentage: p.commission_percentage || 0,
      billingCycle: p.billing_cycle,
      features: p.features || {},
      isActive: p.is_active,
      isDefault: p.is_default || false,
      createdAt: p.created_at,
    }));
  },

  savePlan: async (plan: Partial<Plan>, id?: string) => {
    const payload: any = {
      name: plan.name,
      description: plan.description,
      price: plan.price,
      type: plan.type,
      commission_percentage: plan.commission_percentage || 0,
      billing_cycle: plan.billingCycle,
      features: plan.features,
      is_active: plan.isActive,
      is_default: plan.isDefault || false,
    };
    if (id) {
      return await supabase.from("plans").update(payload).eq("id", id);
    } else {
      return await supabase.from("plans").insert(payload);
    }
  },

  deletePlan: async (id: string) => {
    return await supabase.from("plans").delete().eq("id", id);
  },

  getRestaurantSubscription: async (
    restaurantId: string,
  ): Promise<RestaurantSubscription | null> => {
    const { data, error } = await supabase
      .from("restaurant_subscriptions")
      .select("*, plans(*)")
      .eq("restaurant_id", restaurantId)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      restaurantId: data.restaurant_id,
      planId: data.plan_id,
      status: data.status,
      currentPeriodStart: data.current_period_start,
      currentPeriodEnd: data.current_period_end,
      cancelAtPeriodEnd: data.cancel_at_period_end,
      createdAt: data.created_at,
      plan: data.plans
        ? {
            id: data.plans.id,
            name: data.plans.name,
            description: data.plans.description,
            price: data.plans.price,
            type: data.plans.type || "fixed",
            commission_percentage: data.plans.commission_percentage || 0,
            billingCycle: data.plans.billing_cycle,
            features: data.plans.features || {},
            isActive: data.plans.is_active,
            isDefault: data.plans.is_default || false,
          }
        : undefined,
    };
  },

  saveRestaurantSubscription: async (
    sub: Partial<RestaurantSubscription>,
    id?: string,
  ) => {
    const payload: any = {
      restaurant_id: sub.restaurantId,
      plan_id: sub.planId,
      status: sub.status,
      current_period_start: sub.currentPeriodStart,
      current_period_end: sub.currentPeriodEnd,
      cancel_at_period_end: sub.cancelAtPeriodEnd,
    };
    if (id) {
      return await supabase
        .from("restaurant_subscriptions")
        .update(payload)
        .eq("id", id);
    } else {
      return await supabase.from("restaurant_subscriptions").insert(payload);
    }
  },

  getPlatformInvoices: async (
    restaurantId?: string,
  ): Promise<PlatformInvoice[]> => {
    let query = supabase
      .from("platform_invoices")
      .select("*")
      .order("created_at", { ascending: false });
    if (restaurantId) {
      query = query.eq("restaurant_id", restaurantId);
    }
    const { data, error } = await query;
    if (error) return [];
    return data.map((i) => ({
      id: i.id,
      restaurantId: i.restaurant_id,
      amount: i.amount,
      description: i.description,
      type: i.type,
      status: i.status,
      dueDate: i.due_date,
      paidAt: i.paid_at,
      paymentMethod: i.payment_method,
      createdAt: i.created_at,
    }));
  },

  savePlatformInvoice: async (invoice: Partial<PlatformInvoice>) => {
    const payload: any = {
      restaurant_id: invoice.restaurantId,
      amount: invoice.amount,
      description: invoice.description,
      type: invoice.type,
      status: invoice.status,
      due_date: invoice.dueDate,
      paid_at: invoice.paidAt,
      payment_method: invoice.paymentMethod,
    };
    return await supabase.from("platform_invoices").insert(payload);
  },

  updatePlatformInvoiceStatus: async (
    id: string,
    status: "paid" | "failed",
    paymentMethod?: string,
  ) => {
    const payload: any = { status };
    if (status === "paid") {
      payload.paid_at = new Date().toISOString();
      if (paymentMethod) payload.payment_method = paymentMethod;
    }
    return await supabase
      .from("platform_invoices")
      .update(payload)
      .eq("id", id);
  },

  // --- Billing Engine Helpers ---
  getPendingSubscriptionRenewals: async (): Promise<any[]> => {
    const now = new Date().toISOString();
    return (
      (
        await supabase
          .from("restaurant_subscriptions")
          .select("*, restaurants(*), plans(*)")
          .eq("status", "active")
          .lt("current_period_end", now)
      ).data || []
    );
  },

  getUninvoicedOrders: async (restaurantId: string): Promise<Order[]> => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("status", "completed")
      .is("platform_invoice_id", null);
    return data || [];
  },

  markOrdersAsInvoiced: async (orderIds: string[], invoiceId: string) => {
    return await supabase
      .from("orders")
      .update({ platform_invoice_id: invoiceId })
      .in("id", orderIds);
  },

  requestRefund: async (
    orderId: string,
    reason: string,
    option: "money" | "resend" | "exchange",
  ) => {
    return await supabase
      .from("orders")
      .update({
        refund_status: "requested",
        refund_reason: reason,
        refund_option: option,
        refund_requested_at: new Date().toISOString(),
      })
      .eq("id", orderId);
  },

  updateRefundStatus: async (
    orderId: string,
    status: "approved" | "rejected",
  ) => {
    return await supabase
      .from("orders")
      .update({ refund_status: status })
      .eq("id", orderId);
  },

  getCategories: async (restaurantId: string): Promise<Category[]> => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("restaurant_id", restaurantId);
    if (error) return [];
    return data.map((c) => ({
      id: c.id,
      restaurantId: c.restaurant_id,
      name: c.name,
      description: c.description,
    }));
  },

  saveCategory: async (category: Omit<Category, "id">, id?: string) => {
    const payload: any = {
      restaurant_id: category.restaurantId,
      name: category.name,
      description: category.description,
    };
    if (id) {
      const { data, error } = await supabase
        .from("categories")
        .update(payload)
        .eq("id", id)
        .select()
        .maybeSingle();
      return { data, error };
    } else {
      const { data, error } = await supabase
        .from("categories")
        .insert(payload)
        .select()
        .maybeSingle();
      return { data, error };
    }
  },

  deleteCategory: async (id: string) => {
    // Middleware check: First remove references in products to prevent foreign key constraint violations
    await supabase.from("products").update({ category_id: null }).eq("category_id", id);
    
    const { error } = await supabase.from("categories").delete().eq("id", id);
    return { error };
  },

  // Driver Methods
  getDriverProfile: async (id: string): Promise<DriverProfile | null> => {
    const { data, error } = await supabase
      .from("driver_profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id,
      vehicleType: data.vehicle_type,
      licensePlate: data.license_plate,
      vehicleColor: data.vehicle_color,
      currentLat: data.current_lat,
      currentLng: data.current_lng,
      isOnline: data.is_online,
      documentNumber: data.document_number,
      birthDate: data.birth_date,
      documentPhoto: data.document_photo,
      licensePhoto: data.license_photo,
      tecnomecanicaPhoto: data.tecnomecanica_photo,
      profilePhoto: data.profile_photo,
      approvalStatus: data.approval_status,
      restaurantId: data.restaurant_id,
      createdAt: data.created_at,
    };
  },

  updateDriverProfile: async (id: string, updates: Partial<DriverProfile>) => {
    const payload: any = {};
    if (updates.vehicleType !== undefined)
      payload.vehicle_type = updates.vehicleType;
    if (updates.licensePlate !== undefined)
      payload.license_plate = updates.licensePlate;
    if (updates.vehicleColor !== undefined)
      payload.vehicle_color = updates.vehicleColor;
    if (updates.currentLat !== undefined)
      payload.current_lat = updates.currentLat;
    if (updates.currentLng !== undefined)
      payload.current_lng = updates.currentLng;
    if (updates.isOnline !== undefined) payload.is_online = updates.isOnline;
    if (updates.documentNumber !== undefined)
      payload.document_number = updates.documentNumber;
    if (updates.birthDate !== undefined) payload.birth_date = updates.birthDate;
    if (updates.documentPhoto !== undefined)
      payload.document_photo = updates.documentPhoto;
    if (updates.licensePhoto !== undefined)
      payload.license_photo = updates.licensePhoto;
    if (updates.tecnomecanicaPhoto !== undefined)
      payload.tecnomecanica_photo = updates.tecnomecanicaPhoto;
    if (updates.profilePhoto !== undefined)
      payload.profile_photo = updates.profilePhoto;
    if (updates.approvalStatus !== undefined)
      payload.approval_status = updates.approvalStatus;
    if (updates.restaurantId !== undefined)
      payload.restaurant_id = updates.restaurantId;

    const { error } = await supabase
      .from("driver_profiles")
      .update(payload)
      .eq("id", id);
    return { error };
  },

  getRestaurantDrivers: async (
    restaurantId: string,
  ): Promise<(AppUser & { profile: DriverProfile })[]> => {
    const { data, error } = await supabase
      .from("app_users")
      .select(
        `
        *,
        driver_profiles!inner(*)
      `,
      )
      .eq("driver_profiles.restaurant_id", restaurantId);

    if (error) throw error;
    return (data || []).map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      status: u.status,
      createdAt: u.created_at,
      displayName: u.display_name,
      phone: u.phone,
      profile: {
        id: u.driver_profiles[0].id,
        vehicleType: u.driver_profiles[0].vehicle_type,
        licensePlate: u.driver_profiles[0].license_plate,
        vehicleColor: u.driver_profiles[0].vehicle_color,
        isOnline: u.driver_profiles[0].is_online,
        documentNumber: u.driver_profiles[0].document_number,
        birthDate: u.driver_profiles[0].birth_date,
        documentPhoto: u.driver_profiles[0].document_photo,
        licensePhoto: u.driver_profiles[0].license_photo,
        tecnomecanicaPhoto: u.driver_profiles[0].tecnomecanica_photo,
        profilePhoto: u.driver_profiles[0].profile_photo,
        approvalStatus: u.driver_profiles[0].approval_status,
        restaurantId: u.driver_profiles[0].restaurant_id,
        createdAt: u.driver_profiles[0].created_at,
      },
    }));
  },

  getAvailableOrdersForDrivers: async (): Promise<
    (Order & {
      restaurantName: string;
      restaurantAddress: string;
      restaurantPhone: string;
    })[]
  > => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, restaurants(name, address, phone)")
      .in("status", ["accepted", "approved", "preparing", "assigned"])
      .is("driver_id", null)
      .order("created_at", { ascending: true });

    if (error) return [];
    return data.map((o) => ({
      id: o.id,
      restaurantId: o.restaurant_id,
      restaurantName: o.restaurants?.name || "Restaurante",
      restaurantAddress: o.restaurants?.address || "Dirección no disponible",
      restaurantPhone: o.restaurants?.phone || "",
      customerId: o.customer_id,
      customerName: o.customer_name,
      items: o.items,
      total: o.total,
      status: o.status,
      createdAt: o.created_at,
      driverId: o.driver_id,
      paymentMethod: o.payment_method,
      paymentStatus: o.payment_status,
      deliveryLat: o.delivery_lat,
      deliveryLng: o.delivery_lng,
      customerPhone: o.customer_phone,
      recipientName: o.recipient_name,
      address: o.address,
      note: o.note,
    }));
  },

  getDriverOrders: async (
    driverId: string,
  ): Promise<
    (Order & {
      restaurantName: string;
      restaurantAddress: string;
      restaurantPhone: string;
    })[]
  > => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, restaurants(name, address, phone)")
      .eq("driver_id", driverId)
      .in("status", ["shipped", "on_the_way", "completed"])
      .order("created_at", { ascending: false });

    if (error) return [];
    return data.map((o) => ({
      id: o.id,
      restaurantId: o.restaurant_id,
      restaurantName: o.restaurants?.name || "Restaurante",
      restaurantAddress: o.restaurants?.address || "Dirección no disponible",
      restaurantPhone: o.restaurants?.phone || "",
      customerId: o.customer_id,
      customerName: o.customer_name,
      items: o.items,
      total: o.total,
      status: o.status,
      createdAt: o.created_at,
      driverId: o.driver_id,
      paymentMethod: o.payment_method,
      paymentStatus: o.payment_status,
      deliveryLat: o.delivery_lat,
      deliveryLng: o.delivery_lng,
      customerPhone: o.customer_phone,
      recipientName: o.recipient_name,
      address: o.address,
      note: o.note,
    }));
  },

  assignDriverToOrder: async (orderId: string, driverId: string) => {
    const { data: orderDetails } = await supabase
      .from("orders")
      .select("customer_id")
      .eq("id", orderId)
      .single();

    const { error } = await supabase
      .from("orders")
      .update({ driver_id: driverId, status: "on_the_way" })
      .eq("id", orderId);

    if (!error) {
      if (orderDetails?.customer_id) {
        const title = "¡Repartidor en Camino! 🛵💨";
        const body = "¡Excelentes noticias! Un repartidor estrella ha tomado tu pedido y va a toda velocidad hacia ti. ¡Prepárate! 🍕🎉";

        try {
          await db.saveNotification({
            userId: orderDetails.customer_id,
            title,
            body,
            type: "direct",
            orderId: orderId,
          });
        } catch (err) {
          console.error("Failed to notify customer driver assignment:", err);
        }
      }

      // Notify the driver
      try {
        const title = "¡Nuevo Pedido Asignado para ti! 🏆🛵";
        const body = "¡Tienes un nuevo viaje esperándote! Revisa los detalles y prepárate para ganar más hoy. 💸🔥";

        await db.saveNotification({
          userId: driverId,
          title,
          body,
          type: "direct",
          orderId: orderId,
        });
      } catch (err) {
        console.error("Failed to notify driver assignment:", err);
      }
    }

    return { error };
  },

  // Review Methods
  createReview: async (review: Omit<Review, "id" | "createdAt">) => {
    try {
      const commentWithPrefix = `__pending__::${review.comment || ""}`;
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: review.orderId,
          restaurantId: review.restaurantId,
          userId: review.userId,
          rating: review.rating,
          comment: commentWithPrefix,
        }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        return { data: null, error: new Error(errData.error || "Error al crear la reseña") };
      }
      const resJson = await response.json();
      return { data: resJson.data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  getAllRestaurantRatings: async (): Promise<Record<string, { average: number; count: number }>> => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("restaurant_id, rating");
        
      if (error) return {};
      
      const ratings: Record<string, { total: number; count: number }> = {};
      (data || []).forEach(r => {
        if (!ratings[r.restaurant_id]) ratings[r.restaurant_id] = { total: 0, count: 0 };
        ratings[r.restaurant_id].total += r.rating;
        ratings[r.restaurant_id].count += 1;
      });
      
      const result: Record<string, { average: number; count: number }> = {};
      Object.entries(ratings).forEach(([id, stats]) => {
        result[id] = {
          average: stats.total / stats.count,
          count: stats.count
        };
      });
      
      return result;
    } catch (e) {
      return {};
    }
  },

  getRestaurantReviews: async (restaurantId: string): Promise<Review[]> => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching restaurant reviews from supabase:", error);
        return [];
      }

      return (data || []).map((r: any) => {
        const dbComment = r.comment || "";
        let commentStr = dbComment;
        let status: "pending" | "approved" | "rejected" = "approved"; // Default for legacy reviews

        if (dbComment.startsWith("__pending__::")) {
          commentStr = dbComment.slice(13);
          status = "pending";
        } else if (dbComment.startsWith("__approved__::")) {
          commentStr = dbComment.slice(14);
          status = "approved";
        } else if (dbComment.startsWith("__rejected__::")) {
          commentStr = dbComment.slice(14);
          status = "rejected";
        }

        return {
          id: r.id,
          orderId: r.order_id || r.orderId,
          restaurantId: r.restaurant_id || r.restaurantId,
          userId: r.user_id || r.userId,
          rating: r.rating,
          comment: commentStr,
          createdAt: r.created_at || r.createdAt,
          status
        };
      });
    } catch (err) {
      console.error("Error fetching restaurant reviews:", err);
      return [];
    }
  },

  getUserReviews: async (userId: string): Promise<Review[]> => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching user reviews from supabase:", error);
        return [];
      }

      return (data || []).map((r: any) => {
        const dbComment = r.comment || "";
        let commentStr = dbComment;
        let status: "pending" | "approved" | "rejected" = "approved"; // Default for legacy reviews

        if (dbComment.startsWith("__pending__::")) {
          commentStr = dbComment.slice(13);
          status = "pending";
        } else if (dbComment.startsWith("__approved__::")) {
          commentStr = dbComment.slice(14);
          status = "approved";
        } else if (dbComment.startsWith("__rejected__::")) {
          commentStr = dbComment.slice(14);
          status = "rejected";
        }

        return {
          id: r.id,
          orderId: r.order_id || r.orderId,
          restaurantId: r.restaurant_id || r.restaurantId,
          userId: r.user_id || r.userId,
          rating: r.rating,
          comment: commentStr,
          createdAt: r.created_at || r.createdAt,
          status
        };
      });
    } catch (err) {
      console.error("Error fetching user reviews:", err);
      return [];
    }
  },

  updateReviewStatus: async (reviewId: string, status: "approved" | "rejected" | "pending") => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        return { data: null, error: new Error(errData.error || "Error al actualizar estado") };
      }
      const resJson = await response.json();
      return { data: resJson.data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  // Coupons
  async getCoupons(restaurantId?: string): Promise<Coupon[]> {
    let query = supabase.from("coupons").select("*");
    if (restaurantId) {
      query = query.eq("restaurant_id", restaurantId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((c) => ({
      id: c.id,
      code: c.code,
      discountType: c.discount_type,
      value: c.value,
      minOrderAmount: c.min_order_amount,
      startDate: c.start_date,
      endDate: c.end_date,
      active: c.active,
      restaurantId: c.restaurant_id,
      usageLimit: c.usage_limit,
      timesUsed: c.times_used,
    }));
  },

  async saveCoupon(coupon: Partial<Coupon>): Promise<void> {
    const data: any = {
      code: coupon.code,
      discount_type: coupon.discountType,
      value: Number(coupon.value) || 0,
      min_order_amount: Number(coupon.minOrderAmount) || 0,
      start_date: coupon.startDate || null,
      end_date: coupon.endDate || null,
      active: coupon.active !== false,
      restaurant_id: coupon.restaurantId,
      usage_limit: coupon.usageLimit ? Number(coupon.usageLimit) : null,
    };

    // Remove undefined fields to avoid sending them to Supabase
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

    if (coupon.id) {
      const { error } = await supabase
        .from("coupons")
        .update(data)
        .eq("id", coupon.id);
      if (error) throw error;
    } else {
      data.times_used = 0;
      const { error } = await supabase.from("coupons").insert([data]);
      if (error) throw error;
    }
  },

  async deleteCoupon(id: string): Promise<void> {
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) throw error;
  },

  async validateCoupon(
    code: string,
    restaurantId: string,
    orderAmount: number,
  ): Promise<Coupon | null> {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("active", true)
      .or(`restaurant_id.is.null,restaurant_id.eq.${restaurantId}`)
      .single();

    if (error || !data) return null;

    const coupon: Coupon = {
      id: data.id,
      code: data.code,
      discountType: data.discount_type,
      value: data.value,
      minOrderAmount: data.min_order_amount,
      startDate: data.start_date,
      endDate: data.end_date,
      active: data.active,
      restaurantId: data.restaurant_id,
      usageLimit: data.usage_limit,
      timesUsed: data.times_used,
    };

    // Check dates
    const now = new Date();
    if (coupon.startDate && new Date(coupon.startDate) > now) return null;
    if (coupon.endDate && new Date(coupon.endDate) < now) return null;

    // Check usage limit
    if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit) return null;

    // Check min amount
    if (orderAmount < coupon.minOrderAmount) return null;

    return coupon;
  },

  // Loyalty
  async getUserLoyaltyPoints(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from("loyalty_points")
      .select("points_balance")
      .eq("user_id", userId);

    if (error) {
      if (error.code === "PGRST116") return 0; // Not found
      return 0; // or throw
    }
    // Sum points from all restaurants for the global view if necessary, or return 0
    return data?.reduce((acc: number, val: any) => acc + (val.points_balance || 0), 0) || 0;
  },

  async getLoyaltyTransactions(userId: string): Promise<LoyaltyTransaction[]> {
    const { data, error } = await supabase
      .from("loyalty_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((t) => ({
      id: t.id,
      userId: t.user_id,
      points: t.points,
      type: t.type,
      description: t.description,
      orderId: t.order_id,
      createdAt: t.created_at,
    }));
  },

  async addLoyaltyPoints(
    userId: string,
    points: number,
    description: string,
    orderId?: string,
    restaurantId?: string,
  ): Promise<void> {
    if (restaurantId) {
      const { data: current } = await supabase
        .from("loyalty_points")
        .select("*")
        .eq("user_id", userId)
        .eq("restaurant_id", restaurantId)
        .maybeSingle();

      if (current) {
        await supabase
          .from("loyalty_points")
          .update({
            points_balance: current.points_balance + points,
            updated_at: new Date().toISOString(),
          })
          .eq("id", current.id);
      } else {
        await supabase.from("loyalty_points").insert({
          user_id: userId,
          restaurant_id: restaurantId,
          points_balance: points,
        });
      }
    }

    const { error } = await supabase.from("loyalty_transactions").insert([
      {
        user_id: userId,
        points: points,
        type: "earned",
        description,
        order_id: orderId,
      },
    ]);
    if (error) throw error;

    // Notify user of points earned in background without blocking
    try {
      let title = "¡Has ganado Monedas de Oro! 🌟🏅";
      let body = `Recibiste +${points} monedas de oro en tu balance de SmartBite. ${description}`;

      if (description.toLowerCase().includes("multiplicador") || description.toLowerCase().includes("multiplicado")) {
        title = "¡Multiplicador de Monedas con Éxito! 🚀🔥🪙";
        body = `¡Tus estrellas están alineadas! Ganaste un total de +${points} monedas de oro multiplicadas gracias a tu pedido. 🎉`;
      } else if (description.toLowerCase().includes("completado") || description.toLowerCase().includes("pedido")) {
        title = "¡Pedido Completado y Monedas de Oro! 🛵🪙";
        body = `¡Listo! Tu pedido fue entregado con éxito. Has acumulado +${points} monedas de oro. ¡Sigue así para canjear atractivos premios!`;
      } else if (description.toLowerCase().includes("ruleta")) {
        title = "¡Premio de la Ruleta Pay! 🎡💰";
        body = `¡Suerte de campeón! Has ganado +${points} monedas de oro en la Ruleta de premios. ¡El baúl sigue creciendo!`;
      } else if (description.toLowerCase().includes("bienvenida") || description.toLowerCase().includes("registro")) {
        title = "¡Bono de Bienvenida! 🎁✨";
        body = `Recibiste +${points} monedas de oro de regalo por registrarte en SmartBite. ¡Disfruta del sabor!`;
      }

      this.saveNotification({
        userId,
        title,
        body,
        type: "loyalty_points",
        orderId,
        metadata: { restaurantId, points, description }
      }).catch(notifErr => console.warn("Failed back-saving points earned notification", notifErr));
    } catch (notifErr) {
      console.warn("Failed to trigger loyalty points notification", notifErr);
    }
  },

  async spendLoyaltyPoints(
    userId: string,
    points: number,
    description: string,
    orderId?: string,
  ): Promise<void> {
    const currentPoints = await this.getUserLoyaltyPoints(userId);
    if (currentPoints < points) throw new Error("Monedas de Oro insuficientes");

    const { error } = await supabase.from("loyalty_transactions").insert([
      {
        user_id: userId,
        points: -points,
        type: "spent",
        description,
        order_id: orderId,
      },
    ]);
    if (error) throw error;
  },

  async spendRestaurantLoyaltyPoints(
    userId: string,
    restaurantId: string,
    pointsCost: number,
    description: string
  ): Promise<void> {
    const balance = await this.getLoyaltyPointsBalance(userId, restaurantId);
    if (!balance || balance.pointsBalance < pointsCost) {
      throw new Error("Monedas de Oro insuficientes para este restaurante");
    }

    const { error: updateError } = await supabase
      .from("loyalty_points")
      .update({ points_balance: balance.pointsBalance - pointsCost })
      .eq("id", balance.id);

    if (updateError) throw updateError;

    await supabase.from("loyalty_transactions").insert([{
      user_id: userId,
      points: -pointsCost,
      type: "spent",
      description
    }]);

    try {
      this.saveNotification({
        userId,
        title: "¡Monedas de Oro Redimidas! 🎡🪙",
        body: `Has canjeado -${pointsCost} monedas de oro en la Ruleta Pay. ¡Te deseamos mucha suerte!`,
        type: "loyalty_redemption",
        metadata: { restaurantId, pointsCost, description }
      }).catch(notifErr => console.warn("Error sending spend notification async:", notifErr));
    } catch (notifErr) {
      console.warn("Error sending spend notification", notifErr);
    }
  },

  async getNotifications(userId: string): Promise<AppNotification[]> {
    const { data, error } = await supabase
      .from("app_notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn(
        "Error fetching notifications (table might be missing):",
        error,
      );
      return [];
    }

    return data.map((n) => ({
      id: n.id,
      userId: n.user_id,
      title: n.title,
      body: n.body,
      type: n.type,
      orderId: n.order_id,
      isRead: n.is_read,
      createdAt: n.created_at,
      metadata: n.metadata,
    }));
  },

  subscribeToNotifications(
    userId: string,
    callback: (notification: any) => void,
  ) {
    return supabase
      .channel(`user-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "app_notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("Realtime notification received:", payload);
          callback(payload.new);
        },
      )
      .subscribe();
  },

  async saveNotification(
    notification: Partial<AppNotification>,
  ): Promise<void> {
    console.log("[db.saveNotification] Called with:", notification);
    // 1. Insert directly from client to ensure internal notifications work
    const { data: insertData, error } = await supabase.from("app_notifications").insert([
      {
        user_id: notification.userId,
        title: notification.title,
        body: notification.body,
        type: notification.type || 'direct',
        order_id: notification.orderId,
        is_read: false,
        metadata: notification.metadata || (notification.url ? { url: notification.url } : null),
      },
    ]).select();

    if (error) {
      console.error("[db.saveNotification] Error saving to DB:", error);
    } else {
      console.log("[db.saveNotification] Successfully saved to DB:", insertData);
    }

    // 2. Trigger push notification via Server API in background (don't await to avoid blocking)
    const notificationId = insertData?.[0]?.id || null;
    fetch("/api/notifications/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: notification.userId,
        title: notification.title,
        body: notification.body,
        data: { 
          type: notification.type, 
          orderId: notification.orderId,
          url: notification.url,
          notificationId: notificationId
        },
        skipDbInsert: true // Client already inserted it above, keep server simple
      }),
    }).then(async (res) => {
      const resData = await res.json();
      console.log("[db.saveNotification] Push API response:", resData);
    }).catch (e => {
      console.warn("[db.saveNotification] Error sending push notification via server API:", e);
    });
  },

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from("app_notifications")
      .update({ is_read: true })
      .eq("id", notificationId);
    if (error) throw error;
  },

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from("app_notifications")
      .update({ is_read: true })
      .eq("user_id", userId);
    if (error) throw error;
  },

  async deleteAllNotifications(userId: string): Promise<void> {
    const { error } = await supabase
      .from("app_notifications")
      .delete()
      .eq("user_id", userId);
    if (error) throw error;
  },

  async clearAllNotificationHistory(): Promise<void> {
    // Delete individual notifications for ALL users
    await supabase.from("app_notifications").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    // Delete campaigns
    await supabase.from("notification_campaigns").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    // Delete scheduled
    await supabase.from("scheduled_notifications").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  },

  // FAVORITES METHODS
  async toggleFavorite(userId: string, restaurantId: string): Promise<boolean> {
    const { data, error: checkError } = await supabase
      .from("user_favorites")
      .select("*")
      .eq("user_id", userId)
      .eq("restaurant_id", restaurantId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (data) {
      const { error } = await supabase
        .from("user_favorites")
        .delete()
        .eq("id", data.id);
      if (error) throw error;
      return false; // Removed
    } else {
      const { error } = await supabase
        .from("user_favorites")
        .insert([{ user_id: userId, restaurant_id: restaurantId }]);
      if (error) throw error;
      return true; // Added
    }
  },

  async isFavorite(userId: string, restaurantId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("user_favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("restaurant_id", restaurantId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  },

  async getUserFavorites(userId: string): Promise<Restaurant[]> {
    const { data, error } = await supabase
      .from("user_favorites")
      .select("*, restaurant:restaurants(*)")
      .eq("user_id", userId);

    if (error) throw error;
    return (data || []).map((d) => {
      const r = d.restaurant;
      if (!r) return null;
      return {
        id: r.id,
        name: r.name,
        type: r.type,
        description: r.description,
        logo: r.logo,
        coverImage: r.cover_image,
        phone: r.phone,
        address: r.address,
        department: r.department,
        city: r.city,
        ownerId: r.owner_id,
        rating: r.rating || 0,
        reviews_count: r.reviews_count || 0,
        isOpen: r.is_open,
        isVerified: r.is_verified,
        openingHours: r.opening_hours,
        status: r.status,
        cuisine_type: r.cuisine_type,
        estimated_delivery_time: r.estimated_delivery_time,
        delivery_fee: r.delivery_fee,
        min_order_amount: r.min_order_amount,
        latitude: r.latitude,
        longitude: r.longitude,
      };
    }).filter(Boolean) as unknown as Restaurant[];
  },

  async toggleProductFavorite(userId: string, productId: string): Promise<boolean> {
    const { data, error: checkError } = await supabase
      .from("user_product_favorites")
      .select("*")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (data) {
      const { error } = await supabase
        .from("user_product_favorites")
        .delete()
        .eq("id", data.id);
      if (error) throw error;
      return false; // Removed
    } else {
      const { error } = await supabase
        .from("user_product_favorites")
        .insert([{ user_id: userId, product_id: productId }]);
      if (error) throw error;
      return true; // Added
    }
  },

  async isProductFavorite(userId: string, productId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("user_product_favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  },

  async getUserProductFavorites(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from("user_product_favorites")
      .select("*, product:products(*, restaurants(*))")
      .eq("user_id", userId);

    if (error) throw error;
    return (data || []).map((d) => {
      if (!d.product) return null;
      const p = d.product;
      const r = p.restaurants;
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        category: p.category,
        images: p.images || [],
        available: p.available,
        hasDiscount: p.has_discount,
        isPromotion: p.is_promotion,
        isPartOfCombo: p.is_part_of_combo,
        restaurantId: r?.id || "",
        restaurantName: r?.name || "",
      };
    }).filter(Boolean);
  },

  // Gamification Levels
  getGamificationLevels: async (restaurantId: string): Promise<GamificationLevel[]> => {
    const data = localStorage.getItem(`levels_${restaurantId}`);
    return data ? JSON.parse(data) : [
      { id: '1', restaurantId, name: 'Principiante', pointsRequired: 0, icon: '🥚', color: '#8b5a2b', benefits: ['Monedas de Oro base'] },
      { id: '2', restaurantId, name: 'Explorador', pointsRequired: 500, icon: '🚶', color: '#c0c0c0', benefits: ['Envío gratis 1 vez al mes'] },
      { id: '3', restaurantId, name: 'Aventurero', pointsRequired: 1500, icon: '🏃', color: '#ffd700', benefits: ['Soporte prioritario'] },
      { id: '4', restaurantId, name: 'Maestro', pointsRequired: 3000, icon: '🧙', color: '#e5e4e2', benefits: ['Regalo de cumpleaños'] },
      { id: '5', restaurantId, name: 'Leyenda', pointsRequired: 5000, icon: '🐉', color: '#b9f2ff', benefits: ['Mesa platino', 'Acceso anticipado'] }
    ];
  },
  
  saveGamificationLevel: async (level: GamificationLevel) => {
    const levels = await db.getGamificationLevels(level.restaurantId);
    if (level.id) {
      const idx = levels.findIndex(l => l.id === level.id);
      if (idx >= 0) levels[idx] = level;
      else levels.push(level);
    } else {
      levels.push({ ...level, id: Date.now().toString() });
    }
    localStorage.setItem(`levels_${level.restaurantId}`, JSON.stringify(levels.sort((a,b) => a.pointsRequired - b.pointsRequired)));
  },

  deleteGamificationLevel: async (restaurantId: string, levelId: string) => {
    const levels = await db.getGamificationLevels(restaurantId);
    localStorage.setItem(`levels_${restaurantId}`, JSON.stringify(levels.filter(l => l.id !== levelId)));
  },

  // Gamification Tasks
  getGamificationTasks: async (restaurantId: string): Promise<GamificationTask[]> => {
    const data = localStorage.getItem(`tasks_${restaurantId}`);
    return data ? JSON.parse(data) : [
      { id: '1', restaurantId, name: 'Primeros Pasos', description: 'Completa tu perfil de usuario al 100%', pointsReward: 100, type: 'one-time', icon: '👤' },
      { id: '2', restaurantId, name: 'Crítico de Comida', description: 'Deja 3 reseñas de tus pedidos', pointsReward: 150, type: 'one-time', icon: '📝' },
      { id: '3', restaurantId, name: 'Social', description: 'Sube una foto etiquetándonos en Instagram', pointsReward: 50, type: 'one-time', icon: '📸' },
      { id: '4', restaurantId, name: 'Goloso', description: 'Pide postre en tus próximos 2 pedidos', pointsReward: 200, type: 'one-time', icon: '🍰' },
      { id: '5', restaurantId, name: 'Madrugador', description: 'Realiza un pedido antes de las 11 AM', pointsReward: 120, type: 'one-time', icon: '🌅' }
    ];
  },

  saveGamificationTask: async (task: GamificationTask) => {
    const tasks = await db.getGamificationTasks(task.restaurantId);
    if (task.id) {
      const idx = tasks.findIndex(t => t.id === task.id);
      if (idx >= 0) tasks[idx] = task;
      else tasks.push(task);
    } else {
      tasks.push({ ...task, id: Date.now().toString() });
    }
    localStorage.setItem(`tasks_${task.restaurantId}`, JSON.stringify(tasks));
  },

  deleteGamificationTask: async (restaurantId: string, taskId: string) => {
    const tasks = await db.getGamificationTasks(restaurantId);
    localStorage.setItem(`tasks_${restaurantId}`, JSON.stringify(tasks.filter(t => t.id !== taskId)));
  },

  // Reward level mapping
  getRewardLevelRequirements: async (restaurantId: string): Promise<Record<string, string>> => {
    const data = localStorage.getItem(`reward_levels_${restaurantId}`);
    return data ? JSON.parse(data) : {};
  },

  saveRewardLevelRequirement: async (restaurantId: string, rewardId: string, levelId: string) => {
    const reqs = await db.getRewardLevelRequirements(restaurantId);
    if (levelId) reqs[rewardId] = levelId;
    else delete reqs[rewardId];
    localStorage.setItem(`reward_levels_${restaurantId}`, JSON.stringify(reqs));
  },

  async getLoyaltyRewards(restaurantId: string): Promise<LoyaltyReward[]> {
    const { data, error } = await supabase
      .from("loyalty_rewards")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("is_active", true)
      .order("points_cost", { ascending: true });

    if (error) throw error;
    return (data || []).map((r) => ({
      id: r.id,
      restaurantId: r.restaurant_id,
      title: r.title,
      description: r.description,
      pointsCost: r.points_cost,
      rewardType: r.reward_type,
      imageUrl: r.image_url,
      isActive: r.is_active,
      createdAt: r.created_at,
    }));
  },

  async saveLoyaltyReward(reward: Partial<LoyaltyReward>): Promise<LoyaltyReward> {
    const payload = {
      restaurant_id: reward.restaurantId,
      title: reward.title,
      description: reward.description,
      points_cost: reward.pointsCost,
      reward_type: reward.rewardType,
      image_url: reward.imageUrl,
      is_active: reward.isActive ?? true,
    };

    if (reward.id) {
      const { data, error } = await supabase
        .from("loyalty_rewards")
        .update(payload)
        .eq("id", reward.id)
        .select()
        .single();
      if (error) throw error;
      return { ...reward, id: data.id } as LoyaltyReward;
    } else {
      const { data, error } = await supabase
        .from("loyalty_rewards")
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return { ...reward, id: data.id } as LoyaltyReward;
    }
  },

  async deleteLoyaltyReward(rewardId: string): Promise<void> {
    const { error } = await supabase
      .from("loyalty_rewards")
      .delete()
      .eq("id", rewardId);
    if (error) throw error;
  },

  async getNotificationCampaigns(): Promise<NotificationCampaign[]> {
    const { data, error } = await supabase
      .from("notification_campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Error fetching notification campaigns:", error);
      return [];
    }

    return data.map((c) => ({
      id: c.id,
      senderId: c.sender_id,
      restaurantId: c.restaurant_id,
      title: c.title,
      body: c.body,
      targetSegment: c.target_segment,
      sentCount: c.sent_count || 0,
      createdAt: c.created_at,
    }));
  },

  async getScheduledNotifications(): Promise<ScheduledNotification[]> {
    const { data, error } = await supabase
      .from("scheduled_notifications")
      .select("*")
      .order("scheduled_for", { ascending: true });

    if (error) throw error;
    return (data || []).map((s) => ({
      id: s.id,
      senderId: s.sender_id,
      title: s.title,
      body: s.body,
      category: s.category,
      targetSegment: s.target_segment,
      restaurantId: s.restaurant_id,
      scheduledFor: s.scheduled_for,
      isSent: s.is_sent,
      createdAt: s.created_at,
    }));
  },

  async scheduleNotification(
    notification: Omit<ScheduledNotification, "id" | "isSent" | "createdAt">,
  ): Promise<void> {
    const { error } = await supabase.from("scheduled_notifications").insert([
      {
        sender_id: notification.senderId,
        title: notification.title,
        body: notification.body,
        category: notification.category,
        target_segment: notification.targetSegment,
        restaurant_id: notification.restaurantId,
        scheduled_for: notification.scheduledFor,
        is_sent: false,
      },
    ]);

    if (error) throw error;
  },

  async deleteScheduledNotification(id: string): Promise<void> {
    const { error } = await supabase
      .from("scheduled_notifications")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async getLoyaltyPointsBalance(
    userId: string,
    restaurantId: string,
  ): Promise<LoyaltyPoints | null> {
    const { data, error } = await supabase
      .from("loyalty_points")
      .select("*")
      .eq("user_id", userId)
      .eq("restaurant_id", restaurantId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      restaurantId: data.restaurant_id,
      pointsBalance: data.points_balance,
      totalEarned: data.total_earned,
      updatedAt: data.updated_at,
    };
  },

  async getAllUserLoyaltyPoints(
    userId: string,
  ): Promise<(LoyaltyPoints & { restaurant: Restaurant })[]> {
    const { data, error } = await supabase
      .from("loyalty_points")
      .select("*, restaurant:restaurants(*)")
      .eq("user_id", userId);

    if (error) throw error;
    return (data || []).map((d) => ({
      id: d.id,
      userId: d.user_id,
      restaurantId: d.restaurant_id,
      pointsBalance: d.points_balance,
      totalEarned: d.total_earned,
      updatedAt: d.updated_at,
      restaurant: d.restaurant
        ? {
            id: d.restaurant.id,
            name: d.restaurant.name,
            type: d.restaurant.type,
            description: d.restaurant.description,
            logo: d.restaurant.logo,
            coverImage: d.restaurant.cover_image,
            phone: d.restaurant.phone,
            address: d.restaurant.address,
            department: d.restaurant.department,
            city: d.restaurant.city,
            businessType: d.restaurant.business_type,
            businessCategory: d.restaurant.payment_gateways?.businessCategory || d.restaurant.business_category || "restaurant",
            handlesPromotions: d.restaurant.handles_promotions,
            hasDelivery: d.restaurant.has_delivery,
            deliveryFee: d.restaurant.delivery_fee,
            openingHours: d.restaurant.opening_hours,
            detailedHours: d.restaurant.detailed_hours,
            whatsappNumber: d.restaurant.whatsapp_number,
            anniversaryProgramEnabled: d.restaurant.anniversary_program_enabled,
            loyaltyPointsPerDollar: d.restaurant.loyalty_points_per_dollar,
            loyaltyEnabled: d.restaurant.loyalty_enabled,
            commissionRate: d.restaurant.commission_rate || 5,
            banners: d.restaurant.banners || [],
            tables: d.restaurant.tables || [],
            paymentGateways: d.restaurant.payment_gateways,
            aiKnowledge: d.restaurant.ai_knowledge || {
              instructions: "",
              openingHours: "",
              allergens: "",
              popularDishes: "",
              peakHours: "",
              foodTypes: "",
              promotions: "",
              coupons: "",
              marketingHistory: [],
            },
            menu: [],
          }
        : ({} as Restaurant),
    }));
  },

  async redeemLoyaltyReward(
    userId: string,
    restaurantId: string,
    rewardId: string,
    pointsCost: number,
  ): Promise<void> {
    // 1. Check points
    const balance = await this.getLoyaltyPointsBalance(userId, restaurantId);
    if (!balance || balance.pointsBalance < pointsCost) {
      throw new Error("Monedas de Oro insuficientes para canjear este premio");
    }

    // 2. Insert redemption
    const { error: redemptionError } = await supabase
      .from("loyalty_redemptions")
      .insert([
        {
          user_id: userId,
          restaurant_id: restaurantId,
          reward_id: rewardId,
          points_spent: pointsCost,
          status: "pending",
        },
      ]);
    if (redemptionError) throw redemptionError;

    // 3. Update points balance
    const { error: updateError } = await supabase
      .from("loyalty_points")
      .update({ points_balance: balance.pointsBalance - pointsCost })
      .eq("id", balance.id);

    if (updateError) throw updateError;

    // 4. Log the transaction
    await supabase.from("loyalty_transactions").insert([{
      user_id: userId,
      points: pointsCost,
      type: "spent",
      description: "Canje de premio"
    }]);

    // 5. Notify the user
    try {
      this.saveNotification({
        userId,
        title: "¡Premio Canjeado! 🎁🪙",
        body: `Has canjeado ${pointsCost} monedas de oro por tu premio. Revisa el estado en la sección de fidelización.`,
        type: "loyalty_redemption",
        metadata: { restaurantId, rewardId, pointsCost }
      }).catch(notifErr => console.warn("Failed async redemption notification:", notifErr));
    } catch (notifErr) {
      console.warn("Failed to send redemption notification", notifErr);
    }

    // 6. Notify the restaurant owner
    try {
      const { data: restaurant } = await supabase.from('restaurants').select('owner_id, name').eq('id', restaurantId).single();
      if (restaurant?.owner_id) {
        await this.saveNotification({
          userId: restaurant.owner_id,
          title: "¡Premio Canjeado en tu Local! 🎫🏆",
          body: `¡Atención! Un usuario frecuente acaba de canjear monedas de oro por un premio en ${restaurant.name}. ¡Excelente señal de fidelidad! 📈✨`,
          type: "restaurant_alert"
        });
      }
    } catch (ownerErr) {
      console.warn("Failed to notify restaurant owner of redemption", ownerErr);
    }
  },

  async getRestaurantRedemptions(
    restaurantId: string,
  ): Promise<LoyaltyRedemption[]> {
    const { data, error } = await supabase
      .from("loyalty_redemptions")
      .select("*, reward:loyalty_rewards(*)")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((r) => ({
      id: r.id,
      userId: r.user_id,
      restaurantId: r.restaurant_id,
      rewardId: r.reward_id,
      pointsSpent: r.points_spent,
      status: r.status,
      createdAt: r.created_at,
      reward: r.reward,
    }));
  },

  async updateRedemptionStatus(
    redemptionId: string,
    status: "completed" | "cancelled",
  ): Promise<void> {
    const { data: redemption, error: fetchError } = await supabase
      .from("loyalty_redemptions")
      .select("user_id, reward_id")
      .eq("id", redemptionId)
      .maybeSingle();

    const { error } = await supabase
      .from("loyalty_redemptions")
      .update({ status })
      .eq("id", redemptionId);

    if (error) throw error;

    if (!fetchError && redemption?.user_id) {
      this.saveNotification({
        userId: redemption.user_id,
        title: status === "completed" ? "¡Canje de Premio Aprobado! ✅🎁" : "Atención: Canje de Premio Cancelado ❌🪙",
        body: status === "completed" 
          ? `¡Felicidades! Tu gran canje de monedas de oro ha sido aprobado y procesado exitosamente. ¡A disfrutar tu merecida recompensa! 🥳🏆`
          : `Lamentablemente tu canje de monedas de oro fue cancelado en esta ocasión. Tus valiosas monedas han sido devueltas a tu balance intacto. ¡Sigue probando! 🔄🤝`,
        type: "loyalty_redemption_update",
        metadata: { redemptionId, status }
      }).catch(err => console.warn("Error notifying redemption status update", err));
    }
  },

  async getRewardModules(): Promise<RewardModule[]> {
    try {
      const { data, error } = await supabase
        .from("reward_modules")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error || !data) {
        return [];
      }

      return data.map((item: any) => ({
        id: String(item.id),
        title: item.title,
        description: item.description,
        imageUrl: formatImageUrl(item.image_url),
        buttonText: item.button_text,
        path: item.path,
        isActive: item.is_active ?? true,
        sortOrder: item.sort_order ?? 0
      }));
    } catch (err) {
      console.warn("Table reward_modules might not exist or failed fetch:", err);
      return [];
    }
  },

  async saveRewardModule(module: RewardModule): Promise<void> {
    const data: any = {
      title: module.title,
      description: module.description,
      image_url: module.imageUrl,
      button_text: module.buttonText,
      path: module.path,
      is_active: module.isActive,
      sort_order: module.sortOrder,
    };

    if (module.id) {
      data.id = module.id;
      const { error } = await supabase
        .from("reward_modules")
        .upsert([data]);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("reward_modules")
        .insert([data]);
      if (error) throw error;
    }
  },

  async deleteRewardModule(id: string): Promise<void> {
    const { error } = await supabase
      .from("reward_modules")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  async clearAllRewardModules(): Promise<void> {
    const { error } = await supabase
      .from("reward_modules")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Deletes all records safely
    if (error) {
      // Fallback: fetch IDs and delete each
      const { data } = await supabase.from("reward_modules").select("id");
      if (data && data.length > 0) {
        for (const row of data) {
          await supabase.from("reward_modules").delete().eq("id", row.id);
        }
      }
    }
  },

  // ================= GAMIFICATION/XP SYSTEM METHODS =================
  getUserGamification: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("app_users")
        .select("extra_anniversaries")
        .eq("id", userId)
        .maybeSingle();
      if (error || !data) return { level: 1, xp: 0, completedTasks: [] };
      const list = data.extra_anniversaries || [];
      const gameObj = list.find((item: any) => item.type === "gamification");
      if (gameObj) {
        return {
          level: gameObj.level || 1,
          xp: gameObj.xp || 0,
          completedTasks: gameObj.completedTasks || [],
        };
      }
      return { level: 1, xp: 0, completedTasks: [] };
    } catch {
      return { level: 1, xp: 0, completedTasks: [] };
    }
  },

  saveUserGamification: async (userId: string, state: { level: number; xp: number; completedTasks: string[] }) => {
    try {
      const { data, error } = await supabase
        .from("app_users")
        .select("extra_anniversaries")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      
      const currentList = data?.extra_anniversaries || [];
      const cleanList = currentList.filter((item: any) => item.type !== "gamification");
      const updatedList = [
        ...cleanList,
        {
          type: "gamification",
          level: state.level,
          xp: state.xp,
          completedTasks: state.completedTasks,
          updatedAt: new Date().toISOString()
        }
      ];

      const { error: patchError } = await supabase
        .from("app_users")
        .update({ extra_anniversaries: updatedList })
        .eq("id", userId);
      return { error: patchError };
    } catch (err: any) {
      console.error("Error saving gamification status", err);
      return { error: err };
    }
  },

  updateUserXP: async (userId: string, xpGained: number) => {
    try {
      // Accessing supabase and executing level ups
      const { data, error } = await supabase
        .from("app_users")
        .select("extra_anniversaries")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      
      const currentList = data?.extra_anniversaries || [];
      const gameObj = currentList.find((item: any) => item.type === "gamification");
      
      const currentXP = gameObj?.xp || 0;
      const currentLevel = gameObj?.level || 1;
      
      const newXP = currentXP + xpGained;
      const newLevel = Math.floor(newXP / 50) + 1; // 50 XP per level
      const levelUpgraded = newLevel > currentLevel;

      const cleanList = currentList.filter((item: any) => item.type !== "gamification");
      const updatedList = [
        ...cleanList,
        {
          type: "gamification",
          level: newLevel,
          xp: newXP,
          completedTasks: gameObj?.completedTasks || [],
          updatedAt: new Date().toISOString()
        }
      ];

      const payload: any = { extra_anniversaries: updatedList };

      if (levelUpgraded) {
        const extraAffiliationSpots = Math.floor(newLevel / 5);
        const extraInviteLinkSpots = Math.floor(newLevel / 3) * 2;

        payload.max_restaurant_affiliations = 5 + extraAffiliationSpots;
        payload.max_referral_invites = 20 + extraInviteLinkSpots;
      }

      const { error: patchError } = await supabase
        .from("app_users")
        .update(payload)
        .eq("id", userId);

      if (levelUpgraded && !patchError) {
        try {
          db.saveNotification({
            userId,
            title: "¡Nivel Superado! 🥳🔥🎒",
            body: `¡Felicidades! Has subido de nivel. Ahora eres Nivel ${newLevel}. ¡Sigue acumulando experiencia para más beneficios!`,
            type: "level_up",
            metadata: { newLevel, newXP }
          }).catch(notifErr => console.warn("Failed async updateUserXP level notification:", notifErr));
        } catch (notifErr) {
          console.warn("Failed to notify user level-up", notifErr);
        }
      }

      return { levelUpgraded, newLevel, newXP, error: patchError };
    } catch (err: any) {
      console.error("Unexpected error in updateUserXP", err);
      return { error: err };
    }
  },

  completeGamificationTask: async (userId: string, taskId: string, xpReward: number) => {
    try {
      const { data, error } = await supabase
        .from("app_users")
        .select("extra_anniversaries")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;

      const currentList = data?.extra_anniversaries || [];
      const gameObj = currentList.find((item: any) => item.type === "gamification");

      const completedTasks: string[] = gameObj?.completedTasks || [];
      if (completedTasks.includes(taskId)) {
        return { alreadyCompleted: true };
      }

      const updatedTasks = [...completedTasks, taskId];
      const currentXP = gameObj?.xp || 0;
      const currentLevel = gameObj?.level || 1;

      const newXP = currentXP + xpReward;
      const newLevel = Math.floor(newXP / 50) + 1;
      const levelUpgraded = newLevel > currentLevel;

      const cleanList = currentList.filter((item: any) => item.type !== "gamification");
      const updatedList = [
        ...cleanList,
        {
          type: "gamification",
          level: newLevel,
          xp: newXP,
          completedTasks: updatedTasks,
          updatedAt: new Date().toISOString()
        }
      ];

      const payload: any = { extra_anniversaries: updatedList };

      if (levelUpgraded) {
        const extraAffiliationSpots = Math.floor(newLevel / 5);
        const extraInviteLinkSpots = Math.floor(newLevel / 3) * 2;

        payload.max_restaurant_affiliations = 5 + extraAffiliationSpots;
        payload.max_referral_invites = 20 + extraInviteLinkSpots;
      }

      const { error: patchError } = await supabase
        .from("app_users")
        .update(payload)
        .eq("id", userId);

      if (levelUpgraded && !patchError) {
        try {
          db.saveNotification({
            userId,
            title: "¡Subiste de Nivel por Misión! 🎯🎉",
            body: `¡Qué gran trabajo! Completaste un reto y subiste al Nivel ${newLevel}. ¡Sigue completando actividades!`,
            type: "level_up",
            metadata: { newLevel, newXP, taskId }
          }).catch(notifErr => console.warn("Failed async completeGamificationTask level notification:", notifErr));
        } catch (notifErr) {
          console.warn("Failed to notify user task level-up", notifErr);
        }
      }

      return { success: true, levelUpgraded, newLevel, newXP, error: patchError };
    } catch (err: any) {
      console.error("Error completing gamification task", err);
      return { error: err };
    }
  },
};
