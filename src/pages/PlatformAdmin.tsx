import {  formatCurrency } from "../utils/format";
import React, { useState, useEffect } from "react";
import {  toast } from "sonner";
import {  ImageCropperModal } from "../components/ImageCropperModal";
import { 
  db,
  defaultSettings,
  Restaurant,
  AppUser,
  PlatformSettings,
  Banner,
  FoodCategory,
  BusinessCategory,
  Product,
  Coupon,
  Plan,
  PlatformInvoice,
  BackgroundMusicTrack,
} from "../store/db";
import {  supabase } from "../lib/supabase";
import {  runBillingEngine } from "../services/billingService";
import {  PlanManager } from "../components/PlanManager";
import {  Documentation } from "../components/Documentation";
import {  AdminMarketingHub } from "../components/AdminMarketingHub";
import {  Link, useLocation } from "react-router-dom";
import { 
  Store,
  TrendingUp,
  Users,
  DollarSign,
  Shield,
  Pause,
  Play,
  Trash2,
  Edit,
  Settings,
  Trophy,
  Award,
  Image as ImageIcon,
  Plus,
  Star,
  ExternalLink,
  LayoutList,
  Layout,
  FileText,
  ChevronLeft,
  Download,
  CheckCircle2,
  AlertTriangle,
  Bike,
  Truck,
  Ticket,
  Percent,
  Calendar,
  Tag,
  X,
  Car,
  CreditCard,
  BellRing,
  Zap,
  Brain,
  MessageSquare,
  Mic,
  Volume2,
  Music,
  VolumeX,
  Clock,
  Upload,
  ShoppingBag,
  BookOpen,
  Target,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle,
  Bot,
  Smile,
  Crop, Activity, Fingerprint,
  Share2,
  Save,
  ArrowUp,
  ArrowDown,
  Layers,
  Copy,
  Check
} from "lucide-react";

import { DateSelector } from "../components/DateSelector";
import { jsPDF } from "jspdf";
import { AdminReferralManagement } from "../components/AdminReferralManagement";
import { AdminRepresentativeManagement } from "../components/AdminRepresentativeManagement";
import { AdminGamificationManagement } from "../components/AdminGamificationManagement";
import { AdminMetaManager } from "../components/AdminMetaManager";
import autoTable from "jspdf-autotable";
import {  motion, AnimatePresence } from "framer-motion";
import {  ImageSizeInfo } from "../components/ImageSizeInfo";

import {  DashboardSidebar, SidebarGroup } from "../components/DashboardSidebar";
import {  useAuth } from "../contexts/AuthContext";
import {  NotificationInbox } from "../components/NotificationInbox";
import {  useNotifications } from "../contexts/NotificationContext";
import {  OnboardingBuilder } from "../components/OnboardingBuilder";
import {  SplashBuilder } from "../components/SplashBuilder";
import {  AdminParchisConfig } from "../components/AdminParchisConfig";
import { AdminTrafficDashboard } from "../components/AdminTrafficDashboard";

const QuotaCountdown = () => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  }>({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      // Google AI Studio resets generally at midnight Pacific Time (PT)
      // PT is usually UTC-7 (PDT) or UTC-8 (PST).
      // Let's target the next 08:00 UTC as a safe estimate for the reset.

      const target = new Date();
      target.setUTCHours(8, 0, 0, 0);

      if (now.getUTCHours() >= 8) {
        target.setUTCDate(target.getUTCDate() + 1);
      }

      const diff = target.getTime() - now.getTime();

      if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0 };

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      return { hours, minutes, seconds };
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    setTimeLeft(calculateTimeLeft());
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-surface-variant border border-white/10 p-6 rounded-[2rem] flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-orange-500 animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-muted">
          Reinicio de Cuotas
        </span>
      </div>
      <div className="flex gap-4">
        <div className="flex flex-col">
          <span className="text-3xl font-black text-on-surface tabular-nums">
            {timeLeft.hours.toString().padStart(2, "0")}
          </span>
          <span className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest">
            Hrs
          </span>
        </div>
        <span className="text-3xl font-black text-orange-500">:</span>
        <div className="flex flex-col">
          <span className="text-3xl font-black text-on-surface tabular-nums">
            {timeLeft.minutes.toString().padStart(2, "0")}
          </span>
          <span className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest">
            Min
          </span>
        </div>
        <span className="text-3xl font-black text-orange-500">:</span>
        <div className="flex flex-col">
          <span className="text-3xl font-black text-on-surface tabular-nums">
            {timeLeft.seconds.toString().padStart(2, "0")}
          </span>
          <span className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest">
            Seg
          </span>
        </div>
      </div>
      <p className="mt-4 text-[9px] font-medium text-on-surface-variant max-w-[150px] leading-tight">
        Tiempo estimado para la restauración de la cuota gratuita (08:00 UTC).
      </p>
    </div>
  );
};

export default function PlatformAdmin() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [auditingRestaurant, setAuditingRestaurant] =
    useState<Restaurant | null>(null);
  const [auditingLoading, setAuditingLoading] = useState(false);
  const [auditChecklist, setAuditChecklist] = useState<{
    hasLogo: boolean;
    hasCover: boolean;
    hasAddress: boolean;
    hasHours: boolean;
    hasProducts: boolean;
    numProducts: number;
    hasAssistant: boolean;
    hasPrizes: boolean;
    prizesCount: number;
    loyaltyEnabled: boolean;
    referralEnabled: boolean;
    anniversaryEnabled: boolean;
  } | null>(null);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [itemToDelete, setItemToDelete] = useState<{
    type: "foodCategory" | "businessCategory";
    id: string;
    name?: string;
  } | null>(null);

  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [cropper, setCropper] = useState<{
    isOpen: boolean;
    imageSrc: string;
    type:
      | "auth"
      | "heroImage"
      | "groceryHeroImage"
      | "liquorHeroImage"
      | "salsamentariaHeroImage"
      | "heroBanner"
      | "banner"
      | "footerBanner"
      | "authClient"
      | "authRestaurant"
      | "authDriver"
      | "appLogo"
      | "splashLogo"
      | "foodCategory"
      | "businessCategory";
    aspectRatio?: number;
    cropWidth?: number;
    cropHeight?: number;
    metaId?: string; // Para identificar banners específicos
  } | null>(null);

  const [activeTab, setActiveTab] = useState<
    | "restaurants"
    | "users"
    | "settings"
    | "stats"
    | "traffic"
    | "drivers"
    | "marketing"
    | "meta_social"
    | "payments"
    | "plans"
    | "billing"
    | "communications"
    | "inbox"
    | "ai_core"
    | "docs"
    | "onboarding"
    | "splash"
    | "referrals"
    | "representatives"
    | "gamification"
    | "juegos"
    | "music"
  >(() => {
    const params = new URLSearchParams(location.search);
    const tabOption = params.get("tab");
    return (tabOption as any) || "restaurants";
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabOption = params.get("tab");
    if (tabOption) {
      setActiveTab(tabOption as any);
    }
  }, [location.search]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [communicationsSubTab, setCommunicationsSubTab] = useState<
    "send" | "history" | "scheduled"
  >("send");
  const [marketingSubTab, setMarketingSubTab] = useState<
    "business_categories" | "banners" | "food_chips" | "coupons"
  >("business_categories");
  const [scheduledNotes, setScheduledNotes] = useState<any[]>([]);
  const [notificationForm, setNotificationForm] = useState({
    target: "all" as
      | "all"
      | "all_customers"
      | "all_restaurants"
      | "all_drivers"
      | "restaurant_customers",
    restaurantId: "",
    title: "",
    body: "",
    isScheduled: false,
    scheduledDate: "",
    scheduledTime: "",
    category: "promoción",
  });
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [invoices, setInvoices] = useState<PlatformInvoice[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon> | null>(
    null,
  );
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(
    null,
  );
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    type: "user" | "restaurant";
    name: string;
  } | null>(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<
    string | null
  >(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isConvertingPwaIcon, setIsConvertingPwaIcon] = useState(false);
  const [isUploadingMusic, setIsUploadingMusic] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const musicInputRef = React.useRef<HTMLInputElement>(null);
  const [musicTracks, setMusicTracks] = useState<BackgroundMusicTrack[]>([]);
  const [dateFilter, setDateFilter] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  const [loading, setLoading] = useState(true);
  const [isClearingHistory, setIsClearingHistory] = useState(false);

  const [selectedDriver, setSelectedDriver] = useState<any | null>(null);

  const handleClearHistory = async () => {
    if (
      !confirm(
        "¿Estás seguro de borrar permanentemente TODO el historial de notificaciones y campañas? Esta acción no se puede deshacer.",
      )
    )
      return;

    setIsClearingHistory(true);
    try {
      await db.clearAllNotificationHistory();
      toast.success("Hitorial eliminado permanentemente");
      fetchData();
      const resCampaigns = await db.getNotificationCampaigns();
      setCampaigns(resCampaigns);
      const resScheduled = await db.getScheduledNotifications();
      setScheduledNotes(resScheduled);
    } catch (error) {
      console.error("Error clearing history:", error);
      toast.error("Error al limpiar el historial");
    } finally {
      setIsClearingHistory(false);
    }
  };

  const fetchData = async () => {
    try {
      console.log("PlatformAdmin: Fetching data...");

      const [
        restaurantsData,
        usersData,
        settingsData,
        ordersData,
        driversResult,
        couponsData,
        plansData,
        invoicesData,
        campaignsData,
        musicTracksData,
      ] = await Promise.all([
        db.getRestaurants().catch((e) => {
          console.error("Error fetching restaurants:", e);
          return [];
        }),
        db.getAppUsers().catch((e) => {
          console.error("Error fetching users:", e);
          return [];
        }),
        db.getPlatformSettings().catch((e) => {
          console.error("Error fetching settings:", e);
          return null;
        }),
        db.getAllOrders().catch((e) => {
          console.error("Error fetching orders:", e);
          return [];
        }),
        supabase
          .from("driver_profiles")
          .select("*, app_users!inner(display_name, email)"),
        db.getCoupons().catch((e) => {
          console.error("Error fetching coupons:", e);
          return [];
        }),
        db.getPlans().catch((e) => {
          console.error("Error fetching plans:", e);
          return [];
        }),
        db.getPlatformInvoices().catch((e) => {
          console.error("Error fetching invoices:", e);
          return [];
        }),
        db.getNotificationCampaigns().catch((e) => {
          console.error("Error fetching campaigns:", e);
          return [];
        }),
        db.getBackgroundMusicTracks().catch((e) => {
          console.error("Error fetching music:", e);
          return [];
        }),
      ]);

      if (driversResult.error) {
        console.error("Error fetching drivers:", driversResult.error);
      }

      setRestaurants(restaurantsData || []);
      setAppUsers(usersData || []);
      if (settingsData) {
        if (!settingsData.businessCategories || settingsData.businessCategories.length === 0) {
          settingsData.businessCategories = defaultSettings.businessCategories;
        }
        setSettings(settingsData);
      }
      setOrders(ordersData || []);
      setDrivers(driversResult.data || []);
      setCoupons(couponsData || []);
      setPlans(plansData || []);
      setInvoices(invoicesData || []);
      setCampaigns(campaignsData || []);
      setMusicTracks(musicTracksData || []);

      // Fetch menus in background
      if (restaurantsData) {
        restaurantsData.forEach(async (r) => {
          try {
            const menu = await db.getRestaurantMenu(r.id);
            setRestaurants((prev) =>
              prev.map((item) =>
                item.id === r.id ? { ...item, menu: menu as Product[] } : item,
              ),
            );
          } catch (e) {
            console.error(`PlatformAdmin: Error fetching menu for ${r.id}`, e);
          }
        });
      }
    } catch (error) {
      console.error("Error fetching platform data:", error);
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Safety timeout
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn("PlatformAdmin fetchData timed out");
        setLoading(false);
      }
    }, 6000);
    return () => clearTimeout(timeoutId);
  }, []);

  const handleUpdateDriverApproval = async (
    id: string,
    status: "approved" | "rejected",
  ) => {
    try {
      const { error } = await db.updateDriverProfile(id, {
        approvalStatus: status,
      });
      if (error) throw error;

      // Update local state immediately for better UX
      setDrivers((prev) =>
        prev.map((d) => (d.id === id ? { ...d, approval_status: status } : d)),
      );

      if (selectedDriver && selectedDriver.id === id) {
        setSelectedDriver((prev) => ({ ...prev, approval_status: status }));
      }

      toast.success(
        `Repartidor ${status === "approved" ? "aprobado" : "rechazado"} correctamente`,
      );
      // Optional: Refresh data to ensure sync with server
      // fetchData();
    } catch (error) {
      console.error("Error updating driver approval:", error);
      toast.error("Error al actualizar el estado del repartidor");
    }
  };

  const handleUpdateUserStatus = async (
    id: string,
    newStatus: "active" | "paused",
  ) => {
    await db.updateAppUser(id, { status: newStatus });
    fetchData();
  };

  const handleDeleteUser = async (id: string) => {
    if (!deleteConfirm) return;
    const { error } = await db.deleteAppUser(id);
    if (error) {
      toast.error(
        "Error al eliminar. Asegúrate de configurar SUPABASE_SERVICE_ROLE_KEY en el backend.",
      );
    } else {
      setDeleteConfirm(null);
      toast.success("Usuario eliminado correctamente");
      fetchData();
    }
  };

  const handleDeleteRestaurant = async (id: string) => {
    if (!deleteConfirm) return;
    await db.deleteRestaurant(id);
    setDeleteConfirm(null);
    toast.success("Restaurante eliminado correctamente");
    fetchData();
  };

  const handleToggleRestaurantStatus = async (
    id: string,
    currentStatus: string,
  ) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    await db.updateRestaurant(id, { status: newStatus as any });
    fetchData();
  };

  const handleStartAudit = async (initialRestaurant: Restaurant) => {
    setAuditingRestaurant(initialRestaurant);
    setAuditingLoading(true);
    try {
      // Re-fetch fresh restaurant data from DB to ensure latest uploaded images/data are used
      const freshRest = (await db.getRestaurant(initialRestaurant.id)) || initialRestaurant;
      const restaurant = { ...initialRestaurant, ...freshRest };
      setAuditingRestaurant(restaurant as any);

      // Fetch wheel prizes count
      const prizes = await db.getRestaurantWheelPrizes(restaurant.id);
      const prizesCount = prizes ? prizes.length : 0;
      
      let menuList = restaurant.menu || [];
      if (!menuList || menuList.length === 0) {
        menuList = await db.getRestaurantMenu(restaurant.id);
      }
      const menuCount = Array.isArray(menuList) ? menuList.length : 0;

      const aiKnowledge =
        restaurant.aiKnowledge || (restaurant as any).ai_knowledge;
      const hours =
        restaurant.openingHours || (restaurant as any).opening_hours || (restaurant as any).detailedHours || (restaurant as any).detailed_hours;
      
      const rawLogo = restaurant.logo || (restaurant as any).logo_url || (restaurant as any).logoUrl || (restaurant as any).avatar;
      const rawCover = restaurant.coverImage || (restaurant as any).cover_image || (restaurant as any).cover || (restaurant as any).header_image || (restaurant as any).banner || (Array.isArray(restaurant.banners) && restaurant.banners.length > 0 ? (typeof restaurant.banners[0] === 'string' ? restaurant.banners[0] : ((restaurant.banners[0] as any)?.url || (restaurant.banners[0] as any)?.image || (restaurant.banners[0] as any)?.imageUrl)) : null);
      const address = restaurant.address;

      const isValidImg = (img: any): boolean => {
        if (!img) return false;
        if (Array.isArray(img)) return img.length > 0 && img.some(item => isValidImg(typeof item === 'string' ? item : ((item as any)?.url || (item as any)?.image || (item as any)?.imageUrl)));
        if (typeof img !== "string") return false;
        const trimmed = img.trim();
        if (trimmed.length < 5) return false;
        if (trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "undefined") return false;
        if (trimmed.toLowerCase().includes("placeholder") && !trimmed.startsWith("data:") && !trimmed.includes("supabase.co")) return false;
        return true;
      };

      const hasLogo = isValidImg(rawLogo);
      const hasCover = isValidImg(rawCover);
      const hasAddress = !!(address && address.trim().length > 3);
      const hasHours = !!(
        (typeof hours === "string" && hours.trim().length > 2) ||
        (typeof hours === "object" && hours && Object.keys(hours).length > 0)
      );
      const hasAssistant = !!(
        aiKnowledge &&
        (aiKnowledge.instructions?.trim() || aiKnowledge.foodTypes?.trim())
      );

      setAuditChecklist({
        hasLogo,
        hasCover,
        hasAddress,
        hasHours,
        hasProducts: menuCount > 0,
        numProducts: menuCount,
        hasAssistant,
        hasPrizes: prizesCount > 0,
        prizesCount,
        loyaltyEnabled:
          !!(restaurant as any).loyalty_enabled ||
          !!(restaurant as any).loyaltyEnabled,
        referralEnabled:
          !!(restaurant as any).referral_enabled ||
          !!(restaurant as any).referralEnabled,
        anniversaryEnabled:
          !!(restaurant as any).anniversary_program_enabled ||
          !!(restaurant as any).anniversaryProgramEnabled,
      });
    } catch (err) {
      console.error("Error running admin audit:", err);
      toast.error("Ocurrió un error al obtener detalles del restaurante.");
    } finally {
      setAuditingLoading(false);
    }
  };

  const handleApprovePublish = async (restaurant: Restaurant) => {
    try {
      await db.updateRestaurant(restaurant.id, {
        status: "active" as any,
        highlightMessage: "",
      });
      toast.success(
        `🎉 El restaurante "${restaurant.name}" ha sido aprobado y publicado oficialmente.`,
      );
      setAuditingRestaurant(null);
      fetchData();
    } catch (err) {
      console.error("Error approving restaurant:", err);
      toast.error("Error al publicar el restaurante.");
    }
  };

  const handleRejectPublish = async (restaurant: Restaurant) => {
    try {
      await db.updateRestaurant(restaurant.id, {
        status: "inactive" as any,
        highlightMessage: "",
      });
      toast.success(
        `La solicitud del restaurante "${restaurant.name}" fue rechazada y regresó a borrador.`,
      );
      setAuditingRestaurant(null);
      fetchData();
    } catch (err) {
      console.error("Error rejecting restaurant publish request:", err);
      toast.error("Error al procesar el rechazo.");
    }
  };

  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    const newFeatured = !currentFeatured;
    // Featured restaurants pay 10% commission, others default to 5% (or keep current if it's not 10)
    const newCommission = newFeatured ? 10 : 5;

    await db.updateRestaurant(id, {
      isFeatured: newFeatured,
      commissionRate: newCommission,
    });

    toast.success(
      newFeatured
        ? "Restaurante destacado (Comisión 10%)"
        : "Restaurante quitado de destacados (Comisión 5%)",
    );
    fetchData();
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;
    try {
      await db.saveCoupon(editingCoupon);
      toast.success("Cupón guardado correctamente");
      setEditingCoupon(null);
      fetchData();
    } catch (error) {
      console.error("Error saving coupon:", error);
      toast.error("Error al guardar el cupón");
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este cupón?")) return;
    try {
      await db.deleteCoupon(id);
      toast.success("Cupón eliminado");
      fetchData();
    } catch (error) {
      console.error("Error deleting coupon:", error);
      toast.error("Error al eliminar el cupón");
    }
  };

  const exportToPDF = (
    restaurant: Restaurant,
    restaurantOrders: any[],
    sales: number,
    commission: number,
    net: number,
  ) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(249, 115, 22); // Orange
    doc.text("Reporte de Ventas y Comisiones", 14, 22);

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Restaurante: ${restaurant.name}`, 14, 32);
    doc.text(`Periodo: ${dateFilter.start} al ${dateFilter.end}`, 14, 38);
    doc.text(`Fecha de Reporte: ${new Date().toLocaleDateString()}`, 14, 44);

    // Summary Table
    autoTable(doc, {
      startY: 55,
      head: [["Concepto", "Monto"]],
      body: [
        ["Ventas Totales", `${formatCurrency(sales)}`],
        [
          `Comisión App (${restaurant.commissionRate || 5}%)`,
          `${formatCurrency(commission)}`,
        ],
        ["Neto a Pagar al Restaurante", `${formatCurrency(net)}`],
      ],
      theme: "striped",
      headStyles: { fillColor: [249, 115, 22] },
    });

    // Details Table
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(
      "Detalle de Movimientos",
      14,
      (doc as any).lastAutoTable.finalY + 15,
    );

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [["ID Pedido", "Fecha", "Cliente", "Total", "Comisión", "Neto"]],
      body: restaurantOrders.map((o) => {
        const comm = o.total * ((restaurant.commissionRate || 5) / 100);
        return [
          `#${o.id.slice(0, 8)}`,
          new Date(o.createdAt).toLocaleDateString(),
          o.customerName,
          `${formatCurrency(o.total)}`,
          `${formatCurrency(comm)}`,
          `${formatCurrency(o.total - comm)}`,
        ];
      }),
      headStyles: { fillColor: [50, 50, 50] },
    });

    doc.save(
      `Reporte_${restaurant.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`,
    );
    toast.success("PDF exportado correctamente");
  };

  const handleSaveUserRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const targetUserId = editingUser.id;
    const targetRole = editingUser.role;

    console.log(
      `PlatformAdmin: Updating user ${targetUserId} to role ${targetRole}`,
    );

    try {
      const { data: updatedUser, error } = await db.updateAppUser(
        targetUserId,
        { role: targetRole },
      );

      if (error) {
        console.error("PlatformAdmin: Error updating user role:", error);
        toast.error(`Error al actualizar el rol: ${error.message}`);
        return;
      }

      if (updatedUser && updatedUser.role !== targetRole) {
        console.error(
          "PlatformAdmin: Role update did not stick. Expected:",
          targetRole,
          "Got:",
          updatedUser.role,
        );
        toast.error(
          "El cambio de rol no se aplicó correctamente en el servidor.",
        );
        return;
      }

      // If role is driver, ensure they have a driver profile
      if (targetRole === "driver") {
        try {
          const profile = await db.getDriverProfile(targetUserId);
          if (!profile) {
            console.log("PlatformAdmin: Creating missing driver profile");
            const { error: profileError } = await supabase
              .from("driver_profiles")
              .upsert({
                id: targetUserId,
                vehicle_type: "motorcycle",
                is_online: false,
              });
            if (profileError)
              console.error(
                "PlatformAdmin: Error creating driver profile:",
                profileError,
              );
          }
        } catch (err) {
          console.error("PlatformAdmin: Error ensuring driver profile:", err);
        }
      }

      toast.success("Rol actualizado exitosamente");

      // Optimistic update of local state
      setAppUsers((prev) =>
        prev.map((u) =>
          u.id === targetUserId ? { ...u, role: targetRole } : u,
        ),
      );

      setEditingUser(null);

      // Refresh data after a short delay to ensure DB consistency
      setTimeout(() => fetchData(), 500);
    } catch (err) {
      console.error("PlatformAdmin: Unexpected error:", err);
      toast.error("Ocurrió un error inesperado");
    }
  };

  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("PlatformAdmin: handleMusicUpload triggered", e.target.files);

    try {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        console.log(
          "PlatformAdmin: File selected:",
          file.name,
          file.size,
          file.type,
        );

        if (file.size === 0) {
          toast.error("El archivo seleccionado está vacío");
          return;
        }

        if (file.size > 100 * 1024 * 1024) {
          toast.error("El archivo es demasiado grande (Máximo 100MB)");
          if (musicInputRef.current) musicInputRef.current.value = "";
          return;
        }

        toast.info(`Procesando archivo: ${file.name}`);
        setIsUploadingMusic(true);
        setUploadProgress(0);
        toast.loading(`Subiendo track: ${file.name}...`, {
          id: "music-upload",
        });

        console.log("PlatformAdmin: Initiating db.uploadAudio...");
        const { url, error } = await db.uploadAudio(
          file,
          "platform/music",
          (progress) => {
            setUploadProgress(progress);
          },
        );

        if (error) {
          console.error("PlatformAdmin: Upload audio component error:", error);
          toast.error(`Error de Servidor: ${error.message || error}`, {
            id: "music-upload",
          });
          throw error;
        }

        if (url) {
          console.log("PlatformAdmin: Upload success, received URL:", url);
          const { error: settingsError } = await db.updatePlatformSettings({
            backgroundMusicUrl: url,
          });
          if (settingsError) {
            console.error(
              "PlatformAdmin: Error updating settings:",
              settingsError,
            );
            throw settingsError;
          }

          setSettings((prev) =>
            prev ? { ...prev, backgroundMusicUrl: url } : prev,
          );
          toast.success("¡Canción de fondo añadida correctamente!", {
            id: "music-upload",
          });
          window.dispatchEvent(new CustomEvent("background-music-update"));
        } else {
          console.warn(
            "PlatformAdmin: Upload completed but no URL was returned",
          );
          toast.error("Error: No se recibió la dirección del archivo", {
            id: "music-upload",
          });
        }
      } else {
        console.log("PlatformAdmin: No file selected in input");
        toast.error("No se detectó ningún archivo seleccionado.");
      }
    } catch (err: any) {
      console.error("PlatformAdmin: General upload error catch:", err);
      toast.error(`Error de carga: ${err?.message || "Error desconocido"}`, {
        id: "music-upload",
      });
    } finally {
      setIsUploadingMusic(false);
      setUploadProgress(0);
      if (musicInputRef.current) {
        musicInputRef.current.value = "";
      }
    }
  };

  const handleClearMusic = async () => {
    try {
      const { error } = await db.updatePlatformSettings({
        backgroundMusicUrl: "",
      });
      if (error) throw error;
      setSettings((prev) =>
        prev ? { ...prev, backgroundMusicUrl: "" } : prev,
      );
      toast.success("Música de fondo desactivada.");
      window.dispatchEvent(new CustomEvent("background-music-update"));
    } catch (err) {
      console.error("Error clearing settings backgroundMusicUrl:", err);
      toast.error("No se pudo desactivar el audio de fondo.");
    }
  };

  const handleToggleHideMusic = async () => {
    if (!settings) return;
    const newValue = !settings.hideMusicPlayer;
    try {
      const { error } = await db.updatePlatformSettings({
        hideMusicPlayer: newValue,
      });
      if (error) throw error;
      setSettings((prev) =>
        prev ? { ...prev, hideMusicPlayer: newValue } : prev,
      );
      toast.success(
        newValue
          ? "Reproductor ocultado en toda la app."
          : "Reproductor visible en toda la app.",
      );
      window.dispatchEvent(new CustomEvent("background-music-update"));
    } catch (err) {
      console.error("Error toggling hideMusicPlayer:", err);
      toast.error("No se pudo cambiar la visibilidad del reproductor.");
    }
  };

  const handlePwaIconUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    if (file.size > 10 * 1024 * 1024) {
      toast.error("La imagen seleccionada es demasiado grande (máximo 10MB).");
      return;
    }

    const confirmUpload = window.confirm(
      "¿Deseas convertir esta imagen al icono oficial de la PWA?\n\n" +
        "Esto regenerará automáticamente los tamaños 192x192, 512x512 y Maskable y forzará una actualización de caché en los dispositivos la próxima vez que abran la aplicación.",
    );
    if (!confirmUpload) return;

    setIsConvertingPwaIcon(true);
    const toastId = toast.loading(
      "Subiendo y configurando imagen de icono PWA...",
    );

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload-pwa-icon", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Error al procesar el icono.");
      }

      if (data.url && settings) {
        setSettings({
          ...settings,
          pwaIconUrl: data.url,
          pwaVersion: Date.now(),
        });
      }

      toast.success(
        "¡Icono PWA regenerado y actualizado exitosamente! Se reflejará automáticamente en los dispositivos de los usuarios.",
        { id: toastId },
      );
    } catch (err: any) {
      console.error("[PWA Upload Error]", err);
      toast.error(`Error al actualizar el icono PWA: ${err.message || err}`, {
        id: toastId,
      });
    } finally {
      setIsConvertingPwaIcon(false);
      e.target.value = "";
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSavingSettings(true);
    try {
      // Fetch fresh settings to ensure we don't overwrite concurrent changes
      const freshSettings = await db.getPlatformSettings();
      
      // Merge current local changes with the fresh settings
      const mergedSettings = { ...freshSettings, ...settings };

      const { error } = await db.updatePlatformSettings(mergedSettings);
      if (error) throw error;
      
      // Update local state directly to reflect changes without full reload
      setSettings(mergedSettings);
      
      toast.success("Configuración guardada exitosamente.");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Error al guardar la configuración");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleAddFoodCategory = () => {
    if (!settings) return;
    const newCategory: FoodCategory = {
      id: crypto.randomUUID(),
      name: "Nueva Categoría",
      icon: "🍽️",
    };
    setSettings({
      ...settings,
      foodCategories: [...(settings.foodCategories || []), newCategory],
    });
  };

  const handleUpdateFoodCategory = (
    id: string,
    field: keyof FoodCategory,
    value: string,
  ) => {
    if (!settings) return;
    setSettings({
      ...settings,
      foodCategories: (settings.foodCategories || []).map((c) =>
        c.id === id ? { ...c, [field]: value } : c,
      ),
    });
  };

  const handleDeleteFoodCategory = (id: string) => {
    if (!settings) return;
    const cat = settings.foodCategories?.find((c) => c.id === id);
    setItemToDelete({ type: "foodCategory", id, name: cat?.name });
  };

  const confirmDeleteFoodCategory = async (id: string) => {
    if (!settings) return;
    
    const newFoodCategories = (settings.foodCategories || []).filter(
      (c) => c.id !== id,
    );
    
    const updatedSettings = {
      ...settings,
      foodCategories: newFoodCategories,
    };

    setSettings(updatedSettings);

    try {
      const { error } = await db.updatePlatformSettings(updatedSettings);
      if (error) throw error;
      toast.success("Categoría eliminada exitosamente.");
    } catch (error) {
      console.error("Error deleting food category:", error);
      toast.error("Error al eliminar la categoría.");
    }
  };

  const [isSavingBusinessCategories, setIsSavingBusinessCategories] = useState(false);

  // Función de inicialización y sincronización del slider de categorías
  const syncCategorySliderState = async (forceDbFetch = false) => {
    try {
      if (forceDbFetch || !settings) {
        const freshSettings = await db.getPlatformSettings();
        if (freshSettings) {
          if (!freshSettings.businessCategories || freshSettings.businessCategories.length === 0) {
            freshSettings.businessCategories = defaultSettings.businessCategories;
          }
          setSettings(freshSettings);
          return freshSettings.businessCategories;
        }
      }
      return settings?.businessCategories || defaultSettings.businessCategories;
    } catch (err) {
      console.error("Error sincronizando slider de categorías:", err);
      return defaultSettings.businessCategories;
    }
  };

  const handleSaveBusinessCategories = async (customList?: BusinessCategory[]) => {
    if (!settings) return;
    setIsSavingBusinessCategories(true);
    const toastId = toast.loading("Guardando configuración de categorías de negocio...");
    try {
      const listToSave = customList || settings.businessCategories || [];
      const updatedSettings: PlatformSettings = {
        ...settings,
        businessCategories: listToSave,
      };
      
      // Actualización optimista local
      setSettings(updatedSettings);

      // Persistencia en base de datos Supabase
      const { error } = await db.updatePlatformSettings(updatedSettings);
      if (error) throw error;

      // Sincronizar inmediatamente el estado local con la respuesta fresca de la base de datos
      const refreshedSettings = await db.getPlatformSettings();
      if (refreshedSettings) {
        setSettings(refreshedSettings);
      }

      toast.success("¡Categorías de negocio guardadas y sincronizadas exitosamente!", {
        id: toastId,
      });
    } catch (error: any) {
      console.error("Error saving business categories:", error);
      toast.error(`Error al guardar las categorías: ${error.message || error}`, {
        id: toastId,
      });
    } finally {
      setIsSavingBusinessCategories(false);
    }
  };

  const handleAddBusinessCategory = () => {
    if (!settings) return;
    const currentCount = (settings.businessCategories || []).length;
    const newSlug = `categoria_${Date.now().toString(36)}`;
    const newCategory: BusinessCategory = {
      id: newSlug,
      title: `Nueva Categoría #${currentCount + 1}`,
      subtitle: "Los mejores productos y servicios a domicilio",
      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
      active: true,
      fromColor: "from-neutral-900 via-neutral-800",
      toColor: "to-orange-500/60",
      shadowColor: "shadow-[0_4px_20px_rgba(249,115,22,0.3)] border-orange-500/40",
      dotColor: "bg-orange-500",
    };
    const updated = [...(settings.businessCategories || []), newCategory];
    setSettings({
      ...settings,
      businessCategories: updated,
    });
    toast.success("Nueva categoría agregada. Recuerda pulsar 'Guardar Categorías' para persistir los cambios.");
  };

  const handleDuplicateBusinessCategory = (cat: BusinessCategory) => {
    if (!settings) return;
    const newSlug = `${cat.id}_copia_${Date.now().toString(36).slice(-4)}`;
    const duplicated: BusinessCategory = {
      ...cat,
      id: newSlug,
      title: `${cat.title} (Copia)`,
      active: true,
    };
    const updated = [...(settings.businessCategories || []), duplicated];
    setSettings({
      ...settings,
      businessCategories: updated,
    });
    toast.success(`Categoría duplicada como '${duplicated.title}'.`);
  };

  const handleReorderBusinessCategory = (index: number, direction: "up" | "down") => {
    if (!settings || !settings.businessCategories) return;
    const list = [...settings.businessCategories];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const [moved] = list.splice(index, 1);
    list.splice(targetIdx, 0, moved);
    setSettings({
      ...settings,
      businessCategories: list,
    });
  };

  const handleToggleBusinessCategoryActive = (id: string, active: boolean) => {
    if (!settings || !settings.businessCategories) return;
    const updated = (settings.businessCategories || []).map((c) =>
      c.id === id ? { ...c, active } : c,
    );
    setSettings({
      ...settings,
      businessCategories: updated,
    });
  };

  const handleUpdateBusinessCategory = (
    id: string,
    field: keyof BusinessCategory,
    value: any,
  ) => {
    if (!settings) return;
    setSettings({
      ...settings,
      businessCategories: (settings.businessCategories || []).map((c) =>
        c.id === id ? { ...c, [field]: value } : c,
      ),
    });
  };

  const handleDeleteBusinessCategory = (id: string) => {
    if (!settings) return;
    const cat = settings.businessCategories?.find((c) => c.id === id);
    setItemToDelete({ type: "businessCategory", id, name: cat?.title });
  };

  const confirmDeleteBusinessCategory = async (id: string) => {
    if (!settings) return;
    
    const newBusinessCategories = (settings.businessCategories || []).filter(
      (c) => c.id !== id,
    );

    const updatedSettings = {
      ...settings,
      businessCategories: newBusinessCategories,
    };
    
    setSettings(updatedSettings);

    try {
      const { error } = await db.updatePlatformSettings(updatedSettings);
      if (error) throw error;
      const refreshedSettings = await db.getPlatformSettings();
      if (refreshedSettings) {
        setSettings(refreshedSettings);
      }
      toast.success("Categoría eliminada y cambios guardados exitosamente.");
    } catch (error) {
      console.error("Error deleting business category:", error);
      toast.error("Error al eliminar la categoría.");
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!cropper) return;

    try {
      toast.loading("Subiendo imagen recortada...");
      const isLogo = cropper.type === "appLogo" || cropper.type === "splashLogo";
      const extension = isLogo ? "png" : "jpg";
      const mimeType = isLogo ? "image/png" : "image/jpeg";
      
      const file = new File([croppedBlob], `crop_${Date.now()}.${extension}`, {
        type: mimeType,
      });
      // Clean up the folder name for supabase
      const folderType = cropper.type.replace(/([A-Z])/g, "-$1").toLowerCase();
      const { url, error } = await db.uploadImage(
        file,
        "platform/" + folderType,
      );
      toast.dismiss();

      if (error) {
        toast.error("Error al subir la imagen recortada");
      } else if (url && settings) {
        if (cropper.type === "auth") {
          setSettings({ ...settings, authPageImage: url });
        } else if (cropper.type === "heroImage") {
          setSettings({ ...settings, heroImage: url });
        } else if (cropper.type === "groceryHeroImage") {
          setSettings({ ...settings, groceryHeroImage: url });
        } else if (cropper.type === "liquorHeroImage") {
          setSettings({ ...settings, liquorHeroImage: url });
        } else if (cropper.type === "salsamentariaHeroImage") {
          setSettings({ ...settings, salsamentariaHeroImage: url });
        } else if (cropper.type === "footerBanner") {
          setSettings({ ...settings, footerBannerImage: url });
        } else if (cropper.type === "authClient") {
          setSettings({
            ...settings,
            paymentGateways: {
              ...(settings.paymentGateways || {}),
              authClientBanner: url,
            },
          });
        } else if (cropper.type === "authRestaurant") {
          setSettings({
            ...settings,
            paymentGateways: {
              ...(settings.paymentGateways || {}),
              authRestaurantBanner: url,
            },
          });
        } else if (cropper.type === "authDriver") {
          setSettings({
            ...settings,
            paymentGateways: {
              ...(settings.paymentGateways || {}),
              authDriverBanner: url,
            },
          });
        } else if (cropper.type === "appLogo") {
          setSettings({ ...settings, appLogo: url });
        } else if (cropper.type === "splashLogo") {
          setSettings({ ...settings, systemSplashLogo: url });
        } else if (cropper.type === "businessCategory" && cropper.metaId) {
          setSettings({
            ...settings,
            businessCategories: (settings.businessCategories || []).map((c) =>
              c.id === cropper.metaId ? { ...c, image: url } : c,
            ),
          });
        } else if (cropper.type === "heroBanner" && cropper.metaId) {
          handleUpdateHeroBanner(cropper.metaId, "imageUrl", url);
        } else if (cropper.type === "banner" && cropper.metaId) {
          handleUpdateBanner(cropper.metaId, "imageUrl", url);
        } else if (cropper.type === "foodCategory" && cropper.metaId) {
          handleUpdateFoodCategory(cropper.metaId, "imageUrl", url);
        }
      }
    } catch (e) {
      toast.dismiss();
      console.error(e);
      toast.error("Ocurrió un error al procesar el recorte");
    }

    setCropper(null);
  };

  const handleAddBanner = () => {
    if (!settings) return;
    const newBanner: Banner = {
      id: crypto.randomUUID(),
      title: "Nuevo Banner",
      imageUrl: "",
      active: true,
    };
    setSettings({
      ...settings,
      banners: [...(settings.banners || []), newBanner],
    });
  };

  const handleUpdateBanner = (id: string, field: keyof Banner, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      banners: settings.banners.map((b) =>
        b.id === id ? { ...b, [field]: value } : b,
      ),
    });
  };

  const handleDeleteBanner = (id: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      banners: settings.banners.filter((b) => b.id !== id),
    });
  };

  const handleAddHeroBanner = () => {
    if (!settings) return;
    const newBanner: Banner = {
      id: crypto.randomUUID(),
      title: "Nuevo Banner Hero",
      imageUrl: "",
      active: true,
    };
    setSettings({
      ...settings,
      heroBanners: [...(settings.heroBanners || []), newBanner],
    });
  };

  const handleUpdateHeroBanner = (
    id: string,
    field: keyof Banner,
    value: any,
  ) => {
    if (!settings) return;
    setSettings({
      ...settings,
      heroBanners: (settings.heroBanners || []).map((b) =>
        b.id === id ? { ...b, [field]: value } : b,
      ),
    });
  };

  const handleDeleteHeroBanner = (id: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      heroBanners: (settings.heroBanners || []).filter((b) => b.id !== id),
    });
  };

  const handleUpdatePaymentGateway = (
    gateway: string,
    field: string,
    value: any,
  ) => {
    if (!settings) return;
    setSettings({
      ...settings,
      paymentGateways: {
        ...settings.paymentGateways,
        [gateway]: {
          ...((settings.paymentGateways?.[
            gateway as keyof typeof settings.paymentGateways
          ] as any) || {}),
          [field]: value,
        },
      },
    });
  };

  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const todayOrders = orders.filter((o) => {
    const today = new Date().toDateString();
    return new Date(o.createdAt).toDateString() === today;
  }).length;

  const totalCommissions = orders.reduce((sum, o) => {
    const restaurant = restaurants.find((r) => r.id === o.restaurantId);
    const rate = (restaurant?.commissionRate || 5) / 100;
    return sum + o.total * rate;
  }, 0);

  const tabGroups: SidebarGroup[] = [
    {
      title: "Monitoreo Estratégico",
      items: [
        {
          id: "stats",
          label: "Dashboard y Métricas",
          icon: TrendingUp,
          inactiveColor: "text-blue-500",
          activeClass:
            "bg-blue-600 text-on-surface shadow-lg shadow-blue-200/60",
        },
        {
          id: "traffic",
          label: "Visitas y Métricas",
          icon: Activity,
          inactiveColor: "text-rose-500",
          activeClass:
            "bg-rose-600 text-on-surface shadow-lg shadow-rose-200/60",
        },
        {
          id: "ai_core",
          label: "AI Core Assistant",
          icon: Zap,
          inactiveColor: "text-violet-500",
          activeClass:
            "bg-violet-600 text-on-surface shadow-lg shadow-violet-200/60",
        },
      ],
    },
    {
      title: "Ecosistema",
      items: [
        {
          id: "restaurants",
          label: "Restaurantes",
          icon: Store,
          inactiveColor: "text-orange-500",
          activeClass:
            "bg-orange-600 text-on-surface shadow-lg shadow-orange-200/60",
        },
        {
          id: "users",
          label: "Usuarios y Roles",
          icon: Users,
          inactiveColor: "text-emerald-500",
          activeClass:
            "bg-emerald-600 text-on-surface shadow-lg shadow-emerald-200/60",
        },
        {
          id: "drivers",
          label: "Repartidores",
          icon: Truck,
          inactiveColor: "text-cyan-500",
          activeClass:
            "bg-cyan-600 text-on-surface shadow-lg shadow-cyan-200/60",
        },
      ],
    },
    {
      title: "Herramientas de Negocio",
      items: [
        {
          id: "meta_social",
          label: "Meta Social (FB & IG)",
          icon: Share2,
          badge: "NUEVO",
          inactiveColor: "text-blue-500",
          activeClass:
            "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200/60",
        },
        {
          id: "marketing",
          label: "Marketing y Banners",
          icon: ImageIcon,
          inactiveColor: "text-pink-500",
          activeClass:
            "bg-pink-600 text-on-surface shadow-lg shadow-pink-200/60",
        },
        {
          id: "music",
          label: "Biblioteca Musical",
          icon: Volume2,
          inactiveColor: "text-orange-500",
          activeClass:
            "bg-orange-600 text-on-surface shadow-lg shadow-orange-200/60",
        },
        {
          id: "referrals",
          label: "Programa Referidos",
          icon: Users,
          inactiveColor: "text-rose-500",
          activeClass:
            "bg-rose-600 text-on-surface shadow-lg shadow-rose-200/60",
        },
        {
          id: "representatives",
          label: "Embajadores y Reps",
          icon: Award,
          inactiveColor: "text-amber-600",
          activeClass:
            "bg-amber-600 text-on-surface shadow-lg shadow-amber-200/60",
        },
        {
          id: "gamification",
          label: "Tareas y Gamificación",
          icon: Trophy,
          inactiveColor: "text-amber-500",
          activeClass:
            "bg-amber-600 text-on-surface shadow-lg shadow-amber-200/60",
        },
        {
          id: "juegos",
          label: "Juegos (Parchís)",
          icon: Target,
          inactiveColor: "text-red-500",
          activeClass: "bg-red-600 text-orange-100 shadow-lg shadow-red-200/60",
        },
        {
          id: "splash",
          label: "Splash Screen",
          icon: Zap,
          inactiveColor: "text-fuchsia-500",
          activeClass:
            "bg-fuchsia-600 text-on-surface shadow-lg shadow-fuchsia-200/60",
        },
        {
          id: "onboarding",
          label: "Onboarding App",
          icon: LayoutList,
          inactiveColor: "text-amber-500",
          activeClass:
            "bg-amber-600 text-on-surface shadow-lg shadow-amber-200/60",
        },
        {
          id: "plans",
          label: "Planes de Suscripción",
          icon: Shield,
          inactiveColor: "text-indigo-500",
          activeClass:
            "bg-indigo-600 text-on-surface shadow-lg shadow-indigo-200/60",
        },
        {
          id: "communications",
          label: "Avisos y Push",
          icon: BellRing,
          inactiveColor: "text-yellow-500",
          activeClass:
            "bg-yellow-600 text-on-surface shadow-lg shadow-yellow-200/60",
        },
      ],
    },
    {
      title: "Operaciones",
      items: [
        {
          id: "billing",
          label: "Facturación / Cortes",
          icon: FileText,
          inactiveColor: "text-teal-500",
          activeClass:
            "bg-teal-600 text-on-surface shadow-lg shadow-teal-200/60",
        },
        {
          id: "payments",
          label: "Liquidaciones",
          icon: DollarSign,
          inactiveColor: "text-green-500",
          activeClass:
            "bg-green-600 text-on-surface shadow-lg shadow-green-200/60",
        },
      ],
    },
    {
      title: "Sistema",
      items: [
        {
          id: "settings",
          label: "Configuración Global",
          icon: Settings,
          inactiveColor: "text-slate-500",
          activeClass:
            "bg-slate-700 text-on-surface shadow-lg shadow-slate-200/60",
        },
        {
          id: "docs",
          label: "Documentación Oficial",
          icon: BookOpen,
          inactiveColor: "text-blue-500",
          activeClass:
            "bg-blue-600 text-on-surface shadow-lg shadow-blue-200/60",
        },
      ],
    },
  ];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-neutral-50 overflow-hidden">
      <DashboardSidebar
        title="Admin Global"
        subtitle="SmartBite Platform"
        groups={tabGroups}
        activeId={activeTab}
        onItemClick={(id) => setActiveTab(id as any)}
        logo={<Shield className="w-8 h-8 text-on-surface" />}
        showHomeLink={true}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        {/* Header Hero Section */}
        <div className="relative h-64 overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-950">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.4),transparent_70%)]"></div>
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 5, 0],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-24 -right-24 w-[35rem] h-[35rem] bg-orange-500/10 rounded-full blur-3xl"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-50 via-neutral-50/10 to-transparent"></div>

          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-12 flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-orange-500/30 blur-2xl rounded-full"></div>
              <div className="w-32 h-32 rounded-3xl bg-white border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden relative z-10 transition-transform hover:scale-105 duration-500">
                <Shield className="w-14 h-14 text-orange-600" />
              </div>
            </motion.div>
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex-1 min-w-0 pb-1"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                <h1 className="text-4xl font-black text-neutral-900 tracking-tighter truncate drop-shadow-sm uppercase">
                  Gestión Central
                </h1>
                <div className="flex gap-2">
                  <span className="bg-orange-600 text-on-surface px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">
                    Live
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                <div className="flex items-center gap-2 text-on-surface-variant text-sm font-bold bg-white/50 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/50">
                  <Shield className="w-4 h-4" />
                  Super Administrador
                </div>
                <div className="flex items-center gap-2 text-rose-600 text-sm font-bold bg-rose-50/50 backdrop-blur-sm px-4 py-2 rounded-2xl border border-rose-100/50">
                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                  SmartBite Global System
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="px-2 sm:px-12 pb-24 w-full">
          {/* Main Content Area */}
          <main className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {activeTab === "ai_core" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-3xl font-black text-neutral-900 tracking-tight flex items-center gap-3">
                      <Zap className="w-8 h-8 text-orange-500" />
                      SmartBite AI Core
                    </h2>
                    <p className="text-on-surface-variant font-medium max-w-2xl">
                      Arquitectura neuronal de SmartBite. Estas APIs impulsan la
                      venta asistida, el soporte por voz y la gamificación de la
                      plataforma. Referencia técnica de modelos estables.
                    </p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-2xl flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                      Estado: Estable y Operativo
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-10 rounded-[3rem] border border-neutral-200 shadow-xl flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity">
                      <Zap className="w-32 h-32 text-orange-600" />
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-2xl font-black text-neutral-900 mb-4 tracking-tight">
                        Núcleo Central de Inteligencia
                      </h3>
                      <p className="text-sm font-medium text-on-surface-variant leading-relaxed max-w-md">
                        SmartBite opera sobre un ecosistema multimodal. El chat
                        procesa transacciones complejas, el live-preview permite
                        soporte por voz humana y el TTS gamifica la experiencia
                        del cliente.
                      </p>
                    </div>
                  </div>
                  <QuotaCountdown />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-8 rounded-[2rem] border border-neutral-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <MessageSquare className="w-16 h-16 text-orange-600" />
                    </div>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-black text-neutral-900">
                          Sales Assistant
                        </h3>
                        <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-muted">
                          Canal de Chat
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-on-surface-muted uppercase mb-1">
                          Modelo Estable
                        </p>
                        <p className="text-sm font-black font-mono text-neutral-900 bg-neutral-100 p-2 rounded-lg truncate">
                          gemini-3-flash-preview
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-on-surface-muted uppercase">
                          Capacidades e Impacto
                        </p>
                        <ul className="text-xs font-medium text-neutral-600 space-y-2">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5" />
                            Gestión de Carrito Inteligente
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5" />
                            Finalización de pedidos (Datos Entrega)
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5" />
                            <b>Envío directo al panel del Restaurante</b>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5" />
                            Reconocimiento de Perfil y Sesión
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2rem] border border-neutral-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Mic className="w-16 h-16 text-blue-600" />
                    </div>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                        <Mic className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-black text-neutral-900">
                          Voice Assistant
                        </h3>
                        <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-muted">
                          Tiempo Real / Bidi
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-on-surface-muted uppercase mb-1">
                          Modelo Estable
                        </p>
                        <p className="text-sm font-black font-mono text-neutral-900 bg-neutral-100 p-2 rounded-lg truncate">
                          gemini-3.1-flash-live-preview
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-on-surface-muted uppercase">
                          Capacidades e Impacto
                        </p>
                        <ul className="text-xs font-medium text-neutral-600 space-y-2">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5" />
                            Streaming de Audio Bidireccional
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5" />
                            Conversación fluida natural
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5" />
                            Herramientas de pedido activas
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5" />
                            Latencia mínima (Live Flow)
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2rem] border border-neutral-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Volume2 className="w-16 h-16 text-purple-600" />
                    </div>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
                        <Volume2 className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-black text-neutral-900">
                          TTS Expansive
                        </h3>
                        <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-muted">
                          Voz y Síntesis
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-on-surface-muted uppercase mb-1">
                          Modelo Estable
                        </p>
                        <p className="text-sm font-black font-mono text-neutral-900 bg-neutral-100 p-2 rounded-lg truncate">
                          gemini-3.1-flash-tts-preview
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-on-surface-muted uppercase">
                          Capacidades e Impacto
                        </p>
                        <ul className="text-xs font-medium text-neutral-600 space-y-2">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5" />
                            Anuncio de Premios (Rueda de la Suerte)
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5" />
                            Generación de Audio con Entonación
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5" />
                            Integración con Recompensas Físicas
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5" />
                            Experiencia Gamificada (TTS)
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing & Quotas */}
                <div className="bg-surface-variant p-10 rounded-[3rem] text-on-surface relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="relative z-10">
                    <div className="flex flex-col gap-2 mb-10">
                      <h3 className="text-2xl font-black tracking-tight">
                        Referencia de Cuotas y Precios (Google AI Studio)
                      </h3>
                      <p className="text-on-surface-muted font-medium max-w-3xl">
                        Actualmente SmartBite utiliza el plan <b>Gratuito</b>{" "}
                        para desarrollo. A continuación, el resumen de límites y
                        costos para cuando desees escalar a producción.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      <div className="space-y-8">
                        <div>
                          <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-4">
                            Plan Gratuito (Actual)
                          </p>
                          <div className="space-y-4 text-xs">
                            <div className="flex justify-between items-center border-b border-white/10 pb-4">
                              <span className="font-bold text-on-surface-variant font-sans tracking-tight">
                                RPM (Solicitudes por Minuto)
                              </span>
                              <span className="font-black">
                                2 - 15 Solicitudes
                              </span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/10 pb-4">
                              <span className="font-bold text-on-surface-variant font-sans tracking-tight">
                                TPM (Tokens por Minuto)
                              </span>
                              <span className="font-black">
                                32,000 - 1,000,000
                              </span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/10 pb-4">
                              <span className="font-bold text-on-surface-variant font-sans tracking-tight">
                                RPD (Solicitudes por Día)
                              </span>
                              <span className="font-black">1,500 - 2,000</span>
                            </div>
                            <p className="text-[10px] text-on-surface-variant bg-white/5 p-4 rounded-xl italic">
                              * Nota: En el plan gratuito, Google puede utilizar
                              los datos para mejorar sus modelos. Las cuotas
                              coinciden con Google AI Studio.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-8">
                        <div>
                          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4">
                            Plan de Pago (Producción)
                          </p>
                          <div className="space-y-4 text-xs">
                            <div className="flex justify-between items-center border-b border-white/10 pb-4">
                              <span className="font-bold text-on-surface-variant font-sans tracking-tight">
                                Costo Entrada (Input / 1M tokens)
                              </span>
                              <span className="font-black text-emerald-400">
                                ~$300 COP
                              </span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/10 pb-4">
                              <span className="font-bold text-on-surface-variant font-sans tracking-tight">
                                Costo Salida (Output / 1M tokens)
                              </span>
                              <span className="font-black text-emerald-400">
                                ~$1,200 COP
                              </span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/10 pb-4">
                              <span className="font-bold text-on-surface-variant font-sans tracking-tight">
                                Privacidad de Datos
                              </span>
                              <span className="font-black uppercase tracking-tighter text-emerald-500">
                                Protección Total
                              </span>
                            </div>
                            <p className="text-[10px] text-emerald-500/80 bg-emerald-500/5 p-4 rounded-xl font-bold uppercase tracking-widest text-center border border-emerald-500/20">
                              Los datos NO se usan para entrenamiento en el plan
                              de pago.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                  <div className="bg-orange-50 p-8 rounded-[2rem] border border-orange-100 flex items-start gap-4">
                    <div className="p-3 bg-orange-500 rounded-2xl text-on-surface shrink-0 shadow-lg">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-orange-950 mb-1">
                        Manejo de "Quota Exceeded"
                      </h4>
                      <p className="text-sm font-bold text-orange-950/70 leading-relaxed">
                        Si el asistente deja de responder por cuota excedida, es
                        necesario esperar al reinicio diario de Google. Para
                        remover estos límites, se debe activar la facturación en
                        la consola de Google AI Studio / Google Cloud.
                      </p>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-8 rounded-[2rem] border border-blue-100 flex items-start gap-4">
                    <div className="p-3 bg-blue-500 rounded-2xl text-on-surface shrink-0 shadow-lg">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-blue-950 mb-1">
                        Identidad y Estabilidad
                      </h4>
                      <p className="text-sm font-bold text-blue-950/70 leading-relaxed">
                        Los modelos gemini-3-flash y gemini-3.1-flash son los
                        más estables para el uso de herramientas (Tool Calling),
                        asegurando que los pedidos siempre lleguen al panel del
                        restaurante.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "inbox" && (
              <div className="bg-white rounded-3xl shadow-sm border border-neutral-200 p-8">
                <NotificationInbox />
              </div>
            )}

            {activeTab === "restaurants" && (
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200 text-on-surface-variant text-sm uppercase tracking-wider">
                        <th className="p-4 font-medium">Restaurante</th>
                        <th className="p-4 font-medium">Email Dueño</th>
                        <th className="p-4 font-medium">Gamificación</th>
                        <th className="p-4 font-medium">Estado</th>
                        <th className="p-4 font-medium text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {restaurants.map((restaurant) => {
                        const owner = appUsers.find(
                          (u) => u.id === restaurant.ownerId,
                        );
                        return (
                          <tr
                            key={restaurant.id}
                            className="hover:bg-neutral-50 transition-colors group"
                          >
                            <td className="p-4 flex items-center gap-3">
                              {restaurant.logo ? (
                                <img
                                  src={restaurant.logo}
                                  alt=""
                                  className="w-10 h-10 rounded-full object-cover border border-neutral-200"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center border border-neutral-200">
                                  <Store className="w-5 h-5 text-on-surface-muted" />
                                </div>
                              )}
                              <span className="font-bold text-neutral-900">
                                {restaurant.name}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-neutral-600 font-medium">
                              {owner?.email || "No asignado"}
                            </td>
                            <td className="p-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                  restaurant.gamificationEnabled
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                    : "bg-neutral-100 text-neutral-500 border-neutral-200"
                                }`}
                              >
                                {restaurant.gamificationEnabled
                                  ? "Activado"
                                  : "Inactivo"}
                              </span>
                            </td>
                            <td className="p-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  restaurant.status === "active"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : (restaurant.status as any) ===
                                          "pending_publish" ||
                                        (restaurant.status === "inactive" &&
                                          (restaurant as any)
                                            .highlight_message ===
                                            "pending_publish")
                                      ? "bg-amber-100 text-amber-800 animate-pulse border border-amber-300"
                                      : restaurant.status === "inactive"
                                        ? "bg-amber-50 border border-amber-100 text-stone-500"
                                        : "bg-slate-100 text-slate-800"
                                }`}
                              >
                                {restaurant.status === "active"
                                  ? "Activo"
                                  : (restaurant.status as any) ===
                                        "pending_publish" ||
                                      (restaurant.status === "inactive" &&
                                        (restaurant as any)
                                          .highlight_message ===
                                          "pending_publish")
                                    ? "Pendiente Publicar"
                                    : "Borrador"}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2 transition-opacity">
                                <button
                                  onClick={() => handleStartAudit(restaurant)}
                                  className={`p-1.5 rounded-lg transition-all flex items-center gap-1 font-bold text-xs uppercase ${
                                    (restaurant.status as any) ===
                                      "pending_publish" ||
                                    (restaurant.status === "inactive" &&
                                      (restaurant as any).highlight_message ===
                                        "pending_publish")
                                      ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 px-2.5 py-1 text-[10px] border border-amber-500/25"
                                      : "text-stone-500 hover:bg-stone-100"
                                  }`}
                                  title="Iniciar Auditoría y Publicar"
                                >
                                  <Sparkles
                                    className={`w-3.5 h-3.5 ${(restaurant.status as any) === "pending_publish" || (restaurant.status === "inactive" && (restaurant as any).highlight_message === "pending_publish") ? "animate-pulse stroke-[2.5px]" : ""}`}
                                  />
                                  {((restaurant.status as any) ===
                                    "pending_publish" ||
                                    (restaurant.status === "inactive" &&
                                      (restaurant as any).highlight_message ===
                                        "pending_publish")) &&
                                    "Auditar"}
                                </button>
                                <button
                                  onClick={() =>
                                    setEditingRestaurant(restaurant)
                                  }
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Editar Configuración"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <Link
                                  to={`/admin/${restaurant.id}`}
                                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  title="Gestionar Menú"
                                >
                                  <LayoutList className="w-4 h-4" />
                                </Link>
                                <Link
                                  to={`/r/${restaurant.id}`}
                                  className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                  title="Ver Página Pública"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Link>
                                <button
                                  onClick={() =>
                                    handleToggleFeatured(
                                      restaurant.id,
                                      !!restaurant.isFeatured,
                                    )
                                  }
                                  className={`p-2 rounded-lg transition-colors ${
                                    restaurant.isFeatured
                                      ? "text-amber-500 bg-amber-50"
                                      : "text-on-surface-muted hover:bg-neutral-50"
                                  }`}
                                  title={
                                    restaurant.isFeatured
                                      ? "Quitar de destacados"
                                      : "Destacar"
                                  }
                                >
                                  <Star
                                    className={`w-4 h-4 ${restaurant.isFeatured ? "fill-current" : ""}`}
                                  />
                                </button>
                                <button
                                  onClick={() =>
                                    handleToggleRestaurantStatus(
                                      restaurant.id,
                                      restaurant.status || "active",
                                    )
                                  }
                                  className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                  title={
                                    restaurant.status !== "inactive"
                                      ? "Desactivar"
                                      : "Activar"
                                  }
                                >
                                  {restaurant.status !== "inactive" ? (
                                    <Pause className="w-4 h-4" />
                                  ) : (
                                    <Play className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() =>
                                    setDeleteConfirm({
                                      id: restaurant.id,
                                      type: "restaurant",
                                      name: restaurant.name,
                                    })
                                  }
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "referrals" && <AdminReferralManagement />}

            {activeTab === "representatives" && (
              <AdminRepresentativeManagement />
            )}

            {activeTab === "gamification" && <AdminGamificationManagement />}
            {activeTab === "juegos" && <AdminParchisConfig />}

            {activeTab === "users" && (
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200 text-on-surface-variant text-sm uppercase tracking-wider">
                        <th className="p-4 font-medium">Email</th>
                        <th className="p-4 font-medium">Rol</th>
                        <th className="p-4 font-medium">Dashboard</th>
                        <th className="p-4 font-medium">Estado</th>
                        <th className="p-4 font-medium">Fecha Registro</th>
                        <th className="p-4 font-medium text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {appUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-12 text-center">
                            <div className="flex flex-col items-center gap-3 text-on-surface-muted">
                              <Users className="w-12 h-12 opacity-20" />
                              <p className="font-medium">
                                No se encontraron usuarios.
                              </p>
                              <p className="text-xs max-w-xs mx-auto">
                                Si eres administrador y no ves la lista, puede
                                haber un problema con las políticas de seguridad
                                (RLS) en Supabase.
                              </p>
                              <button
                                onClick={() => fetchData()}
                                className="mt-4 px-4 py-2 bg-orange-600 text-on-surface rounded-lg text-sm font-bold"
                              >
                                Reintentar Carga
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        appUsers.map((user) => (
                          <tr
                            key={user.id}
                            className="hover:bg-neutral-50 transition-colors"
                          >
                            <td className="p-4 font-medium text-neutral-900">
                              {user.email}
                            </td>
                            <td className="p-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  user.role === "admin"
                                    ? "bg-amber-100 text-amber-800"
                                    : user.role === "restaurant"
                                      ? "bg-blue-100 text-blue-800"
                                      : user.role === "driver"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {user.role === "admin"
                                  ? "Administrador"
                                  : user.role === "restaurant"
                                    ? "Restaurante"
                                    : user.role === "driver"
                                      ? "Repartidor"
                                      : "Usuario"}
                              </span>
                            </td>
                            <td className="p-4 text-xs font-mono text-on-surface-variant">
                              {user.role === "admin"
                                ? "/platform"
                                : user.role === "restaurant"
                                  ? "/admin"
                                  : user.role === "driver"
                                    ? "/driver"
                                    : "/profile"}
                            </td>
                            <td className="p-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  user.status === "active"
                                    ? "bg-orange-100 text-orange-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {user.status === "active"
                                  ? "Activo"
                                  : "Pausado"}
                              </span>
                            </td>
                            <td className="p-4 text-neutral-600">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setEditingUser(user)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Cambiar Rol"
                                >
                                  <Shield className="w-4 h-4" />
                                </button>
                                {user.status === "active" ? (
                                  <button
                                    onClick={() =>
                                      handleUpdateUserStatus(user.id, "paused")
                                    }
                                    className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                    title="Pausar Usuario"
                                  >
                                    <Pause className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() =>
                                      handleUpdateUserStatus(user.id, "active")
                                    }
                                    className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                    title="Activar Usuario"
                                  >
                                    <Play className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() =>
                                    setDeleteConfirm({
                                      id: user.id,
                                      type: "user",
                                      name: user.email,
                                    })
                                  }
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Eliminar Usuario"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "drivers" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-muted mb-1">
                      Pendientes de Aprobación
                    </p>
                    <p className="text-3xl font-black text-orange-600">
                      {
                        drivers.filter((d) => d.approval_status === "pending")
                          .length
                      }
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-muted mb-1">
                      Aprobados
                    </p>
                    <p className="text-3xl font-black text-emerald-600">
                      {
                        drivers.filter((d) => d.approval_status === "approved")
                          .length
                      }
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-muted mb-1">
                      En Línea
                    </p>
                    <p className="text-3xl font-black text-blue-600">
                      {drivers.filter((d) => d.is_online).length}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-neutral-50 border-b border-neutral-200 text-on-surface-variant text-[10px] font-black uppercase tracking-widest">
                          <th className="p-4">Repartidor</th>
                          <th className="p-4">Vehículo</th>
                          <th className="p-4">Documento</th>
                          <th className="p-4">Estado</th>
                          <th className="p-4">Aprobación</th>
                          <th className="p-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {drivers.map((driver) => {
                          const user = Array.isArray(driver.app_users)
                            ? driver.app_users[0]
                            : driver.app_users;
                          const restaurant = restaurants.find(
                            (r) => r.id === driver.restaurant_id,
                          );
                          return (
                            <tr
                              key={driver.id}
                              className="hover:bg-neutral-50 transition-colors"
                            >
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-neutral-100 overflow-hidden border border-neutral-200">
                                    {driver.profile_photo ? (
                                      <img
                                        src={driver.profile_photo}
                                        alt=""
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <Users className="w-5 h-5 text-on-surface-muted m-2.5" />
                                    )}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-black text-neutral-900">
                                      {user?.display_name || "Sin nombre"}
                                    </span>
                                    <span className="text-[10px] text-on-surface-muted font-bold">
                                      {user?.email}
                                    </span>
                                    <span className="text-[10px] text-on-surface-muted font-medium">
                                      Doc: {driver.document_number || "N/A"}
                                    </span>
                                    {restaurant && (
                                      <span className="text-[10px] text-orange-600 font-black uppercase tracking-widest mt-0.5">
                                        Vinculado a: {restaurant.name}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2 text-neutral-600">
                                    {driver.vehicle_type === "motorcycle" && (
                                      <Bike className="w-4 h-4" />
                                    )}
                                    {driver.vehicle_type === "motocarro" && (
                                      <Truck className="w-4 h-4" />
                                    )}
                                    {driver.vehicle_type === "bicycle" && (
                                      <Bike className="w-4 h-4" />
                                    )}
                                    {driver.vehicle_type === "car" && (
                                      <Car className="w-4 h-4" />
                                    )}
                                    <span className="capitalize text-xs font-bold">
                                      {driver.vehicle_type}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-mono text-on-surface-muted">
                                    {driver.license_plate} •{" "}
                                    {driver.vehicle_color}
                                  </span>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className="text-xs font-bold text-neutral-600">
                                  {driver.document_number || "N/A"}
                                </span>
                              </td>
                              <td className="p-4">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    driver.is_online
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-neutral-100 text-neutral-800"
                                  }`}
                                >
                                  {driver.is_online
                                    ? "En línea"
                                    : "Desconectado"}
                                </span>
                              </td>
                              <td className="p-4">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    driver.approval_status === "approved"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : driver.approval_status === "rejected"
                                        ? "bg-rose-100 text-rose-800"
                                        : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {driver.approval_status === "approved"
                                    ? "Aprobado"
                                    : driver.approval_status === "rejected"
                                      ? "Rechazado"
                                      : "Pendiente"}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setSelectedDriver(driver)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Ver Documentos"
                                  >
                                    <FileText className="w-4 h-4" />
                                  </button>
                                  {driver.approval_status !== "approved" && (
                                    <button
                                      onClick={() =>
                                        handleUpdateDriverApproval(
                                          driver.id,
                                          "approved",
                                        )
                                      }
                                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                      title="Aprobar"
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                    </button>
                                  )}
                                  {driver.approval_status !== "rejected" && (
                                    <button
                                      onClick={() =>
                                        handleUpdateDriverApproval(
                                          driver.id,
                                          "rejected",
                                        )
                                      }
                                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                      title="Rechazar"
                                    >
                                      <Pause className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "meta_social" && (
              <AdminMetaManager
                restaurants={restaurants}
                onUpdateRestaurants={fetchData}
              />
            )}

            {activeTab === "marketing" && settings && (
              <AdminMarketingHub
                settings={settings}
                setSettings={setSettings}
                handleSaveSettings={handleSaveSettings}
                isSavingSettings={isSavingSettings}
                handleSaveBusinessCategories={handleSaveBusinessCategories}
                isSavingBusinessCategories={isSavingBusinessCategories}
                handleAddBusinessCategory={handleAddBusinessCategory}
                handleDuplicateBusinessCategory={handleDuplicateBusinessCategory}
                handleReorderBusinessCategory={handleReorderBusinessCategory}
                handleToggleBusinessCategoryActive={handleToggleBusinessCategoryActive}
                handleUpdateBusinessCategory={handleUpdateBusinessCategory}
                handleDeleteBusinessCategory={handleDeleteBusinessCategory}
                handleAddBanner={handleAddBanner}
                handleUpdateBanner={handleUpdateBanner}
                handleDeleteBanner={handleDeleteBanner}
                handleAddHeroBanner={handleAddHeroBanner}
                handleUpdateHeroBanner={handleUpdateHeroBanner}
                handleDeleteHeroBanner={handleDeleteHeroBanner}
                handleAddFoodCategory={handleAddFoodCategory}
                handleUpdateFoodCategory={handleUpdateFoodCategory}
                handleDeleteFoodCategory={handleDeleteFoodCategory}
                coupons={coupons}
                setEditingCoupon={setEditingCoupon}
                handleDeleteCoupon={handleDeleteCoupon}
                setCropper={setCropper}
              />
            )}

            {activeTab === "plans" && (
              <PlanManager plans={plans} onPlansChange={fetchData} />
            )}

            {activeTab === "billing" && (
              <div className="bg-white rounded-3xl shadow-sm border border-neutral-200 p-8">
                <h2 className="text-2xl font-black text-neutral-900">
                  Facturación (En construcción)
                </h2>
              </div>
            )}

            {activeTab === "payments" && (
              <div className="bg-white rounded-3xl shadow-sm border border-neutral-200 p-8">
                <h2 className="text-2xl font-black text-neutral-900">
                  Pagos Pendientes (En construcción)
                </h2>
              </div>
            )}

            {activeTab === "traffic" && <AdminTrafficDashboard />}
            {activeTab === "stats" && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h2 className="text-3xl font-black text-neutral-900 tracking-tight flex items-center gap-3">
                    <TrendingUp className="w-8 h-8 text-blue-600" />
                    Dashboard Principal
                  </h2>
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-neutral-200">
                    <DateSelector
                      value={dateFilter.start}
                      onChange={(val) =>
                        setDateFilter({ ...dateFilter, start: val })
                      }
                    />
                    <span className="text-on-surface-muted font-bold px-2">
                      -
                    </span>
                    <DateSelector
                      value={dateFilter.end}
                      onChange={(val) =>
                        setDateFilter({ ...dateFilter, end: val })
                      }
                    />
                  </div>
                </div>

                {(() => {
                  const filteredOrders = orders.filter((o) => {
                    if (!o.createdAt) return false;
                    const d = new Date(o.createdAt).toISOString().split("T")[0];
                    return d >= dateFilter.start && d <= dateFilter.end;
                  });

                  const totalRevenue = filteredOrders.reduce(
                    (sum, o) => sum + (Number(o.total) || 0),
                    0,
                  );
                  const activeRests = restaurants.filter(
                    (r) => r.status !== "inactive",
                  ).length;
                  const usersCount = appUsers.length;

                  const subscriptionRevenue = invoices
                    .filter(
                      (i) => i.type === "subscription" && i.status === "paid",
                    )
                    .reduce((sum, i) => sum + Number(i.amount), 0);

                  const commissionRevenue = invoices
                    .filter(
                      (i) => i.type === "commission" && i.status === "paid",
                    )
                    .reduce((sum, i) => sum + Number(i.amount), 0);

                  const pendingRevenue = invoices
                    .filter((i) => i.status === "pending")
                    .reduce((sum, i) => sum + Number(i.amount), 0);

                  return (
                    <div className="space-y-6">
                      {/* Top Metrics Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-3xl shadow-lg relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <DollarSign className="w-24 h-24 text-on-surface" />
                          </div>
                          <p className="text-blue-100 font-bold mb-1">
                            Ventas Brutas
                          </p>
                          <p className="text-3xl font-black text-on-surface">
                            {formatCurrency(totalRevenue)}
                          </p>
                          <p className="text-blue-200 text-xs mt-2 font-medium">
                            Volumen procesado en el periodo
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-3xl shadow-lg relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Store className="w-24 h-24 text-on-surface" />
                          </div>
                          <p className="text-emerald-100 font-bold mb-1">
                            Restaurantes Activos
                          </p>
                          <p className="text-3xl font-black text-on-surface">
                            {activeRests}
                          </p>
                          <p className="text-emerald-200 text-xs mt-2 font-medium">
                            Liderando el ecosistema
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-3xl shadow-lg relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <ShoppingBag className="w-24 h-24 text-on-surface" />
                          </div>
                          <p className="text-orange-100 font-bold mb-1">
                            Pedidos Totales
                          </p>
                          <p className="text-3xl font-black text-on-surface">
                            {filteredOrders.length}
                          </p>
                          <p className="text-orange-200 text-xs mt-2 font-medium">
                            Encuentros completados
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-3xl shadow-lg relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Users className="w-24 h-24 text-on-surface" />
                          </div>
                          <p className="text-indigo-100 font-bold mb-1">
                            Usuarios Afiliados
                          </p>
                          <p className="text-3xl font-black text-on-surface">
                            {usersCount}
                          </p>
                          <p className="text-indigo-200 text-xs mt-2 font-medium">
                            Clientes y Repartidores
                          </p>
                        </div>
                      </div>

                      {/* Secondary Revenue Metrics */}
                      <h3 className="text-lg font-bold text-neutral-900 pt-4">
                        Ingresos de la Plataforma
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex items-center gap-4">
                          <div className="bg-emerald-100 p-4 rounded-xl text-emerald-600">
                            <Shield className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">
                              Suscripciones
                            </p>
                            <p className="text-xl font-black text-neutral-900">
                              {formatCurrency(subscriptionRevenue)}
                            </p>
                            <p className="text-[10px] text-on-surface-muted font-bold mt-0.5">
                              Cobros pagados
                            </p>
                          </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex items-center gap-4">
                          <div className="bg-blue-100 p-4 rounded-xl text-blue-600">
                            <TrendingUp className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">
                              Comisiones
                            </p>
                            <p className="text-xl font-black text-neutral-900">
                              {formatCurrency(commissionRevenue)}
                            </p>
                            <p className="text-[10px] text-on-surface-muted font-bold mt-0.5">
                              Recaudado
                            </p>
                          </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex items-center gap-4">
                          <div className="bg-rose-100 p-4 rounded-xl text-rose-600">
                            <AlertTriangle className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">
                              Por Cobrar
                            </p>
                            <p className="text-xl font-black text-neutral-900">
                              {formatCurrency(pendingRevenue)}
                            </p>
                            <p className="text-[10px] text-on-surface-muted font-bold mt-0.5">
                              Facturas pendientes
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Live Security & Anti-Bot Insights */}
                      <div className="mt-8 bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 p-6 rounded-3xl border border-rose-950/40 relative overflow-hidden group shadow-lg">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Shield className="w-24 h-24 text-white" />
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 z-10 relative">
                          <div>
                            <p className="text-rose-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                              Motor de Heurística y Anti-Bot Activo
                            </p>
                            <h4 className="text-xl font-black text-white mt-1">Integridad del Sistema y Red</h4>
                          </div>
                          <button
                            onClick={() => setActiveTab("traffic")}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wide rounded-xl transition-all shadow-sm shadow-rose-900/40"
                          >
                            Ir a Panel de Seguridad
                          </button>
                        </div>
                        <p className="text-slate-400 text-xs font-medium mb-4 leading-relaxed max-w-2xl">
                          Nuestra capa de identificación y heurística analiza firmas de hardware (Canvas Fingerprinting), emuladores automatizados y patrones sospechosos de navegación en tiempo real para proteger el ecosistema contra scrapers, spammers y bots.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/40 flex items-center gap-3">
                            <Bot className="w-5 h-5 text-rose-400" />
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tráfico Automatizado (Bots)</p>
                              <p className="text-lg font-black text-rose-400 mt-0.5">Detectado y Marcado</p>
                            </div>
                          </div>
                          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/40 flex items-center gap-3">
                            <Fingerprint className="w-5 h-5 text-amber-400" />
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Huellas Digitales (Fingerprints)</p>
                              <p className="text-lg font-black text-amber-400 mt-0.5">Identificación Única</p>
                            </div>
                          </div>
                          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/40 flex items-center gap-3">
                            <Activity className="w-5 h-5 text-emerald-400" />
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Análisis en Tiempo Real</p>
                              <p className="text-lg font-black text-emerald-400 mt-0.5">Activo y Resguardado</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {!selectedRestaurantId ? (
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                      <h3 className="text-xl font-bold text-neutral-900">
                        Estadísticas Detalladas por Restaurante
                      </h3>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => {
                            setLoading(true);
                            fetchData();
                          }}
                          className="p-2 text-on-surface-variant hover:text-orange-600 transition-colors"
                          title="Refrescar datos"
                        >
                          <TrendingUp
                            className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
                          />
                        </button>
                        <div className="flex items-center gap-2">
                          <DateSelector
                            value={dateFilter.start}
                            onChange={(val) =>
                              setDateFilter({ ...dateFilter, start: val })
                            }
                          />
                          <span className="text-on-surface-muted">-</span>
                          <DateSelector
                            value={dateFilter.end}
                            onChange={(val) =>
                              setDateFilter({ ...dateFilter, end: val })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-neutral-50 border-b border-neutral-200 text-on-surface-variant text-xs uppercase tracking-wider">
                            <th className="p-4 font-medium">Restaurante</th>
                            <th className="p-4 font-medium">Ventas Totales</th>
                            <th className="p-4 font-medium">Pedidos</th>
                            <th className="p-4 font-medium">Comisión %</th>
                            <th className="p-4 font-medium">Ganancia App</th>
                            <th className="p-4 font-medium">
                              A Pagar al Restaurante
                            </th>
                            <th className="p-4 font-medium text-right">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                          {restaurants.length === 0 ? (
                            <tr>
                              <td
                                colSpan={7}
                                className="p-8 text-center text-on-surface-variant"
                              >
                                No hay restaurantes registrados
                              </td>
                            </tr>
                          ) : (
                            restaurants.map((restaurant) => {
                              const restaurantOrders = orders.filter((o) => {
                                if (!o.createdAt || !o.restaurantId)
                                  return false;
                                try {
                                  const orderDate = new Date(o.createdAt)
                                    .toISOString()
                                    .split("T")[0];
                                  return (
                                    String(o.restaurantId) ===
                                      String(restaurant.id) &&
                                    orderDate >= dateFilter.start &&
                                    orderDate <= dateFilter.end
                                  );
                                } catch (e) {
                                  return false;
                                }
                              });

                              const sales = restaurantOrders.reduce(
                                (sum, o) => sum + (Number(o.total) || 0),
                                0,
                              );
                              const commissionRate =
                                Number(restaurant.commissionRate) || 5;
                              const commission = sales * (commissionRate / 100);
                              const netToRestaurant = sales - commission;

                              return (
                                <tr
                                  key={restaurant.id}
                                  className="hover:bg-neutral-50 transition-colors"
                                >
                                  <td className="p-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden">
                                        {restaurant.logo ? (
                                          <img
                                            src={restaurant.logo}
                                            alt=""
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                          />
                                        ) : (
                                          <Store className="w-4 h-4 text-on-surface-muted" />
                                        )}
                                      </div>
                                      <span className="font-bold text-neutral-900">
                                        {restaurant.name}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-4 font-bold text-neutral-900">
                                    {formatCurrency(sales)}
                                  </td>
                                  <td className="p-4 text-neutral-600">
                                    {restaurantOrders.length}
                                  </td>
                                  <td className="p-4">
                                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-bold text-xs">
                                      {commissionRate}%
                                    </span>
                                  </td>
                                  <td className="p-4 font-bold text-emerald-600">
                                    {formatCurrency(commission)}
                                  </td>
                                  <td className="p-4 font-bold text-orange-600">
                                    {formatCurrency(netToRestaurant)}
                                  </td>
                                  <td className="p-4 text-right">
                                    <button
                                      onClick={() => {
                                        console.log(
                                          "Selecting restaurant:",
                                          restaurant.id,
                                        );
                                        setSelectedRestaurantId(restaurant.id);
                                      }}
                                      className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                      title="Ver Detalles"
                                    >
                                      <FileText className="w-5 h-5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="bg-surface-variant text-on-surface font-bold">
                            <td className="p-4">TOTALES</td>
                            <td className="p-4">
                              $
                              {orders
                                .filter((o) => {
                                  if (!o.createdAt) return false;
                                  const d = new Date(o.createdAt)
                                    .toISOString()
                                    .split("T")[0];
                                  return (
                                    d >= dateFilter.start && d <= dateFilter.end
                                  );
                                })
                                .reduce(
                                  (sum, o) => sum + (Number(o.total) || 0),
                                  0,
                                )
                                .toLocaleString("es-CO")}
                            </td>
                            <td className="p-4">
                              {
                                orders.filter((o) => {
                                  if (!o.createdAt) return false;
                                  const d = new Date(o.createdAt)
                                    .toISOString()
                                    .split("T")[0];
                                  return (
                                    d >= dateFilter.start && d <= dateFilter.end
                                  );
                                }).length
                              }
                            </td>
                            <td className="p-4">-</td>
                            <td className="p-4 text-emerald-400">
                              $
                              {orders
                                .filter((o) => {
                                  if (!o.createdAt) return false;
                                  const d = new Date(o.createdAt)
                                    .toISOString()
                                    .split("T")[0];
                                  return (
                                    d >= dateFilter.start && d <= dateFilter.end
                                  );
                                })
                                .reduce((sum, o) => {
                                  const r = restaurants.find(
                                    (res) =>
                                      String(res.id) === String(o.restaurantId),
                                  );
                                  return (
                                    sum +
                                    (Number(o.total) || 0) *
                                      ((Number(r?.commissionRate) || 5) / 100)
                                  );
                                }, 0)
                                .toLocaleString("es-CO")}
                            </td>
                            <td className="p-4">-</td>
                            <td className="p-4"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {(() => {
                      const restaurant = restaurants.find(
                        (r) => r.id === selectedRestaurantId,
                      );
                      if (!restaurant) return null;

                      const restaurantOrders = orders.filter((o) => {
                        if (!o.createdAt || !o.restaurantId) return false;
                        try {
                          const orderDate = new Date(o.createdAt)
                            .toISOString()
                            .split("T")[0];
                          return (
                            String(o.restaurantId) === String(restaurant.id) &&
                            orderDate >= dateFilter.start &&
                            orderDate <= dateFilter.end
                          );
                        } catch (e) {
                          return false;
                        }
                      });

                      const sales = restaurantOrders.reduce(
                        (sum, o) => sum + (Number(o.total) || 0),
                        0,
                      );
                      const commissionRate =
                        Number(restaurant.commissionRate) || 5;
                      const appEarnings = sales * (commissionRate / 100);
                      const restaurantPayable = sales - appEarnings;

                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => setSelectedRestaurantId(null)}
                              className="flex items-center gap-2 text-on-surface-variant hover:text-neutral-900 transition-colors font-bold"
                            >
                              <ChevronLeft className="w-5 h-5" />
                              Volver al listado
                            </button>
                            <button
                              onClick={() =>
                                exportToPDF(
                                  restaurant,
                                  restaurantOrders,
                                  sales,
                                  appEarnings,
                                  restaurantPayable,
                                )
                              }
                              className="flex items-center gap-2 bg-orange-600 text-on-surface px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange-700 transition-all shadow-lg shadow-orange-200"
                            >
                              <Download className="w-4 h-4" />
                              Exportar PDF
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-8 rounded-[2rem] border border-neutral-200 shadow-sm">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-muted mb-2">
                                Ventas Totales
                              </p>
                              <p className="text-3xl font-black text-neutral-900">
                                {formatCurrency(sales)}
                              </p>
                            </div>
                            <div className="bg-white p-8 rounded-[2rem] border border-neutral-200 shadow-sm">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600/60 mb-2">
                                Comisión App ({commissionRate}%)
                              </p>
                              <p className="text-3xl font-black text-orange-600">
                                {formatCurrency(appEarnings)}
                              </p>
                            </div>
                            <div className="bg-white p-8 rounded-[2rem] border border-neutral-200 shadow-sm">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600/60 mb-2">
                                Neto Restaurante
                              </p>
                              <p className="text-3xl font-black text-emerald-600">
                                {formatCurrency(restaurantPayable)}
                              </p>
                            </div>
                          </div>

                          <div className="bg-white p-8 rounded-2xl shadow-xl border border-neutral-100">
                            <h3 className="text-xl font-black mb-6">
                              Movimientos Detallados: {restaurant.name}
                            </h3>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="text-[10px] font-black text-on-surface-muted uppercase tracking-[0.2em] border-b border-neutral-100">
                                    <th className="pb-4">ID Pedido</th>
                                    <th className="pb-4">Fecha</th>
                                    <th className="pb-4">Cliente</th>
                                    <th className="pb-4">Total</th>
                                    <th className="pb-4">Comisión</th>
                                    <th className="pb-4">Neto</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-50">
                                  {restaurantOrders.length === 0 ? (
                                    <tr>
                                      <td
                                        colSpan={6}
                                        className="py-8 text-center text-on-surface-variant font-bold"
                                      >
                                        No hay movimientos registrados en este
                                        periodo
                                      </td>
                                    </tr>
                                  ) : (
                                    restaurantOrders.map((order) => {
                                      const total = Number(order.total) || 0;
                                      const commission =
                                        total * (commissionRate / 100);
                                      const net = total - commission;
                                      return (
                                        <tr
                                          key={order.id}
                                          className="text-sm font-bold text-neutral-700 hover:bg-neutral-50 transition-colors"
                                        >
                                          <td className="py-4 font-mono text-xs text-on-surface-muted">
                                            #{order.id?.slice(0, 8) || "---"}
                                          </td>
                                          <td className="py-4">
                                            {order.createdAt
                                              ? new Date(
                                                  order.createdAt,
                                                ).toLocaleDateString()
                                              : "---"}
                                          </td>
                                          <td className="py-4">
                                            {order.customerName || "Cliente"}
                                          </td>
                                          <td className="py-4">
                                            {formatCurrency(total)}
                                          </td>
                                          <td className="py-4 text-red-500">
                                            -$
                                            {commission.toLocaleString("es-CO")}
                                          </td>
                                          <td className="py-4 text-emerald-600 font-black">
                                            {formatCurrency(net)}
                                          </td>
                                        </tr>
                                      );
                                    })
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {activeTab === "communications" && (
              <div className="bg-white rounded-3xl shadow-sm border border-neutral-200 p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
                      Comunicaciones del Sistema
                    </h2>
                    <p className="text-on-surface-variant font-medium">
                      Gestiona las notificaciones y avisos internos de la
                      plataforma.
                    </p>
                  </div>
                  <div className="flex p-1 bg-neutral-100 rounded-2xl">
                    <button
                      onClick={() => setCommunicationsSubTab("send")}
                      className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        communicationsSubTab === "send"
                          ? "bg-white text-orange-600 shadow-sm"
                          : "text-on-surface-variant hover:text-neutral-900"
                      }`}
                    >
                      Enviar Aviso
                    </button>
                    <button
                      onClick={() => setCommunicationsSubTab("history")}
                      className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        communicationsSubTab === "history"
                          ? "bg-white text-orange-600 shadow-sm"
                          : "text-on-surface-variant hover:text-neutral-900"
                      }`}
                    >
                      Historial
                    </button>
                    <button
                      onClick={() => setCommunicationsSubTab("scheduled")}
                      className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        communicationsSubTab === "scheduled"
                          ? "bg-white text-orange-600 shadow-sm"
                          : "text-on-surface-variant hover:text-neutral-900"
                      }`}
                    >
                      Programadas
                    </button>
                  </div>
                </div>

                {communicationsSubTab === "send" && (
                  <div className="max-w-2xl">
                    <div className="space-y-6">
                      <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2">
                              Segmento Destinatario
                            </label>
                            <select
                              value={notificationForm.target}
                              onChange={(e) =>
                                setNotificationForm({
                                  ...notificationForm,
                                  target: e.target.value as any,
                                })
                              }
                              className="w-full p-4 bg-white border-2 border-neutral-100 rounded-2xl font-bold focus:border-orange-500 outline-none transition-all appearance-none text-neutral-900"
                            >
                              <option value="all">
                                🚀 Todos los Usuarios (General)
                              </option>
                              <option value="all_customers">
                                👥 Todos los Clientes (Solo Usuarios)
                              </option>
                              <option value="all_restaurants">
                                🏪 Dueños de Restaurantes
                              </option>
                              <option value="all_drivers">
                                🚲 Todos los Repartidores
                              </option>
                              <option value="restaurant_customers">
                                📍 Clientes de un Restaurante Específico
                              </option>
                            </select>
                          </div>

                          {notificationForm.target ===
                            "restaurant_customers" && (
                            <div>
                              <label className="block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2">
                                Seleccionar Restaurante
                              </label>
                              <select
                                value={notificationForm.restaurantId}
                                onChange={(e) =>
                                  setNotificationForm({
                                    ...notificationForm,
                                    restaurantId: e.target.value,
                                  })
                                }
                                className="w-full p-4 bg-white border-2 border-neutral-100 rounded-2xl font-bold focus:border-orange-500 outline-none transition-all appearance-none text-neutral-900"
                              >
                                <option value="">
                                  Selecciona un restaurante...
                                </option>
                                {restaurants.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div className="pt-2">
                            <label className="block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2">
                              Categoría del Aviso
                            </label>
                            <select
                              value={notificationForm.category}
                              onChange={(e) =>
                                setNotificationForm({
                                  ...notificationForm,
                                  category: e.target.value,
                                })
                              }
                              className="w-full p-4 bg-white border-2 border-neutral-100 rounded-2xl font-bold focus:border-orange-500 outline-none transition-all appearance-none text-neutral-900"
                            >
                              <option value="pagos">
                                💳 Pagos y Facturación
                              </option>
                              <option value="capacitación">
                                🎓 Capacitación / Tutoriales
                              </option>
                              <option value="soporte">
                                🛠️ Soporte Técnico
                              </option>
                              <option value="actualizaciones">
                                🆙 Actualizaciones del Sistema
                              </option>
                              <option value="visitas">
                                📍 Visitas y Auditorías
                              </option>
                              <option value="cupones">
                                🎟️ Cupones de Plataforma
                              </option>
                              <option value="premios">
                                🏆 Premios y Reconocimientos
                              </option>
                              <option value="información">
                                ℹ️ Información General
                              </option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-2xl border border-neutral-100 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-neutral-900">
                            Programar Envío
                          </p>
                          <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
                            El aviso se enviará automáticamente en la fecha
                            indicada
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            setNotificationForm({
                              ...notificationForm,
                              isScheduled: !notificationForm.isScheduled,
                            })
                          }
                          className={`w-12 h-6 rounded-full transition-all relative ${notificationForm.isScheduled ? "bg-orange-500" : "bg-neutral-200"}`}
                        >
                          <div
                            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${notificationForm.isScheduled ? "left-7" : "left-1"}`}
                          />
                        </button>
                      </div>

                      {notificationForm.isScheduled && (
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                          <div>
                            <label className="block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2">
                              Fecha de Envío
                            </label>
                            <input
                              type="date"
                              value={notificationForm.scheduledDate}
                              onChange={(e) =>
                                setNotificationForm({
                                  ...notificationForm,
                                  scheduledDate: e.target.value,
                                })
                              }
                              className="w-full p-4 bg-white border-2 border-neutral-100 rounded-2xl font-bold focus:border-orange-500 outline-none transition-all text-neutral-900"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2">
                              Hora de Envío
                            </label>
                            <input
                              type="time"
                              value={notificationForm.scheduledTime}
                              onChange={(e) =>
                                setNotificationForm({
                                  ...notificationForm,
                                  scheduledTime: e.target.value,
                                })
                              }
                              className="w-full p-4 bg-white border-2 border-neutral-100 rounded-2xl font-bold focus:border-orange-500 outline-none transition-all text-neutral-900"
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2">
                            Título del Aviso / Notificación
                          </label>
                          <input
                            type="text"
                            value={notificationForm.title}
                            onChange={(e) =>
                              setNotificationForm({
                                ...notificationForm,
                                title: e.target.value,
                              })
                            }
                            placeholder="Ej: ¡Nueva Promoción Disponible!"
                            className="w-full p-4 bg-neutral-50 border-2 border-neutral-100 rounded-2xl font-bold focus:border-orange-500 outline-none transition-all text-neutral-900"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2">
                            Mensaje (Cuerpo)
                          </label>
                          <textarea
                            value={notificationForm.body}
                            onChange={(e) =>
                              setNotificationForm({
                                ...notificationForm,
                                body: e.target.value,
                              })
                            }
                            placeholder="Escribe el contenido del mensaje aquí..."
                            rows={4}
                            className="w-full p-4 bg-neutral-50 border-2 border-neutral-100 rounded-2xl font-bold focus:border-orange-500 outline-none transition-all resize-none text-neutral-900"
                          />
                        </div>
                      </div>

                      <div className="pt-4">
                        <button
                          disabled={
                            isSendingNotification ||
                            !notificationForm.title ||
                            !notificationForm.body ||
                            (notificationForm.target ===
                              "restaurant_customers" &&
                              !notificationForm.restaurantId) ||
                            (notificationForm.isScheduled &&
                              (!notificationForm.scheduledDate ||
                                !notificationForm.scheduledTime))
                          }
                          onClick={async () => {
                            setIsSendingNotification(true);
                            try {
                              if (notificationForm.isScheduled) {
                                const scheduledDateTime = new Date(
                                  `${notificationForm.scheduledDate}T${notificationForm.scheduledTime}`,
                                ).toISOString();

                                await db.scheduleNotification({
                                  senderId: user?.id,
                                  title: notificationForm.title,
                                  body: notificationForm.body,
                                  category: notificationForm.category,
                                  targetSegment: notificationForm.target,
                                  scheduledFor: scheduledDateTime,
                                });

                                toast.success("Aviso programado exitosamente");
                                const resScheduled =
                                  await db.getScheduledNotifications();
                                setScheduledNotes(resScheduled);
                                setNotificationForm({
                                  ...notificationForm,
                                  title: "",
                                  body: "",
                                  isScheduled: false,
                                  scheduledDate: "",
                                  scheduledTime: "",
                                });
                              } else {
                                const response = await fetch(
                                  "/api/notifications/send",
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      topic: notificationForm.target,
                                      restaurantId:
                                        notificationForm.restaurantId,
                                      senderId: user?.id,
                                      title: notificationForm.title,
                                      body: notificationForm.body,
                                      data: {
                                        category: notificationForm.category,
                                        type: "platform_broadcast",
                                      },
                                    }),
                                  },
                                );

                                if (response.ok) {
                                  const result = await response.json();
                                  toast.success(
                                    result.message ||
                                      "Aviso enviado exitosamente",
                                  );
                                  setNotificationForm({
                                    ...notificationForm,
                                    title: "",
                                    body: "",
                                    isScheduled: false,
                                  });
                                  const resCampaigns =
                                    await db.getNotificationCampaigns();
                                  setCampaigns(resCampaigns);
                                } else {
                                  const err = await response.json();
                                  toast.error(
                                    `Error: ${err.error || "No se pudo enviar"}`,
                                  );
                                }
                              }
                            } catch (e) {
                              toast.error(
                                "Error de conexión con el servidor. Inténtalo de nuevo.",
                              );
                            } finally {
                              setIsSendingNotification(false);
                            }
                          }}
                          className="w-full py-4 bg-surface-variant text-on-surface font-black rounded-2xl shadow-xl shadow-neutral-100 hover:bg-surface-base transition-all disabled:opacity-50 flex items-center justify-center gap-3 active:scale-[0.98]"
                        >
                          <BellRing className="w-5 h-5 text-orange-500" />
                          {isSendingNotification
                            ? "Procesando..."
                            : notificationForm.isScheduled
                              ? "Programar Aviso"
                              : "Enviar Aviso Inmediato"}
                        </button>
                        <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
                          <AlertTriangle className="w-4 h-4 text-amber-600 mt-1 flex-shrink-0" />
                          <p className="text-[10px] text-amber-800 font-bold uppercase tracking-widest leading-relaxed">
                            Este sistema envía tanto un aviso interno al buzón
                            del usuario como una notificación push inmediata.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {communicationsSubTab === "history" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-neutral-900 uppercase tracking-widest text-xs">
                        Historial de Campañas Enviadas
                      </h3>
                      <button
                        onClick={handleClearHistory}
                        disabled={isClearingHistory || campaigns.length === 0}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                        {isClearingHistory
                          ? "Borrando..."
                          : "Limpiar Historial"}
                      </button>
                    </div>
                    {campaigns.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-neutral-50 border-b border-neutral-200 text-on-surface-variant text-[10px] font-black uppercase tracking-widest">
                              <th className="p-4">Fecha</th>
                              <th className="p-4">Segmento</th>
                              <th className="p-4">Título</th>
                              <th className="p-4">Mensaje</th>
                              <th className="p-4 text-right">Alcance</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100">
                            {campaigns.map((campaign) => (
                              <tr
                                key={campaign.id}
                                className="hover:bg-neutral-50 transition-colors"
                              >
                                <td className="p-4 text-xs font-bold text-on-surface-variant">
                                  {new Date(
                                    campaign.createdAt,
                                  ).toLocaleDateString()}
                                </td>
                                <td className="p-4">
                                  <span className="bg-neutral-100 text-neutral-600 px-2 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest">
                                    {campaign.targetSegment === "all"
                                      ? "🚀 Todos"
                                      : campaign.targetSegment ===
                                          "all_restaurants"
                                        ? "🏪 Restaurantes"
                                        : campaign.targetSegment ===
                                            "all_drivers"
                                          ? "🚲 Repartidores"
                                          : campaign.targetSegment ===
                                              "restaurant_customers"
                                            ? "👥 Clientes"
                                            : campaign.targetSegment}
                                  </span>
                                </td>
                                <td className="p-4 font-bold text-neutral-900 text-sm">
                                  {campaign.title}
                                </td>
                                <td className="p-4 text-neutral-600 text-sm truncate max-w-[200px]">
                                  {campaign.body}
                                </td>
                                <td className="p-4 text-right">
                                  <span className="font-bold text-emerald-600">
                                    Enviado
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-20 text-center bg-neutral-50 rounded-[2rem] border border-neutral-200 border-dashed">
                        <BellRing className="w-12 h-12 text-on-surface-variant mx-auto mb-4" />
                        <p className="text-on-surface-variant font-bold">
                          No hay historial de envíos todavía.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {communicationsSubTab === "scheduled" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-neutral-900 uppercase tracking-widest text-xs">
                        Avisos Programados Pendientes
                      </h3>
                      <button
                        onClick={handleClearHistory}
                        disabled={
                          isClearingHistory || scheduledNotes.length === 0
                        }
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                        {isClearingHistory
                          ? "Borrando..."
                          : "Vaciar Programados"}
                      </button>
                    </div>
                    {scheduledNotes.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-neutral-50 border-b border-neutral-200 text-on-surface-variant text-[10px] font-black uppercase tracking-widest">
                              <th className="p-4">Programado Para</th>
                              <th className="p-4">Categoría</th>
                              <th className="p-4">Título</th>
                              <th className="p-4">Estado</th>
                              <th className="p-4 text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100">
                            {scheduledNotes.map((note) => (
                              <tr
                                key={note.id}
                                className="hover:bg-neutral-50 transition-colors"
                              >
                                <td className="p-4 text-xs font-bold text-neutral-900">
                                  {new Date(note.scheduledFor).toLocaleString()}
                                </td>
                                <td className="p-4">
                                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest">
                                    {note.category}
                                  </span>
                                </td>
                                <td className="p-4 font-bold text-neutral-900 text-sm">
                                  {note.title}
                                </td>
                                <td className="p-4">
                                  {note.isSent ? (
                                    <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest">
                                      Enviado
                                    </span>
                                  ) : (
                                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest">
                                      Pendiente
                                    </span>
                                  )}
                                </td>
                                <td className="p-4 text-right">
                                  {!note.isSent && (
                                    <button
                                      onClick={async () => {
                                        if (
                                          confirm(
                                            "¿Estás seguro de eliminar esta programación?",
                                          )
                                        ) {
                                          try {
                                            await db.deleteScheduledNotification(
                                              note.id,
                                            );
                                            setScheduledNotes((prev) =>
                                              prev.filter(
                                                (n) => n.id !== note.id,
                                              ),
                                            );
                                            toast.success(
                                              "Programación eliminada",
                                            );
                                          } catch (e) {
                                            toast.error("No se pudo eliminar");
                                          }
                                        }
                                      }}
                                      className="p-2 text-on-surface-muted hover:text-red-500 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-20 text-center bg-neutral-50 rounded-[2rem] border border-neutral-200 border-dashed">
                        <Calendar className="w-12 h-12 text-on-surface-variant mx-auto mb-4" />
                        <p className="text-on-surface-variant font-bold">
                          No hay avisos programados.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "docs" && <Documentation />}

            {activeTab === "splash" && settings && (
              <div className="p-0">
                <SplashBuilder settings={settings} onUpdate={setSettings} />
              </div>
            )}

            {activeTab === "onboarding" && settings && (
              <div className="p-0">
                <OnboardingBuilder settings={settings} onUpdate={setSettings} />
              </div>
            )}

            {activeTab === "settings" && settings && (
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden p-6">
                <form
                  onSubmit={handleSaveSettings}
                  className="space-y-8 max-w-3xl"
                >
                  {/* General App Info Section */}
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-orange-500" />
                      Información General de la App
                    </h3>
                    <div className="space-y-4 bg-neutral-50 p-6 rounded-2xl border border-neutral-100">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Nombre de la Aplicación
                        </label>
                        <input
                          type="text"
                          value={settings.appName || ""}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              appName: e.target.value,
                            })
                          }
                          placeholder="Ej. SmartBite"
                          className="w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white text-neutral-900"
                        />
                        <p className="text-[10px] text-on-surface-variant mt-2 font-bold uppercase tracking-widest">
                          Este nombre se usará en el título de la página y en la
                          instalación PWA.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Dominio / Link de Producción (Para QRs y Enlaces
                          externos)
                        </label>
                        <input
                          type="text"
                          value={settings.productionUrl || ""}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              productionUrl: e.target.value,
                            })
                          }
                          placeholder="Ej. https://myapp.example.com"
                          className="w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white text-neutral-900"
                        />
                        <p className="text-[10px] text-on-surface-variant mt-2 font-bold uppercase tracking-widest">
                          Ingresa la URL completa (incluyendo https://). Esta se
                          usará para generar los QRs internos de los
                          restaurantes y los enlaces para ver las páginas
                          públicas.
                        </p>
                      </div>

                      <div className="pt-4 border-t border-neutral-200">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.showWorkWithUsBanner !== false}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                showWorkWithUsBanner: e.target.checked,
                              })
                            }
                            className="w-5 h-5 rounded border-neutral-300 text-orange-500 focus:ring-orange-500"
                          />
                          <span className="text-sm font-bold text-neutral-900">
                            Mostrar Banner "Trabaja con{" "}
                            {settings.appName || "SmartBite"}"
                          </span>
                        </label>
                        <p className="text-[10px] text-on-surface-variant mt-2 font-bold uppercase tracking-widest pl-8">
                          Activa o desactiva la pequeña barra flotante que
                          aparece en la parte superior derecha (o debajo de la
                          cabecera) para invitar a los usuarios a unirse a la
                          plataforma.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Logos Section */}
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-orange-500" />
                      Logos de la Plataforma
                    </h3>
                    <div className="space-y-8 bg-neutral-50 p-6 rounded-2xl border border-neutral-100">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Logo Principal de la App (Barra superior)
                        </label>
                        <p className="text-xs text-on-surface-variant mb-3">
                          Sube o pega la URL de la imagen (debe tener fondo
                          transparente o formato que combine, preferiblemente
                          PNG o SVG).
                        </p>
                        <div className="flex flex-col gap-4 mb-4">
                          {settings.appLogo ? (
                            <div className="relative group w-fit">
                              <div className="w-64 h-32 bg-white border-2 border-neutral-200 border-dashed rounded-xl overflow-hidden flex items-center justify-center p-4">
                                <img
                                  src={settings.appLogo}
                                  alt="App Logo"
                                  className="max-h-full max-w-full object-contain"
                                />
                              </div>
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                                <div className="relative">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        const file = e.target.files[0];
                                        const reader = new FileReader();
                                        reader.onload = (ev) => {
                                          setCropper({
                                            isOpen: true,
                                            imageSrc: ev.target
                                              ?.result as string,
                                            type: "appLogo",
                                            aspectRatio: undefined,
                                            cropWidth: settings?.logoWidth || 200,
                                            cropHeight: settings?.logoHeight || 60,
                                          });
                                        };
                                        reader.readAsDataURL(file);
                                        e.target.value = "";
                                      }
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                  />
                                  <button
                                    type="button"
                                    className="px-4 py-2 bg-white text-neutral-900 rounded-lg text-sm font-bold flex items-center gap-2"
                                  >
                                    <Upload className="w-4 h-4" /> Cambiar Logo
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="relative overflow-hidden inline-block group w-full max-w-sm">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    const file = e.target.files[0];
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                      setCropper({
                                        isOpen: true,
                                        imageSrc: ev.target?.result as string,
                                        type: "appLogo",
                                        aspectRatio: undefined,
                                        cropWidth: settings?.logoWidth || 200,
                                        cropHeight: settings?.logoHeight || 60,
                                      });
                                    };
                                    reader.readAsDataURL(file);
                                    e.target.value = "";
                                  }
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              />
                              <div className="w-full border-2 border-dashed border-neutral-300 rounded-xl p-6 group-hover:border-orange-500 group-hover:bg-orange-50 transition-colors flex flex-col items-center justify-center gap-3">
                                <Upload className="w-8 h-8 text-on-surface-muted group-hover:text-orange-500" />
                                <div className="text-center">
                                  <span className="text-sm font-bold text-neutral-700 block">
                                    Subir desde dispositivo
                                  </span>
                                  <span className="text-xs text-on-surface-variant block mt-1">
                                    PNG, JPG o SVG (Recomendado: fondo
                                    transparente)
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Interactive Sizing and Precise Positioning Panel */}
                        {settings.appLogo && (
                          <div className="mt-4 p-5 bg-white rounded-2xl border border-neutral-200/80 space-y-4 max-w-2xl shadow-sm">
                            <h4 className="text-sm font-black text-neutral-900 flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-orange-500" />
                              Herramientas de Recorte y Dimensión Precisa
                            </h4>

                            <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                              Desliza y ajusta la posición del logotipo
                              milimétricamente. Esto evita que la curva
                              superior, el círculo dorado o el icono del trofeo
                              queden recortados o se vean incompletos.
                            </p>

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (settings.appLogo) {
                                    setCropper({
                                      isOpen: true,
                                      imageSrc: settings.appLogo,
                                      type: "appLogo",
                                      aspectRatio: undefined,
                                      cropWidth: settings?.logoWidth || 200,
                                      cropHeight: settings?.logoHeight || 60,
                                    });
                                  }
                                }}
                                className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm border border-neutral-200/50"
                              >
                                <Crop className="w-3.5 h-3.5 text-neutral-600" />
                                Recortar Logo (Formato Libre)
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSettings({
                                    ...settings,
                                    logoScale: 100,
                                    logoOffsetX: 8,
                                    logoOffsetY: 0,
                                    logoWidth: 200,
                                    logoHeight: 60,
                                    logoBorderRadius: 16,
                                  });
                                  toast.info(
                                    "Valores de visualización restablecidos a los por defecto.",
                                  );
                                }}
                                className="px-3 py-2 bg-neutral-50 hover:bg-red-50 text-red-600 text-xs font-bold rounded-xl transition-colors border border-red-100"
                              >
                                Restablecer Valores
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                              {/* Escala (Scale) */}
                              <div className="space-y-1.5">
                                <span className="text-xs font-bold text-neutral-600 flex justify-between">
                                  <span>Escala / Tamaño (Escalable):</span>
                                  <span className="text-orange-600 font-extrabold">
                                    {settings.logoScale !== undefined
                                      ? settings.logoScale
                                      : 125}
                                    %
                                  </span>
                                </span>
                                <input
                                  type="range"
                                  min={30}
                                  max={250}
                                  step={5}
                                  value={
                                    settings.logoScale !== undefined
                                      ? settings.logoScale
                                      : 125
                                  }
                                  onChange={(e) => {
                                    setSettings({
                                      ...settings,
                                      logoScale: Number(e.target.value),
                                    });
                                  }}
                                  className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-orange-500 text-orange-500"
                                />
                              </div>

                              {/* Offset X (Horizontal Position) */}
                              <div className="space-y-1.5">
                                <span className="text-xs font-bold text-neutral-600 flex justify-between">
                                  <span>Desplazamiento Horizontal (X):</span>
                                  <span className="text-orange-600 font-extrabold">
                                    {settings.logoOffsetX !== undefined
                                      ? settings.logoOffsetX
                                      : 8}
                                    px
                                  </span>
                                </span>
                                <input
                                  type="range"
                                  min={-100}
                                  max={300}
                                  step={1}
                                  value={
                                    settings.logoOffsetX !== undefined
                                      ? settings.logoOffsetX
                                      : 8
                                  }
                                  onChange={(e) => {
                                    setSettings({
                                      ...settings,
                                      logoOffsetX: Number(e.target.value),
                                    });
                                  }}
                                  className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                />
                              </div>

                              {/* Offset Y (Vertical Position) */}
                              <div className="space-y-1.5">
                                <span className="text-xs font-bold text-neutral-600 flex justify-between">
                                  <span>Desplazamiento Vertical (Y):</span>
                                  <span className="text-orange-600 font-extrabold">
                                    {settings.logoOffsetY !== undefined
                                      ? settings.logoOffsetY
                                      : 0}
                                    px
                                  </span>
                                </span>
                                <input
                                  type="range"
                                  min={-60}
                                  max={60}
                                  step={1}
                                  value={
                                    settings.logoOffsetY !== undefined
                                      ? settings.logoOffsetY
                                      : 0
                                  }
                                  onChange={(e) => {
                                    setSettings({
                                      ...settings,
                                      logoOffsetY: Number(e.target.value),
                                    });
                                  }}
                                  className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                />
                              </div>

                              {/* Rounded Borders right */}
                              <div className="space-y-1.5">
                                <span className="text-xs font-bold text-neutral-600 flex justify-between">
                                  <span>Bordes Redondeados (Derecha):</span>
                                  <span className="text-orange-600 font-extrabold">
                                    {settings.logoBorderRadius !== undefined
                                      ? settings.logoBorderRadius
                                      : 16}
                                    px
                                  </span>
                                </span>
                                <input
                                  type="range"
                                  min={0}
                                  max={80}
                                  step={2}
                                  value={
                                    settings.logoBorderRadius !== undefined
                                      ? settings.logoBorderRadius
                                      : 16
                                  }
                                  onChange={(e) => {
                                    setSettings({
                                      ...settings,
                                      logoBorderRadius: Number(e.target.value),
                                    });
                                  }}
                                  className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                />
                              </div>

                              {/* Max Width */}
                              <div className="space-y-1.5">
                                <span className="text-xs font-bold text-neutral-600 flex justify-between">
                                  <span>Ancho Máximo del Logo:</span>
                                  <span className="text-orange-600 font-extrabold">
                                    {settings.logoWidth !== undefined
                                      ? settings.logoWidth
                                      : 200}
                                    px
                                  </span>
                                </span>
                                <input
                                  type="range"
                                  min={50}
                                  max={500}
                                  step={5}
                                  value={
                                    settings.logoWidth !== undefined
                                      ? settings.logoWidth
                                      : 200
                                  }
                                  onChange={(e) => {
                                    setSettings({
                                      ...settings,
                                      logoWidth: Number(e.target.value),
                                    });
                                  }}
                                  className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                />
                              </div>

                              {/* Max Height */}
                              <div className="space-y-1.5">
                                <span className="text-xs font-bold text-neutral-600 flex justify-between">
                                  <span>Alto Máximo del Logo:</span>
                                  <span className="text-orange-600 font-extrabold">
                                    {settings.logoHeight !== undefined
                                      ? settings.logoHeight
                                      : 60}
                                    px
                                  </span>
                                </span>
                                <input
                                  type="range"
                                  min={20}
                                  max={180}
                                  step={5}
                                  value={
                                    settings.logoHeight !== undefined
                                      ? settings.logoHeight
                                      : 60
                                  }
                                  onChange={(e) => {
                                    setSettings({
                                      ...settings,
                                      logoHeight: Number(e.target.value),
                                    });
                                  }}
                                  className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                />
                              </div>
                            </div>

                            {/* Live Preview Container simulating App Floating Header */}
                            <div className="mt-4 p-4 bg-black rounded-2xl border border-white/10 overflow-hidden shadow-inner">
                              <span className="block text-[10px] uppercase tracking-wider text-neutral-400 font-bold mb-3">
                                Vista Previa Interactiva en Tiempo Real
                                (Imitación de Barra Superior)
                              </span>
                              <div className="h-20 w-full bg-black flex items-center px-4 relative overflow-hidden rounded-xl border border-white/5">
                                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                                <div className="flex items-center group shrink-0 py-2 w-[60%] select-none">
                                  <div className="flex items-center justify-start w-full relative">
                                    <img
                                      src={settings.appLogo}
                                      alt="Preview Logo"
                                      style={{
                                        transform: `scale(${(settings.logoScale !== undefined ? settings.logoScale : 125) / 100}) translate(${settings.logoOffsetX !== undefined ? settings.logoOffsetX : 8}px, ${settings.logoOffsetY !== undefined ? settings.logoOffsetY : 0}px)`,
                                        transformOrigin: "left center",
                                        maxHeight:
                                          settings.logoHeight !== undefined
                                            ? `${settings.logoHeight}px`
                                            : "60px",
                                        maxWidth:
                                          settings.logoWidth !== undefined
                                            ? `${settings.logoWidth}px`
                                            : "200px",
                                        borderTopRightRadius:
                                          settings.logoBorderRadius !==
                                          undefined
                                            ? `${settings.logoBorderRadius}px`
                                            : "16px",
                                        borderBottomRightRadius:
                                          settings.logoBorderRadius !==
                                          undefined
                                            ? `${settings.logoBorderRadius}px`
                                            : "16px",
                                      }}
                                      className="w-full h-auto object-contain object-left drop-shadow-glow"
                                    />
                                  </div>
                                </div>
                                <div className="absolute right-4 flex items-center gap-1.5 text-[11px] font-bold text-neutral-300 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                                  <span>250 🪙</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pt-6 border-t border-neutral-200">
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Logo para el Splash Screen del Sistema
                        </label>
                        <p className="text-xs text-on-surface-variant mb-3">
                          Este logo se utilizará al mostrar el Splash por
                          defecto de la aplicación (preferiblemente un logo
                          cuadrado o simétrico). Si no se proporciona, se usará
                          el logo principal de arriba.
                        </p>
                        <div className="flex flex-col gap-4 mb-4">
                          {settings.systemSplashLogo ? (
                            <div className="relative group w-fit">
                              <div className="w-48 h-48 bg-surface-variant border-2 border-neutral-200 border-dashed rounded-[2rem] overflow-hidden flex items-center justify-center p-4">
                                <img
                                  src={settings.systemSplashLogo}
                                  alt="System Splash Logo"
                                  className="max-h-full max-w-full object-contain"
                                />
                              </div>
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[2rem]">
                                <div className="relative">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        const file = e.target.files[0];
                                        const reader = new FileReader();
                                        reader.onload = (ev) => {
                                          setCropper({
                                            isOpen: true,
                                            imageSrc: ev.target
                                              ?.result as string,
                                            type: "splashLogo",
                                            aspectRatio: 1,
                                            cropWidth: 512,
                                            cropHeight: 512,
                                          });
                                        };
                                        reader.readAsDataURL(file);
                                        e.target.value = "";
                                      }
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                  />
                                  <button
                                    type="button"
                                    className="px-4 py-2 bg-white text-neutral-900 rounded-lg text-sm font-bold flex items-center gap-2"
                                  >
                                    <Upload className="w-4 h-4" /> Cambiar
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="relative overflow-hidden inline-block group w-full max-w-xs">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    const file = e.target.files[0];
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                      setCropper({
                                        isOpen: true,
                                        imageSrc: ev.target?.result as string,
                                        type: "splashLogo",
                                        aspectRatio: 1,
                                        cropWidth: 512,
                                        cropHeight: 512,
                                      });
                                    };
                                    reader.readAsDataURL(file);
                                    e.target.value = "";
                                  }
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              />
                              <div className="w-full aspect-square border-2 border-dashed border-neutral-300 rounded-[2rem] p-6 group-hover:border-orange-500 group-hover:bg-orange-50 transition-colors flex flex-col items-center justify-center gap-3">
                                <Upload className="w-8 h-8 text-on-surface-muted group-hover:text-orange-500" />
                                <div className="text-center">
                                  <span className="text-sm font-bold text-neutral-700 block">
                                    Subir desde dispositivo
                                  </span>
                                  <span className="text-xs text-on-surface-variant block mt-1">
                                    Logo especial para el Splash (cuadrado
                                    recomendado)
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-6 border-t border-neutral-200">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-bold text-neutral-800">
                            Icono Oficial de Instalación PWA (Chrome, Safari,
                            Android, iOS)
                          </label>
                          <span className="px-2 py-0.5 bg-orange-500/10 text-orange-500 text-[10px] uppercase font-black tracking-widest rounded-full">
                            Actualizador Automatizado
                          </span>
                        </div>
                        <p className="text-xs text-neutral-700/80 mb-4 leading-relaxed">
                          Sube desde aquí cualquier imagen (como tu logotipo,
                          trofeo o marca). El sistema procesará el archivo en el
                          servidor con <b>sharp</b>, creará instantáneamente
                          todas las dimensiones oficiales adaptativas (192px,
                          512px y máscara segura), e{" "}
                          <b>
                            incrementará la firma del Service Worker / Manifest
                          </b>{" "}
                          para forzar a dispositivos como Google Chrome a
                          recargar el icono e instalar tu App con la imagen
                          correcta.
                        </p>

                        <div className="bg-white border text-neutral-800 border-neutral-200 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
                          <div className="w-24 h-24 bg-neutral-900 border border-neutral-200 rounded-2xl overflow-hidden flex items-center justify-center shrink-0">
                            <img
                              key={`${settings.pwaIconUrl || "default"}-${settings.pwaVersion || 0}`}
                              src={
                                settings.pwaIconUrl
                                  ? `${settings.pwaIconUrl}?v=${settings.pwaVersion}`
                                  : "/pwa-192x192.png"
                              }
                              alt="Current PWA Icon"
                              className="w-20 h-20 object-contain rounded-xl shadow-lg ring-1 ring-white/10"
                              onError={(e) => {
                                e.currentTarget.src =
                                  "https://placehold.co/192x192/000000/FFFFFF/png?text=Bite";
                              }}
                            />
                          </div>
                          <div className="grow space-y-2">
                            <h4 className="text-sm font-bold text-neutral-950">
                              Icono Actual en Servidor
                            </h4>
                            <p className="text-xs text-neutral-600 leading-relaxed">
                              La imagen de la izquierda representa tu icono
                              actual. Sube una nueva para reemplazarla de
                              inmediato de forma global.
                            </p>
                            <div className="relative inline-block mt-1">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handlePwaIconUpload}
                                disabled={isConvertingPwaIcon}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                              />
                              <button
                                type="button"
                                disabled={isConvertingPwaIcon}
                                className="px-4 py-2 bg-orange-500 text-on-surface disabled:opacity-50 text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-orange-600 transition-colors cursor-pointer"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                {isConvertingPwaIcon
                                  ? "Procesando en Servidor..."
                                  : "Subir y Regenerar Icono PWA"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Assistant Icon Section */}
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                      <Bot className="w-5 h-5 text-orange-500" />
                      Configuración del Asistente IA
                    </h3>
                    <div className="space-y-4 bg-neutral-50 p-6 rounded-2xl border border-neutral-100">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Icono del Asistente Inteligente (Predeterminado)
                        </label>
                        <select
                          value={settings.assistantIcon || "Smile"}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              assistantIcon: e.target.value,
                            })
                          }
                          className="w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white text-neutral-900 mb-4"
                        >
                          <option value="Smile">
                            Carita Feliz (Por defecto)
                          </option>
                          <option value="Bot">Robot</option>
                          <option value="Sparkles">Destellos</option>
                          <option value="MessageSquare">Burbuja de Chat</option>
                          <option value="Zap">Rayo</option>
                          <option value="Star">Estrella</option>
                        </select>

                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Icono Personalizado (Imagen)
                        </label>
                        <div className="flex items-center gap-4">
                          {settings.assistantCustomIconUrl ? (
                            <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-neutral-200 bg-white">
                              <img
                                src={settings.assistantCustomIconUrl}
                                alt="Custom Assistant Icon"
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setSettings({
                                    ...settings,
                                    assistantCustomIconUrl: "",
                                  })
                                }
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                              >
                                &times;
                              </button>
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-dashed border-neutral-300 bg-neutral-50 flex items-center justify-center">
                              <Bot className="w-6 h-6 text-neutral-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const file = e.target.files[0];
                                  toast.loading(
                                    "Subiendo icono personalizado...",
                                    { id: "upload-assistant-icon" },
                                  );
                                  const { url, error } = await db.uploadImage(
                                    file,
                                    "platform/assistant",
                                  );
                                  if (error) {
                                    toast.error(
                                      `Error: ${error.message || "No se pudo subir la imagen"}`,
                                      { id: "upload-assistant-icon" },
                                    );
                                  } else if (url) {
                                    setSettings({
                                      ...settings,
                                      assistantCustomIconUrl: url,
                                    });
                                    toast.success(
                                      "Icono personalizado subido correctamente",
                                      { id: "upload-assistant-icon" },
                                    );
                                  }
                                }
                              }}
                              className="w-full text-sm text-neutral-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-on-surface-variant mt-3 font-bold uppercase tracking-widest">
                          Si subes un icono personalizado en formato imagen,
                          reemplazará al icono vectorizado seleccionado arriba.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-200 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSavingSettings}
                      className="px-6 py-3 bg-orange-500 text-on-surface rounded-xl font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSavingSettings
                        ? "Guardando..."
                        : "Guardar Configuración"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "payments" && settings && (
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden p-6">
                <form
                  onSubmit={handleSaveSettings}
                  className="space-y-8 max-w-3xl"
                >
                  <div className="mb-4">
                    <h2 className="text-2xl font-black text-neutral-900 mb-2">
                      Pasarelas de Pago de la Plataforma
                    </h2>
                    <p className="text-on-surface-variant text-sm">
                      Configura las credenciales de Nequi, Mercado Pago y
                      PayPal. Estos métodos de pago son exclusivamente para
                      cobrar planes, suscripciones y comisiones a los
                      restaurantes registrados.
                    </p>
                  </div>

                  {/* Nequi Configuration */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-purple-600" />
                        Pagos con Nequi
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-neutral-600">
                          Activar
                        </span>
                        <input
                          type="checkbox"
                          checked={
                            settings.paymentGateways?.nequi?.active || false
                          }
                          onChange={(e) =>
                            handleUpdatePaymentGateway(
                              "nequi",
                              "active",
                              e.target.checked,
                            )
                          }
                          className="w-5 h-5 accent-orange-500 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="space-y-4 bg-neutral-50 p-6 rounded-2xl border border-neutral-100">
                      <p className="text-xs text-on-surface-variant">
                        Credenciales para la integración con Nequi API (Pagos
                        Push/Pull).
                      </p>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Client ID
                        </label>
                        <input
                          type="text"
                          value={
                            settings.paymentGateways?.nequi?.clientId || ""
                          }
                          onChange={(e) =>
                            handleUpdatePaymentGateway(
                              "nequi",
                              "clientId",
                              e.target.value,
                            )
                          }
                          className="w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white text-neutral-900"
                          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Client Secret
                        </label>
                        <input
                          type="password"
                          value={
                            settings.paymentGateways?.nequi?.clientSecret || ""
                          }
                          onChange={(e) =>
                            handleUpdatePaymentGateway(
                              "nequi",
                              "clientSecret",
                              e.target.value,
                            )
                          }
                          className="w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white text-neutral-900"
                          placeholder="************************"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          API Key
                        </label>
                        <input
                          type="password"
                          value={settings.paymentGateways?.nequi?.apiKey || ""}
                          onChange={(e) =>
                            handleUpdatePaymentGateway(
                              "nequi",
                              "apiKey",
                              e.target.value,
                            )
                          }
                          className="w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white text-neutral-900"
                          placeholder="************************"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Merchant ID
                        </label>
                        <input
                          type="text"
                          value={
                            settings.paymentGateways?.nequi?.merchantId || ""
                          }
                          onChange={(e) =>
                            handleUpdatePaymentGateway(
                              "nequi",
                              "merchantId",
                              e.target.value,
                            )
                          }
                          className="w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white text-neutral-900"
                          placeholder="Ej. ID de tu comercio en Nequi"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mercado Pago Configuration */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-blue-500" />
                        Mercado Pago
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-neutral-600">
                          Activar
                        </span>
                        <input
                          type="checkbox"
                          checked={
                            settings.paymentGateways?.mercadoPago?.active ||
                            false
                          }
                          onChange={(e) =>
                            handleUpdatePaymentGateway(
                              "mercadoPago",
                              "active",
                              e.target.checked,
                            )
                          }
                          className="w-5 h-5 accent-orange-500 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="space-y-4 bg-neutral-50 p-6 rounded-2xl border border-neutral-100">
                      <p className="text-xs text-on-surface-variant">
                        Credenciales de producción para procesar pagos con
                        tarjeta y saldo de Mercado Pago.
                      </p>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Public Key
                        </label>
                        <input
                          type="text"
                          value={
                            settings.paymentGateways?.mercadoPago?.publicKey ||
                            ""
                          }
                          onChange={(e) =>
                            handleUpdatePaymentGateway(
                              "mercadoPago",
                              "publicKey",
                              e.target.value,
                            )
                          }
                          className="w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white text-neutral-900"
                          placeholder="APP_USR-xxxx-xxxx-xxxx-xxxx"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Access Token
                        </label>
                        <input
                          type="password"
                          value={
                            settings.paymentGateways?.mercadoPago
                              ?.accessToken || ""
                          }
                          onChange={(e) =>
                            handleUpdatePaymentGateway(
                              "mercadoPago",
                              "accessToken",
                              e.target.value,
                            )
                          }
                          className="w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white text-neutral-900"
                          placeholder="APP_USR-xxxxxxxxxxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxx"
                        />
                      </div>
                    </div>
                  </div>

                  {/* PayPal Configuration */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-blue-800" />
                        PayPal
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-neutral-600">
                          Activar
                        </span>
                        <input
                          type="checkbox"
                          checked={
                            settings.paymentGateways?.paypal?.active || false
                          }
                          onChange={(e) =>
                            handleUpdatePaymentGateway(
                              "paypal",
                              "active",
                              e.target.checked,
                            )
                          }
                          className="w-5 h-5 accent-orange-500 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="space-y-4 bg-neutral-50 p-6 rounded-2xl border border-neutral-100">
                      <p className="text-xs text-on-surface-variant">
                        Credenciales de REST API de PayPal.
                      </p>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Client ID
                        </label>
                        <input
                          type="text"
                          value={
                            settings.paymentGateways?.paypal?.clientId || ""
                          }
                          onChange={(e) =>
                            handleUpdatePaymentGateway(
                              "paypal",
                              "clientId",
                              e.target.value,
                            )
                          }
                          className="w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white text-neutral-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Secret
                        </label>
                        <input
                          type="password"
                          value={settings.paymentGateways?.paypal?.secret || ""}
                          onChange={(e) =>
                            handleUpdatePaymentGateway(
                              "paypal",
                              "secret",
                              e.target.value,
                            )
                          }
                          className="w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white text-neutral-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Billing & Cycle Configuration */}
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-orange-500" />
                      Facturación y Ciclos de Corte
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-neutral-50 p-6 rounded-2xl border border-neutral-100">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Día de Corte Mensual (Planes)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="28"
                          value={settings.billingCutDay || 1}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              billingCutDay: parseInt(e.target.value),
                            })
                          }
                          className="w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white text-neutral-900"
                        />
                        <p className="text-[10px] text-on-surface-muted mt-2 font-bold uppercase tracking-widest">
                          Día del mes para generar facturas de suscripción
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Ciclo de Comisiones
                        </label>
                        <select
                          value={settings.commissionCycle || "weekly"}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              commissionCycle: e.target.value as any,
                            })
                          }
                          className="w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white text-neutral-900"
                        >
                          <option value="weekly">Semanal (7 días)</option>
                          <option value="biweekly">Quincenal (15 días)</option>
                          <option value="monthly">Mensual (30 días)</option>
                        </select>
                        <p className="text-[10px] text-on-surface-muted mt-2 font-bold uppercase tracking-widest">
                          Frecuencia de consolidación de comisiones
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-200 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSavingSettings}
                      className="px-6 py-3 bg-orange-500 text-on-surface rounded-xl font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSavingSettings
                        ? "Guardando..."
                        : "Guardar Credenciales"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "music" && (
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="max-w-4xl space-y-8">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-3xl font-black text-neutral-900 tracking-tight flex items-center gap-3">
                      <Music className="w-8 h-8 text-orange-500" />
                      Música de Fondo
                    </h2>
                    <p className="text-on-surface-variant font-medium max-w-2xl">
                      Configura y cambia la música de fondo que ambienta la
                      experiencia de toda tu plataforma en tiempo real. Sube un
                      archivo de audio liviano (MP3 o WAV).
                    </p>
                  </div>

                  {/* Controles de Visibilidad del Reproductor */}
                  <div className="bg-orange-50/50 border border-orange-100 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <h4 className="text-base font-black text-neutral-900 tracking-tight flex items-center gap-2">
                        {settings?.hideMusicPlayer ? (
                          <EyeOff className="w-5 h-5 text-neutral-500" />
                        ) : (
                          <Eye className="w-5 h-5 text-orange-500" />
                        )}
                        Reproductor de Música Flotante
                      </h4>
                      <p className="text-xs text-neutral-600 font-medium">
                        {settings?.hideMusicPlayer
                          ? "El botón reproductor de música está actualmente oculto para todos los clientes."
                          : "El botón flotante para pausar/reproducir la música es visible para los clientes."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleHideMusic}
                      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings?.hideMusicPlayer
                          ? "bg-neutral-300"
                          : "bg-orange-500"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          settings?.hideMusicPlayer
                            ? "translate-x-0"
                            : "translate-x-5"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="relative h-64 w-full border-2 border-dashed border-neutral-300 rounded-[2rem] p-8 hover:border-orange-500 hover:bg-orange-50/50 transition-all flex flex-col items-center justify-center gap-4 overflow-hidden group">
                        {isUploadingMusic && (
                          <div className="absolute inset-0 bg-white/90 z-40 rounded-[2rem] flex flex-col items-center justify-center backdrop-blur-sm">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mb-2" />
                            <div className="w-1/2 bg-neutral-200 rounded-full h-1.5 overflow-hidden shadow-inner mb-2">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${uploadProgress}%` }}
                                className="h-full bg-orange-500"
                              />
                            </div>
                            <span className="text-xs font-black text-orange-600 uppercase tracking-widest">
                              {uploadProgress < 100
                                ? `Subiendo... ${uploadProgress}%`
                                : "Procesando..."}
                            </span>
                          </div>
                        )}

                        <input
                          id="music-upload-field"
                          ref={musicInputRef}
                          type="file"
                          accept="audio/*"
                          onChange={handleMusicUpload}
                          onClick={(e) => {
                            (e.target as HTMLInputElement).value = "";
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-[40]"
                        />

                        <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Music className="w-8 h-8" />
                        </div>
                        <div className="text-center pointer-events-none">
                          <span className="text-lg font-black text-neutral-900 block tracking-tight">
                            Sube un Nuevo Audio de Fondo
                          </span>
                          <span className="text-[10px] text-neutral-400 block mt-1 uppercase tracking-widest font-bold">
                            MP3 / WAV • Recomendado menos de 5MB
                          </span>
                          <div className="mt-4 bg-orange-500 text-white text-[10px] font-black uppercase px-6 py-2.5 rounded-full shadow-lg shadow-orange-200 group-hover:bg-orange-600 transition-colors inline-block">
                            Seleccionar Archivo
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-neutral-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                          <Volume2 className="w-24 h-24" />
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-tighter mb-4 relative z-10">
                          Estado del Audio
                        </h3>

                        {settings?.backgroundMusicUrl ? (
                          <div className="space-y-6 relative z-10">
                            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10">
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">
                                  Señal Activa de Fondo
                                </span>
                                <div className="flex gap-1 items-end h-3">
                                  {[1, 2, 3, 4].map((i) => (
                                    <motion.div
                                      key={i}
                                      animate={{ height: [4, 12, 6, 10, 4] }}
                                      transition={{
                                        repeat: Infinity,
                                        duration: 0.8,
                                        delay: i * 0.15,
                                        ease: "easeInOut",
                                      }}
                                      className="w-0.5 bg-orange-500 rounded-full"
                                    />
                                  ))}
                                </div>
                              </div>

                              <audio
                                key={settings.backgroundMusicUrl}
                                src={settings.backgroundMusicUrl}
                                controls
                                className="w-full h-8 invert opacity-85 mt-2"
                                onError={(e) => {
                                  console.warn(
                                    "PlatformAdmin: Active settings audio failed to load gracefully.",
                                  );
                                  e.currentTarget.removeAttribute("src");
                                  e.currentTarget.load();
                                }}
                              />
                            </div>

                            <div className="space-y-4">
                              <button
                                type="button"
                                onClick={handleClearMusic}
                                className="w-full py-3 px-4 bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all text-center relative z-10 flex items-center justify-center gap-2 border border-red-500/20"
                              >
                                <Trash2 className="w-4 h-4" />
                                Quitar Música de Fondo Activa
                              </button>

                              <div className="border-t border-white/10 pt-4">
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                                  Información del Sistema
                                </p>
                                <ul className="text-xs text-white/70 space-y-2">
                                  <li className="flex gap-3">
                                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 shrink-0" />
                                    <span>
                                      Al subir música, se reproduce
                                      automáticamente de fondo para tus
                                      clientes.
                                    </span>
                                  </li>
                                  <li className="flex gap-3">
                                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 shrink-0" />
                                    <span>
                                      Los clientes pueden silenciar o pausar el
                                      audio desde el botón flotante.
                                    </span>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="py-8 text-center relative z-10">
                            <VolumeX className="w-12 h-12 text-white/20 mx-auto mb-4 animate-pulse" />
                            <p className="text-white/40 text-sm font-medium">
                              No hay ninguna pista configurada.
                            </p>
                            <p className="text-neutral-500 text-xs mt-1">
                              Sube un archivo de audio para activar el sonido
                              ambiental.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Driver Documents Modal */}
            {selectedDriver && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  onClick={() => setSelectedDriver(null)}
                />
                <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                  <div className="p-8 border-b border-neutral-100 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                        <Truck className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-neutral-900">
                          Documentación del Repartidor
                        </h3>
                        <p className="text-sm font-bold text-on-surface-muted">
                          {
                            (Array.isArray(selectedDriver.app_users)
                              ? selectedDriver.app_users[0]
                              : selectedDriver.app_users
                            )?.display_name
                          }{" "}
                          •{" "}
                          {
                            (Array.isArray(selectedDriver.app_users)
                              ? selectedDriver.app_users[0]
                              : selectedDriver.app_users
                            )?.email
                          }
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedDriver(null)}
                      className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                    >
                      <X className="w-6 h-6 text-on-surface-muted" />
                    </button>
                  </div>

                  <div className="p-8 overflow-y-auto space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-on-surface-muted uppercase tracking-widest">
                          Foto de Perfil
                        </p>
                        <div className="aspect-square rounded-2xl overflow-hidden border-4 border-neutral-50 shadow-inner bg-neutral-100">
                          {selectedDriver.profile_photo ? (
                            <img
                              src={selectedDriver.profile_photo}
                              alt="Perfil"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                              Sin foto
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-on-surface-muted uppercase tracking-widest">
                          Cédula / Documento
                        </p>
                        <div className="aspect-[4/3] rounded-2xl overflow-hidden border-4 border-neutral-50 shadow-inner bg-neutral-100">
                          {selectedDriver.document_photo ? (
                            <img
                              src={selectedDriver.document_photo}
                              alt="Cédula"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                              Sin foto
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-on-surface-muted uppercase tracking-widest">
                          Licencia de Conducción
                        </p>
                        <div className="aspect-[4/3] rounded-2xl overflow-hidden border-4 border-neutral-50 shadow-inner bg-neutral-100">
                          {selectedDriver.license_photo ? (
                            <img
                              src={selectedDriver.license_photo}
                              alt="Licencia"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                              Sin foto
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-on-surface-muted uppercase tracking-widest">
                          Tecnomecánica (Opcional)
                        </p>
                        <div className="aspect-[4/3] rounded-2xl overflow-hidden border-4 border-neutral-50 shadow-inner bg-neutral-100">
                          {selectedDriver.tecnomecanica_photo ? (
                            <img
                              src={selectedDriver.tecnomecanica_photo}
                              alt="Tecnomecánica"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                              No cargada
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100 grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div>
                        <p className="text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-1">
                          Documento
                        </p>
                        <p className="font-bold text-neutral-900">
                          {selectedDriver.document_number || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-1">
                          Fecha Nacimiento
                        </p>
                        <p className="font-bold text-neutral-900">
                          {selectedDriver.birth_date || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-1">
                          Vehículo
                        </p>
                        <p className="font-bold text-neutral-900 capitalize">
                          {selectedDriver.vehicle_type} -{" "}
                          {selectedDriver.vehicle_color || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-1">
                          Placa
                        </p>
                        <p className="font-bold text-neutral-900">
                          {selectedDriver.license_plate || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 border-t border-neutral-100 bg-neutral-50 flex justify-end gap-3">
                    <button
                      onClick={() =>
                        handleUpdateDriverApproval(
                          selectedDriver.id,
                          "rejected",
                        )
                      }
                      className="px-8 py-3 bg-rose-50 text-rose-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-rose-100 transition-all"
                    >
                      Rechazar
                    </button>
                    <button
                      onClick={() =>
                        handleUpdateDriverApproval(
                          selectedDriver.id,
                          "approved",
                        )
                      }
                      className="px-8 py-3 bg-emerald-500 text-on-surface rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200"
                    >
                      Aprobar Repartidor
                    </button>
                  </div>
                </div>
              </div>
            )}
            {editingRestaurant && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                  <h2 className="text-xl font-bold mb-4">
                    Configuración de Restaurante
                  </h2>
                  <p className="text-neutral-600 mb-6 text-sm">
                    Editando:{" "}
                    <span className="font-bold">{editingRestaurant.name}</span>
                  </p>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Categoría de Negocio (Slider y Catálogo)
                      </label>
                      <select
                        value={editingRestaurant.businessCategory || "restaurant"}
                        onChange={(e) =>
                          setEditingRestaurant({
                            ...editingRestaurant,
                            businessCategory: e.target.value,
                          })
                        }
                        className="w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none font-bold bg-white text-neutral-900 cursor-pointer"
                      >
                        {(settings?.businessCategories || []).map((cat: any) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.title.replace("Explorar ", "")}
                          </option>
                        ))}
                        {(!settings?.businessCategories || settings.businessCategories.length === 0) && (
                          <>
                            <option value="restaurant">Restaurantes</option>
                            <option value="salsamentaria">Salsamentarías</option>
                            <option value="grocery">Verdulerías</option>
                            <option value="bakery">Panaderías</option>
                            <option value="liquor">Licores</option>
                            <option value="pharmacy">Farmacias</option>
                            <option value="ice_cream">Heladerías</option>
                            <option value="general_store">Víveres y Abarrotes</option>
                            <option value="cevicheria">Cevicherías</option>
                            <option value="seafood">Pescados y Mariscos</option>
                            <option value="coffee">Cafeterías</option>
                          </>
                        )}
                      </select>
                      <p className="text-[10px] text-on-surface-muted mt-2 uppercase tracking-widest font-bold">
                        Determina en qué categoría del slider se mostrará el negocio
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Porcentaje de Comisión (%)
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="number"
                          min="5"
                          max="100"
                          value={editingRestaurant.commissionRate || 5}
                          onChange={(e) =>
                            setEditingRestaurant({
                              ...editingRestaurant,
                              commissionRate: Number(e.target.value),
                            })
                          }
                          className="flex-1 p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none font-bold bg-white text-neutral-900"
                        />
                        <span className="text-on-surface-variant font-bold">
                          %
                        </span>
                      </div>
                      <p className="text-[10px] text-on-surface-muted mt-2 uppercase tracking-widest font-bold">
                        Mínimo sugerido: 5%
                      </p>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                      <input
                        type="checkbox"
                        id="isFeatured"
                        checked={!!editingRestaurant.isFeatured}
                        onChange={(e) => {
                          const isFeatured = e.target.checked;
                          setEditingRestaurant({
                            ...editingRestaurant,
                            isFeatured,
                            commissionRate: isFeatured
                              ? 10
                              : editingRestaurant.commissionRate,
                          });
                        }}
                        className="w-5 h-5 accent-amber-500"
                      />
                      <label
                        htmlFor="isFeatured"
                        className="flex-1 cursor-pointer"
                      >
                        <span className="block text-sm font-bold text-amber-900">
                          Restaurante Destacado
                        </span>
                        <span className="block text-[10px] text-amber-700 uppercase tracking-wider font-bold">
                          Aplica comisión del 10%
                        </span>
                      </label>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <input
                        type="checkbox"
                        id="gamificationEnabledModal"
                        checked={!!editingRestaurant.gamificationEnabled}
                        onChange={(e) => {
                          setEditingRestaurant({
                            ...editingRestaurant,
                            gamificationEnabled: e.target.checked,
                          });
                        }}
                        className="w-5 h-5 accent-emerald-500"
                      />
                      <label
                        htmlFor="gamificationEnabledModal"
                        className="flex-1 cursor-pointer"
                      >
                        <span className="block text-sm font-bold text-emerald-900">
                          Gamificación (Tareas y Niveles)
                        </span>
                        <span className="block text-[10px] text-emerald-700 uppercase tracking-wider font-bold">
                          Activar sistema de misiones y niveles
                        </span>
                      </label>
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                      <button
                        type="button"
                        onClick={() => setEditingRestaurant(null)}
                        className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-xl font-medium transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await db.updateRestaurant(editingRestaurant.id, {
                              commissionRate: editingRestaurant.commissionRate,
                              isFeatured: editingRestaurant.isFeatured,
                              gamificationEnabled:
                                editingRestaurant.gamificationEnabled,
                              businessCategory:
                                editingRestaurant.businessCategory,
                            });
                            toast.success("Configuración actualizada");
                            setEditingRestaurant(null);
                            fetchData();
                          } catch (err) {
                            toast.error("Error al actualizar");
                          }
                        }}
                        className="px-4 py-2 bg-orange-500 text-on-surface rounded-xl font-medium hover:bg-orange-600 transition-colors"
                      >
                        Guardar Cambios
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Role Modal */}
            {/* Coupon Modal */}
            {editingCoupon && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  onClick={() => setEditingCoupon(null)}
                />
                <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
                  <div className="p-8 border-b border-neutral-100 flex justify-between items-center">
                    <h3 className="text-2xl font-black text-neutral-900">
                      {editingCoupon.id ? "Editar Cupón" : "Nuevo Cupón"}
                    </h3>
                    <button
                      onClick={() => setEditingCoupon(null)}
                      className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                    >
                      <X className="w-6 h-6 text-on-surface-muted" />
                    </button>
                  </div>
                  <form onSubmit={handleSaveCoupon} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2">
                          Restaurante (Opcional - Vacío para toda la plataforma)
                        </label>
                        <select
                          value={editingCoupon.restaurantId || ""}
                          onChange={(e) =>
                            setEditingCoupon({
                              ...editingCoupon,
                              restaurantId: e.target.value || undefined,
                            })
                          }
                          className="w-full px-4 py-3 bg-neutral-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none font-bold transition-all text-neutral-900"
                        >
                          <option value="">Toda la plataforma</option>
                          {restaurants.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2">
                          Código del Cupón
                        </label>
                        <input
                          type="text"
                          value={editingCoupon.code}
                          onChange={(e) =>
                            setEditingCoupon({
                              ...editingCoupon,
                              code: e.target.value.toUpperCase(),
                            })
                          }
                          className="w-full px-4 py-3 bg-neutral-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none font-bold transition-all text-neutral-900"
                          placeholder="EJ: BIENVENIDO50"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2">
                          Tipo de Descuento
                        </label>
                        <select
                          value={editingCoupon.discountType}
                          onChange={(e) =>
                            setEditingCoupon({
                              ...editingCoupon,
                              discountType: e.target.value as any,
                            })
                          }
                          className="w-full px-4 py-3 bg-neutral-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none font-bold transition-all text-neutral-900"
                        >
                          <option value="percentage">Porcentaje (%)</option>
                          <option value="fixed">Monto Fijo ($)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2">
                          Valor
                        </label>
                        <input
                          type="number"
                          value={
                            editingCoupon.value === 0
                              ? ""
                              : editingCoupon.value || ""
                          }
                          onChange={(e) =>
                            setEditingCoupon({
                              ...editingCoupon,
                              value: e.target.value
                                ? Number(e.target.value)
                                : 0,
                            })
                          }
                          className="w-full px-4 py-3 bg-neutral-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none font-bold transition-all text-neutral-900"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2">
                          Mín. Pedido
                        </label>
                        <input
                          type="number"
                          value={
                            editingCoupon.minOrderAmount === 0
                              ? ""
                              : editingCoupon.minOrderAmount || ""
                          }
                          onChange={(e) =>
                            setEditingCoupon({
                              ...editingCoupon,
                              minOrderAmount: e.target.value
                                ? Number(e.target.value)
                                : 0,
                            })
                          }
                          className="w-full px-4 py-3 bg-neutral-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none font-bold transition-all text-neutral-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2">
                          Límite de Usos
                        </label>
                        <input
                          type="number"
                          value={editingCoupon.usageLimit || ""}
                          onChange={(e) =>
                            setEditingCoupon({
                              ...editingCoupon,
                              usageLimit: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            })
                          }
                          className="w-full px-4 py-3 bg-neutral-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none font-bold transition-all text-neutral-900"
                          placeholder="Ilimitado"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2">
                          Fecha Inicio
                        </label>
                        <DateSelector
                          value={
                            editingCoupon.startDate
                              ? editingCoupon.startDate.split("T")[0]
                              : ""
                          }
                          onChange={(val) =>
                            setEditingCoupon({
                              ...editingCoupon,
                              startDate: val,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2">
                          Fecha Fin
                        </label>
                        <DateSelector
                          value={
                            editingCoupon.endDate
                              ? editingCoupon.endDate.split("T")[0]
                              : ""
                          }
                          onChange={(val) =>
                            setEditingCoupon({ ...editingCoupon, endDate: val })
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="flex items-center gap-3 p-4 bg-neutral-50 rounded-2xl cursor-pointer hover:bg-neutral-100 transition-colors">
                          <input
                            type="checkbox"
                            checked={editingCoupon.active}
                            onChange={(e) =>
                              setEditingCoupon({
                                ...editingCoupon,
                                active: e.target.checked,
                              })
                            }
                            className="w-5 h-5 accent-orange-500"
                          />
                          <span className="text-sm font-bold text-neutral-700">
                            Cupón Activo
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        type="button"
                        onClick={() => setEditingCoupon(null)}
                        className="flex-1 py-4 bg-neutral-100 text-on-surface-variant font-black rounded-2xl hover:bg-neutral-200 transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-4 bg-orange-500 text-on-surface font-black rounded-2xl shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all"
                      >
                        Guardar Cupón
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {editingUser && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                  <h2 className="text-xl font-bold mb-4">
                    Editar Rol de Usuario
                  </h2>
                  <p className="text-neutral-600 mb-4 text-sm">
                    Usuario:{" "}
                    <span className="font-bold">{editingUser.email}</span>
                  </p>
                  <form onSubmit={handleSaveUserRole}>
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Seleccionar Rol
                      </label>
                      <select
                        value={editingUser.role}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            role: e.target.value as any,
                          })
                        }
                        className="w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white text-neutral-900"
                      >
                        <option value="user">Usuario (Cliente)</option>
                        <option value="restaurant">Restaurante</option>
                        <option value="driver">Repartidor</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                    <div className="flex gap-3 justify-end">
                      <button
                        type="button"
                        onClick={() => setEditingUser(null)}
                        className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-xl font-medium transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-orange-500 text-on-surface rounded-xl font-medium hover:bg-orange-600 transition-colors"
                      >
                        Guardar Cambios
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeTab === "billing" && (
              <div className="bg-white rounded-3xl shadow-xl border border-neutral-100 overflow-hidden">
                <div className="p-8 border-b border-neutral-100 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
                      Facturación
                    </h2>
                    <p className="text-sm font-bold text-on-surface-muted uppercase tracking-widest mt-1">
                      Historial de cobros a restaurantes
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      const btn = document.activeElement as HTMLButtonElement;
                      if (btn) btn.disabled = true;
                      toast.loading("Ejecutando motor de facturación...");
                      await runBillingEngine();
                      await fetchData();
                      if (btn) btn.disabled = false;
                    }}
                    className="bg-surface-variant text-on-surface px-6 py-3 rounded-2xl font-black text-sm transition-all flex items-center gap-3 shadow-lg shadow-neutral-200 hover:scale-105 active:scale-95"
                  >
                    <FileText className="w-5 h-5 text-orange-500" />
                    Procesar Cortes
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-neutral-50">
                        <th className="px-8 py-4 text-[10px] font-black text-on-surface-muted uppercase tracking-widest">
                          Restaurante
                        </th>
                        <th className="px-8 py-4 text-[10px] font-black text-on-surface-muted uppercase tracking-widest">
                          Concepto
                        </th>
                        <th className="px-8 py-4 text-[10px] font-black text-on-surface-muted uppercase tracking-widest">
                          Monto
                        </th>
                        <th className="px-8 py-4 text-[10px] font-black text-on-surface-muted uppercase tracking-widest">
                          Fecha Límite
                        </th>
                        <th className="px-8 py-4 text-[10px] font-black text-on-surface-muted uppercase tracking-widest">
                          Estado
                        </th>
                        <th className="px-8 py-4 text-[10px] font-black text-on-surface-muted uppercase tracking-widest">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {invoices.length > 0 ? (
                        invoices.map((invoice) => {
                          const restaurant = restaurants.find(
                            (r) => r.id === invoice.restaurantId,
                          );
                          return (
                            <tr
                              key={invoice.id}
                              className="hover:bg-neutral-50/50 transition-colors"
                            >
                              <td className="px-8 py-6">
                                <p className="font-bold text-neutral-900">
                                  {restaurant?.name || "Desconocido"}
                                </p>
                                <p className="text-xs text-on-surface-variant">
                                  {restaurant?.city}
                                </p>
                              </td>
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-2 h-2 rounded-full ${invoice.type === "subscription" ? "bg-blue-500" : "bg-purple-500"}`}
                                  />
                                  <p className="font-bold text-neutral-700">
                                    {invoice.description}
                                  </p>
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                <p className="font-black text-neutral-900">
                                  {formatCurrency(invoice.amount)}
                                </p>
                              </td>
                              <td className="px-8 py-6">
                                <p className="text-sm font-bold text-neutral-600">
                                  {new Date(invoice.dueDate).toLocaleDateString(
                                    "es-CO",
                                    { day: "numeric", month: "short" },
                                  )}
                                </p>
                              </td>
                              <td className="px-8 py-6">
                                <span
                                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    invoice.status === "paid"
                                      ? "bg-green-100 text-green-700"
                                      : invoice.status === "failed"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-amber-100 text-amber-700"
                                  }`}
                                >
                                  {invoice.status === "paid"
                                    ? "Pagado"
                                    : invoice.status === "failed"
                                      ? "Fallido"
                                      : "Pendiente"}
                                </span>
                              </td>
                              <td className="px-8 py-6 flex gap-2">
                                {invoice.status === "pending" && (
                                  <button
                                    onClick={async () => {
                                      if (
                                        confirm(
                                          "¿Confirmar que este restaurante ya pagó esta factura manualmente?",
                                        )
                                      ) {
                                        await db.updatePlatformInvoiceStatus(
                                          invoice.id,
                                          "paid",
                                          "Confirmado manualmente por Admin",
                                        );
                                        toast.success(
                                          "Factura marcada como pagada",
                                        );
                                        fetchData();
                                      }
                                    }}
                                    className="p-2 hover:bg-green-50 rounded-xl transition-colors group"
                                    title="Confirmar Pago Manual"
                                  >
                                    <CheckCircle2 className="w-5 h-5 text-on-surface-muted group-hover:text-green-500" />
                                  </button>
                                )}
                                <button className="p-2 hover:bg-neutral-200 rounded-xl transition-colors">
                                  <FileText className="w-5 h-5 text-on-surface-muted" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-8 py-12 text-center text-on-surface-variant font-bold"
                          >
                            No hay facturas registradas
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                  <div className="flex items-center gap-4 mb-4 text-red-600">
                    <div className="p-3 bg-red-100 rounded-full">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold">
                      ¿Confirmar eliminación?
                    </h2>
                  </div>

                  <p className="text-neutral-600 mb-6 leading-relaxed">
                    Estás a punto de eliminar{" "}
                    {deleteConfirm.type === "user"
                      ? "al usuario"
                      : "el restaurante"}
                    :
                    <span className="font-black text-neutral-900 block mt-1">
                      "{deleteConfirm.name}"
                    </span>
                    {deleteConfirm.type === "restaurant" && (
                      <span className="text-xs text-red-500 font-bold mt-2 block">
                        * Esta acción eliminará permanentemente todos los
                        productos, categorías y pedidos asociados.
                      </span>
                    )}
                  </p>

                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-6 py-3 text-neutral-600 hover:bg-neutral-100 rounded-xl font-bold transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() =>
                        deleteConfirm.type === "user"
                          ? handleDeleteUser(deleteConfirm.id)
                          : handleDeleteRestaurant(deleteConfirm.id)
                      }
                      className="px-6 py-3 bg-red-600 text-on-surface rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                    >
                      Eliminar Permanentemente
                    </button>
                  </div>
                </div>
              </div>
            )}

            {cropper && (
              <ImageCropperModal
                isOpen={cropper.isOpen}
                imageSrc={cropper.imageSrc}
                onClose={() => setCropper(null)}
                onCropComplete={handleCropComplete}
                aspectRatio={cropper.aspectRatio}
                cropWidth={cropper.cropWidth}
                cropHeight={cropper.cropHeight}
              />
            )}

            {/* Modal: Admin Audit and Approve/Publish */}
            {auditingRestaurant && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70] overflow-y-auto text-left">
                <div className="bg-white rounded-3xl p-6 w-full max-w-xl shadow-2xl space-y-6 text-left my-8 border border-neutral-200">
                  <div className="flex justify-between items-start pb-3 border-b border-neutral-100">
                    <div>
                      <h2 className="text-lg font-black text-neutral-950 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#FF8A00] animate-pulse" />
                        Auditoría y Aprobación de Publicación
                      </h2>
                      <p className="text-xs text-neutral-500 font-bold mt-0.5">
                        Establecimiento:{" "}
                        <span className="text-neutral-900 font-extrabold">
                          {auditingRestaurant.name}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => setAuditingRestaurant(null)}
                      className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  {auditingLoading || !auditChecklist ? (
                    <div className="py-20 text-center text-sm font-bold text-neutral-400 flex flex-col items-center gap-2">
                      <div className="w-8 h-8 rounded-full border-4 border-[#FF8A00] border-t-transparent animate-spin" />
                      Calculando métricas de auditoría en tiempo real...
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 text-xs font-semibold text-neutral-700 leading-relaxed">
                        <span className="text-orange-650 font-black uppercase text-[10px] block mb-1">
                          🔍 DIAGNÓSTICO DEL SISTEMA
                        </span>
                        Este módulo verifica que el restaurante afiliado por el
                        embajador cumpla rigurosamente con los requerimientos
                        técnicos y funcionales antes de publicarse en la página
                        principal, evitando fallos en la experiencia del usuario
                        final.
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* Logo */}
                        <div className="p-3 bg-neutral-50 border border-neutral-150 rounded-2xl flex items-start gap-2.5">
                          <div className="mt-0.5">
                            {auditChecklist.hasLogo ? (
                              <CheckCircle className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <AlertTriangle className="w-5 h-5 text-amber-500" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-[11px] font-black text-neutral-900 uppercase">
                              Logo de Identidad
                            </h4>
                            <p className="text-[10px] text-neutral-500 font-bold leading-normal mt-0.5">
                              {auditChecklist.hasLogo
                                ? "✓ Logo válido configurado"
                                : "⚠️ Logo ausente o placeholder"}
                            </p>
                          </div>
                        </div>

                        {/* Cover */}
                        <div className="p-3 bg-neutral-50 border border-neutral-150 rounded-2xl flex items-start gap-2.5">
                          <div className="mt-0.5">
                            {auditChecklist.hasCover ? (
                              <CheckCircle className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <AlertTriangle className="w-5 h-5 text-amber-500" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-[11px] font-black text-neutral-900 uppercase">
                              Fondo de Cabecera
                            </h4>
                            <p className="text-[10px] text-neutral-500 font-bold leading-normal mt-0.5">
                              {auditChecklist.hasCover
                                ? "✓ Banner premium cargado"
                                : "⚠️ Imagen de fondo no definida"}
                            </p>
                          </div>
                        </div>

                        {/* Address */}
                        <div className="p-3 bg-neutral-50 border border-neutral-150 rounded-2xl flex items-start gap-2.5">
                          <div className="mt-0.5">
                            {auditChecklist.hasAddress ? (
                              <CheckCircle className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <AlertTriangle className="w-5 h-5 text-amber-500" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-[11px] font-black text-neutral-900 uppercase">
                              Dirección Física
                            </h4>
                            <div className="text-[10px] text-neutral-500 font-bold leading-normal mt-0.5 truncate max-w-[170px]">
                              {auditChecklist.hasAddress
                                ? `✓ ${auditingRestaurant.address}`
                                : "⚠️ Dirección sin configurar"}
                            </div>
                          </div>
                        </div>

                        {/* Opening hours */}
                        <div className="p-3 bg-neutral-50 border border-neutral-150 rounded-2xl flex items-start gap-2.5">
                          <div className="mt-0.5">
                            {auditChecklist.hasHours ? (
                              <CheckCircle className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <AlertTriangle className="w-5 h-5 text-amber-500" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-[11px] font-black text-neutral-900 uppercase">
                              Horario de Operación
                            </h4>
                            <p className="text-[10px] text-neutral-500 font-bold leading-normal mt-0.5">
                              {auditChecklist.hasHours
                                ? "✓ Horarios semanales asignados"
                                : "⚠️ Horarios no programados"}
                            </p>
                          </div>
                        </div>

                        {/* Digital Menu */}
                        <div className="p-3 bg-neutral-50 border border-neutral-150 rounded-2xl flex items-start gap-2.5">
                          <div className="mt-0.5">
                            {auditChecklist.hasProducts ? (
                              <CheckCircle className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <AlertTriangle className="w-5 h-5 text-amber-500" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-[11px] font-black text-neutral-900 uppercase">
                              Menú Digital
                            </h4>
                            <p className="text-[10px] text-neutral-500 font-bold leading-normal mt-0.5">
                              {auditChecklist.hasProducts
                                ? `✓ ${auditChecklist.numProducts} productos configurados`
                                : "⚠️ Menú completamente vacío"}
                            </p>
                          </div>
                        </div>

                        {/* AI assistant */}
                        <div className="p-3 bg-neutral-50 border border-neutral-150 rounded-2xl flex items-start gap-2.5">
                          <div className="mt-0.5">
                            {auditChecklist.hasAssistant ? (
                              <CheckCircle className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <div className="w-5 h-5 bg-neutral-200 rounded-full flex items-center justify-center text-[10px] font-black text-neutral-600 font-mono">
                                i
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="text-[11px] font-black text-neutral-900 uppercase">
                              Asistente Inteligente (IA)
                            </h4>
                            <p className="text-[10px] text-neutral-500 font-bold leading-normal mt-0.5">
                              {auditChecklist.hasAssistant
                                ? "✓ Comportamiento IA entrenado"
                                : "💡 Recomendado: Entrenar el bot de IA"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* marketing details */}
                      <div className="p-4 bg-neutral-50 border border-neutral-150 rounded-2xl space-y-2">
                        <div className="flex items-center gap-1.5 font-black text-neutral-900 text-xs">
                          <Award className="w-4 h-4 text-[#FF8A00]" />
                          <h4>Dinámicas de Marketing Configuradas</h4>
                        </div>
                        <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider text-neutral-700">
                          <span
                            className={`px-2 py-0.5 rounded-lg border ${auditChecklist.loyaltyEnabled ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-neutral-100 border-neutral-200 text-neutral-400"}`}
                          >
                            Fidelización:{" "}
                            {auditChecklist.loyaltyEnabled ? "Sí" : "No"}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-lg border ${auditChecklist.referralEnabled ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-neutral-100 border-neutral-200 text-neutral-400"}`}
                          >
                            Referidos:{" "}
                            {auditChecklist.referralEnabled ? "Sí" : "No"}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-lg border ${auditChecklist.anniversaryEnabled ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-neutral-100 border-neutral-200 text-neutral-400"}`}
                          >
                            Aniversario:{" "}
                            {auditChecklist.anniversaryEnabled ? "Sí" : "No"}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-lg border ${auditChecklist.prizesCount > 0 ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-neutral-100 border-neutral-200 text-neutral-400"}`}
                          >
                            Ruleta de Premios:{" "}
                            {auditChecklist.prizesCount > 0
                              ? `${auditChecklist.prizesCount} Premios`
                              : "No"}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-3 border-t border-neutral-100">
                        <button
                          onClick={() =>
                            handleRejectPublish(auditingRestaurant)
                          }
                          className="flex-1 py-3 border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-[#FF8A00] hover:text-orange-700 text-xs font-bold rounded-xl transition-colors uppercase tracking-wider"
                        >
                          Rechazar / Regresar a Borrador
                        </button>
                        <button
                          onClick={() =>
                            handleApprovePublish(auditingRestaurant)
                          }
                          className="flex-1 py-3 bg-[#FF8A00] hover:bg-orange-650 text-white text-xs font-black rounded-xl transition-all uppercase tracking-wider shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle className="w-4 h-4 text-orange-100" />
                          Aprobar y Publicar Oficialmente
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Delete Confirmation Modal */}
            {itemToDelete && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl"
                >
                  <div className="p-8">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mb-6 mx-auto transform rotate-12">
                      <Trash2 className="w-8 h-8 transform -rotate-12" />
                    </div>
                    <h3 className="text-2xl font-black text-center text-neutral-900 mb-2">
                      ¿Estás seguro?
                    </h3>
                    <p className="text-on-surface-muted text-center font-medium">
                      Estás a punto de eliminar{" "}
                      {itemToDelete.type === "foodCategory"
                        ? `la categoría "${itemToDelete.name}"`
                        : `la categoría de negocio "${itemToDelete.name}"`}
                      . Esta acción no se puede deshacer.
                    </p>
                  </div>
                  <div className="p-6 bg-neutral-50 flex gap-4 border-t border-neutral-100">
                    <button
                      onClick={() => setItemToDelete(null)}
                      className="flex-1 py-3 rounded-xl font-bold text-neutral-600 bg-white border border-neutral-200 hover:bg-neutral-100 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        if (itemToDelete.type === "foodCategory") {
                          confirmDeleteFoodCategory(itemToDelete.id);
                        } else if (itemToDelete.type === "businessCategory") {
                          confirmDeleteBusinessCategory(itemToDelete.id);
                        }
                        setItemToDelete(null);
                      }}
                      className="flex-1 py-3 rounded-xl font-black text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
                    >
                      Sí, eliminar
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
