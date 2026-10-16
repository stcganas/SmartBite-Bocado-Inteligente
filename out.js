import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { formatCurrency } from "../utils/format";
import React, { useState, useEffect } from "react";
import { ImageCropperModal } from "../components/ImageCropperModal";
import {
  db
} from "../store/db";
import { supabase } from "../lib/supabase";
import { runBillingEngine } from "../services/billingService";
import { PlanManager } from "../components/PlanManager";
import { Documentation } from "../components/Documentation";
import { Link, useLocation } from "react-router-dom";
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
  FileText,
  ChevronLeft,
  Download,
  CheckCircle2,
  AlertTriangle,
  Bike,
  Truck,
  Ticket,
  Calendar,
  X,
  Car,
  CreditCard,
  BellRing,
  Zap,
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
  CheckCircle
} from "lucide-react";
const QuotaCountdown = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = /* @__PURE__ */ new Date();
      const target = /* @__PURE__ */ new Date();
      target.setUTCHours(8, 0, 0, 0);
      if (now.getUTCHours() >= 8) {
        target.setUTCDate(target.getUTCDate() + 1);
      }
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0 };
      const hours = Math.floor(diff / (1e3 * 60 * 60));
      const minutes = Math.floor(diff / (1e3 * 60) % 60);
      const seconds = Math.floor(diff / 1e3 % 60);
      return { hours, minutes, seconds };
    };
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1e3);
    setTimeLeft(calculateTimeLeft());
    return () => clearInterval(timer);
  }, []);
  return /* @__PURE__ */ jsxs("div", { className: "bg-surface-variant border border-white/10 p-6 rounded-[2rem] flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
      /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4 text-orange-500 animate-pulse" }),
      /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-muted", children: "Reinicio de Cuotas" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
        /* @__PURE__ */ jsx("span", { className: "text-3xl font-black text-on-surface tabular-nums", children: timeLeft.hours.toString().padStart(2, "0") }),
        /* @__PURE__ */ jsx("span", { className: "text-[8px] font-bold text-on-surface-variant uppercase tracking-widest", children: "Hrs" })
      ] }),
      /* @__PURE__ */ jsx("span", { className: "text-3xl font-black text-orange-500", children: ":" }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
        /* @__PURE__ */ jsx("span", { className: "text-3xl font-black text-on-surface tabular-nums", children: timeLeft.minutes.toString().padStart(2, "0") }),
        /* @__PURE__ */ jsx("span", { className: "text-[8px] font-bold text-on-surface-variant uppercase tracking-widest", children: "Min" })
      ] }),
      /* @__PURE__ */ jsx("span", { className: "text-3xl font-black text-orange-500", children: ":" }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
        /* @__PURE__ */ jsx("span", { className: "text-3xl font-black text-on-surface tabular-nums", children: timeLeft.seconds.toString().padStart(2, "0") }),
        /* @__PURE__ */ jsx("span", { className: "text-[8px] font-bold text-on-surface-variant uppercase tracking-widest", children: "Seg" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "mt-4 text-[9px] font-medium text-on-surface-variant max-w-[150px] leading-tight", children: "Tiempo estimado para la restauraci\xF3n de la cuota gratuita (08:00 UTC)." })
  ] });
};
import { DateSelector } from "../components/DateSelector";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { AdminReferralManagement } from "../components/AdminReferralManagement";
import { AdminRepresentativeManagement } from "../components/AdminRepresentativeManagement";
import { AdminGamificationManagement } from "../components/AdminGamificationManagement";
import autoTable from "jspdf-autotable";
import { motion } from "framer-motion";
import { ImageSizeInfo } from "../components/ImageSizeInfo";
import { DashboardSidebar } from "../components/DashboardSidebar";
import { useAuth } from "../contexts/AuthContext";
import { NotificationInbox } from "../components/NotificationInbox";
import { useNotifications } from "../contexts/NotificationContext";
import { OnboardingBuilder } from "../components/OnboardingBuilder";
import { SplashBuilder } from "../components/SplashBuilder";
import { AdminParchisConfig } from "../components/AdminParchisConfig";
export default function PlatformAdmin() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const [restaurants, setRestaurants] = useState([]);
  const [auditingRestaurant, setAuditingRestaurant] = useState(null);
  const [auditingLoading, setAuditingLoading] = useState(false);
  const [auditChecklist, setAuditChecklist] = useState(null);
  const [appUsers, setAppUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState(null);
  const [cropper, setCropper] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search);
    const tabOption = params.get("tab");
    return tabOption || "restaurants";
  });
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabOption = params.get("tab");
    if (tabOption) {
      setActiveTab(tabOption);
    }
  }, [location.search]);
  const [campaigns, setCampaigns] = useState([]);
  const [communicationsSubTab, setCommunicationsSubTab] = useState("send");
  const [scheduledNotes, setScheduledNotes] = useState([]);
  const [notificationForm, setNotificationForm] = useState({
    target: "all",
    restaurantId: "",
    title: "",
    body: "",
    isScheduled: false,
    scheduledDate: "",
    scheduledTime: "",
    category: "promoci\xF3n"
  });
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [rewardModules, setRewardModules] = useState([]);
  const [editingRewardModule, setEditingRewardModule] = useState(null);
  const [isSavingRewardModule, setIsSavingRewardModule] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(
    null
  );
  const [editingUser, setEditingUser] = useState(null);
  const [editingRestaurant, setEditingRestaurant] = useState(
    null
  );
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isConvertingPwaIcon, setIsConvertingPwaIcon] = useState(false);
  const [isUploadingMusic, setIsUploadingMusic] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const musicInputRef = React.useRef(null);
  const [musicTracks, setMusicTracks] = useState([]);
  const [dateFilter, setDateFilter] = useState({
    start: new Date((/* @__PURE__ */ new Date()).setDate((/* @__PURE__ */ new Date()).getDate() - 30)).toISOString().split("T")[0],
    end: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
  });
  const [loading, setLoading] = useState(true);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const handleClearHistory = async () => {
    if (!confirm(
      "\xBFEst\xE1s seguro de borrar permanentemente TODO el historial de notificaciones y campa\xF1as? Esta acci\xF3n no se puede deshacer."
    ))
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
        rewardModulesData,
        musicTracksData
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
        supabase.from("driver_profiles").select("*, app_users!inner(display_name, email)"),
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
        db.getRewardModules().catch((e) => {
          console.error("Error fetching reward modules:", e);
          return [];
        }),
        db.getBackgroundMusicTracks().catch((e) => {
          console.error("Error fetching music:", e);
          return [];
        })
      ]);
      if (driversResult.error) {
        console.error("Error fetching drivers:", driversResult.error);
      }
      setRestaurants(restaurantsData || []);
      setAppUsers(usersData || []);
      if (settingsData) setSettings(settingsData);
      setOrders(ordersData || []);
      setDrivers(driversResult.data || []);
      setCoupons(couponsData || []);
      setRewardModules(rewardModulesData || []);
      setPlans(plansData || []);
      setInvoices(invoicesData || []);
      setCampaigns(campaignsData || []);
      setMusicTracks(musicTracksData || []);
      if (restaurantsData) {
        restaurantsData.forEach(async (r) => {
          try {
            const menu = await db.getRestaurantMenu(r.id);
            setRestaurants(
              (prev) => prev.map(
                (item) => item.id === r.id ? { ...item, menu } : item
              )
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
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn("PlatformAdmin fetchData timed out");
        setLoading(false);
      }
    }, 6e3);
    return () => clearTimeout(timeoutId);
  }, []);
  const handleUpdateDriverApproval = async (id, status) => {
    try {
      const { error } = await db.updateDriverProfile(id, {
        approvalStatus: status
      });
      if (error) throw error;
      setDrivers(
        (prev) => prev.map((d) => d.id === id ? { ...d, approval_status: status } : d)
      );
      if (selectedDriver && selectedDriver.id === id) {
        setSelectedDriver((prev) => ({ ...prev, approval_status: status }));
      }
      toast.success(
        `Repartidor ${status === "approved" ? "aprobado" : "rechazado"} correctamente`
      );
    } catch (error) {
      console.error("Error updating driver approval:", error);
      toast.error("Error al actualizar el estado del repartidor");
    }
  };
  const handleUpdateUserStatus = async (id, newStatus) => {
    await db.updateAppUser(id, { status: newStatus });
    fetchData();
  };
  const handleDeleteUser = async (id) => {
    if (!deleteConfirm) return;
    const { error } = await db.deleteAppUser(id);
    if (error) {
      toast.error(
        "Error al eliminar. Aseg\xFArate de configurar SUPABASE_SERVICE_ROLE_KEY en el backend."
      );
    } else {
      setDeleteConfirm(null);
      toast.success("Usuario eliminado correctamente");
      fetchData();
    }
  };
  const handleDeleteRestaurant = async (id) => {
    if (!deleteConfirm) return;
    await db.deleteRestaurant(id);
    setDeleteConfirm(null);
    toast.success("Restaurante eliminado correctamente");
    fetchData();
  };
  const handleToggleRestaurantStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    await db.updateRestaurant(id, { status: newStatus });
    fetchData();
  };
  const handleStartAudit = async (restaurant) => {
    setAuditingRestaurant(restaurant);
    setAuditingLoading(true);
    try {
      const prizes = await db.getRestaurantWheelPrizes(restaurant.id);
      const prizesCount = prizes ? prizes.length : 0;
      const menuCount = restaurant.menu ? restaurant.menu.length : 0;
      const aiKnowledge = restaurant.aiKnowledge || restaurant.ai_knowledge;
      const hours = restaurant.openingHours || restaurant.opening_hours;
      const logo = restaurant.logo;
      const cover = restaurant.coverImage || restaurant.cover_image;
      const address = restaurant.address;
      const hasLogo = !!(logo && !logo.includes("placeholder") && logo.trim().slice(0, 4) === "http");
      const hasCover = !!(cover && !cover.includes("placeholder") && cover.trim().slice(0, 4) === "http");
      const hasAddress = !!(address && address.trim().length > 3);
      const hasHours = !!(hours && hours.trim().length > 2);
      const hasAssistant = !!(aiKnowledge && (aiKnowledge.instructions?.trim() || aiKnowledge.foodTypes?.trim()));
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
        loyaltyEnabled: !!restaurant.loyalty_enabled || !!restaurant.loyalty_enabled,
        referralEnabled: !!restaurant.referral_enabled || !!restaurant.referral_enabled,
        anniversaryEnabled: !!restaurant.anniversary_program_enabled || !!restaurant.anniversaryProgramEnabled
      });
    } catch (err) {
      console.error("Error running admin audit:", err);
      toast.error("Ocurri\xF3 un error al obtener detalles del restaurante.");
    } finally {
      setAuditingLoading(false);
    }
  };
  const handleApprovePublish = async (restaurant) => {
    try {
      await db.updateRestaurant(restaurant.id, {
        status: "active",
        highlightMessage: ""
      });
      toast.success(`\u{1F389} El restaurante "${restaurant.name}" ha sido aprobado y publicado oficialmente.`);
      setAuditingRestaurant(null);
      fetchData();
    } catch (err) {
      console.error("Error approving restaurant:", err);
      toast.error("Error al publicar el restaurante.");
    }
  };
  const handleRejectPublish = async (restaurant) => {
    try {
      await db.updateRestaurant(restaurant.id, {
        status: "inactive",
        highlightMessage: ""
      });
      toast.success(`La solicitud del restaurante "${restaurant.name}" fue rechazada y regres\xF3 a borrador.`);
      setAuditingRestaurant(null);
      fetchData();
    } catch (err) {
      console.error("Error rejecting restaurant publish request:", err);
      toast.error("Error al procesar el rechazo.");
    }
  };
  const handleToggleFeatured = async (id, currentFeatured) => {
    const newFeatured = !currentFeatured;
    const newCommission = newFeatured ? 10 : 5;
    await db.updateRestaurant(id, {
      isFeatured: newFeatured,
      commissionRate: newCommission
    });
    toast.success(
      newFeatured ? "Restaurante destacado (Comisi\xF3n 10%)" : "Restaurante quitado de destacados (Comisi\xF3n 5%)"
    );
    fetchData();
  };
  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!editingCoupon) return;
    try {
      await db.saveCoupon(editingCoupon);
      toast.success("Cup\xF3n guardado correctamente");
      setEditingCoupon(null);
      fetchData();
    } catch (error) {
      console.error("Error saving coupon:", error);
      toast.error("Error al guardar el cup\xF3n");
    }
  };
  const handleDeleteCoupon = async (id) => {
    if (!confirm("\xBFEst\xE1s seguro de eliminar este cup\xF3n?")) return;
    try {
      await db.deleteCoupon(id);
      toast.success("Cup\xF3n eliminado");
      fetchData();
    } catch (error) {
      console.error("Error deleting coupon:", error);
      toast.error("Error al eliminar el cup\xF3n");
    }
  };
  const exportToPDF = (restaurant, restaurantOrders, sales, commission, net) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(249, 115, 22);
    doc.text("Reporte de Ventas y Comisiones", 14, 22);
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Restaurante: ${restaurant.name}`, 14, 32);
    doc.text(`Periodo: ${dateFilter.start} al ${dateFilter.end}`, 14, 38);
    doc.text(`Fecha de Reporte: ${(/* @__PURE__ */ new Date()).toLocaleDateString()}`, 14, 44);
    autoTable(doc, {
      startY: 55,
      head: [["Concepto", "Monto"]],
      body: [
        ["Ventas Totales", `${formatCurrency(sales)}`],
        [
          `Comisi\xF3n App (${restaurant.commissionRate || 5}%)`,
          `${formatCurrency(commission)}`
        ],
        ["Neto a Pagar al Restaurante", `${formatCurrency(net)}`]
      ],
      theme: "striped",
      headStyles: { fillColor: [249, 115, 22] }
    });
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(
      "Detalle de Movimientos",
      14,
      doc.lastAutoTable.finalY + 15
    );
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [["ID Pedido", "Fecha", "Cliente", "Total", "Comisi\xF3n", "Neto"]],
      body: restaurantOrders.map((o) => {
        const comm = o.total * ((restaurant.commissionRate || 5) / 100);
        return [
          `#${o.id.slice(0, 8)}`,
          new Date(o.createdAt).toLocaleDateString(),
          o.customerName,
          `${formatCurrency(o.total)}`,
          `${formatCurrency(comm)}`,
          `${formatCurrency(o.total - comm)}`
        ];
      }),
      headStyles: { fillColor: [50, 50, 50] }
    });
    doc.save(
      `Reporte_${restaurant.name.replace(/\s+/g, "_")}_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.pdf`
    );
    toast.success("PDF exportado correctamente");
  };
  const handleSaveUserRole = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    const targetUserId = editingUser.id;
    const targetRole = editingUser.role;
    console.log(
      `PlatformAdmin: Updating user ${targetUserId} to role ${targetRole}`
    );
    try {
      const { data: updatedUser, error } = await db.updateAppUser(
        targetUserId,
        { role: targetRole }
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
          updatedUser.role
        );
        toast.error(
          "El cambio de rol no se aplic\xF3 correctamente en el servidor."
        );
        return;
      }
      if (targetRole === "driver") {
        try {
          const profile = await db.getDriverProfile(targetUserId);
          if (!profile) {
            console.log("PlatformAdmin: Creating missing driver profile");
            const { error: profileError } = await supabase.from("driver_profiles").upsert({
              id: targetUserId,
              vehicle_type: "motorcycle",
              is_online: false
            });
            if (profileError)
              console.error(
                "PlatformAdmin: Error creating driver profile:",
                profileError
              );
          }
        } catch (err) {
          console.error("PlatformAdmin: Error ensuring driver profile:", err);
        }
      }
      toast.success("Rol actualizado exitosamente");
      setAppUsers(
        (prev) => prev.map(
          (u) => u.id === targetUserId ? { ...u, role: targetRole } : u
        )
      );
      setEditingUser(null);
      setTimeout(() => fetchData(), 500);
    } catch (err) {
      console.error("PlatformAdmin: Unexpected error:", err);
      toast.error("Ocurri\xF3 un error inesperado");
    }
  };
  const handleMusicUpload = async (e) => {
    console.log("PlatformAdmin: handleMusicUpload triggered", e.target.files);
    try {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        console.log(
          "PlatformAdmin: File selected:",
          file.name,
          file.size,
          file.type
        );
        if (file.size === 0) {
          toast.error("El archivo seleccionado est\xE1 vac\xEDo");
          return;
        }
        if (file.size > 100 * 1024 * 1024) {
          toast.error("El archivo es demasiado grande (M\xE1ximo 100MB)");
          if (musicInputRef.current) musicInputRef.current.value = "";
          return;
        }
        toast.info(`Procesando archivo: ${file.name}`);
        setIsUploadingMusic(true);
        setUploadProgress(0);
        toast.loading(`Subiendo track: ${file.name}...`, {
          id: "music-upload"
        });
        console.log("PlatformAdmin: Initiating db.uploadAudio...");
        const { url, error } = await db.uploadAudio(
          file,
          "platform/music",
          (progress) => {
            setUploadProgress(progress);
          }
        );
        if (error) {
          console.error("PlatformAdmin: Upload audio component error:", error);
          toast.error(`Error de Servidor: ${error.message || error}`, {
            id: "music-upload"
          });
          throw error;
        }
        if (url) {
          console.log("PlatformAdmin: Upload success, received URL:", url);
          const { error: settingsError } = await db.updatePlatformSettings({
            backgroundMusicUrl: url
          });
          if (settingsError) {
            console.error(
              "PlatformAdmin: Error updating settings:",
              settingsError
            );
            throw settingsError;
          }
          setSettings(
            (prev) => prev ? { ...prev, backgroundMusicUrl: url } : prev
          );
          toast.success("\xA1Canci\xF3n de fondo a\xF1adida correctamente!", {
            id: "music-upload"
          });
          window.dispatchEvent(new CustomEvent("background-music-update"));
        } else {
          console.warn(
            "PlatformAdmin: Upload completed but no URL was returned"
          );
          toast.error("Error: No se recibi\xF3 la direcci\xF3n del archivo", {
            id: "music-upload"
          });
        }
      } else {
        console.log("PlatformAdmin: No file selected in input");
        toast.error("No se detect\xF3 ning\xFAn archivo seleccionado.");
      }
    } catch (err) {
      console.error("PlatformAdmin: General upload error catch:", err);
      toast.error(`Error de carga: ${err?.message || "Error desconocido"}`, {
        id: "music-upload"
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
        backgroundMusicUrl: ""
      });
      if (error) throw error;
      setSettings(
        (prev) => prev ? { ...prev, backgroundMusicUrl: "" } : prev
      );
      toast.success("M\xFAsica de fondo desactivada.");
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
        hideMusicPlayer: newValue
      });
      if (error) throw error;
      setSettings(
        (prev) => prev ? { ...prev, hideMusicPlayer: newValue } : prev
      );
      toast.success(newValue ? "Reproductor ocultado en toda la app." : "Reproductor visible en toda la app.");
      window.dispatchEvent(new CustomEvent("background-music-update"));
    } catch (err) {
      console.error("Error toggling hideMusicPlayer:", err);
      toast.error("No se pudo cambiar la visibilidad del reproductor.");
    }
  };
  const handlePwaIconUpload = async (e) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    if (file.size > 10 * 1024 * 1024) {
      toast.error("La imagen seleccionada es demasiado grande (m\xE1ximo 10MB).");
      return;
    }
    const confirmUpload = window.confirm(
      "\xBFDeseas convertir esta imagen al icono oficial de la PWA?\n\nEsto regenerar\xE1 autom\xE1ticamente los tama\xF1os 192x192, 512x512 y Maskable y forzar\xE1 una actualizaci\xF3n de cach\xE9 en los dispositivos la pr\xF3xima vez que abran la aplicaci\xF3n."
    );
    if (!confirmUpload) return;
    setIsConvertingPwaIcon(true);
    const toastId = toast.loading(
      "Subiendo y procesando imagen de icono PWA..."
    );
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload-pwa-icon", {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Error desconocido al procesar el icono."
        );
      }
      toast.success(
        "\xA1Iconos PWA regenerados y actualizados exitosamente! Se ha forzado una actualizaci\xF3n de cach\xE9 para los navegadores.",
        { id: toastId }
      );
      fetchData();
    } catch (err) {
      console.error("[PWA Upload Error]", err);
      toast.error(`Error al regenerar el icono PWA: ${err.message || err}`, {
        id: toastId
      });
    } finally {
      setIsConvertingPwaIcon(false);
      e.target.value = "";
    }
  };
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!settings) return;
    setIsSavingSettings(true);
    try {
      const { error } = await db.updatePlatformSettings(settings);
      if (error) throw error;
      toast.success("Configuraci\xF3n guardada exitosamente");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Error al guardar la configuraci\xF3n");
    } finally {
      setIsSavingSettings(false);
    }
  };
  const handleAddFoodCategory = () => {
    if (!settings) return;
    const newCategory = {
      id: crypto.randomUUID(),
      name: "Nueva Categor\xEDa",
      icon: "\u{1F37D}\uFE0F"
    };
    setSettings({
      ...settings,
      foodCategories: [...settings.foodCategories || [], newCategory]
    });
  };
  const handleUpdateFoodCategory = (id, field, value) => {
    if (!settings) return;
    setSettings({
      ...settings,
      foodCategories: (settings.foodCategories || []).map(
        (c) => c.id === id ? { ...c, [field]: value } : c
      )
    });
  };
  const handleDeleteFoodCategory = (id) => {
    if (!settings) return;
    if (!window.confirm("\xBFEst\xE1s seguro de eliminar esta categor\xEDa?")) return;
    setSettings({
      ...settings,
      foodCategories: (settings.foodCategories || []).filter(
        (c) => c.id !== id
      )
    });
  };
  const handleCropComplete = async (croppedBlob) => {
    if (!cropper) return;
    try {
      toast.loading("Subiendo imagen recortada...");
      const file = new File([croppedBlob], `crop_${Date.now()}.jpg`, {
        type: "image/jpeg"
      });
      const folderType = cropper.type.replace(/([A-Z])/g, "-$1").toLowerCase();
      const { url, error } = await db.uploadImage(
        file,
        "platform/" + folderType
      );
      toast.dismiss();
      if (error) {
        toast.error("Error al subir la imagen recortada");
      } else if (url && settings) {
        if (cropper.type === "auth") {
          setSettings({ ...settings, authPageImage: url });
        } else if (cropper.type === "heroImage") {
          setSettings({ ...settings, heroImage: url });
        } else if (cropper.type === "footerBanner") {
          setSettings({ ...settings, footerBannerImage: url });
        } else if (cropper.type === "authClient") {
          setSettings({
            ...settings,
            paymentGateways: {
              ...settings.paymentGateways || {},
              authClientBanner: url
            }
          });
        } else if (cropper.type === "authRestaurant") {
          setSettings({
            ...settings,
            paymentGateways: {
              ...settings.paymentGateways || {},
              authRestaurantBanner: url
            }
          });
        } else if (cropper.type === "authDriver") {
          setSettings({
            ...settings,
            paymentGateways: {
              ...settings.paymentGateways || {},
              authDriverBanner: url
            }
          });
        } else if (cropper.type === "appLogo") {
          setSettings({ ...settings, appLogo: url });
        } else if (cropper.type === "splashLogo") {
          setSettings({ ...settings, systemSplashLogo: url });
        } else if (cropper.type === "heroBanner" && cropper.metaId) {
          handleUpdateHeroBanner(cropper.metaId, "imageUrl", url);
        } else if (cropper.type === "banner" && cropper.metaId) {
          handleUpdateBanner(cropper.metaId, "imageUrl", url);
        }
      }
    } catch (e) {
      toast.dismiss();
      console.error(e);
      toast.error("Ocurri\xF3 un error al procesar el recorte");
    }
    setCropper(null);
  };
  const handleAddBanner = () => {
    if (!settings) return;
    const newBanner = {
      id: crypto.randomUUID(),
      title: "Nuevo Banner",
      imageUrl: "",
      active: true
    };
    setSettings({
      ...settings,
      banners: [...settings.banners || [], newBanner]
    });
  };
  const handleUpdateBanner = (id, field, value) => {
    if (!settings) return;
    setSettings({
      ...settings,
      banners: settings.banners.map(
        (b) => b.id === id ? { ...b, [field]: value } : b
      )
    });
  };
  const handleDeleteBanner = (id) => {
    if (!settings) return;
    setSettings({
      ...settings,
      banners: settings.banners.filter((b) => b.id !== id)
    });
  };
  const handleAddHeroBanner = () => {
    if (!settings) return;
    const newBanner = {
      id: crypto.randomUUID(),
      title: "Nuevo Banner Hero",
      imageUrl: "",
      active: true
    };
    setSettings({
      ...settings,
      heroBanners: [...settings.heroBanners || [], newBanner]
    });
  };
  const handleUpdateHeroBanner = (id, field, value) => {
    if (!settings) return;
    setSettings({
      ...settings,
      heroBanners: (settings.heroBanners || []).map(
        (b) => b.id === id ? { ...b, [field]: value } : b
      )
    });
  };
  const handleDeleteHeroBanner = (id) => {
    if (!settings) return;
    setSettings({
      ...settings,
      heroBanners: (settings.heroBanners || []).filter((b) => b.id !== id)
    });
  };
  const handleUpdatePaymentGateway = (gateway, field, value) => {
    if (!settings) return;
    setSettings({
      ...settings,
      paymentGateways: {
        ...settings.paymentGateways,
        [gateway]: {
          ...settings.paymentGateways?.[gateway] || {},
          [field]: value
        }
      }
    });
  };
  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const todayOrders = orders.filter((o) => {
    const today = (/* @__PURE__ */ new Date()).toDateString();
    return new Date(o.createdAt).toDateString() === today;
  }).length;
  const totalCommissions = orders.reduce((sum, o) => {
    const restaurant = restaurants.find((r) => r.id === o.restaurantId);
    const rate = (restaurant?.commissionRate || 5) / 100;
    return sum + o.total * rate;
  }, 0);
  const tabGroups = [
    {
      title: "Monitoreo Estrat\xE9gico",
      items: [
        {
          id: "stats",
          label: "Dashboard y M\xE9tricas",
          icon: TrendingUp,
          inactiveColor: "text-blue-500",
          activeClass: "bg-blue-600 text-on-surface shadow-lg shadow-blue-200/60"
        },
        {
          id: "ai_core",
          label: "AI Core Assistant",
          icon: Zap,
          inactiveColor: "text-violet-500",
          activeClass: "bg-violet-600 text-on-surface shadow-lg shadow-violet-200/60"
        }
      ]
    },
    {
      title: "Ecosistema",
      items: [
        {
          id: "restaurants",
          label: "Restaurantes",
          icon: Store,
          inactiveColor: "text-orange-500",
          activeClass: "bg-orange-600 text-on-surface shadow-lg shadow-orange-200/60"
        },
        {
          id: "users",
          label: "Usuarios y Roles",
          icon: Users,
          inactiveColor: "text-emerald-500",
          activeClass: "bg-emerald-600 text-on-surface shadow-lg shadow-emerald-200/60"
        },
        {
          id: "drivers",
          label: "Repartidores",
          icon: Truck,
          inactiveColor: "text-cyan-500",
          activeClass: "bg-cyan-600 text-on-surface shadow-lg shadow-cyan-200/60"
        }
      ]
    },
    {
      title: "Herramientas de Negocio",
      items: [
        {
          id: "marketing",
          label: "Marketing y Banners",
          icon: ImageIcon,
          inactiveColor: "text-pink-500",
          activeClass: "bg-pink-600 text-on-surface shadow-lg shadow-pink-200/60"
        },
        {
          id: "music",
          label: "Biblioteca Musical",
          icon: Volume2,
          inactiveColor: "text-orange-500",
          activeClass: "bg-orange-600 text-on-surface shadow-lg shadow-orange-200/60"
        },
        {
          id: "referrals",
          label: "Programa Referidos",
          icon: Users,
          inactiveColor: "text-rose-500",
          activeClass: "bg-rose-600 text-on-surface shadow-lg shadow-rose-200/60"
        },
        {
          id: "representatives",
          label: "Embajadores y Reps",
          icon: Award,
          inactiveColor: "text-amber-600",
          activeClass: "bg-amber-600 text-on-surface shadow-lg shadow-amber-200/60"
        },
        {
          id: "gamification",
          label: "Tareas y Gamificaci\xF3n",
          icon: Trophy,
          inactiveColor: "text-amber-500",
          activeClass: "bg-amber-600 text-on-surface shadow-lg shadow-amber-200/60"
        },
        {
          id: "juegos",
          label: "Juegos (Parch\xEDs)",
          icon: Target,
          inactiveColor: "text-red-500",
          activeClass: "bg-red-600 text-orange-100 shadow-lg shadow-red-200/60"
        },
        {
          id: "splash",
          label: "Splash Screen",
          icon: Zap,
          inactiveColor: "text-fuchsia-500",
          activeClass: "bg-fuchsia-600 text-on-surface shadow-lg shadow-fuchsia-200/60"
        },
        {
          id: "onboarding",
          label: "Onboarding App",
          icon: LayoutList,
          inactiveColor: "text-amber-500",
          activeClass: "bg-amber-600 text-on-surface shadow-lg shadow-amber-200/60"
        },
        {
          id: "plans",
          label: "Planes de Suscripci\xF3n",
          icon: Shield,
          inactiveColor: "text-indigo-500",
          activeClass: "bg-indigo-600 text-on-surface shadow-lg shadow-indigo-200/60"
        },
        {
          id: "communications",
          label: "Avisos y Push",
          icon: BellRing,
          inactiveColor: "text-yellow-500",
          activeClass: "bg-yellow-600 text-on-surface shadow-lg shadow-yellow-200/60"
        }
      ]
    },
    {
      title: "Operaciones",
      items: [
        {
          id: "billing",
          label: "Facturaci\xF3n / Cortes",
          icon: FileText,
          inactiveColor: "text-teal-500",
          activeClass: "bg-teal-600 text-on-surface shadow-lg shadow-teal-200/60"
        },
        {
          id: "payments",
          label: "Liquidaciones",
          icon: DollarSign,
          inactiveColor: "text-green-500",
          activeClass: "bg-green-600 text-on-surface shadow-lg shadow-green-200/60"
        }
      ]
    },
    {
      title: "Sistema",
      items: [
        {
          id: "settings",
          label: "Configuraci\xF3n Global",
          icon: Settings,
          inactiveColor: "text-slate-500",
          activeClass: "bg-slate-700 text-on-surface shadow-lg shadow-slate-200/60"
        },
        {
          id: "docs",
          label: "Documentaci\xF3n Oficial",
          icon: BookOpen,
          inactiveColor: "text-blue-500",
          activeClass: "bg-blue-600 text-on-surface shadow-lg shadow-blue-200/60"
        }
      ]
    }
  ];
  const handleSaveRewardModule = async (e) => {
    e.preventDefault();
    if (!editingRewardModule) return;
    setIsSavingRewardModule(true);
    try {
      const moduleToSave = {
        id: editingRewardModule.id,
        title: editingRewardModule.title || "",
        description: editingRewardModule.description || "",
        imageUrl: editingRewardModule.imageUrl || "",
        buttonText: editingRewardModule.buttonText || "Ir",
        path: editingRewardModule.path || "",
        isActive: editingRewardModule.isActive !== false,
        sortOrder: Number(editingRewardModule.sortOrder || 0)
      };
      await db.saveRewardModule(moduleToSave);
      toast.success("M\xF3dulo guardado exitosamente");
      setEditingRewardModule(null);
      fetchData();
    } catch (err) {
      console.error("Error saving reward module:", err);
      toast.error("Error al guardar el m\xF3dulo: " + err.message);
    } finally {
      setIsSavingRewardModule(false);
    }
  };
  const handleToggleRewardModuleActive = async (module) => {
    try {
      const updated = { ...module, isActive: !module.isActive };
      await db.saveRewardModule(updated);
      toast.success(
        updated.isActive ? "M\xF3dulo activado" : "M\xF3dulo desactivado"
      );
      fetchData();
    } catch (err) {
      console.error("Error toggling reward module:", err);
      toast.error("Error al cambiar el estado del m\xF3dulo");
    }
  };
  const handleDeleteRewardModule = async (id) => {
    if (id.startsWith("default-")) {
      toast.error("No se pueden eliminar los m\xF3dulos del sistema");
      return;
    }
    if (!confirm("\xBFEst\xE1s seguro de eliminar este m\xF3dulo de recompensas?"))
      return;
    try {
      await db.deleteRewardModule(id);
      toast.success("M\xF3dulo eliminado correctamente");
      fetchData();
    } catch (err) {
      console.error("Error deleting reward module:", err);
      toast.error("Error al eliminar el m\xF3dulo");
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "flex-1 flex items-center justify-center bg-neutral-50", children: /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen bg-neutral-50 overflow-hidden", children: [
    /* @__PURE__ */ jsx(
      DashboardSidebar,
      {
        title: "Admin Global",
        subtitle: "SmartBite Platform",
        groups: tabGroups,
        activeId: activeTab,
        onItemClick: (id) => setActiveTab(id),
        logo: /* @__PURE__ */ jsx(Shield, { className: "w-8 h-8 text-on-surface" }),
        showHomeLink: true
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col min-w-0 h-full overflow-y-auto", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative h-64 overflow-hidden shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-950", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.4),transparent_70%)]" }),
          /* @__PURE__ */ jsx(
            motion.div,
            {
              animate: {
                scale: [1, 1.2, 1],
                rotate: [0, 5, 0],
                opacity: [0.1, 0.3, 0.1]
              },
              transition: { duration: 20, repeat: Infinity, ease: "easeInOut" },
              className: "absolute -top-24 -right-24 w-[35rem] h-[35rem] bg-orange-500/10 rounded-full blur-3xl"
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-neutral-50 via-neutral-50/10 to-transparent" }),
        /* @__PURE__ */ jsxs("div", { className: "absolute bottom-0 left-0 right-0 p-6 sm:p-12 flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left", children: [
          /* @__PURE__ */ jsxs(
            motion.div,
            {
              initial: { y: 20, opacity: 0, scale: 0.9 },
              animate: { y: 0, opacity: 1, scale: 1 },
              className: "relative",
              children: [
                /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-orange-500/30 blur-2xl rounded-full" }),
                /* @__PURE__ */ jsx("div", { className: "w-32 h-32 rounded-3xl bg-white border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden relative z-10 transition-transform hover:scale-105 duration-500", children: /* @__PURE__ */ jsx(Shield, { className: "w-14 h-14 text-orange-600" }) })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            motion.div,
            {
              initial: { x: 20, opacity: 0 },
              animate: { x: 0, opacity: 1 },
              className: "flex-1 min-w-0 pb-1",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center gap-3 mb-2", children: [
                  /* @__PURE__ */ jsx("h1", { className: "text-4xl font-black text-neutral-900 tracking-tighter truncate drop-shadow-sm uppercase", children: "Gesti\xF3n Central" }),
                  /* @__PURE__ */ jsx("div", { className: "flex gap-2", children: /* @__PURE__ */ jsx("span", { className: "bg-orange-600 text-on-surface px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm", children: "Live" }) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-center sm:justify-start gap-4", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-on-surface-variant text-sm font-bold bg-white/50 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/50", children: [
                    /* @__PURE__ */ jsx(Shield, { className: "w-4 h-4" }),
                    "Super Administrador"
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-rose-600 text-sm font-bold bg-rose-50/50 backdrop-blur-sm px-4 py-2 rounded-2xl border border-rose-100/50", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" }),
                    "SmartBite Global System"
                  ] })
                ] })
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "px-2 sm:px-12 pb-24 w-full", children: /* @__PURE__ */ jsxs("main", { className: "mt-4 animate-in fade-in slide-in-from-bottom-4 duration-700", children: [
        activeTab === "ai_core" && /* @__PURE__ */ jsxs("div", { className: "space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
              /* @__PURE__ */ jsxs("h2", { className: "text-3xl font-black text-neutral-900 tracking-tight flex items-center gap-3", children: [
                /* @__PURE__ */ jsx(Zap, { className: "w-8 h-8 text-orange-500" }),
                "SmartBite AI Core"
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-on-surface-variant font-medium max-w-2xl", children: "Arquitectura neuronal de SmartBite. Estas APIs impulsan la venta asistida, el soporte por voz y la gamificaci\xF3n de la plataforma. Referencia t\xE9cnica de modelos estables." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-2xl flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" }),
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black uppercase tracking-widest text-emerald-700", children: "Estado: Estable y Operativo" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-white p-10 rounded-[3rem] border border-neutral-200 shadow-xl flex flex-col justify-center relative overflow-hidden group", children: [
              /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity", children: /* @__PURE__ */ jsx(Zap, { className: "w-32 h-32 text-orange-600" }) }),
              /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
                /* @__PURE__ */ jsx("h3", { className: "text-2xl font-black text-neutral-900 mb-4 tracking-tight", children: "N\xFAcleo Central de Inteligencia" }),
                /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-on-surface-variant leading-relaxed max-w-md", children: "SmartBite opera sobre un ecosistema multimodal. El chat procesa transacciones complejas, el live-preview permite soporte por voz humana y el TTS gamifica la experiencia del cliente." })
              ] })
            ] }),
            /* @__PURE__ */ jsx(QuotaCountdown, {})
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-white p-8 rounded-[2rem] border border-neutral-200 shadow-sm relative overflow-hidden group", children: [
              /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity", children: /* @__PURE__ */ jsx(MessageSquare, { className: "w-16 h-16 text-orange-600" }) }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-6", children: [
                /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center", children: /* @__PURE__ */ jsx(MessageSquare, { className: "w-6 h-6 text-orange-600" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h3", { className: "font-black text-neutral-900", children: "Sales Assistant" }),
                  /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black uppercase tracking-widest text-on-surface-muted", children: "Canal de Chat" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-on-surface-muted uppercase mb-1", children: "Modelo Estable" }),
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-black font-mono text-neutral-900 bg-neutral-100 p-2 rounded-lg truncate", children: "gemini-3-flash-preview" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-on-surface-muted uppercase", children: "Capacidades e Impacto" }),
                  /* @__PURE__ */ jsxs("ul", { className: "text-xs font-medium text-neutral-600 space-y-2", children: [
                    /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
                      /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3 h-3 text-emerald-500 mt-0.5" }),
                      "Gesti\xF3n de Carrito Inteligente"
                    ] }),
                    /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
                      /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3 h-3 text-emerald-500 mt-0.5" }),
                      "Finalizaci\xF3n de pedidos (Datos Entrega)"
                    ] }),
                    /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
                      /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3 h-3 text-emerald-500 mt-0.5" }),
                      /* @__PURE__ */ jsx("b", { children: "Env\xEDo directo al panel del Restaurante" })
                    ] }),
                    /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
                      /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3 h-3 text-emerald-500 mt-0.5" }),
                      "Reconocimiento de Perfil y Sesi\xF3n"
                    ] })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-white p-8 rounded-[2rem] border border-neutral-200 shadow-sm relative overflow-hidden group", children: [
              /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity", children: /* @__PURE__ */ jsx(Mic, { className: "w-16 h-16 text-blue-600" }) }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-6", children: [
                /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center", children: /* @__PURE__ */ jsx(Mic, { className: "w-6 h-6 text-blue-600" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h3", { className: "font-black text-neutral-900", children: "Voice Assistant" }),
                  /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black uppercase tracking-widest text-on-surface-muted", children: "Tiempo Real / Bidi" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-on-surface-muted uppercase mb-1", children: "Modelo Estable" }),
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-black font-mono text-neutral-900 bg-neutral-100 p-2 rounded-lg truncate", children: "gemini-3.1-flash-live-preview" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-on-surface-muted uppercase", children: "Capacidades e Impacto" }),
                  /* @__PURE__ */ jsxs("ul", { className: "text-xs font-medium text-neutral-600 space-y-2", children: [
                    /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
                      /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3 h-3 text-emerald-500 mt-0.5" }),
                      "Streaming de Audio Bidireccional"
                    ] }),
                    /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
                      /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3 h-3 text-emerald-500 mt-0.5" }),
                      "Conversaci\xF3n fluida natural"
                    ] }),
                    /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
                      /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3 h-3 text-emerald-500 mt-0.5" }),
                      "Herramientas de pedido activas"
                    ] }),
                    /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
                      /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3 h-3 text-emerald-500 mt-0.5" }),
                      "Latencia m\xEDnima (Live Flow)"
                    ] })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-white p-8 rounded-[2rem] border border-neutral-200 shadow-sm relative overflow-hidden group", children: [
              /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity", children: /* @__PURE__ */ jsx(Volume2, { className: "w-16 h-16 text-purple-600" }) }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-6", children: [
                /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center", children: /* @__PURE__ */ jsx(Volume2, { className: "w-6 h-6 text-purple-600" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h3", { className: "font-black text-neutral-900", children: "TTS Expansive" }),
                  /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black uppercase tracking-widest text-on-surface-muted", children: "Voz y S\xEDntesis" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-on-surface-muted uppercase mb-1", children: "Modelo Estable" }),
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-black font-mono text-neutral-900 bg-neutral-100 p-2 rounded-lg truncate", children: "gemini-3.1-flash-tts-preview" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-on-surface-muted uppercase", children: "Capacidades e Impacto" }),
                  /* @__PURE__ */ jsxs("ul", { className: "text-xs font-medium text-neutral-600 space-y-2", children: [
                    /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
                      /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3 h-3 text-emerald-500 mt-0.5" }),
                      "Anuncio de Premios (Rueda de la Suerte)"
                    ] }),
                    /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
                      /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3 h-3 text-emerald-500 mt-0.5" }),
                      "Generaci\xF3n de Audio con Entonaci\xF3n"
                    ] }),
                    /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
                      /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3 h-3 text-emerald-500 mt-0.5" }),
                      "Integraci\xF3n con Recompensas F\xEDsicas"
                    ] }),
                    /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
                      /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3 h-3 text-emerald-500 mt-0.5" }),
                      "Experiencia Gamificada (TTS)"
                    ] })
                  ] })
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-surface-variant p-10 rounded-[3rem] text-on-surface relative overflow-hidden", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" }),
            /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 mb-10", children: [
                /* @__PURE__ */ jsx("h3", { className: "text-2xl font-black tracking-tight", children: "Referencia de Cuotas y Precios (Google AI Studio)" }),
                /* @__PURE__ */ jsxs("p", { className: "text-on-surface-muted font-medium max-w-3xl", children: [
                  "Actualmente SmartBite utiliza el plan ",
                  /* @__PURE__ */ jsx("b", { children: "Gratuito" }),
                  " ",
                  "para desarrollo. A continuaci\xF3n, el resumen de l\xEDmites y costos para cuando desees escalar a producci\xF3n."
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-12", children: [
                /* @__PURE__ */ jsx("div", { className: "space-y-8", children: /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black text-orange-500 uppercase tracking-widest mb-4", children: "Plan Gratuito (Actual)" }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-4 text-xs", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-b border-white/10 pb-4", children: [
                      /* @__PURE__ */ jsx("span", { className: "font-bold text-on-surface-variant font-sans tracking-tight", children: "RPM (Solicitudes por Minuto)" }),
                      /* @__PURE__ */ jsx("span", { className: "font-black", children: "2 - 15 Solicitudes" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-b border-white/10 pb-4", children: [
                      /* @__PURE__ */ jsx("span", { className: "font-bold text-on-surface-variant font-sans tracking-tight", children: "TPM (Tokens por Minuto)" }),
                      /* @__PURE__ */ jsx("span", { className: "font-black", children: "32,000 - 1,000,000" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-b border-white/10 pb-4", children: [
                      /* @__PURE__ */ jsx("span", { className: "font-bold text-on-surface-variant font-sans tracking-tight", children: "RPD (Solicitudes por D\xEDa)" }),
                      /* @__PURE__ */ jsx("span", { className: "font-black", children: "1,500 - 2,000" })
                    ] }),
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] text-on-surface-variant bg-white/5 p-4 rounded-xl italic", children: "* Nota: En el plan gratuito, Google puede utilizar los datos para mejorar sus modelos. Las cuotas coinciden con Google AI Studio." })
                  ] })
                ] }) }),
                /* @__PURE__ */ jsx("div", { className: "space-y-8", children: /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4", children: "Plan de Pago (Producci\xF3n)" }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-4 text-xs", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-b border-white/10 pb-4", children: [
                      /* @__PURE__ */ jsx("span", { className: "font-bold text-on-surface-variant font-sans tracking-tight", children: "Costo Entrada (Input / 1M tokens)" }),
                      /* @__PURE__ */ jsx("span", { className: "font-black text-emerald-400", children: "~$300 COP" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-b border-white/10 pb-4", children: [
                      /* @__PURE__ */ jsx("span", { className: "font-bold text-on-surface-variant font-sans tracking-tight", children: "Costo Salida (Output / 1M tokens)" }),
                      /* @__PURE__ */ jsx("span", { className: "font-black text-emerald-400", children: "~$1,200 COP" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-b border-white/10 pb-4", children: [
                      /* @__PURE__ */ jsx("span", { className: "font-bold text-on-surface-variant font-sans tracking-tight", children: "Privacidad de Datos" }),
                      /* @__PURE__ */ jsx("span", { className: "font-black uppercase tracking-tighter text-emerald-500", children: "Protecci\xF3n Total" })
                    ] }),
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] text-emerald-500/80 bg-emerald-500/5 p-4 rounded-xl font-bold uppercase tracking-widest text-center border border-emerald-500/20", children: "Los datos NO se usan para entrenamiento en el plan de pago." })
                  ] })
                ] }) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 pb-20", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-orange-50 p-8 rounded-[2rem] border border-orange-100 flex items-start gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "p-3 bg-orange-500 rounded-2xl text-on-surface shrink-0 shadow-lg", children: /* @__PURE__ */ jsx(AlertTriangle, { className: "w-6 h-6" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h4", { className: "font-black text-orange-950 mb-1", children: 'Manejo de "Quota Exceeded"' }),
                /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-orange-950/70 leading-relaxed", children: "Si el asistente deja de responder por cuota excedida, es necesario esperar al reinicio diario de Google. Para remover estos l\xEDmites, se debe activar la facturaci\xF3n en la consola de Google AI Studio / Google Cloud." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-blue-50 p-8 rounded-[2rem] border border-blue-100 flex items-start gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "p-3 bg-blue-500 rounded-2xl text-on-surface shrink-0 shadow-lg", children: /* @__PURE__ */ jsx(Shield, { className: "w-6 h-6" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h4", { className: "font-black text-blue-950 mb-1", children: "Identidad y Estabilidad" }),
                /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-blue-950/70 leading-relaxed", children: "Los modelos gemini-3-flash y gemini-3.1-flash son los m\xE1s estables para el uso de herramientas (Tool Calling), asegurando que los pedidos siempre lleguen al panel del restaurante." })
              ] })
            ] })
          ] })
        ] }),
        activeTab === "inbox" && /* @__PURE__ */ jsx("div", { className: "bg-white rounded-3xl shadow-sm border border-neutral-200 p-8", children: /* @__PURE__ */ jsx(NotificationInbox, {}) }),
        activeTab === "restaurants" && /* @__PURE__ */ jsx("div", { className: "bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-neutral-50 border-b border-neutral-200 text-on-surface-variant text-sm uppercase tracking-wider", children: [
            /* @__PURE__ */ jsx("th", { className: "p-4 font-medium", children: "Restaurante" }),
            /* @__PURE__ */ jsx("th", { className: "p-4 font-medium", children: "Email Due\xF1o" }),
            /* @__PURE__ */ jsx("th", { className: "p-4 font-medium", children: "Tipo" }),
            /* @__PURE__ */ jsx("th", { className: "p-4 font-medium", children: "Direcci\xF3n" }),
            /* @__PURE__ */ jsx("th", { className: "p-4 font-medium", children: "Tel\xE9fono" }),
            /* @__PURE__ */ jsx("th", { className: "p-4 font-medium", children: "Productos" }),
            /* @__PURE__ */ jsx("th", { className: "p-4 font-medium", children: "Estado" }),
            /* @__PURE__ */ jsx("th", { className: "p-4 font-medium text-right", children: "Acciones" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-neutral-200", children: restaurants.map((restaurant) => {
            const owner = appUsers.find(
              (u) => u.id === restaurant.ownerId
            );
            return /* @__PURE__ */ jsxs(
              "tr",
              {
                className: "hover:bg-neutral-50 transition-colors group",
                children: [
                  /* @__PURE__ */ jsxs("td", { className: "p-4 flex items-center gap-3", children: [
                    restaurant.logo ? /* @__PURE__ */ jsx(
                      "img",
                      {
                        src: restaurant.logo,
                        alt: "",
                        className: "w-10 h-10 rounded-full object-cover border border-neutral-200",
                        referrerPolicy: "no-referrer"
                      }
                    ) : /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center border border-neutral-200", children: /* @__PURE__ */ jsx(Store, { className: "w-5 h-5 text-on-surface-muted" }) }),
                    /* @__PURE__ */ jsx("span", { className: "font-bold text-neutral-900", children: restaurant.name })
                  ] }),
                  /* @__PURE__ */ jsx("td", { className: "p-4 text-sm text-neutral-600 font-medium", children: owner?.email || "No asignado" }),
                  /* @__PURE__ */ jsx("td", { className: "p-4 text-neutral-600", children: restaurant.type }),
                  /* @__PURE__ */ jsx("td", { className: "p-4 text-neutral-600", children: restaurant.address || "N/A" }),
                  /* @__PURE__ */ jsx("td", { className: "p-4 text-neutral-600", children: restaurant.phone }),
                  /* @__PURE__ */ jsxs("td", { className: "p-4 text-neutral-600", children: [
                    restaurant.menu.length,
                    " items"
                  ] }),
                  /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsx(
                    "span",
                    {
                      className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${restaurant.status === "active" ? "bg-emerald-100 text-emerald-800" : restaurant.status === "pending_publish" || restaurant.status === "inactive" && restaurant.highlight_message === "pending_publish" ? "bg-amber-100 text-amber-800 animate-pulse border border-amber-300" : restaurant.status === "inactive" ? "bg-amber-50 border border-amber-100 text-stone-500" : "bg-slate-100 text-slate-800"}`,
                      children: restaurant.status === "active" ? "Activo" : restaurant.status === "pending_publish" || restaurant.status === "inactive" && restaurant.highlight_message === "pending_publish" ? "Pendiente Publicar" : "Borrador"
                    }
                  ) }),
                  /* @__PURE__ */ jsx("td", { className: "p-4 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2 transition-opacity", children: [
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        onClick: () => handleStartAudit(restaurant),
                        className: `p-1.5 rounded-lg transition-all flex items-center gap-1 font-bold text-xs uppercase ${restaurant.status === "pending_publish" || restaurant.status === "inactive" && restaurant.highlight_message === "pending_publish" ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 px-2.5 py-1 text-[10px] border border-amber-500/25" : "text-stone-500 hover:bg-stone-100"}`,
                        title: "Iniciar Auditor\xEDa y Publicar",
                        children: [
                          /* @__PURE__ */ jsx(Sparkles, { className: `w-3.5 h-3.5 ${restaurant.status === "pending_publish" || restaurant.status === "inactive" && restaurant.highlight_message === "pending_publish" ? "animate-pulse stroke-[2.5px]" : ""}` }),
                          (restaurant.status === "pending_publish" || restaurant.status === "inactive" && restaurant.highlight_message === "pending_publish") && "Auditar"
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => setEditingRestaurant(restaurant),
                        className: "p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors",
                        title: "Editar Configuraci\xF3n",
                        children: /* @__PURE__ */ jsx(Edit, { className: "w-4 h-4" })
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      Link,
                      {
                        to: `/admin/${restaurant.id}`,
                        className: "p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors",
                        title: "Gestionar Men\xFA",
                        children: /* @__PURE__ */ jsx(LayoutList, { className: "w-4 h-4" })
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      Link,
                      {
                        to: `/r/${restaurant.id}`,
                        className: "p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors",
                        title: "Ver P\xE1gina P\xFAblica",
                        children: /* @__PURE__ */ jsx(ExternalLink, { className: "w-4 h-4" })
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => handleToggleFeatured(
                          restaurant.id,
                          !!restaurant.isFeatured
                        ),
                        className: `p-2 rounded-lg transition-colors ${restaurant.isFeatured ? "text-amber-500 bg-amber-50" : "text-on-surface-muted hover:bg-neutral-50"}`,
                        title: restaurant.isFeatured ? "Quitar de destacados" : "Destacar",
                        children: /* @__PURE__ */ jsx(
                          Star,
                          {
                            className: `w-4 h-4 ${restaurant.isFeatured ? "fill-current" : ""}`
                          }
                        )
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => handleToggleRestaurantStatus(
                          restaurant.id,
                          restaurant.status || "active"
                        ),
                        className: "p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors",
                        title: restaurant.status !== "inactive" ? "Desactivar" : "Activar",
                        children: restaurant.status !== "inactive" ? /* @__PURE__ */ jsx(Pause, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(Play, { className: "w-4 h-4" })
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => setDeleteConfirm({
                          id: restaurant.id,
                          type: "restaurant",
                          name: restaurant.name
                        }),
                        className: "p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors",
                        title: "Eliminar",
                        children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
                      }
                    )
                  ] }) })
                ]
              },
              restaurant.id
            );
          }) })
        ] }) }) }),
        activeTab === "referrals" && /* @__PURE__ */ jsx(AdminReferralManagement, {}),
        activeTab === "representatives" && /* @__PURE__ */ jsx(AdminRepresentativeManagement, {}),
        activeTab === "gamification" && /* @__PURE__ */ jsx(AdminGamificationManagement, {}),
        activeTab === "juegos" && /* @__PURE__ */ jsx(AdminParchisConfig, {}),
        activeTab === "users" && /* @__PURE__ */ jsx("div", { className: "bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-neutral-50 border-b border-neutral-200 text-on-surface-variant text-sm uppercase tracking-wider", children: [
            /* @__PURE__ */ jsx("th", { className: "p-4 font-medium", children: "Email" }),
            /* @__PURE__ */ jsx("th", { className: "p-4 font-medium", children: "Rol" }),
            /* @__PURE__ */ jsx("th", { className: "p-4 font-medium", children: "Dashboard" }),
            /* @__PURE__ */ jsx("th", { className: "p-4 font-medium", children: "Estado" }),
            /* @__PURE__ */ jsx("th", { className: "p-4 font-medium", children: "Fecha Registro" }),
            /* @__PURE__ */ jsx("th", { className: "p-4 font-medium text-right", children: "Acciones" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-neutral-200", children: appUsers.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "p-12 text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-3 text-on-surface-muted", children: [
            /* @__PURE__ */ jsx(Users, { className: "w-12 h-12 opacity-20" }),
            /* @__PURE__ */ jsx("p", { className: "font-medium", children: "No se encontraron usuarios." }),
            /* @__PURE__ */ jsx("p", { className: "text-xs max-w-xs mx-auto", children: "Si eres administrador y no ves la lista, puede haber un problema con las pol\xEDticas de seguridad (RLS) en Supabase." }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => fetchData(),
                className: "mt-4 px-4 py-2 bg-orange-600 text-on-surface rounded-lg text-sm font-bold",
                children: "Reintentar Carga"
              }
            )
          ] }) }) }) : appUsers.map((user2) => /* @__PURE__ */ jsxs(
            "tr",
            {
              className: "hover:bg-neutral-50 transition-colors",
              children: [
                /* @__PURE__ */ jsx("td", { className: "p-4 font-medium text-neutral-900", children: user2.email }),
                /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsx(
                  "span",
                  {
                    className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user2.role === "admin" ? "bg-amber-100 text-amber-800" : user2.role === "restaurant" ? "bg-blue-100 text-blue-800" : user2.role === "driver" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-800"}`,
                    children: user2.role === "admin" ? "Administrador" : user2.role === "restaurant" ? "Restaurante" : user2.role === "driver" ? "Repartidor" : "Usuario"
                  }
                ) }),
                /* @__PURE__ */ jsx("td", { className: "p-4 text-xs font-mono text-on-surface-variant", children: user2.role === "admin" ? "/platform" : user2.role === "restaurant" ? "/admin" : user2.role === "driver" ? "/driver" : "/profile" }),
                /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsx(
                  "span",
                  {
                    className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user2.status === "active" ? "bg-orange-100 text-orange-800" : "bg-red-100 text-red-800"}`,
                    children: user2.status === "active" ? "Activo" : "Pausado"
                  }
                ) }),
                /* @__PURE__ */ jsx("td", { className: "p-4 text-neutral-600", children: new Date(user2.createdAt).toLocaleDateString() }),
                /* @__PURE__ */ jsx("td", { className: "p-4 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => setEditingUser(user2),
                      className: "p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors",
                      title: "Cambiar Rol",
                      children: /* @__PURE__ */ jsx(Shield, { className: "w-4 h-4" })
                    }
                  ),
                  user2.status === "active" ? /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => handleUpdateUserStatus(user2.id, "paused"),
                      className: "p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors",
                      title: "Pausar Usuario",
                      children: /* @__PURE__ */ jsx(Pause, { className: "w-4 h-4" })
                    }
                  ) : /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => handleUpdateUserStatus(user2.id, "active"),
                      className: "p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors",
                      title: "Activar Usuario",
                      children: /* @__PURE__ */ jsx(Play, { className: "w-4 h-4" })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => setDeleteConfirm({
                        id: user2.id,
                        type: "user",
                        name: user2.email
                      }),
                      className: "p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors",
                      title: "Eliminar Usuario",
                      children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
                    }
                  )
                ] }) })
              ]
            },
            user2.id
          )) })
        ] }) }) }),
        activeTab === "drivers" && /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm", children: [
              /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-on-surface-muted mb-1", children: "Pendientes de Aprobaci\xF3n" }),
              /* @__PURE__ */ jsx("p", { className: "text-3xl font-black text-orange-600", children: drivers.filter((d) => d.approval_status === "pending").length })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm", children: [
              /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-on-surface-muted mb-1", children: "Aprobados" }),
              /* @__PURE__ */ jsx("p", { className: "text-3xl font-black text-emerald-600", children: drivers.filter((d) => d.approval_status === "approved").length })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm", children: [
              /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-on-surface-muted mb-1", children: "En L\xEDnea" }),
              /* @__PURE__ */ jsx("p", { className: "text-3xl font-black text-blue-600", children: drivers.filter((d) => d.is_online).length })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-neutral-50 border-b border-neutral-200 text-on-surface-variant text-[10px] font-black uppercase tracking-widest", children: [
              /* @__PURE__ */ jsx("th", { className: "p-4", children: "Repartidor" }),
              /* @__PURE__ */ jsx("th", { className: "p-4", children: "Veh\xEDculo" }),
              /* @__PURE__ */ jsx("th", { className: "p-4", children: "Documento" }),
              /* @__PURE__ */ jsx("th", { className: "p-4", children: "Estado" }),
              /* @__PURE__ */ jsx("th", { className: "p-4", children: "Aprobaci\xF3n" }),
              /* @__PURE__ */ jsx("th", { className: "p-4 text-right", children: "Acciones" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-neutral-100", children: drivers.map((driver) => {
              const user2 = Array.isArray(driver.app_users) ? driver.app_users[0] : driver.app_users;
              const restaurant = restaurants.find(
                (r) => r.id === driver.restaurant_id
              );
              return /* @__PURE__ */ jsxs(
                "tr",
                {
                  className: "hover:bg-neutral-50 transition-colors",
                  children: [
                    /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                      /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-neutral-100 overflow-hidden border border-neutral-200", children: driver.profile_photo ? /* @__PURE__ */ jsx(
                        "img",
                        {
                          src: driver.profile_photo,
                          alt: "",
                          className: "w-full h-full object-cover",
                          referrerPolicy: "no-referrer"
                        }
                      ) : /* @__PURE__ */ jsx(Users, { className: "w-5 h-5 text-on-surface-muted m-2.5" }) }),
                      /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                        /* @__PURE__ */ jsx("span", { className: "font-black text-neutral-900", children: user2?.display_name || "Sin nombre" }),
                        /* @__PURE__ */ jsx("span", { className: "text-[10px] text-on-surface-muted font-bold", children: user2?.email }),
                        /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-on-surface-muted font-medium", children: [
                          "Doc: ",
                          driver.document_number || "N/A"
                        ] }),
                        restaurant && /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-orange-600 font-black uppercase tracking-widest mt-0.5", children: [
                          "Vinculado a: ",
                          restaurant.name
                        ] })
                      ] })
                    ] }) }),
                    /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-neutral-600", children: [
                        driver.vehicle_type === "motorcycle" && /* @__PURE__ */ jsx(Bike, { className: "w-4 h-4" }),
                        driver.vehicle_type === "motocarro" && /* @__PURE__ */ jsx(Truck, { className: "w-4 h-4" }),
                        driver.vehicle_type === "bicycle" && /* @__PURE__ */ jsx(Bike, { className: "w-4 h-4" }),
                        driver.vehicle_type === "car" && /* @__PURE__ */ jsx(Car, { className: "w-4 h-4" }),
                        /* @__PURE__ */ jsx("span", { className: "capitalize text-xs font-bold", children: driver.vehicle_type })
                      ] }),
                      /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-mono text-on-surface-muted", children: [
                        driver.license_plate,
                        " \u2022",
                        " ",
                        driver.vehicle_color
                      ] })
                    ] }) }),
                    /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-neutral-600", children: driver.document_number || "N/A" }) }),
                    /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsx(
                      "span",
                      {
                        className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${driver.is_online ? "bg-emerald-100 text-emerald-800" : "bg-neutral-100 text-neutral-800"}`,
                        children: driver.is_online ? "En l\xEDnea" : "Desconectado"
                      }
                    ) }),
                    /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsx(
                      "span",
                      {
                        className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${driver.approval_status === "approved" ? "bg-emerald-100 text-emerald-800" : driver.approval_status === "rejected" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`,
                        children: driver.approval_status === "approved" ? "Aprobado" : driver.approval_status === "rejected" ? "Rechazado" : "Pendiente"
                      }
                    ) }),
                    /* @__PURE__ */ jsx("td", { className: "p-4 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          onClick: () => setSelectedDriver(driver),
                          className: "p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors",
                          title: "Ver Documentos",
                          children: /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4" })
                        }
                      ),
                      driver.approval_status !== "approved" && /* @__PURE__ */ jsx(
                        "button",
                        {
                          onClick: () => handleUpdateDriverApproval(
                            driver.id,
                            "approved"
                          ),
                          className: "p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors",
                          title: "Aprobar",
                          children: /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4" })
                        }
                      ),
                      driver.approval_status !== "rejected" && /* @__PURE__ */ jsx(
                        "button",
                        {
                          onClick: () => handleUpdateDriverApproval(
                            driver.id,
                            "rejected"
                          ),
                          className: "p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors",
                          title: "Rechazar",
                          children: /* @__PURE__ */ jsx(Pause, { className: "w-4 h-4" })
                        }
                      )
                    ] }) })
                  ]
                },
                driver.id
              );
            }) })
          ] }) }) })
        ] }),
        activeTab === "marketing" && /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black text-neutral-900", children: "Gesti\xF3n de Cupones" }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setEditingCoupon({
                  code: "",
                  discountType: "percentage",
                  value: 0,
                  minOrderAmount: 0,
                  active: true,
                  timesUsed: 0
                }),
                className: "bg-orange-500 text-on-surface px-6 py-3 rounded-2xl font-black hover:bg-orange-600 flex items-center gap-2 shadow-lg shadow-orange-200 transition-all",
                children: [
                  /* @__PURE__ */ jsx(Plus, { className: "w-5 h-5" }),
                  " Nuevo Cup\xF3n"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-neutral-50 border-b border-neutral-200 text-on-surface-variant text-sm uppercase tracking-wider", children: [
              /* @__PURE__ */ jsx("th", { className: "p-4 font-medium", children: "C\xF3digo" }),
              /* @__PURE__ */ jsx("th", { className: "p-4 font-medium", children: "Descuento" }),
              /* @__PURE__ */ jsx("th", { className: "p-4 font-medium", children: "M\xEDn. Pedido" }),
              /* @__PURE__ */ jsx("th", { className: "p-4 font-medium", children: "Vigencia" }),
              /* @__PURE__ */ jsx("th", { className: "p-4 font-medium", children: "Uso" }),
              /* @__PURE__ */ jsx("th", { className: "p-4 font-medium", children: "Estado" }),
              /* @__PURE__ */ jsx("th", { className: "p-4 font-medium text-right", children: "Acciones" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-neutral-200", children: coupons.map((coupon) => /* @__PURE__ */ jsxs(
              "tr",
              {
                className: "hover:bg-neutral-50 transition-colors",
                children: [
                  /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(Ticket, { className: "w-4 h-4 text-orange-500" }),
                    /* @__PURE__ */ jsx("span", { className: "font-black text-neutral-900", children: coupon.code })
                  ] }) }),
                  /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsx("span", { className: "font-bold text-neutral-700", children: coupon.discountType === "percentage" ? `${coupon.value}%` : `${formatCurrency(coupon.value)}` }) }),
                  /* @__PURE__ */ jsx("td", { className: "p-4 text-neutral-600 font-medium", children: formatCurrency(coupon.minOrderAmount) }),
                  /* @__PURE__ */ jsxs("td", { className: "p-4 text-xs text-on-surface-variant", children: [
                    coupon.startDate ? new Date(
                      coupon.startDate
                    ).toLocaleDateString() : "N/A",
                    " ",
                    "-",
                    " ",
                    coupon.endDate ? new Date(coupon.endDate).toLocaleDateString() : "N/A"
                  ] }),
                  /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                    /* @__PURE__ */ jsxs("span", { className: "text-sm font-bold text-neutral-700", children: [
                      coupon.timesUsed,
                      " usos"
                    ] }),
                    coupon.usageLimit && /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-on-surface-muted", children: [
                      "L\xEDmite: ",
                      coupon.usageLimit
                    ] })
                  ] }) }),
                  /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsx(
                    "span",
                    {
                      className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${coupon.active ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`,
                      children: coupon.active ? "Activo" : "Inactivo"
                    }
                  ) }),
                  /* @__PURE__ */ jsx("td", { className: "p-4 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => setEditingCoupon(coupon),
                        className: "p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors",
                        children: /* @__PURE__ */ jsx(Edit, { className: "w-4 h-4" })
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => handleDeleteCoupon(coupon.id),
                        className: "p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors",
                        children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
                      }
                    )
                  ] }) })
                ]
              },
              coupon.id
            )) })
          ] }) }) }),
          settings ? /* @__PURE__ */ jsx("div", { className: "bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden p-6 mt-8", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSaveSettings, className: "space-y-8", children: [
            /* @__PURE__ */ jsx("div", { className: "flex justify-between items-center mb-2", children: /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black text-neutral-900", children: "Gesti\xF3n de Banners" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(ImageIcon, { className: "w-5 h-5 text-orange-500" }),
                "Secci\xF3n Hero (Inicio)"
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-4 bg-neutral-50 p-6 rounded-2xl border border-neutral-100", children: [
                /* @__PURE__ */ jsxs("div", { className: "mb-2", children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-neutral-700 mb-2", children: "Velocidad de Animaci\xF3n de Banners (segundos)" }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-on-surface-variant mb-3", children: "Tiempo que cada banner se muestra antes de deslizarse autom\xE1ticamente (Aplica a todos los carruseles de banners). Usa 0 para desactivar la animaci\xF3n autom\xE1tica." }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      min: "0",
                      step: "0.5",
                      value: settings.bannerAnimationSpeed ?? 3,
                      onChange: (e) => setSettings({
                        ...settings,
                        bannerAnimationSpeed: Number(e.target.value)
                      }),
                      className: "w-full sm:w-1/3 p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white text-neutral-900"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mb-2 pt-4 border-t border-neutral-200", children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-neutral-700 mb-2", children: "L\xEDmite de Restaurantes Destacados (Slider Inicio)" }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-on-surface-variant mb-3", children: "M\xE1ximo n\xFAmero de restaurantes que se mostrar\xE1n en la secci\xF3n de destacados de la p\xE1gina principal." }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      min: "1",
                      value: settings.featuredRestaurantsLimit ?? 2,
                      onChange: (e) => setSettings({
                        ...settings,
                        featuredRestaurantsLimit: Number(
                          e.target.value
                        )
                      }),
                      className: "w-full sm:w-1/3 p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none font-bold bg-white text-neutral-900"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mb-2 pt-4 border-t border-neutral-200", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
                    /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-neutral-700", children: "Imagen de Cabecera Principal (Home)" }),
                    /* @__PURE__ */ jsx(ImageSizeInfo, { type: "cover" })
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-on-surface-variant mb-3", children: "La imagen premium de fondo que se mostrar\xE1 en el Hero de la p\xE1gina principal." }),
                  /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center gap-4", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-full sm:w-1/2", children: /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "text",
                        value: settings.heroImage || "",
                        onChange: (e) => setSettings({
                          ...settings,
                          heroImage: e.target.value
                        }),
                        placeholder: "https://ejemplo.com/imagen.jpg",
                        className: "w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none font-medium bg-white text-neutral-900"
                      }
                    ) }),
                    /* @__PURE__ */ jsxs("div", { className: "w-full sm:w-auto relative group", children: [
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "file",
                          accept: "image/*",
                          className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer",
                          onChange: (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                setCropper({
                                  isOpen: true,
                                  imageSrc: ev.target?.result,
                                  type: "heroImage",
                                  aspectRatio: 16 / 9
                                });
                              };
                              reader.readAsDataURL(file);
                              e.target.value = "";
                            }
                          }
                        }
                      ),
                      /* @__PURE__ */ jsxs(
                        "button",
                        {
                          type: "button",
                          className: "w-full bg-neutral-100 text-neutral-700 font-bold px-4 py-3 rounded-xl hover:bg-neutral-200 transition-colors pointer-events-none flex items-center justify-center gap-2 border border-neutral-300",
                          children: [
                            /* @__PURE__ */ jsx(ImageIcon, { className: "w-5 h-5" }),
                            "Subir imagen"
                          ]
                        }
                      )
                    ] })
                  ] }),
                  settings.heroImage && /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-col gap-4", children: [
                    /* @__PURE__ */ jsx("div", { className: "relative w-full h-40 rounded-xl overflow-hidden border border-neutral-200", children: /* @__PURE__ */ jsx(
                      "img",
                      {
                        src: settings.heroImage,
                        alt: "Hero Home Preview",
                        className: "w-full h-full object-cover",
                        style: {
                          opacity: settings.heroImageOpacity !== void 0 ? settings.heroImageOpacity / 100 : 0.6
                        }
                      }
                    ) }),
                    /* @__PURE__ */ jsxs("div", { className: "w-full sm:w-1/2", children: [
                      /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-neutral-700 mb-2", children: [
                        "Opacidad de la Imagen (",
                        settings.heroImageOpacity ?? 60,
                        "%)"
                      ] }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "range",
                          min: "0",
                          max: "100",
                          value: settings.heroImageOpacity ?? 60,
                          onChange: (e) => setSettings({
                            ...settings,
                            heroImageOpacity: Number(
                              e.target.value
                            )
                          }),
                          className: "w-full appearance-none bg-neutral-200 h-2 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500 cursor-pointer"
                        }
                      ),
                      /* @__PURE__ */ jsx("p", { className: "text-xs text-on-surface-variant mt-2", children: "Ajusta la visibilidad de la imagen de fondo. Menos opacidad har\xE1 que la imagen sea m\xE1s oscura y el texto sea m\xE1s f\xE1cil de leer." })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "pt-4 border-t border-neutral-200", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
                    /* @__PURE__ */ jsx("h4", { className: "text-md font-bold text-neutral-900", children: "Banners del Slider (Hero)" }),
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: handleAddHeroBanner,
                        className: "flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-600 rounded-lg font-medium hover:bg-orange-200 transition-colors text-sm",
                        children: [
                          /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
                          "A\xF1adir Banner Hero"
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "space-y-4", children: settings.heroBanners && settings.heroBanners.length > 0 ? settings.heroBanners.map((banner, index) => /* @__PURE__ */ jsxs(
                    "div",
                    {
                      className: "bg-white p-4 rounded-xl border border-neutral-200 relative mb-4",
                      children: [
                        /* @__PURE__ */ jsx(
                          "button",
                          {
                            type: "button",
                            onClick: () => handleDeleteHeroBanner(banner.id),
                            className: "absolute top-2 right-2 p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors",
                            children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
                          }
                        ),
                        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3", children: [
                          /* @__PURE__ */ jsxs("div", { children: [
                            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-neutral-700 mb-1", children: "T\xEDtulo Corto" }),
                            /* @__PURE__ */ jsx(
                              "input",
                              {
                                type: "text",
                                value: banner.title,
                                onChange: (e) => handleUpdateHeroBanner(
                                  banner.id,
                                  "title",
                                  e.target.value
                                ),
                                className: "w-full p-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm bg-white text-neutral-900"
                              }
                            )
                          ] }),
                          /* @__PURE__ */ jsxs("div", { children: [
                            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-neutral-700", children: "Imagen del Banner" }),
                              /* @__PURE__ */ jsx(ImageSizeInfo, { type: "cover" })
                            ] }),
                            /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
                              /* @__PURE__ */ jsx(
                                "input",
                                {
                                  type: "file",
                                  accept: "image/*",
                                  onChange: (e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      const file = e.target.files[0];
                                      const reader = new FileReader();
                                      reader.onload = (ev) => {
                                        setCropper({
                                          isOpen: true,
                                          imageSrc: ev.target?.result,
                                          type: "heroBanner",
                                          metaId: banner.id,
                                          aspectRatio: 21 / 9
                                        });
                                      };
                                      reader.readAsDataURL(file);
                                      e.target.value = "";
                                    }
                                  },
                                  className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                }
                              ),
                              /* @__PURE__ */ jsxs("div", { className: "w-full border-2 border-dashed border-neutral-200 rounded-lg p-2.5 group-hover:border-orange-500 transition-colors flex items-center justify-center gap-2 bg-neutral-50", children: [
                                /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4 text-on-surface-muted" }),
                                /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-on-surface-variant", children: banner.imageUrl ? "Cambiar imagen" : "Seleccionar imagen" })
                              ] })
                            ] })
                          ] })
                        ] }),
                        banner.imageUrl && /* @__PURE__ */ jsx("div", { className: "mb-3 h-24 rounded-lg overflow-hidden relative border border-neutral-200", children: /* @__PURE__ */ jsx(
                          "img",
                          {
                            src: banner.imageUrl,
                            alt: "Preview",
                            className: "w-full h-full object-cover"
                          }
                        ) }),
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                          /* @__PURE__ */ jsx(
                            "input",
                            {
                              type: "checkbox",
                              id: `active-hero-${banner.id}`,
                              checked: banner.active,
                              onChange: (e) => handleUpdateHeroBanner(
                                banner.id,
                                "active",
                                e.target.checked
                              ),
                              className: "rounded text-orange-500 focus:ring-orange-500"
                            }
                          ),
                          /* @__PURE__ */ jsx(
                            "label",
                            {
                              htmlFor: `active-hero-${banner.id}`,
                              className: "text-sm text-neutral-700 cursor-pointer",
                              children: "Visible en Inicio"
                            }
                          )
                        ] })
                      ]
                    },
                    banner.id
                  )) : /* @__PURE__ */ jsxs("div", { className: "text-center py-6 bg-white rounded-xl border border-neutral-200 border-dashed", children: [
                    /* @__PURE__ */ jsx(ImageIcon, { className: "w-6 h-6 text-on-surface-muted mx-auto mb-2" }),
                    /* @__PURE__ */ jsx("p", { className: "text-on-surface-variant text-sm", children: "No hay banners hero configurados (Se usar\xE1 la imagen por defecto)" })
                  ] }) })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(LayoutList, { className: "w-5 h-5 text-orange-500" }),
                "Categor\xEDas de Comida"
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-neutral-50 p-6 rounded-2xl border border-neutral-100", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
                  /* @__PURE__ */ jsx("h4", { className: "text-md font-bold text-neutral-900", children: "Filtros de Categor\xEDa (Inicio)" }),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: handleAddFoodCategory,
                      className: "flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-600 rounded-lg font-medium hover:bg-orange-200 transition-colors text-sm",
                      children: [
                        /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
                        "A\xF1adir Categor\xEDa"
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx("div", { className: "space-y-4", children: settings.foodCategories && settings.foodCategories.length > 0 ? settings.foodCategories.map((cat, index) => /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className: "bg-white p-4 rounded-xl border border-neutral-200 relative",
                    children: [
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          type: "button",
                          onClick: () => handleDeleteFoodCategory(cat.id),
                          className: "absolute top-2 right-2 p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors",
                          children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
                        }
                      ),
                      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2", children: [
                        /* @__PURE__ */ jsxs("div", { children: [
                          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-neutral-700 mb-1", children: "Nombre (ej. Pizza)" }),
                          /* @__PURE__ */ jsx(
                            "input",
                            {
                              type: "text",
                              value: cat.name,
                              onChange: (e) => handleUpdateFoodCategory(
                                cat.id,
                                "name",
                                e.target.value
                              ),
                              className: "w-full p-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm bg-white text-neutral-900"
                            }
                          )
                        ] }),
                        /* @__PURE__ */ jsxs("div", { children: [
                          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-neutral-700 mb-1", children: "Icono (Emoji)" }),
                          /* @__PURE__ */ jsx(
                            "input",
                            {
                              type: "text",
                              value: cat.icon,
                              onChange: (e) => handleUpdateFoodCategory(
                                cat.id,
                                "icon",
                                e.target.value
                              ),
                              className: "w-full p-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm bg-white text-neutral-900",
                              placeholder: "\u{1F355}"
                            }
                          )
                        ] })
                      ] })
                    ]
                  },
                  cat.id
                )) : /* @__PURE__ */ jsxs("div", { className: "text-center py-6 bg-white rounded-xl border border-neutral-200 border-dashed", children: [
                  /* @__PURE__ */ jsx(LayoutList, { className: "w-6 h-6 text-on-surface-muted mx-auto mb-2" }),
                  /* @__PURE__ */ jsx("p", { className: "text-on-surface-variant text-sm", children: "No hay categor\xEDas configuradas" })
                ] }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(ImageIcon, { className: "w-5 h-5 text-orange-500" }),
                "Banners Promocionales",
                /* @__PURE__ */ jsx(ImageSizeInfo, { type: "banner" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-neutral-50 p-6 rounded-2xl border border-neutral-100", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
                  /* @__PURE__ */ jsx("h4", { className: "text-md font-bold text-neutral-900", children: "Slider (Debajo de Platos Populares)" }),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: handleAddBanner,
                      className: "flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-600 rounded-lg font-medium hover:bg-orange-200 transition-colors text-sm",
                      children: [
                        /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
                        "A\xF1adir Banner Promocional"
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx("div", { className: "space-y-4", children: settings.banners && settings.banners.length > 0 ? settings.banners.map((banner, index) => /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className: "bg-white p-4 rounded-xl border border-neutral-200 relative",
                    children: [
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          type: "button",
                          onClick: () => handleDeleteBanner(banner.id),
                          className: "absolute top-2 right-2 p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors",
                          children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
                        }
                      ),
                      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3", children: [
                        /* @__PURE__ */ jsxs("div", { children: [
                          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-neutral-700 mb-1", children: "T\xEDtulo Corto" }),
                          /* @__PURE__ */ jsx(
                            "input",
                            {
                              type: "text",
                              value: banner.title,
                              onChange: (e) => handleUpdateBanner(
                                banner.id,
                                "title",
                                e.target.value
                              ),
                              className: "w-full p-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm bg-white text-neutral-900"
                            }
                          )
                        ] }),
                        /* @__PURE__ */ jsxs("div", { children: [
                          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-neutral-700", children: "Imagen del Banner" }),
                            /* @__PURE__ */ jsx(ImageSizeInfo, { type: "cover" })
                          ] }),
                          /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
                            /* @__PURE__ */ jsx(
                              "input",
                              {
                                type: "file",
                                accept: "image/*",
                                onChange: (e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    const file = e.target.files[0];
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                      setCropper({
                                        isOpen: true,
                                        imageSrc: ev.target?.result,
                                        type: "banner",
                                        metaId: banner.id,
                                        aspectRatio: 21 / 9
                                      });
                                    };
                                    reader.readAsDataURL(file);
                                    e.target.value = "";
                                  }
                                },
                                className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              }
                            ),
                            /* @__PURE__ */ jsxs("div", { className: "w-full border-2 border-dashed border-neutral-200 rounded-lg p-2.5 group-hover:border-orange-500 transition-colors flex items-center justify-center gap-2 bg-neutral-50", children: [
                              /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4 text-on-surface-muted" }),
                              /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-on-surface-variant", children: banner.imageUrl ? "Cambiar imagen" : "Seleccionar imagen" })
                            ] })
                          ] })
                        ] })
                      ] }),
                      banner.imageUrl && /* @__PURE__ */ jsx("div", { className: "mb-3 h-24 rounded-lg overflow-hidden relative border border-neutral-200", children: /* @__PURE__ */ jsx(
                        "img",
                        {
                          src: banner.imageUrl,
                          alt: "Preview",
                          className: "w-full h-full object-cover"
                        }
                      ) }),
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                        /* @__PURE__ */ jsx(
                          "input",
                          {
                            type: "checkbox",
                            id: `active-banner-${banner.id}`,
                            checked: banner.active,
                            onChange: (e) => handleUpdateBanner(
                              banner.id,
                              "active",
                              e.target.checked
                            ),
                            className: "rounded text-orange-500 focus:ring-orange-500"
                          }
                        ),
                        /* @__PURE__ */ jsx(
                          "label",
                          {
                            htmlFor: `active-banner-${banner.id}`,
                            className: "text-sm text-neutral-700 cursor-pointer",
                            children: "Visible"
                          }
                        )
                      ] })
                    ]
                  },
                  banner.id
                )) : /* @__PURE__ */ jsxs("div", { className: "text-center py-6 bg-white rounded-xl border border-neutral-200 border-dashed", children: [
                  /* @__PURE__ */ jsx(ImageIcon, { className: "w-6 h-6 text-on-surface-muted mx-auto mb-2" }),
                  /* @__PURE__ */ jsx("p", { className: "text-on-surface-variant text-sm", children: "No hay banners promocionales configurados" })
                ] }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(ImageIcon, { className: "w-5 h-5 text-orange-500" }),
                "Banner Pie de P\xE1gina",
                /* @__PURE__ */ jsx(ImageSizeInfo, { type: "banner" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-4 bg-neutral-50 p-6 rounded-2xl border border-neutral-100", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
                    /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-neutral-700", children: "Imagen del Banner Pie de P\xE1gina" }),
                    /* @__PURE__ */ jsx(ImageSizeInfo, { type: "banner" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "file",
                        accept: "image/*",
                        onChange: (e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              setCropper({
                                isOpen: true,
                                imageSrc: ev.target?.result,
                                type: "footerBanner",
                                aspectRatio: 21 / 9
                              });
                            };
                            reader.readAsDataURL(file);
                            e.target.value = "";
                          }
                        },
                        className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      }
                    ),
                    /* @__PURE__ */ jsxs("div", { className: "w-full border-2 border-dashed border-neutral-200 rounded-xl p-3 group-hover:border-orange-500 transition-colors flex items-center justify-center gap-2 bg-neutral-100", children: [
                      /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4 text-on-surface-muted" }),
                      /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-on-surface-variant", children: settings.footerBannerImage ? "Cambiar imagen" : "Seleccionar imagen" })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-neutral-700 mb-2", children: "Enlace (URL)" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      value: settings.footerBannerLink || "",
                      onChange: (e) => setSettings({
                        ...settings,
                        footerBannerLink: e.target.value
                      }),
                      className: "w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white text-neutral-900",
                      placeholder: "/auth"
                    }
                  )
                ] }),
                settings.footerBannerImage && /* @__PURE__ */ jsxs("div", { className: "mt-4 h-32 rounded-xl overflow-hidden relative", children: [
                  /* @__PURE__ */ jsx(
                    "img",
                    {
                      src: settings.footerBannerImage,
                      alt: "Footer Banner Preview",
                      className: "w-full h-full object-cover"
                    }
                  ),
                  /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/40 flex items-center justify-center", children: /* @__PURE__ */ jsx("span", { className: "text-on-surface font-bold", children: "Vista Previa" }) })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(ImageIcon, { className: "w-5 h-5 text-orange-500" }),
                "Banners Personalizados para Registro / Acceso"
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-on-surface-variant mb-4", children: "Personaliza las im\xE1genes de los formularios para clientes, restaurantes y repartidores que se muestran en la p\xE1gina de inicio de sesi\xF3n/registro." }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-4 bg-neutral-50 p-5 rounded-2xl border border-neutral-100 flex flex-col justify-between", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("span", { className: "text-xs font-black uppercase text-orange-600 tracking-wider block mb-2", children: "Clientes" }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
                      /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-neutral-600", children: "Imagen para Clientes (Login y Registro)" }),
                      /* @__PURE__ */ jsx(ImageSizeInfo, { type: "cover" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "file",
                          accept: "image/*",
                          onChange: (e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                setCropper({
                                  isOpen: true,
                                  imageSrc: ev.target?.result,
                                  type: "authClient",
                                  aspectRatio: 9 / 16
                                });
                              };
                              reader.readAsDataURL(file);
                              e.target.value = "";
                            }
                          },
                          className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        }
                      ),
                      /* @__PURE__ */ jsxs("div", { className: "w-full border-2 border-dashed border-neutral-200 rounded-xl p-3 group-hover:border-orange-500 transition-colors flex items-center justify-center gap-2 bg-neutral-100", children: [
                        /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4 text-on-surface-muted" }),
                        /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-on-surface-variant", children: "Subir Imagen" })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
                      /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-bold text-on-surface-variant mb-1", children: "O escribe la URL directamente:" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "text",
                          value: settings.paymentGateways?.authClientBanner || "",
                          onChange: (e) => setSettings({
                            ...settings,
                            paymentGateways: {
                              ...settings.paymentGateways || {},
                              authClientBanner: e.target.value
                            }
                          }),
                          placeholder: "https://images.unsplash.com/...",
                          className: "w-full p-2 text-xs border border-neutral-200 rounded-lg focus:ring-1 focus:ring-orange-500 outline-none"
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "mt-2 text-center", children: /* @__PURE__ */ jsxs("div", { className: "h-28 rounded-xl overflow-hidden relative border border-neutral-200 bg-neutral-100", children: [
                    settings.paymentGateways?.authClientBanner ? /* @__PURE__ */ jsx(
                      "img",
                      {
                        src: settings.paymentGateways.authClientBanner,
                        alt: "Preview Clientes",
                        className: "w-full h-full object-cover",
                        referrerPolicy: "no-referrer"
                      }
                    ) : null,
                    /* @__PURE__ */ jsx("div", { className: "absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-sm text-[8px] font-bold text-on-surface px-2 py-0.5 rounded", children: "Vista Previa" })
                  ] }) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-4 bg-neutral-50 p-5 rounded-2xl border border-neutral-100 flex flex-col justify-between", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("span", { className: "text-xs font-black uppercase text-orange-600 tracking-wider block mb-2", children: "Restaurantes" }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
                      /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-neutral-600", children: "Imagen para Registro de Restaurantes" }),
                      /* @__PURE__ */ jsx(ImageSizeInfo, { type: "cover" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "file",
                          accept: "image/*",
                          onChange: (e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                setCropper({
                                  isOpen: true,
                                  imageSrc: ev.target?.result,
                                  type: "authRestaurant",
                                  aspectRatio: 9 / 16
                                });
                              };
                              reader.readAsDataURL(file);
                              e.target.value = "";
                            }
                          },
                          className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        }
                      ),
                      /* @__PURE__ */ jsxs("div", { className: "w-full border-2 border-dashed border-neutral-200 rounded-xl p-3 group-hover:border-orange-500 transition-colors flex items-center justify-center gap-2 bg-neutral-100", children: [
                        /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4 text-on-surface-muted" }),
                        /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-on-surface-variant", children: "Subir Imagen" })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
                      /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-bold text-on-surface-variant mb-1", children: "O escribe la URL directamente:" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "text",
                          value: settings.paymentGateways?.authRestaurantBanner || "",
                          onChange: (e) => setSettings({
                            ...settings,
                            paymentGateways: {
                              ...settings.paymentGateways || {},
                              authRestaurantBanner: e.target.value
                            }
                          }),
                          placeholder: "https://images.unsplash.com/...",
                          className: "w-full p-2 text-xs border border-neutral-200 rounded-lg focus:ring-1 focus:ring-orange-500 outline-none"
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "mt-2 text-center", children: /* @__PURE__ */ jsxs("div", { className: "h-28 rounded-xl overflow-hidden relative border border-neutral-200 bg-neutral-100", children: [
                    settings.paymentGateways?.authRestaurantBanner ? /* @__PURE__ */ jsx(
                      "img",
                      {
                        src: settings.paymentGateways.authRestaurantBanner,
                        alt: "Preview Restaurante",
                        className: "w-full h-full object-cover",
                        referrerPolicy: "no-referrer"
                      }
                    ) : null,
                    /* @__PURE__ */ jsx("div", { className: "absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-sm text-[8px] font-bold text-on-surface px-2 py-0.5 rounded", children: "Vista Previa" })
                  ] }) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-4 bg-neutral-50 p-5 rounded-2xl border border-neutral-100 flex flex-col justify-between", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("span", { className: "text-xs font-black uppercase text-orange-600 tracking-wider block mb-2", children: "Repartidores" }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
                      /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-neutral-600", children: "Imagen para Registro de Repartidores" }),
                      /* @__PURE__ */ jsx(ImageSizeInfo, { type: "cover" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "file",
                          accept: "image/*",
                          onChange: (e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                setCropper({
                                  isOpen: true,
                                  imageSrc: ev.target?.result,
                                  type: "authDriver",
                                  aspectRatio: 9 / 16
                                });
                              };
                              reader.readAsDataURL(file);
                              e.target.value = "";
                            }
                          },
                          className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        }
                      ),
                      /* @__PURE__ */ jsxs("div", { className: "w-full border-2 border-dashed border-neutral-100 rounded-xl p-3 group-hover:border-orange-500 transition-colors flex items-center justify-center gap-2 bg-neutral-100", children: [
                        /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4 text-on-surface-muted" }),
                        /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-on-surface-variant", children: "Subir Imagen" })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
                      /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-bold text-on-surface-variant mb-1", children: "O escribe la URL directamente:" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "text",
                          value: settings.paymentGateways?.authDriverBanner || "",
                          onChange: (e) => setSettings({
                            ...settings,
                            paymentGateways: {
                              ...settings.paymentGateways || {},
                              authDriverBanner: e.target.value
                            }
                          }),
                          placeholder: "https://images.unsplash.com/...",
                          className: "w-full p-2 text-xs border border-neutral-200 rounded-lg focus:ring-1 focus:ring-orange-500 outline-none"
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "mt-2 text-center", children: /* @__PURE__ */ jsxs("div", { className: "h-28 rounded-xl overflow-hidden relative border border-neutral-200 bg-neutral-100", children: [
                    settings.paymentGateways?.authDriverBanner ? /* @__PURE__ */ jsx(
                      "img",
                      {
                        src: settings.paymentGateways.authDriverBanner,
                        alt: "Preview Repartidores",
                        className: "w-full h-full object-cover",
                        referrerPolicy: "no-referrer"
                      }
                    ) : null,
                    /* @__PURE__ */ jsx("div", { className: "absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-sm text-[8px] font-bold text-on-surface px-2 py-0.5 rounded", children: "Vista Previa" })
                  ] }) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-4 bg-neutral-50 p-5 rounded-2xl border border-neutral-100 flex flex-col justify-between", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("span", { className: "text-xs font-black uppercase text-orange-600 tracking-wider block mb-2", children: "Promoci\xF3n Gama" }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
                      /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-neutral-600", children: "Imagen para Gamificaci\xF3n" }),
                      /* @__PURE__ */ jsx(ImageSizeInfo, { type: "gamification" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "file",
                          accept: "image/*",
                          onChange: (e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                setCropper({
                                  isOpen: true,
                                  imageSrc: ev.target?.result,
                                  type: "auth",
                                  aspectRatio: 672 / 256,
                                  cropWidth: 672,
                                  cropHeight: 256
                                });
                              };
                              reader.readAsDataURL(file);
                              e.target.value = "";
                            }
                          },
                          className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        }
                      ),
                      /* @__PURE__ */ jsxs("div", { className: "w-full border-2 border-dashed border-neutral-200 rounded-xl p-3 group-hover:border-orange-500 transition-colors flex items-center justify-center gap-2 bg-neutral-100", children: [
                        /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4 text-on-surface-muted" }),
                        /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-on-surface-variant", children: "Subir Imagen" })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
                      /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-bold text-on-surface-variant mb-1", children: "O escribe la URL directamente:" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "text",
                          value: settings.authPageImage || "",
                          onChange: (e) => setSettings({
                            ...settings,
                            authPageImage: e.target.value
                          }),
                          placeholder: "https://images.unsplash.com/...",
                          className: "w-full p-2 text-xs border border-neutral-200 rounded-lg focus:ring-1 focus:ring-orange-500 outline-none"
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "mt-2 text-center", children: [
                    /* @__PURE__ */ jsxs("div", { className: "h-28 rounded-xl overflow-hidden relative border border-neutral-200 bg-neutral-100 mb-3", children: [
                      settings.authPageImage ? /* @__PURE__ */ jsx(
                        "img",
                        {
                          src: settings.authPageImage,
                          alt: "Preview Promo",
                          className: "w-full h-full object-cover",
                          referrerPolicy: "no-referrer"
                        }
                      ) : null,
                      /* @__PURE__ */ jsx("div", { className: "absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-sm text-[8px] font-bold text-on-surface px-2 py-0.5 rounded", children: "Vista Previa" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "space-y-3 text-left", children: [
                      /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-bold text-on-surface-variant mb-1", children: "T\xEDtulo de Gamificaci\xF3n:" }),
                        /* @__PURE__ */ jsx(
                          "input",
                          {
                            type: "text",
                            value: settings.authPromoTitle || "",
                            onChange: (e) => setSettings({
                              ...settings,
                              authPromoTitle: e.target.value
                            }),
                            placeholder: "Gana Monedas de Oro en cada pedido \u{1FA99}",
                            className: "w-full p-2 text-xs border border-neutral-200 rounded-lg focus:ring-1 focus:ring-orange-500 outline-none"
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-bold text-on-surface-variant mb-1", children: "Descripci\xF3n de Gamificaci\xF3n:" }),
                        /* @__PURE__ */ jsx(
                          "textarea",
                          {
                            value: settings.authPromoDescription || "",
                            onChange: (e) => setSettings({
                              ...settings,
                              authPromoDescription: e.target.value
                            }),
                            placeholder: "Cada vez que pidas...",
                            className: "w-full p-2 text-xs border border-neutral-200 rounded-lg focus:ring-1 focus:ring-orange-500 outline-none",
                            rows: 3
                          }
                        )
                      ] })
                    ] })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "pt-4 border-t border-neutral-200 flex justify-end", children: /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                disabled: isSavingSettings,
                className: "px-6 py-3 bg-orange-500 text-on-surface rounded-xl font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-2",
                children: isSavingSettings ? "Guardando..." : "Guardar Banners"
              }
            ) })
          ] }) }) : null,
          /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden p-6 mt-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black text-neutral-900", children: "M\xF3dulos del Slide de Recompensas (Inicio)" }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-on-surface-variant mt-1", children: "Administra, cambia el orden, sube im\xE1genes y agrega nuevos m\xF3dulos al carrusel de la p\xE1gina de inicio." })
              ] }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => setEditingRewardModule({
                    title: "",
                    description: "",
                    imageUrl: "",
                    buttonText: "Ir",
                    path: "",
                    isActive: true,
                    sortOrder: rewardModules.length + 1
                  }),
                  className: "bg-orange-500 text-on-surface px-6 py-3 rounded-2xl font-black hover:bg-orange-600 flex items-center gap-2 shadow-lg shadow-orange-200 transition-all text-sm shrink-0",
                  children: [
                    /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
                    " Nuevo M\xF3dulo"
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse min-w-[700px]", children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-neutral-50 border-b border-neutral-200 text-on-surface-variant text-xs uppercase tracking-wider", children: [
                /* @__PURE__ */ jsx("th", { className: "p-4 font-medium", children: "Imagen" }),
                /* @__PURE__ */ jsx("th", { className: "p-4 font-medium", children: "T\xEDtulo" }),
                /* @__PURE__ */ jsx("th", { className: "p-4 font-medium max-w-xs", children: "Descripci\xF3n y Enlace" }),
                /* @__PURE__ */ jsx("th", { className: "p-4 font-medium text-center", children: "Texto Bot\xF3n" }),
                /* @__PURE__ */ jsx("th", { className: "p-4 font-medium text-center", children: "Orden" }),
                /* @__PURE__ */ jsx("th", { className: "p-4 font-medium text-center", children: "Estado" }),
                /* @__PURE__ */ jsx("th", { className: "p-4 font-medium text-center", children: "Acciones" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-neutral-200 text-sm", children: rewardModules.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx(
                "td",
                {
                  colSpan: 7,
                  className: "p-8 text-center text-on-surface-variant font-medium",
                  children: "No hay m\xF3dulos configurados."
                }
              ) }) : rewardModules.map((module) => /* @__PURE__ */ jsxs(
                "tr",
                {
                  className: "hover:bg-neutral-50 transition-colors",
                  children: [
                    /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsx("div", { className: "w-16 h-12 rounded-lg overflow-hidden border border-neutral-200 bg-neutral-150 relative", children: module.imageUrl ? /* @__PURE__ */ jsx(
                      "img",
                      {
                        src: module.imageUrl,
                        alt: module.title,
                        className: "w-full h-full object-cover",
                        referrerPolicy: "no-referrer"
                      }
                    ) : /* @__PURE__ */ jsx("span", { className: "text-[10px] text-on-surface-muted absolute inset-0 flex items-center justify-center", children: "Sin imagen" }) }) }),
                    /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("span", { className: "font-bold text-neutral-900 block", children: module.title }),
                      module.id?.startsWith("default-") && /* @__PURE__ */ jsx("span", { className: "inline-block bg-neutral-100 text-neutral-600 font-bold px-2 py-0.5 rounded text-[9px] mt-1", children: "M\xF3dulo Base" })
                    ] }) }),
                    /* @__PURE__ */ jsx("td", { className: "p-4 max-w-xs", children: /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-600 leading-relaxed line-clamp-2", children: module.description }),
                      /* @__PURE__ */ jsx("span", { className: "text-[10px] font-mono text-on-surface-muted block mt-1 break-all", children: module.path })
                    ] }) }),
                    /* @__PURE__ */ jsx("td", { className: "p-4 text-center", children: /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-neutral-700 bg-neutral-100 px-2.5 py-1 rounded-full border border-neutral-200", children: module.buttonText }) }),
                    /* @__PURE__ */ jsx("td", { className: "p-4 text-center font-bold text-neutral-700 font-mono", children: module.sortOrder }),
                    /* @__PURE__ */ jsx("td", { className: "p-4 text-center", children: /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => handleToggleRewardModuleActive(module),
                        className: `px-3 py-1 rounded-full text-xs font-bold transition-all border ${module.isActive ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-neutral-100 border-neutral-200 text-on-surface-variant"}`,
                        children: module.isActive ? "Activo" : "Inactivo"
                      }
                    ) }),
                    /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-center gap-1", children: [
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          type: "button",
                          onClick: () => setEditingRewardModule(module),
                          className: "p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors",
                          title: "Editar m\xF3dulo",
                          children: /* @__PURE__ */ jsx(Edit, { className: "w-4 h-4" })
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          type: "button",
                          disabled: module.id?.startsWith("default-"),
                          onClick: () => module.id && handleDeleteRewardModule(module.id),
                          className: `p-1.5 rounded-lg transition-colors ${module.id?.startsWith("default-") ? "text-on-surface-variant cursor-not-allowed opacity-50" : "text-rose-600 hover:bg-rose-50"}`,
                          title: module.id?.startsWith("default-") ? "M\xF3dulo base - no puede eliminarse" : "Eliminar m\xF3dulo",
                          children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
                        }
                      )
                    ] }) })
                  ]
                },
                module.id
              )) })
            ] }) })
          ] })
        ] }),
        editingRewardModule && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-neutral-200 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50 shrink-0", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xl font-black text-neutral-900", children: editingRewardModule.id ? "Editar M\xF3dulo de Recompensa" : "Nuevo M\xF3dulo de Recompensa" }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setEditingRewardModule(null),
                className: "p-2 hover:bg-neutral-200 text-on-surface-variant rounded-full transition-colors",
                children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs(
            "form",
            {
              onSubmit: handleSaveRewardModule,
              className: "p-6 space-y-4 overflow-y-auto flex-1 bg-white",
              children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-neutral-900 mb-1", children: "T\xEDtulo del M\xF3dulo" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      required: true,
                      value: editingRewardModule.title || "",
                      onChange: (e) => setEditingRewardModule({
                        ...editingRewardModule,
                        title: e.target.value
                      }),
                      placeholder: "Ej. Ruleta de premios",
                      className: "w-full p-3 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-neutral-900 bg-white font-medium"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-neutral-900 mb-1", children: "Descripci\xF3n" }),
                  /* @__PURE__ */ jsx(
                    "textarea",
                    {
                      required: true,
                      value: editingRewardModule.description || "",
                      onChange: (e) => setEditingRewardModule({
                        ...editingRewardModule,
                        description: e.target.value
                      }),
                      placeholder: "Ej. Gira y gana premios en tu pr\xF3xima compra.",
                      rows: 2,
                      className: "w-full p-3 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-neutral-900 bg-white font-medium"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-neutral-900 mb-1", children: "Imagen del M\xF3dulo" }),
                  /* @__PURE__ */ jsxs("div", { className: "flex gap-4 items-center bg-white", children: [
                    /* @__PURE__ */ jsxs("div", { className: "w-24 h-16 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100 relative group shrink-0", children: [
                      editingRewardModule.imageUrl ? /* @__PURE__ */ jsxs(Fragment, { children: [
                        /* @__PURE__ */ jsx(
                          "img",
                          {
                            src: editingRewardModule.imageUrl,
                            alt: "Previsualizaci\xF3n",
                            className: "w-full h-full object-cover",
                            referrerPolicy: "no-referrer"
                          }
                        ),
                        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center", children: /* @__PURE__ */ jsx("span", { className: "text-[10px] text-on-surface font-bold", children: "Cambiar" }) })
                      ] }) : /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center text-on-surface-muted", children: [
                        /* @__PURE__ */ jsx(ImageIcon, { className: "w-5 h-5" }),
                        /* @__PURE__ */ jsx("span", { className: "text-[9px] mt-1", children: "Sin imagen" })
                      ] }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "file",
                          accept: "image/*",
                          onChange: async (e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              toast.loading("Subiendo imagen...");
                              const { url, error } = await db.uploadImage(
                                file,
                                "platform/rewards"
                              );
                              toast.dismiss();
                              if (error) {
                                toast.error("Error al subir la imagen");
                              } else if (url) {
                                setEditingRewardModule({
                                  ...editingRewardModule,
                                  imageUrl: url
                                });
                                toast.success("Imagen subida exitosamente");
                              }
                            }
                          },
                          className: "absolute inset-0 opacity-0 cursor-pointer"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-1", children: [
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "text",
                          required: true,
                          value: editingRewardModule.imageUrl || "",
                          onChange: (e) => setEditingRewardModule({
                            ...editingRewardModule,
                            imageUrl: e.target.value
                          }),
                          placeholder: "URL de la imagen o Sube un archivo",
                          className: "w-full p-2.5 border border-neutral-200 rounded-lg text-xs font-mono outline-none focus:ring-1 focus:ring-orange-500 text-neutral-900 bg-white font-medium"
                        }
                      ),
                      /* @__PURE__ */ jsx("span", { className: "text-[10px] text-on-surface-variant block px-1 leading-normal font-semibold", children: "Haz clic en la caja de previsualizaci\xF3n para subir, o pega un enlace." })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-neutral-900 mb-1", children: "Texto del Bot\xF3n" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "text",
                        required: true,
                        value: editingRewardModule.buttonText || "Ir",
                        onChange: (e) => setEditingRewardModule({
                          ...editingRewardModule,
                          buttonText: e.target.value
                        }),
                        placeholder: "Ej. Girar ahora, Ver premios",
                        className: "w-full p-3 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-neutral-900 bg-white font-medium"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-neutral-900 mb-1", children: "Orden de Visualizaci\xF3n" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "number",
                        required: true,
                        min: "0",
                        value: editingRewardModule.sortOrder ?? 0,
                        onChange: (e) => setEditingRewardModule({
                          ...editingRewardModule,
                          sortOrder: Number(e.target.value)
                        }),
                        placeholder: "Ej. 1, 2, 3",
                        className: "w-full p-3 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-neutral-900 bg-white font-mono font-medium"
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-neutral-900 mb-1", children: "Ruta de Redirecci\xF3n (Ruta Interna)" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      required: true,
                      value: editingRewardModule.path || "",
                      onChange: (e) => setEditingRewardModule({
                        ...editingRewardModule,
                        path: e.target.value
                      }),
                      placeholder: "Ej. /rewards/wheel, /rewards/redeem, /referrals",
                      className: "w-full p-3 border border-neutral-200 rounded-xl font-mono text-xs outline-none focus:ring-2 focus:ring-orange-500 text-neutral-900 bg-white font-medium"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 pt-2", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "checkbox",
                      id: "reward-module-active",
                      checked: editingRewardModule.isActive !== false,
                      onChange: (e) => setEditingRewardModule({
                        ...editingRewardModule,
                        isActive: e.target.checked
                      }),
                      className: "w-5 h-5 accent-orange-500 cursor-pointer rounded-lg border-neutral-300 bg-white"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "label",
                    {
                      htmlFor: "reward-module-active",
                      className: "text-sm font-bold text-neutral-900 cursor-pointer select-none",
                      children: "M\xF3dulo Activo (Mostrar en Inicio)"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "pt-4 border-t border-neutral-100 flex justify-end gap-3", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => setEditingRewardModule(null),
                      className: "px-5 py-2.5 border border-neutral-200 text-neutral-600 rounded-xl font-bold hover:bg-neutral-50 transition-colors",
                      children: "Cancelar"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "submit",
                      disabled: isSavingRewardModule,
                      className: "px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-on-surface rounded-xl font-bold transition-all shadow-lg shadow-orange-100 disabled:opacity-50",
                      children: isSavingRewardModule ? "Guardando..." : "Guardar"
                    }
                  )
                ] })
              ]
            }
          )
        ] }) }),
        activeTab === "plans" && /* @__PURE__ */ jsx(PlanManager, { plans, onPlansChange: fetchData }),
        activeTab === "billing" && /* @__PURE__ */ jsx("div", { className: "bg-white rounded-3xl shadow-sm border border-neutral-200 p-8", children: /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black text-neutral-900", children: "Facturaci\xF3n (En construcci\xF3n)" }) }),
        activeTab === "payments" && /* @__PURE__ */ jsx("div", { className: "bg-white rounded-3xl shadow-sm border border-neutral-200 p-8", children: /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black text-neutral-900", children: "Pagos Pendientes (En construcci\xF3n)" }) }),
        activeTab === "stats" && /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4", children: [
            /* @__PURE__ */ jsxs("h2", { className: "text-3xl font-black text-neutral-900 tracking-tight flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(TrendingUp, { className: "w-8 h-8 text-blue-600" }),
              "Dashboard Principal"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-neutral-200", children: [
              /* @__PURE__ */ jsx(
                DateSelector,
                {
                  value: dateFilter.start,
                  onChange: (val) => setDateFilter({ ...dateFilter, start: val })
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "text-on-surface-muted font-bold px-2", children: "-" }),
              /* @__PURE__ */ jsx(
                DateSelector,
                {
                  value: dateFilter.end,
                  onChange: (val) => setDateFilter({ ...dateFilter, end: val })
                }
              )
            ] })
          ] }),
          (() => {
            const filteredOrders = orders.filter((o) => {
              if (!o.createdAt) return false;
              const d = new Date(o.createdAt).toISOString().split("T")[0];
              return d >= dateFilter.start && d <= dateFilter.end;
            });
            const totalRevenue = filteredOrders.reduce(
              (sum, o) => sum + (Number(o.total) || 0),
              0
            );
            const activeRests = restaurants.filter(
              (r) => r.status !== "inactive"
            ).length;
            const usersCount = appUsers.length;
            const subscriptionRevenue = invoices.filter(
              (i) => i.type === "subscription" && i.status === "paid"
            ).reduce((sum, i) => sum + Number(i.amount), 0);
            const commissionRevenue = invoices.filter(
              (i) => i.type === "commission" && i.status === "paid"
            ).reduce((sum, i) => sum + Number(i.amount), 0);
            const pendingRevenue = invoices.filter((i) => i.status === "pending").reduce((sum, i) => sum + Number(i.amount), 0);
            return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-3xl shadow-lg relative overflow-hidden group", children: [
                  /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity", children: /* @__PURE__ */ jsx(DollarSign, { className: "w-24 h-24 text-on-surface" }) }),
                  /* @__PURE__ */ jsx("p", { className: "text-blue-100 font-bold mb-1", children: "Ventas Brutas" }),
                  /* @__PURE__ */ jsx("p", { className: "text-3xl font-black text-on-surface", children: formatCurrency(totalRevenue) }),
                  /* @__PURE__ */ jsx("p", { className: "text-blue-200 text-xs mt-2 font-medium", children: "Volumen procesado en el periodo" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-3xl shadow-lg relative overflow-hidden group", children: [
                  /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity", children: /* @__PURE__ */ jsx(Store, { className: "w-24 h-24 text-on-surface" }) }),
                  /* @__PURE__ */ jsx("p", { className: "text-emerald-100 font-bold mb-1", children: "Restaurantes Activos" }),
                  /* @__PURE__ */ jsx("p", { className: "text-3xl font-black text-on-surface", children: activeRests }),
                  /* @__PURE__ */ jsx("p", { className: "text-emerald-200 text-xs mt-2 font-medium", children: "Liderando el ecosistema" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-3xl shadow-lg relative overflow-hidden group", children: [
                  /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity", children: /* @__PURE__ */ jsx(ShoppingBag, { className: "w-24 h-24 text-on-surface" }) }),
                  /* @__PURE__ */ jsx("p", { className: "text-orange-100 font-bold mb-1", children: "Pedidos Totales" }),
                  /* @__PURE__ */ jsx("p", { className: "text-3xl font-black text-on-surface", children: filteredOrders.length }),
                  /* @__PURE__ */ jsx("p", { className: "text-orange-200 text-xs mt-2 font-medium", children: "Encuentros completados" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-3xl shadow-lg relative overflow-hidden group", children: [
                  /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity", children: /* @__PURE__ */ jsx(Users, { className: "w-24 h-24 text-on-surface" }) }),
                  /* @__PURE__ */ jsx("p", { className: "text-indigo-100 font-bold mb-1", children: "Usuarios Afiliados" }),
                  /* @__PURE__ */ jsx("p", { className: "text-3xl font-black text-on-surface", children: usersCount }),
                  /* @__PURE__ */ jsx("p", { className: "text-indigo-200 text-xs mt-2 font-medium", children: "Clientes y Repartidores" })
                ] })
              ] }),
              /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-neutral-900 pt-4", children: "Ingresos de la Plataforma" }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex items-center gap-4", children: [
                  /* @__PURE__ */ jsx("div", { className: "bg-emerald-100 p-4 rounded-xl text-emerald-600", children: /* @__PURE__ */ jsx(Shield, { className: "w-6 h-6" }) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-on-surface-variant font-bold uppercase tracking-wider", children: "Suscripciones" }),
                    /* @__PURE__ */ jsx("p", { className: "text-xl font-black text-neutral-900", children: formatCurrency(subscriptionRevenue) }),
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] text-on-surface-muted font-bold mt-0.5", children: "Cobros pagados" })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex items-center gap-4", children: [
                  /* @__PURE__ */ jsx("div", { className: "bg-blue-100 p-4 rounded-xl text-blue-600", children: /* @__PURE__ */ jsx(TrendingUp, { className: "w-6 h-6" }) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-on-surface-variant font-bold uppercase tracking-wider", children: "Comisiones" }),
                    /* @__PURE__ */ jsx("p", { className: "text-xl font-black text-neutral-900", children: formatCurrency(commissionRevenue) }),
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] text-on-surface-muted font-bold mt-0.5", children: "Recaudado" })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex items-center gap-4", children: [
                  /* @__PURE__ */ jsx("div", { className: "bg-rose-100 p-4 rounded-xl text-rose-600", children: /* @__PURE__ */ jsx(AlertTriangle, { className: "w-6 h-6" }) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-on-surface-variant font-bold uppercase tracking-wider", children: "Por Cobrar" }),
                    /* @__PURE__ */ jsx("p", { className: "text-xl font-black text-neutral-900", children: formatCurrency(pendingRevenue) }),
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] text-on-surface-muted font-bold mt-0.5", children: "Facturas pendientes" })
                  ] })
                ] })
              ] })
            ] });
          })(),
          !selectedRestaurantId ? /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-2xl shadow-sm border border-neutral-200", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6", children: [
              /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-neutral-900", children: "Estad\xEDsticas Detalladas por Restaurante" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => {
                      setLoading(true);
                      fetchData();
                    },
                    className: "p-2 text-on-surface-variant hover:text-orange-600 transition-colors",
                    title: "Refrescar datos",
                    children: /* @__PURE__ */ jsx(
                      TrendingUp,
                      {
                        className: `w-5 h-5 ${loading ? "animate-spin" : ""}`
                      }
                    )
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(
                    DateSelector,
                    {
                      value: dateFilter.start,
                      onChange: (val) => setDateFilter({ ...dateFilter, start: val })
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { className: "text-on-surface-muted", children: "-" }),
                  /* @__PURE__ */ jsx(
                    DateSelector,
                    {
                      value: dateFilter.end,
                      onChange: (val) => setDateFilter({ ...dateFilter, end: val })
                    }
                  )
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-neutral-50 border-b border-neutral-200 text-on-surface-variant text-xs uppercase tracking-wider", children: [
                /* @__PURE__ */ jsx("th", { className: "p-4 font-medium", children: "Restaurante" }),
                /* @__PURE__ */ jsx("th", { className: "p-4 font-medium", children: "Ventas Totales" }),
                /* @__PURE__ */ jsx("th", { className: "p-4 font-medium", children: "Pedidos" }),
                /* @__PURE__ */ jsx("th", { className: "p-4 font-medium", children: "Comisi\xF3n %" }),
                /* @__PURE__ */ jsx("th", { className: "p-4 font-medium", children: "Ganancia App" }),
                /* @__PURE__ */ jsx("th", { className: "p-4 font-medium", children: "A Pagar al Restaurante" }),
                /* @__PURE__ */ jsx("th", { className: "p-4 font-medium text-right", children: "Acciones" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-neutral-200", children: restaurants.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx(
                "td",
                {
                  colSpan: 7,
                  className: "p-8 text-center text-on-surface-variant",
                  children: "No hay restaurantes registrados"
                }
              ) }) : restaurants.map((restaurant) => {
                const restaurantOrders = orders.filter((o) => {
                  if (!o.createdAt || !o.restaurantId)
                    return false;
                  try {
                    const orderDate = new Date(o.createdAt).toISOString().split("T")[0];
                    return String(o.restaurantId) === String(restaurant.id) && orderDate >= dateFilter.start && orderDate <= dateFilter.end;
                  } catch (e) {
                    return false;
                  }
                });
                const sales = restaurantOrders.reduce(
                  (sum, o) => sum + (Number(o.total) || 0),
                  0
                );
                const commissionRate = Number(restaurant.commissionRate) || 5;
                const commission = sales * (commissionRate / 100);
                const netToRestaurant = sales - commission;
                return /* @__PURE__ */ jsxs(
                  "tr",
                  {
                    className: "hover:bg-neutral-50 transition-colors",
                    children: [
                      /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                        /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden", children: restaurant.logo ? /* @__PURE__ */ jsx(
                          "img",
                          {
                            src: restaurant.logo,
                            alt: "",
                            className: "w-full h-full object-cover",
                            referrerPolicy: "no-referrer"
                          }
                        ) : /* @__PURE__ */ jsx(Store, { className: "w-4 h-4 text-on-surface-muted" }) }),
                        /* @__PURE__ */ jsx("span", { className: "font-bold text-neutral-900", children: restaurant.name })
                      ] }) }),
                      /* @__PURE__ */ jsx("td", { className: "p-4 font-bold text-neutral-900", children: formatCurrency(sales) }),
                      /* @__PURE__ */ jsx("td", { className: "p-4 text-neutral-600", children: restaurantOrders.length }),
                      /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxs("span", { className: "bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-bold text-xs", children: [
                        commissionRate,
                        "%"
                      ] }) }),
                      /* @__PURE__ */ jsx("td", { className: "p-4 font-bold text-emerald-600", children: formatCurrency(commission) }),
                      /* @__PURE__ */ jsx("td", { className: "p-4 font-bold text-orange-600", children: formatCurrency(netToRestaurant) }),
                      /* @__PURE__ */ jsx("td", { className: "p-4 text-right", children: /* @__PURE__ */ jsx(
                        "button",
                        {
                          onClick: () => {
                            console.log(
                              "Selecting restaurant:",
                              restaurant.id
                            );
                            setSelectedRestaurantId(restaurant.id);
                          },
                          className: "p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors",
                          title: "Ver Detalles",
                          children: /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5" })
                        }
                      ) })
                    ]
                  },
                  restaurant.id
                );
              }) }),
              /* @__PURE__ */ jsx("tfoot", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-surface-variant text-on-surface font-bold", children: [
                /* @__PURE__ */ jsx("td", { className: "p-4", children: "TOTALES" }),
                /* @__PURE__ */ jsxs("td", { className: "p-4", children: [
                  "$",
                  orders.filter((o) => {
                    if (!o.createdAt) return false;
                    const d = new Date(o.createdAt).toISOString().split("T")[0];
                    return d >= dateFilter.start && d <= dateFilter.end;
                  }).reduce(
                    (sum, o) => sum + (Number(o.total) || 0),
                    0
                  ).toLocaleString("es-CO")
                ] }),
                /* @__PURE__ */ jsx("td", { className: "p-4", children: orders.filter((o) => {
                  if (!o.createdAt) return false;
                  const d = new Date(o.createdAt).toISOString().split("T")[0];
                  return d >= dateFilter.start && d <= dateFilter.end;
                }).length }),
                /* @__PURE__ */ jsx("td", { className: "p-4", children: "-" }),
                /* @__PURE__ */ jsxs("td", { className: "p-4 text-emerald-400", children: [
                  "$",
                  orders.filter((o) => {
                    if (!o.createdAt) return false;
                    const d = new Date(o.createdAt).toISOString().split("T")[0];
                    return d >= dateFilter.start && d <= dateFilter.end;
                  }).reduce((sum, o) => {
                    const r = restaurants.find(
                      (res) => String(res.id) === String(o.restaurantId)
                    );
                    return sum + (Number(o.total) || 0) * ((Number(r?.commissionRate) || 5) / 100);
                  }, 0).toLocaleString("es-CO")
                ] }),
                /* @__PURE__ */ jsx("td", { className: "p-4", children: "-" }),
                /* @__PURE__ */ jsx("td", { className: "p-4" })
              ] }) })
            ] }) })
          ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-6", children: (() => {
            const restaurant = restaurants.find(
              (r) => r.id === selectedRestaurantId
            );
            if (!restaurant) return null;
            const restaurantOrders = orders.filter((o) => {
              if (!o.createdAt || !o.restaurantId) return false;
              try {
                const orderDate = new Date(o.createdAt).toISOString().split("T")[0];
                return String(o.restaurantId) === String(restaurant.id) && orderDate >= dateFilter.start && orderDate <= dateFilter.end;
              } catch (e) {
                return false;
              }
            });
            const sales = restaurantOrders.reduce(
              (sum, o) => sum + (Number(o.total) || 0),
              0
            );
            const commissionRate = Number(restaurant.commissionRate) || 5;
            const appEarnings = sales * (commissionRate / 100);
            const restaurantPayable = sales - appEarnings;
            return /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => setSelectedRestaurantId(null),
                    className: "flex items-center gap-2 text-on-surface-variant hover:text-neutral-900 transition-colors font-bold",
                    children: [
                      /* @__PURE__ */ jsx(ChevronLeft, { className: "w-5 h-5" }),
                      "Volver al listado"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => exportToPDF(
                      restaurant,
                      restaurantOrders,
                      sales,
                      appEarnings,
                      restaurantPayable
                    ),
                    className: "flex items-center gap-2 bg-orange-600 text-on-surface px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange-700 transition-all shadow-lg shadow-orange-200",
                    children: [
                      /* @__PURE__ */ jsx(Download, { className: "w-4 h-4" }),
                      "Exportar PDF"
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
                /* @__PURE__ */ jsxs("div", { className: "bg-white p-8 rounded-[2rem] border border-neutral-200 shadow-sm", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-muted mb-2", children: "Ventas Totales" }),
                  /* @__PURE__ */ jsx("p", { className: "text-3xl font-black text-neutral-900", children: formatCurrency(sales) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "bg-white p-8 rounded-[2rem] border border-neutral-200 shadow-sm", children: [
                  /* @__PURE__ */ jsxs("p", { className: "text-[10px] font-black uppercase tracking-[0.2em] text-orange-600/60 mb-2", children: [
                    "Comisi\xF3n App (",
                    commissionRate,
                    "%)"
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-3xl font-black text-orange-600", children: formatCurrency(appEarnings) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "bg-white p-8 rounded-[2rem] border border-neutral-200 shadow-sm", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600/60 mb-2", children: "Neto Restaurante" }),
                  /* @__PURE__ */ jsx("p", { className: "text-3xl font-black text-emerald-600", children: formatCurrency(restaurantPayable) })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-white p-8 rounded-2xl shadow-xl border border-neutral-100", children: [
                /* @__PURE__ */ jsxs("h3", { className: "text-xl font-black mb-6", children: [
                  "Movimientos Detallados: ",
                  restaurant.name
                ] }),
                /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
                  /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-[10px] font-black text-on-surface-muted uppercase tracking-[0.2em] border-b border-neutral-100", children: [
                    /* @__PURE__ */ jsx("th", { className: "pb-4", children: "ID Pedido" }),
                    /* @__PURE__ */ jsx("th", { className: "pb-4", children: "Fecha" }),
                    /* @__PURE__ */ jsx("th", { className: "pb-4", children: "Cliente" }),
                    /* @__PURE__ */ jsx("th", { className: "pb-4", children: "Total" }),
                    /* @__PURE__ */ jsx("th", { className: "pb-4", children: "Comisi\xF3n" }),
                    /* @__PURE__ */ jsx("th", { className: "pb-4", children: "Neto" })
                  ] }) }),
                  /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-neutral-50", children: restaurantOrders.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx(
                    "td",
                    {
                      colSpan: 6,
                      className: "py-8 text-center text-on-surface-variant font-bold",
                      children: "No hay movimientos registrados en este periodo"
                    }
                  ) }) : restaurantOrders.map((order) => {
                    const total = Number(order.total) || 0;
                    const commission = total * (commissionRate / 100);
                    const net = total - commission;
                    return /* @__PURE__ */ jsxs(
                      "tr",
                      {
                        className: "text-sm font-bold text-neutral-700 hover:bg-neutral-50 transition-colors",
                        children: [
                          /* @__PURE__ */ jsxs("td", { className: "py-4 font-mono text-xs text-on-surface-muted", children: [
                            "#",
                            order.id?.slice(0, 8) || "---"
                          ] }),
                          /* @__PURE__ */ jsx("td", { className: "py-4", children: order.createdAt ? new Date(
                            order.createdAt
                          ).toLocaleDateString() : "---" }),
                          /* @__PURE__ */ jsx("td", { className: "py-4", children: order.customerName || "Cliente" }),
                          /* @__PURE__ */ jsx("td", { className: "py-4", children: formatCurrency(total) }),
                          /* @__PURE__ */ jsxs("td", { className: "py-4 text-red-500", children: [
                            "-$",
                            commission.toLocaleString("es-CO")
                          ] }),
                          /* @__PURE__ */ jsx("td", { className: "py-4 text-emerald-600 font-black", children: formatCurrency(net) })
                        ]
                      },
                      order.id
                    );
                  }) })
                ] }) })
              ] })
            ] });
          })() })
        ] }),
        activeTab === "communications" && /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-3xl shadow-sm border border-neutral-200 p-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-8", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black text-neutral-900 tracking-tight", children: "Comunicaciones del Sistema" }),
              /* @__PURE__ */ jsx("p", { className: "text-on-surface-variant font-medium", children: "Gestiona las notificaciones y avisos internos de la plataforma." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex p-1 bg-neutral-100 rounded-2xl", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setCommunicationsSubTab("send"),
                  className: `px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${communicationsSubTab === "send" ? "bg-white text-orange-600 shadow-sm" : "text-on-surface-variant hover:text-neutral-900"}`,
                  children: "Enviar Aviso"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setCommunicationsSubTab("history"),
                  className: `px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${communicationsSubTab === "history" ? "bg-white text-orange-600 shadow-sm" : "text-on-surface-variant hover:text-neutral-900"}`,
                  children: "Historial"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setCommunicationsSubTab("scheduled"),
                  className: `px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${communicationsSubTab === "scheduled" ? "bg-white text-orange-600 shadow-sm" : "text-on-surface-variant hover:text-neutral-900"}`,
                  children: "Programadas"
                }
              )
            ] })
          ] }),
          communicationsSubTab === "send" && /* @__PURE__ */ jsx("div", { className: "max-w-2xl", children: /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsx("div", { className: "bg-neutral-50 p-6 rounded-2xl border border-neutral-100", children: /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2", children: "Segmento Destinatario" }),
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: notificationForm.target,
                    onChange: (e) => setNotificationForm({
                      ...notificationForm,
                      target: e.target.value
                    }),
                    className: "w-full p-4 bg-white border-2 border-neutral-100 rounded-2xl font-bold focus:border-orange-500 outline-none transition-all appearance-none text-neutral-900",
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "all", children: "\u{1F680} Todos los Usuarios (General)" }),
                      /* @__PURE__ */ jsx("option", { value: "all_customers", children: "\u{1F465} Todos los Clientes (Solo Usuarios)" }),
                      /* @__PURE__ */ jsx("option", { value: "all_restaurants", children: "\u{1F3EA} Due\xF1os de Restaurantes" }),
                      /* @__PURE__ */ jsx("option", { value: "all_drivers", children: "\u{1F6B2} Todos los Repartidores" }),
                      /* @__PURE__ */ jsx("option", { value: "restaurant_customers", children: "\u{1F4CD} Clientes de un Restaurante Espec\xEDfico" })
                    ]
                  }
                )
              ] }),
              notificationForm.target === "restaurant_customers" && /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2", children: "Seleccionar Restaurante" }),
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: notificationForm.restaurantId,
                    onChange: (e) => setNotificationForm({
                      ...notificationForm,
                      restaurantId: e.target.value
                    }),
                    className: "w-full p-4 bg-white border-2 border-neutral-100 rounded-2xl font-bold focus:border-orange-500 outline-none transition-all appearance-none text-neutral-900",
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "", children: "Selecciona un restaurante..." }),
                      restaurants.map((r) => /* @__PURE__ */ jsx("option", { value: r.id, children: r.name }, r.id))
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "pt-2", children: [
                /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2", children: "Categor\xEDa del Aviso" }),
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: notificationForm.category,
                    onChange: (e) => setNotificationForm({
                      ...notificationForm,
                      category: e.target.value
                    }),
                    className: "w-full p-4 bg-white border-2 border-neutral-100 rounded-2xl font-bold focus:border-orange-500 outline-none transition-all appearance-none text-neutral-900",
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "pagos", children: "\u{1F4B3} Pagos y Facturaci\xF3n" }),
                      /* @__PURE__ */ jsx("option", { value: "capacitaci\xF3n", children: "\u{1F393} Capacitaci\xF3n / Tutoriales" }),
                      /* @__PURE__ */ jsx("option", { value: "soporte", children: "\u{1F6E0}\uFE0F Soporte T\xE9cnico" }),
                      /* @__PURE__ */ jsx("option", { value: "actualizaciones", children: "\u{1F199} Actualizaciones del Sistema" }),
                      /* @__PURE__ */ jsx("option", { value: "visitas", children: "\u{1F4CD} Visitas y Auditor\xEDas" }),
                      /* @__PURE__ */ jsx("option", { value: "cupones", children: "\u{1F39F}\uFE0F Cupones de Plataforma" }),
                      /* @__PURE__ */ jsx("option", { value: "premios", children: "\u{1F3C6} Premios y Reconocimientos" }),
                      /* @__PURE__ */ jsx("option", { value: "informaci\xF3n", children: "\u2139\uFE0F Informaci\xF3n General" })
                    ]
                  }
                )
              ] })
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-2xl border border-neutral-100 flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-bold text-neutral-900", children: "Programar Env\xEDo" }),
                /* @__PURE__ */ jsx("p", { className: "text-[10px] text-on-surface-variant font-bold uppercase tracking-widest", children: "El aviso se enviar\xE1 autom\xE1ticamente en la fecha indicada" })
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setNotificationForm({
                    ...notificationForm,
                    isScheduled: !notificationForm.isScheduled
                  }),
                  className: `w-12 h-6 rounded-full transition-all relative ${notificationForm.isScheduled ? "bg-orange-500" : "bg-neutral-200"}`,
                  children: /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: `absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${notificationForm.isScheduled ? "left-7" : "left-1"}`
                    }
                  )
                }
              )
            ] }),
            notificationForm.isScheduled && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2", children: "Fecha de Env\xEDo" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "date",
                    value: notificationForm.scheduledDate,
                    onChange: (e) => setNotificationForm({
                      ...notificationForm,
                      scheduledDate: e.target.value
                    }),
                    className: "w-full p-4 bg-white border-2 border-neutral-100 rounded-2xl font-bold focus:border-orange-500 outline-none transition-all text-neutral-900"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2", children: "Hora de Env\xEDo" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "time",
                    value: notificationForm.scheduledTime,
                    onChange: (e) => setNotificationForm({
                      ...notificationForm,
                      scheduledTime: e.target.value
                    }),
                    className: "w-full p-4 bg-white border-2 border-neutral-100 rounded-2xl font-bold focus:border-orange-500 outline-none transition-all text-neutral-900"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2", children: "T\xEDtulo del Aviso / Notificaci\xF3n" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: notificationForm.title,
                    onChange: (e) => setNotificationForm({
                      ...notificationForm,
                      title: e.target.value
                    }),
                    placeholder: "Ej: \xA1Nueva Promoci\xF3n Disponible!",
                    className: "w-full p-4 bg-neutral-50 border-2 border-neutral-100 rounded-2xl font-bold focus:border-orange-500 outline-none transition-all text-neutral-900"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2", children: "Mensaje (Cuerpo)" }),
                /* @__PURE__ */ jsx(
                  "textarea",
                  {
                    value: notificationForm.body,
                    onChange: (e) => setNotificationForm({
                      ...notificationForm,
                      body: e.target.value
                    }),
                    placeholder: "Escribe el contenido del mensaje aqu\xED...",
                    rows: 4,
                    className: "w-full p-4 bg-neutral-50 border-2 border-neutral-100 rounded-2xl font-bold focus:border-orange-500 outline-none transition-all resize-none text-neutral-900"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "pt-4", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  disabled: isSendingNotification || !notificationForm.title || !notificationForm.body || notificationForm.target === "restaurant_customers" && !notificationForm.restaurantId || notificationForm.isScheduled && (!notificationForm.scheduledDate || !notificationForm.scheduledTime),
                  onClick: async () => {
                    setIsSendingNotification(true);
                    try {
                      if (notificationForm.isScheduled) {
                        const scheduledDateTime = (/* @__PURE__ */ new Date(
                          `${notificationForm.scheduledDate}T${notificationForm.scheduledTime}`
                        )).toISOString();
                        await db.scheduleNotification({
                          senderId: user?.id,
                          title: notificationForm.title,
                          body: notificationForm.body,
                          category: notificationForm.category,
                          targetSegment: notificationForm.target,
                          scheduledFor: scheduledDateTime
                        });
                        toast.success("Aviso programado exitosamente");
                        const resScheduled = await db.getScheduledNotifications();
                        setScheduledNotes(resScheduled);
                        setNotificationForm({
                          ...notificationForm,
                          title: "",
                          body: "",
                          isScheduled: false,
                          scheduledDate: "",
                          scheduledTime: ""
                        });
                      } else {
                        const response = await fetch(
                          "/api/notifications/send",
                          {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                              topic: notificationForm.target,
                              restaurantId: notificationForm.restaurantId,
                              senderId: user?.id,
                              title: notificationForm.title,
                              body: notificationForm.body,
                              data: {
                                category: notificationForm.category,
                                type: "platform_broadcast"
                              }
                            })
                          }
                        );
                        if (response.ok) {
                          const result = await response.json();
                          toast.success(
                            result.message || "Aviso enviado exitosamente"
                          );
                          setNotificationForm({
                            ...notificationForm,
                            title: "",
                            body: "",
                            isScheduled: false
                          });
                          const resCampaigns = await db.getNotificationCampaigns();
                          setCampaigns(resCampaigns);
                        } else {
                          const err = await response.json();
                          toast.error(
                            `Error: ${err.error || "No se pudo enviar"}`
                          );
                        }
                      }
                    } catch (e) {
                      toast.error(
                        "Error de conexi\xF3n con el servidor. Int\xE9ntalo de nuevo."
                      );
                    } finally {
                      setIsSendingNotification(false);
                    }
                  },
                  className: "w-full py-4 bg-surface-variant text-on-surface font-black rounded-2xl shadow-xl shadow-neutral-100 hover:bg-surface-base transition-all disabled:opacity-50 flex items-center justify-center gap-3 active:scale-[0.98]",
                  children: [
                    /* @__PURE__ */ jsx(BellRing, { className: "w-5 h-5 text-orange-500" }),
                    isSendingNotification ? "Procesando..." : notificationForm.isScheduled ? "Programar Aviso" : "Enviar Aviso Inmediato"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3", children: [
                /* @__PURE__ */ jsx(AlertTriangle, { className: "w-4 h-4 text-amber-600 mt-1 flex-shrink-0" }),
                /* @__PURE__ */ jsx("p", { className: "text-[10px] text-amber-800 font-bold uppercase tracking-widest leading-relaxed", children: "Este sistema env\xEDa tanto un aviso interno al buz\xF3n del usuario como una notificaci\xF3n push inmediata." })
              ] })
            ] })
          ] }) }),
          communicationsSubTab === "history" && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-4", children: [
              /* @__PURE__ */ jsx("h3", { className: "font-bold text-neutral-900 uppercase tracking-widest text-xs", children: "Historial de Campa\xF1as Enviadas" }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: handleClearHistory,
                  disabled: isClearingHistory || campaigns.length === 0,
                  className: "px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors flex items-center gap-2 disabled:opacity-50",
                  children: [
                    /* @__PURE__ */ jsx(Trash2, { className: "w-3 h-3" }),
                    isClearingHistory ? "Borrando..." : "Limpiar Historial"
                  ]
                }
              )
            ] }),
            campaigns.length > 0 ? /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-neutral-50 border-b border-neutral-200 text-on-surface-variant text-[10px] font-black uppercase tracking-widest", children: [
                /* @__PURE__ */ jsx("th", { className: "p-4", children: "Fecha" }),
                /* @__PURE__ */ jsx("th", { className: "p-4", children: "Segmento" }),
                /* @__PURE__ */ jsx("th", { className: "p-4", children: "T\xEDtulo" }),
                /* @__PURE__ */ jsx("th", { className: "p-4", children: "Mensaje" }),
                /* @__PURE__ */ jsx("th", { className: "p-4 text-right", children: "Alcance" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-neutral-100", children: campaigns.map((campaign) => /* @__PURE__ */ jsxs(
                "tr",
                {
                  className: "hover:bg-neutral-50 transition-colors",
                  children: [
                    /* @__PURE__ */ jsx("td", { className: "p-4 text-xs font-bold text-on-surface-variant", children: new Date(
                      campaign.createdAt
                    ).toLocaleDateString() }),
                    /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsx("span", { className: "bg-neutral-100 text-neutral-600 px-2 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest", children: campaign.targetSegment === "all" ? "\u{1F680} Todos" : campaign.targetSegment === "all_restaurants" ? "\u{1F3EA} Restaurantes" : campaign.targetSegment === "all_drivers" ? "\u{1F6B2} Repartidores" : campaign.targetSegment === "restaurant_customers" ? "\u{1F465} Clientes" : campaign.targetSegment }) }),
                    /* @__PURE__ */ jsx("td", { className: "p-4 font-bold text-neutral-900 text-sm", children: campaign.title }),
                    /* @__PURE__ */ jsx("td", { className: "p-4 text-neutral-600 text-sm truncate max-w-[200px]", children: campaign.body }),
                    /* @__PURE__ */ jsx("td", { className: "p-4 text-right", children: /* @__PURE__ */ jsx("span", { className: "font-bold text-emerald-600", children: "Enviado" }) })
                  ]
                },
                campaign.id
              )) })
            ] }) }) : /* @__PURE__ */ jsxs("div", { className: "py-20 text-center bg-neutral-50 rounded-[2rem] border border-neutral-200 border-dashed", children: [
              /* @__PURE__ */ jsx(BellRing, { className: "w-12 h-12 text-on-surface-variant mx-auto mb-4" }),
              /* @__PURE__ */ jsx("p", { className: "text-on-surface-variant font-bold", children: "No hay historial de env\xEDos todav\xEDa." })
            ] })
          ] }),
          communicationsSubTab === "scheduled" && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-4", children: [
              /* @__PURE__ */ jsx("h3", { className: "font-bold text-neutral-900 uppercase tracking-widest text-xs", children: "Avisos Programados Pendientes" }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: handleClearHistory,
                  disabled: isClearingHistory || scheduledNotes.length === 0,
                  className: "px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors flex items-center gap-2 disabled:opacity-50",
                  children: [
                    /* @__PURE__ */ jsx(Trash2, { className: "w-3 h-3" }),
                    isClearingHistory ? "Borrando..." : "Vaciar Programados"
                  ]
                }
              )
            ] }),
            scheduledNotes.length > 0 ? /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-neutral-50 border-b border-neutral-200 text-on-surface-variant text-[10px] font-black uppercase tracking-widest", children: [
                /* @__PURE__ */ jsx("th", { className: "p-4", children: "Programado Para" }),
                /* @__PURE__ */ jsx("th", { className: "p-4", children: "Categor\xEDa" }),
                /* @__PURE__ */ jsx("th", { className: "p-4", children: "T\xEDtulo" }),
                /* @__PURE__ */ jsx("th", { className: "p-4", children: "Estado" }),
                /* @__PURE__ */ jsx("th", { className: "p-4 text-right", children: "Acciones" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-neutral-100", children: scheduledNotes.map((note) => /* @__PURE__ */ jsxs(
                "tr",
                {
                  className: "hover:bg-neutral-50 transition-colors",
                  children: [
                    /* @__PURE__ */ jsx("td", { className: "p-4 text-xs font-bold text-neutral-900", children: new Date(note.scheduledFor).toLocaleString() }),
                    /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsx("span", { className: "bg-orange-100 text-orange-700 px-2 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest", children: note.category }) }),
                    /* @__PURE__ */ jsx("td", { className: "p-4 font-bold text-neutral-900 text-sm", children: note.title }),
                    /* @__PURE__ */ jsx("td", { className: "p-4", children: note.isSent ? /* @__PURE__ */ jsx("span", { className: "bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest", children: "Enviado" }) : /* @__PURE__ */ jsx("span", { className: "bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest", children: "Pendiente" }) }),
                    /* @__PURE__ */ jsx("td", { className: "p-4 text-right", children: !note.isSent && /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: async () => {
                          if (confirm(
                            "\xBFEst\xE1s seguro de eliminar esta programaci\xF3n?"
                          )) {
                            try {
                              await db.deleteScheduledNotification(
                                note.id
                              );
                              setScheduledNotes(
                                (prev) => prev.filter(
                                  (n) => n.id !== note.id
                                )
                              );
                              toast.success(
                                "Programaci\xF3n eliminada"
                              );
                            } catch (e) {
                              toast.error("No se pudo eliminar");
                            }
                          }
                        },
                        className: "p-2 text-on-surface-muted hover:text-red-500 transition-colors",
                        children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
                      }
                    ) })
                  ]
                },
                note.id
              )) })
            ] }) }) : /* @__PURE__ */ jsxs("div", { className: "py-20 text-center bg-neutral-50 rounded-[2rem] border border-neutral-200 border-dashed", children: [
              /* @__PURE__ */ jsx(Calendar, { className: "w-12 h-12 text-on-surface-variant mx-auto mb-4" }),
              /* @__PURE__ */ jsx("p", { className: "text-on-surface-variant font-bold", children: "No hay avisos programados." })
            ] })
          ] })
        ] }),
        activeTab === "docs" && /* @__PURE__ */ jsx(Documentation, {}),
        activeTab === "splash" && settings && /* @__PURE__ */ jsx("div", { className: "p-0", children: /* @__PURE__ */ jsx(SplashBuilder, { settings, onUpdate: setSettings }) }),
        activeTab === "onboarding" && settings && /* @__PURE__ */ jsx("div", { className: "p-0", children: /* @__PURE__ */ jsx(OnboardingBuilder, { settings, onUpdate: setSettings }) }),
        activeTab === "settings" && settings && /* @__PURE__ */ jsx("div", { className: "bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden p-6", children: /* @__PURE__ */ jsxs(
          "form",
          {
            onSubmit: handleSaveSettings,
            className: "space-y-8 max-w-3xl",
            children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(Settings, { className: "w-5 h-5 text-orange-500" }),
                  "Informaci\xF3n General de la App"
                ] }),
                /* @__PURE__ */ jsx("div", { className: "space-y-4 bg-neutral-50 p-6 rounded-2xl border border-neutral-100", children: /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-neutral-700 mb-2", children: "Nombre de la Aplicaci\xF3n" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      value: settings.appName || "",
                      onChange: (e) => setSettings({
                        ...settings,
                        appName: e.target.value
                      }),
                      placeholder: "Ej. SmartBite",
                      className: "w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white text-neutral-900"
                    }
                  ),
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] text-on-surface-variant mt-2 font-bold uppercase tracking-widest", children: "Este nombre se usar\xE1 en el t\xEDtulo de la p\xE1gina y en la instalaci\xF3n PWA." })
                ] }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(ImageIcon, { className: "w-5 h-5 text-orange-500" }),
                  "Logos de la Plataforma"
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-8 bg-neutral-50 p-6 rounded-2xl border border-neutral-100", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-neutral-700 mb-2", children: "Logo Principal de la App (Barra superior)" }),
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-on-surface-variant mb-3", children: "Sube o pega la URL de la imagen (debe tener fondo transparente o formato que combine, preferiblemente PNG o SVG)." }),
                    /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-4 mb-4", children: settings.appLogo ? /* @__PURE__ */ jsxs("div", { className: "relative group w-fit", children: [
                      /* @__PURE__ */ jsx("div", { className: "w-64 h-32 bg-white border-2 border-neutral-200 border-dashed rounded-xl overflow-hidden flex items-center justify-center p-4", children: /* @__PURE__ */ jsx(
                        "img",
                        {
                          src: settings.appLogo,
                          alt: "App Logo",
                          className: "max-h-full max-w-full object-contain"
                        }
                      ) }),
                      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                        /* @__PURE__ */ jsx(
                          "input",
                          {
                            type: "file",
                            accept: "image/*",
                            onChange: (e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  setCropper({
                                    isOpen: true,
                                    imageSrc: ev.target?.result,
                                    type: "appLogo",
                                    aspectRatio: 1
                                  });
                                };
                                reader.readAsDataURL(file);
                                e.target.value = "";
                              }
                            },
                            className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          }
                        ),
                        /* @__PURE__ */ jsxs(
                          "button",
                          {
                            type: "button",
                            className: "px-4 py-2 bg-white text-neutral-900 rounded-lg text-sm font-bold flex items-center gap-2",
                            children: [
                              /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4" }),
                              " Cambiar Logo"
                            ]
                          }
                        )
                      ] }) })
                    ] }) : /* @__PURE__ */ jsxs("div", { className: "relative overflow-hidden inline-block group w-full max-w-sm", children: [
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "file",
                          accept: "image/*",
                          onChange: (e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                setCropper({
                                  isOpen: true,
                                  imageSrc: ev.target?.result,
                                  type: "appLogo",
                                  aspectRatio: 1
                                });
                              };
                              reader.readAsDataURL(file);
                              e.target.value = "";
                            }
                          },
                          className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        }
                      ),
                      /* @__PURE__ */ jsxs("div", { className: "w-full border-2 border-dashed border-neutral-300 rounded-xl p-6 group-hover:border-orange-500 group-hover:bg-orange-50 transition-colors flex flex-col items-center justify-center gap-3", children: [
                        /* @__PURE__ */ jsx(Upload, { className: "w-8 h-8 text-on-surface-muted group-hover:text-orange-500" }),
                        /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                          /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-neutral-700 block", children: "Subir desde dispositivo" }),
                          /* @__PURE__ */ jsx("span", { className: "text-xs text-on-surface-variant block mt-1", children: "PNG, JPG o SVG (Recomendado: fondo transparente)" })
                        ] })
                      ] })
                    ] }) })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "pt-6 border-t border-neutral-200", children: [
                    /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-neutral-700 mb-2", children: "Logo para el Splash Screen del Sistema" }),
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-on-surface-variant mb-3", children: "Este logo se utilizar\xE1 al mostrar el Splash por defecto de la aplicaci\xF3n (preferiblemente un logo cuadrado o sim\xE9trico). Si no se proporciona, se usar\xE1 el logo principal de arriba." }),
                    /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-4 mb-4", children: settings.systemSplashLogo ? /* @__PURE__ */ jsxs("div", { className: "relative group w-fit", children: [
                      /* @__PURE__ */ jsx("div", { className: "w-48 h-48 bg-surface-variant border-2 border-neutral-200 border-dashed rounded-[2rem] overflow-hidden flex items-center justify-center p-4", children: /* @__PURE__ */ jsx(
                        "img",
                        {
                          src: settings.systemSplashLogo,
                          alt: "System Splash Logo",
                          className: "max-h-full max-w-full object-contain"
                        }
                      ) }),
                      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[2rem]", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                        /* @__PURE__ */ jsx(
                          "input",
                          {
                            type: "file",
                            accept: "image/*",
                            onChange: (e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  setCropper({
                                    isOpen: true,
                                    imageSrc: ev.target?.result,
                                    type: "splashLogo",
                                    aspectRatio: 1
                                  });
                                };
                                reader.readAsDataURL(file);
                                e.target.value = "";
                              }
                            },
                            className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          }
                        ),
                        /* @__PURE__ */ jsxs(
                          "button",
                          {
                            type: "button",
                            className: "px-4 py-2 bg-white text-neutral-900 rounded-lg text-sm font-bold flex items-center gap-2",
                            children: [
                              /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4" }),
                              " Cambiar"
                            ]
                          }
                        )
                      ] }) })
                    ] }) : /* @__PURE__ */ jsxs("div", { className: "relative overflow-hidden inline-block group w-full max-w-xs", children: [
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "file",
                          accept: "image/*",
                          onChange: (e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                setCropper({
                                  isOpen: true,
                                  imageSrc: ev.target?.result,
                                  type: "splashLogo",
                                  aspectRatio: 1
                                });
                              };
                              reader.readAsDataURL(file);
                              e.target.value = "";
                            }
                          },
                          className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        }
                      ),
                      /* @__PURE__ */ jsxs("div", { className: "w-full aspect-square border-2 border-dashed border-neutral-300 rounded-[2rem] p-6 group-hover:border-orange-500 group-hover:bg-orange-50 transition-colors flex flex-col items-center justify-center gap-3", children: [
                        /* @__PURE__ */ jsx(Upload, { className: "w-8 h-8 text-on-surface-muted group-hover:text-orange-500" }),
                        /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                          /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-neutral-700 block", children: "Subir desde dispositivo" }),
                          /* @__PURE__ */ jsx("span", { className: "text-xs text-on-surface-variant block mt-1", children: "Logo especial para el Splash (cuadrado recomendado)" })
                        ] })
                      ] })
                    ] }) })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "pt-6 border-t border-neutral-200", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
                      /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-neutral-800", children: "Icono Oficial de Instalaci\xF3n PWA (Chrome, Safari, Android, iOS)" }),
                      /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 bg-orange-500/10 text-orange-500 text-[10px] uppercase font-black tracking-widest rounded-full", children: "Actualizador Automatizado" })
                    ] }),
                    /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-700/80 mb-4 leading-relaxed", children: [
                      "Sube desde aqu\xED cualquier imagen (como tu logotipo, trofeo o marca). El sistema procesar\xE1 el archivo en el servidor con ",
                      /* @__PURE__ */ jsx("b", { children: "sharp" }),
                      ", crear\xE1 instant\xE1neamente todas las dimensiones oficiales adaptativas (192px, 512px y m\xE1scara segura), e",
                      " ",
                      /* @__PURE__ */ jsx("b", { children: "incrementar\xE1 la firma del Service Worker / Manifest" }),
                      " ",
                      "para forzar a dispositivos como Google Chrome a recargar el icono e instalar tu App con la imagen correcta."
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "bg-white border text-neutral-800 border-neutral-200 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm", children: [
                      /* @__PURE__ */ jsx("div", { className: "w-24 h-24 bg-neutral-900 border border-neutral-200 rounded-2xl overflow-hidden flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(
                        "img",
                        {
                          src: "/pwa-192x192.png",
                          alt: "Current PWA Icon",
                          className: "w-20 h-20 object-contain rounded-xl",
                          onError: (e) => {
                            e.currentTarget.src = "https://placehold.co/192x192/000000/FFFFFF/png?text=SmartBite";
                          }
                        }
                      ) }),
                      /* @__PURE__ */ jsxs("div", { className: "grow space-y-2", children: [
                        /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-neutral-950", children: "Icono Actual en Servidor" }),
                        /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-600 leading-relaxed", children: "La imagen de la izquierda representa tu icono actual. Sube una nueva para reemplazarla de inmediato de forma global." }),
                        /* @__PURE__ */ jsxs("div", { className: "relative inline-block mt-1", children: [
                          /* @__PURE__ */ jsx(
                            "input",
                            {
                              type: "file",
                              accept: "image/*",
                              onChange: handlePwaIconUpload,
                              disabled: isConvertingPwaIcon,
                              className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                            }
                          ),
                          /* @__PURE__ */ jsxs(
                            "button",
                            {
                              type: "button",
                              disabled: isConvertingPwaIcon,
                              className: "px-4 py-2 bg-orange-500 text-on-surface disabled:opacity-50 text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-orange-600 transition-colors cursor-pointer",
                              children: [
                                /* @__PURE__ */ jsx(Upload, { className: "w-3.5 h-3.5" }),
                                isConvertingPwaIcon ? "Procesando en Servidor..." : "Subir y Regenerar Icono PWA"
                              ]
                            }
                          )
                        ] })
                      ] })
                    ] })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "pt-4 border-t border-neutral-200 flex justify-end", children: /* @__PURE__ */ jsx(
                "button",
                {
                  type: "submit",
                  disabled: isSavingSettings,
                  className: "px-6 py-3 bg-orange-500 text-on-surface rounded-xl font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-2",
                  children: isSavingSettings ? "Guardando..." : "Guardar Configuraci\xF3n"
                }
              ) })
            ]
          }
        ) }),
        activeTab === "payments" && settings && /* @__PURE__ */ jsx("div", { className: "bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden p-6", children: /* @__PURE__ */ jsxs(
          "form",
          {
            onSubmit: handleSaveSettings,
            className: "space-y-8 max-w-3xl",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
                /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black text-neutral-900 mb-2", children: "Pasarelas de Pago de la Plataforma" }),
                /* @__PURE__ */ jsx("p", { className: "text-on-surface-variant text-sm", children: "Configura las credenciales de Nequi, Mercado Pago y PayPal. Estos m\xE9todos de pago son exclusivamente para cobrar planes, suscripciones y comisiones a los restaurantes registrados." })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
                  /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-neutral-900 flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(CreditCard, { className: "w-5 h-5 text-purple-600" }),
                    "Pagos con Nequi"
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-neutral-600", children: "Activar" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "checkbox",
                        checked: settings.paymentGateways?.nequi?.active || false,
                        onChange: (e) => handleUpdatePaymentGateway(
                          "nequi",
                          "active",
                          e.target.checked
                        ),
                        className: "w-5 h-5 accent-orange-500 rounded cursor-pointer"
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-4 bg-neutral-50 p-6 rounded-2xl border border-neutral-100", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-on-surface-variant", children: "Credenciales para la integraci\xF3n con Nequi API (Pagos Push/Pull)." }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-neutral-700 mb-2", children: "Client ID" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "text",
                        value: settings.paymentGateways?.nequi?.clientId || "",
                        onChange: (e) => handleUpdatePaymentGateway(
                          "nequi",
                          "clientId",
                          e.target.value
                        ),
                        className: "w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white text-neutral-900",
                        placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-neutral-700 mb-2", children: "Client Secret" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "password",
                        value: settings.paymentGateways?.nequi?.clientSecret || "",
                        onChange: (e) => handleUpdatePaymentGateway(
                          "nequi",
                          "clientSecret",
                          e.target.value
                        ),
                        className: "w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white text-neutral-900",
                        placeholder: "************************"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-neutral-700 mb-2", children: "API Key" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "password",
                        value: settings.paymentGateways?.nequi?.apiKey || "",
                        onChange: (e) => handleUpdatePaymentGateway(
                          "nequi",
                          "apiKey",
                          e.target.value
                        ),
                        className: "w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white text-neutral-900",
                        placeholder: "************************"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-neutral-700 mb-2", children: "Merchant ID" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "text",
                        value: settings.paymentGateways?.nequi?.merchantId || "",
                        onChange: (e) => handleUpdatePaymentGateway(
                          "nequi",
                          "merchantId",
                          e.target.value
                        ),
                        className: "w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white text-neutral-900",
                        placeholder: "Ej. ID de tu comercio en Nequi"
                      }
                    )
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
                  /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-neutral-900 flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(CreditCard, { className: "w-5 h-5 text-blue-500" }),
                    "Mercado Pago"
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-neutral-600", children: "Activar" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "checkbox",
                        checked: settings.paymentGateways?.mercadoPago?.active || false,
                        onChange: (e) => handleUpdatePaymentGateway(
                          "mercadoPago",
                          "active",
                          e.target.checked
                        ),
                        className: "w-5 h-5 accent-orange-500 rounded cursor-pointer"
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-4 bg-neutral-50 p-6 rounded-2xl border border-neutral-100", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-on-surface-variant", children: "Credenciales de producci\xF3n para procesar pagos con tarjeta y saldo de Mercado Pago." }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-neutral-700 mb-2", children: "Public Key" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "text",
                        value: settings.paymentGateways?.mercadoPago?.publicKey || "",
                        onChange: (e) => handleUpdatePaymentGateway(
                          "mercadoPago",
                          "publicKey",
                          e.target.value
                        ),
                        className: "w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white text-neutral-900",
                        placeholder: "APP_USR-xxxx-xxxx-xxxx-xxxx"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-neutral-700 mb-2", children: "Access Token" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "password",
                        value: settings.paymentGateways?.mercadoPago?.accessToken || "",
                        onChange: (e) => handleUpdatePaymentGateway(
                          "mercadoPago",
                          "accessToken",
                          e.target.value
                        ),
                        className: "w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white text-neutral-900",
                        placeholder: "APP_USR-xxxxxxxxxxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxx"
                      }
                    )
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
                  /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-neutral-900 flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(CreditCard, { className: "w-5 h-5 text-blue-800" }),
                    "PayPal"
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-neutral-600", children: "Activar" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "checkbox",
                        checked: settings.paymentGateways?.paypal?.active || false,
                        onChange: (e) => handleUpdatePaymentGateway(
                          "paypal",
                          "active",
                          e.target.checked
                        ),
                        className: "w-5 h-5 accent-orange-500 rounded cursor-pointer"
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-4 bg-neutral-50 p-6 rounded-2xl border border-neutral-100", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-on-surface-variant", children: "Credenciales de REST API de PayPal." }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-neutral-700 mb-2", children: "Client ID" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "text",
                        value: settings.paymentGateways?.paypal?.clientId || "",
                        onChange: (e) => handleUpdatePaymentGateway(
                          "paypal",
                          "clientId",
                          e.target.value
                        ),
                        className: "w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white text-neutral-900"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-neutral-700 mb-2", children: "Secret" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "password",
                        value: settings.paymentGateways?.paypal?.secret || "",
                        onChange: (e) => handleUpdatePaymentGateway(
                          "paypal",
                          "secret",
                          e.target.value
                        ),
                        className: "w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white text-neutral-900"
                      }
                    )
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5 text-orange-500" }),
                  "Facturaci\xF3n y Ciclos de Corte"
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 bg-neutral-50 p-6 rounded-2xl border border-neutral-100", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-neutral-700 mb-2", children: "D\xEDa de Corte Mensual (Planes)" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "number",
                        min: "1",
                        max: "28",
                        value: settings.billingCutDay || 1,
                        onChange: (e) => setSettings({
                          ...settings,
                          billingCutDay: parseInt(e.target.value)
                        }),
                        className: "w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white text-neutral-900"
                      }
                    ),
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] text-on-surface-muted mt-2 font-bold uppercase tracking-widest", children: "D\xEDa del mes para generar facturas de suscripci\xF3n" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-neutral-700 mb-2", children: "Ciclo de Comisiones" }),
                    /* @__PURE__ */ jsxs(
                      "select",
                      {
                        value: settings.commissionCycle || "weekly",
                        onChange: (e) => setSettings({
                          ...settings,
                          commissionCycle: e.target.value
                        }),
                        className: "w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white text-neutral-900",
                        children: [
                          /* @__PURE__ */ jsx("option", { value: "weekly", children: "Semanal (7 d\xEDas)" }),
                          /* @__PURE__ */ jsx("option", { value: "biweekly", children: "Quincenal (15 d\xEDas)" }),
                          /* @__PURE__ */ jsx("option", { value: "monthly", children: "Mensual (30 d\xEDas)" })
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] text-on-surface-muted mt-2 font-bold uppercase tracking-widest", children: "Frecuencia de consolidaci\xF3n de comisiones" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "pt-4 border-t border-neutral-200 flex justify-end", children: /* @__PURE__ */ jsx(
                "button",
                {
                  type: "submit",
                  disabled: isSavingSettings,
                  className: "px-6 py-3 bg-orange-500 text-on-surface rounded-xl font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-2",
                  children: isSavingSettings ? "Guardando..." : "Guardar Credenciales"
                }
              ) })
            ]
          }
        ) }),
        activeTab === "music" && /* @__PURE__ */ jsx("div", { className: "bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden p-8 animate-in fade-in slide-in-from-bottom-4 duration-700", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl space-y-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
            /* @__PURE__ */ jsxs("h2", { className: "text-3xl font-black text-neutral-900 tracking-tight flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(Music, { className: "w-8 h-8 text-orange-500" }),
              "M\xFAsica de Fondo"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-on-surface-variant font-medium max-w-2xl", children: "Configura y cambia la m\xFAsica de fondo que ambienta la experiencia de toda tu plataforma en tiempo real. Sube un archivo de audio liviano (MP3 o WAV)." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-orange-50/50 border border-orange-100 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxs("h4", { className: "text-base font-black text-neutral-900 tracking-tight flex items-center gap-2", children: [
                settings?.hideMusicPlayer ? /* @__PURE__ */ jsx(EyeOff, { className: "w-5 h-5 text-neutral-500" }) : /* @__PURE__ */ jsx(Eye, { className: "w-5 h-5 text-orange-500" }),
                "Reproductor de M\xFAsica Flotante"
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-600 font-medium", children: settings?.hideMusicPlayer ? "El bot\xF3n reproductor de m\xFAsica est\xE1 actualmente oculto para todos los clientes." : "El bot\xF3n flotante para pausar/reproducir la m\xFAsica es visible para los clientes." })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: handleToggleHideMusic,
                className: `relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings?.hideMusicPlayer ? "bg-neutral-300" : "bg-orange-500"}`,
                children: /* @__PURE__ */ jsx(
                  "span",
                  {
                    className: `pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${settings?.hideMusicPlayer ? "translate-x-0" : "translate-x-5"}`
                  }
                )
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [
            /* @__PURE__ */ jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsxs("div", { className: "relative h-64 w-full border-2 border-dashed border-neutral-300 rounded-[2rem] p-8 hover:border-orange-500 hover:bg-orange-50/50 transition-all flex flex-col items-center justify-center gap-4 overflow-hidden group", children: [
              isUploadingMusic && /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 bg-white/90 z-40 rounded-[2rem] flex flex-col items-center justify-center backdrop-blur-sm", children: [
                /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mb-2" }),
                /* @__PURE__ */ jsx("div", { className: "w-1/2 bg-neutral-200 rounded-full h-1.5 overflow-hidden shadow-inner mb-2", children: /* @__PURE__ */ jsx(
                  motion.div,
                  {
                    initial: { width: 0 },
                    animate: { width: `${uploadProgress}%` },
                    className: "h-full bg-orange-500"
                  }
                ) }),
                /* @__PURE__ */ jsx("span", { className: "text-xs font-black text-orange-600 uppercase tracking-widest", children: uploadProgress < 100 ? `Subiendo... ${uploadProgress}%` : "Procesando..." })
              ] }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "music-upload-field",
                  ref: musicInputRef,
                  type: "file",
                  accept: "audio/*",
                  onChange: handleMusicUpload,
                  onClick: (e) => {
                    e.target.value = "";
                  },
                  className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-[40]"
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-orange-50 text-orange-600 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300", children: /* @__PURE__ */ jsx(Music, { className: "w-8 h-8" }) }),
              /* @__PURE__ */ jsxs("div", { className: "text-center pointer-events-none", children: [
                /* @__PURE__ */ jsx("span", { className: "text-lg font-black text-neutral-900 block tracking-tight", children: "Sube un Nuevo Audio de Fondo" }),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] text-neutral-400 block mt-1 uppercase tracking-widest font-bold", children: "MP3 / WAV \u2022 Recomendado menos de 5MB" }),
                /* @__PURE__ */ jsx("div", { className: "mt-4 bg-orange-500 text-white text-[10px] font-black uppercase px-6 py-2.5 rounded-full shadow-lg shadow-orange-200 group-hover:bg-orange-600 transition-colors inline-block", children: "Seleccionar Archivo" })
              ] })
            ] }) }),
            /* @__PURE__ */ jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsxs("div", { className: "bg-neutral-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl", children: [
              /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 p-8 opacity-10", children: /* @__PURE__ */ jsx(Volume2, { className: "w-24 h-24" }) }),
              /* @__PURE__ */ jsx("h3", { className: "text-xl font-black uppercase tracking-tighter mb-4 relative z-10", children: "Estado del Audio" }),
              settings?.backgroundMusicUrl ? /* @__PURE__ */ jsxs("div", { className: "space-y-6 relative z-10", children: [
                /* @__PURE__ */ jsxs("div", { className: "bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-3", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black text-orange-400 uppercase tracking-widest", children: "Se\xF1al Activa de Fondo" }),
                    /* @__PURE__ */ jsx("div", { className: "flex gap-1 items-end h-3", children: [1, 2, 3, 4].map((i) => /* @__PURE__ */ jsx(
                      motion.div,
                      {
                        animate: { height: [4, 12, 6, 10, 4] },
                        transition: {
                          repeat: Infinity,
                          duration: 0.8,
                          delay: i * 0.15,
                          ease: "easeInOut"
                        },
                        className: "w-0.5 bg-orange-500 rounded-full"
                      },
                      i
                    )) })
                  ] }),
                  /* @__PURE__ */ jsx(
                    "audio",
                    {
                      src: settings.backgroundMusicUrl,
                      controls: true,
                      className: "w-full h-8 invert opacity-85 mt-2",
                      onError: (e) => {
                        console.warn(
                          "PlatformAdmin: Active settings audio failed to load gracefully."
                        );
                        e.currentTarget.removeAttribute("src");
                        e.currentTarget.load();
                      }
                    },
                    settings.backgroundMusicUrl
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: handleClearMusic,
                      className: "w-full py-3 px-4 bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all text-center relative z-10 flex items-center justify-center gap-2 border border-red-500/20",
                      children: [
                        /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }),
                        "Quitar M\xFAsica de Fondo Activa"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs("div", { className: "border-t border-white/10 pt-4", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2", children: "Informaci\xF3n del Sistema" }),
                    /* @__PURE__ */ jsxs("ul", { className: "text-xs text-white/70 space-y-2", children: [
                      /* @__PURE__ */ jsxs("li", { className: "flex gap-3", children: [
                        /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 shrink-0" }),
                        /* @__PURE__ */ jsx("span", { children: "Al subir m\xFAsica, se reproduce autom\xE1ticamente de fondo para tus clientes." })
                      ] }),
                      /* @__PURE__ */ jsxs("li", { className: "flex gap-3", children: [
                        /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 shrink-0" }),
                        /* @__PURE__ */ jsx("span", { children: "Los clientes pueden silenciar o pausar el audio desde el bot\xF3n flotante." })
                      ] })
                    ] })
                  ] })
                ] })
              ] }) : /* @__PURE__ */ jsxs("div", { className: "py-8 text-center relative z-10", children: [
                /* @__PURE__ */ jsx(VolumeX, { className: "w-12 h-12 text-white/20 mx-auto mb-4 animate-pulse" }),
                /* @__PURE__ */ jsx("p", { className: "text-white/40 text-sm font-medium", children: "No hay ninguna pista configurada." }),
                /* @__PURE__ */ jsx("p", { className: "text-neutral-500 text-xs mt-1", children: "Sube un archivo de audio para activar el sonido ambiental." })
              ] })
            ] }) })
          ] })
        ] }) }),
        selectedDriver && /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[100] flex items-center justify-center p-4", children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "absolute inset-0 bg-black/60 backdrop-blur-sm",
              onClick: () => setSelectedDriver(null)
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col", children: [
            /* @__PURE__ */ jsxs("div", { className: "p-8 border-b border-neutral-100 flex justify-between items-center", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center", children: /* @__PURE__ */ jsx(Truck, { className: "w-6 h-6 text-orange-600" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h3", { className: "text-2xl font-black text-neutral-900", children: "Documentaci\xF3n del Repartidor" }),
                  /* @__PURE__ */ jsxs("p", { className: "text-sm font-bold text-on-surface-muted", children: [
                    (Array.isArray(selectedDriver.app_users) ? selectedDriver.app_users[0] : selectedDriver.app_users)?.display_name,
                    " ",
                    "\u2022",
                    " ",
                    (Array.isArray(selectedDriver.app_users) ? selectedDriver.app_users[0] : selectedDriver.app_users)?.email
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setSelectedDriver(null),
                  className: "p-2 hover:bg-neutral-100 rounded-full transition-colors",
                  children: /* @__PURE__ */ jsx(X, { className: "w-6 h-6 text-on-surface-muted" })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-8 overflow-y-auto space-y-8", children: [
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black text-on-surface-muted uppercase tracking-widest", children: "Foto de Perfil" }),
                  /* @__PURE__ */ jsx("div", { className: "aspect-square rounded-2xl overflow-hidden border-4 border-neutral-50 shadow-inner bg-neutral-100", children: selectedDriver.profile_photo ? /* @__PURE__ */ jsx(
                    "img",
                    {
                      src: selectedDriver.profile_photo,
                      alt: "Perfil",
                      className: "w-full h-full object-cover",
                      referrerPolicy: "no-referrer"
                    }
                  ) : /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center text-on-surface-variant", children: "Sin foto" }) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black text-on-surface-muted uppercase tracking-widest", children: "C\xE9dula / Documento" }),
                  /* @__PURE__ */ jsx("div", { className: "aspect-[4/3] rounded-2xl overflow-hidden border-4 border-neutral-50 shadow-inner bg-neutral-100", children: selectedDriver.document_photo ? /* @__PURE__ */ jsx(
                    "img",
                    {
                      src: selectedDriver.document_photo,
                      alt: "C\xE9dula",
                      className: "w-full h-full object-cover",
                      referrerPolicy: "no-referrer"
                    }
                  ) : /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center text-on-surface-variant", children: "Sin foto" }) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black text-on-surface-muted uppercase tracking-widest", children: "Licencia de Conducci\xF3n" }),
                  /* @__PURE__ */ jsx("div", { className: "aspect-[4/3] rounded-2xl overflow-hidden border-4 border-neutral-50 shadow-inner bg-neutral-100", children: selectedDriver.license_photo ? /* @__PURE__ */ jsx(
                    "img",
                    {
                      src: selectedDriver.license_photo,
                      alt: "Licencia",
                      className: "w-full h-full object-cover",
                      referrerPolicy: "no-referrer"
                    }
                  ) : /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center text-on-surface-variant", children: "Sin foto" }) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black text-on-surface-muted uppercase tracking-widest", children: "Tecnomec\xE1nica (Opcional)" }),
                  /* @__PURE__ */ jsx("div", { className: "aspect-[4/3] rounded-2xl overflow-hidden border-4 border-neutral-50 shadow-inner bg-neutral-100", children: selectedDriver.tecnomecanica_photo ? /* @__PURE__ */ jsx(
                    "img",
                    {
                      src: selectedDriver.tecnomecanica_photo,
                      alt: "Tecnomec\xE1nica",
                      className: "w-full h-full object-cover",
                      referrerPolicy: "no-referrer"
                    }
                  ) : /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center text-on-surface-variant", children: "No cargada" }) })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-neutral-50 p-6 rounded-2xl border border-neutral-100 grid grid-cols-2 md:grid-cols-4 gap-6", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-1", children: "Documento" }),
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-neutral-900", children: selectedDriver.document_number || "N/A" })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-1", children: "Fecha Nacimiento" }),
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-neutral-900", children: selectedDriver.birth_date || "N/A" })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-1", children: "Veh\xEDculo" }),
                  /* @__PURE__ */ jsxs("p", { className: "font-bold text-neutral-900 capitalize", children: [
                    selectedDriver.vehicle_type,
                    " -",
                    " ",
                    selectedDriver.vehicle_color || "N/A"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-1", children: "Placa" }),
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-neutral-900", children: selectedDriver.license_plate || "N/A" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-8 border-t border-neutral-100 bg-neutral-50 flex justify-end gap-3", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => handleUpdateDriverApproval(
                    selectedDriver.id,
                    "rejected"
                  ),
                  className: "px-8 py-3 bg-rose-50 text-rose-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-rose-100 transition-all",
                  children: "Rechazar"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => handleUpdateDriverApproval(
                    selectedDriver.id,
                    "approved"
                  ),
                  className: "px-8 py-3 bg-emerald-500 text-on-surface rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200",
                  children: "Aprobar Repartidor"
                }
              )
            ] })
          ] })
        ] }),
        editingRestaurant && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl p-6 w-full max-w-md", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold mb-4", children: "Configuraci\xF3n de Restaurante" }),
          /* @__PURE__ */ jsxs("p", { className: "text-neutral-600 mb-6 text-sm", children: [
            "Editando:",
            " ",
            /* @__PURE__ */ jsx("span", { className: "font-bold", children: editingRestaurant.name })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-neutral-700 mb-2", children: "Porcentaje de Comisi\xF3n (%)" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    min: "5",
                    max: "100",
                    value: editingRestaurant.commissionRate || 5,
                    onChange: (e) => setEditingRestaurant({
                      ...editingRestaurant,
                      commissionRate: Number(e.target.value)
                    }),
                    className: "flex-1 p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none font-bold bg-white text-neutral-900"
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "text-on-surface-variant font-bold", children: "%" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-[10px] text-on-surface-muted mt-2 uppercase tracking-widest font-bold", children: "M\xEDnimo sugerido: 5%" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "checkbox",
                  id: "isFeatured",
                  checked: !!editingRestaurant.isFeatured,
                  onChange: (e) => {
                    const isFeatured = e.target.checked;
                    setEditingRestaurant({
                      ...editingRestaurant,
                      isFeatured,
                      commissionRate: isFeatured ? 10 : editingRestaurant.commissionRate
                    });
                  },
                  className: "w-5 h-5 accent-amber-500"
                }
              ),
              /* @__PURE__ */ jsxs(
                "label",
                {
                  htmlFor: "isFeatured",
                  className: "flex-1 cursor-pointer",
                  children: [
                    /* @__PURE__ */ jsx("span", { className: "block text-sm font-bold text-amber-900", children: "Restaurante Destacado" }),
                    /* @__PURE__ */ jsx("span", { className: "block text-[10px] text-amber-700 uppercase tracking-wider font-bold", children: "Aplica comisi\xF3n del 10%" })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-3 justify-end pt-4", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setEditingRestaurant(null),
                  className: "px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-xl font-medium transition-colors",
                  children: "Cancelar"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: async () => {
                    try {
                      await db.updateRestaurant(editingRestaurant.id, {
                        commissionRate: editingRestaurant.commissionRate,
                        isFeatured: editingRestaurant.isFeatured
                      });
                      toast.success("Configuraci\xF3n actualizada");
                      setEditingRestaurant(null);
                      fetchData();
                    } catch (err) {
                      toast.error("Error al actualizar");
                    }
                  },
                  className: "px-4 py-2 bg-orange-500 text-on-surface rounded-xl font-medium hover:bg-orange-600 transition-colors",
                  children: "Guardar Cambios"
                }
              )
            ] })
          ] })
        ] }) }),
        editingCoupon && /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[100] flex items-center justify-center p-4", children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "absolute inset-0 bg-black/60 backdrop-blur-sm",
              onClick: () => setEditingCoupon(null)
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden", children: [
            /* @__PURE__ */ jsxs("div", { className: "p-8 border-b border-neutral-100 flex justify-between items-center", children: [
              /* @__PURE__ */ jsx("h3", { className: "text-2xl font-black text-neutral-900", children: editingCoupon.id ? "Editar Cup\xF3n" : "Nuevo Cup\xF3n" }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setEditingCoupon(null),
                  className: "p-2 hover:bg-neutral-100 rounded-full transition-colors",
                  children: /* @__PURE__ */ jsx(X, { className: "w-6 h-6 text-on-surface-muted" })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("form", { onSubmit: handleSaveCoupon, className: "p-8 space-y-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2", children: "Restaurante (Opcional - Vac\xEDo para toda la plataforma)" }),
                  /* @__PURE__ */ jsxs(
                    "select",
                    {
                      value: editingCoupon.restaurantId || "",
                      onChange: (e) => setEditingCoupon({
                        ...editingCoupon,
                        restaurantId: e.target.value || void 0
                      }),
                      className: "w-full px-4 py-3 bg-neutral-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none font-bold transition-all text-neutral-900",
                      children: [
                        /* @__PURE__ */ jsx("option", { value: "", children: "Toda la plataforma" }),
                        restaurants.map((r) => /* @__PURE__ */ jsx("option", { value: r.id, children: r.name }, r.id))
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2", children: "C\xF3digo del Cup\xF3n" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      value: editingCoupon.code,
                      onChange: (e) => setEditingCoupon({
                        ...editingCoupon,
                        code: e.target.value.toUpperCase()
                      }),
                      className: "w-full px-4 py-3 bg-neutral-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none font-bold transition-all text-neutral-900",
                      placeholder: "EJ: BIENVENIDO50",
                      required: true
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2", children: "Tipo de Descuento" }),
                  /* @__PURE__ */ jsxs(
                    "select",
                    {
                      value: editingCoupon.discountType,
                      onChange: (e) => setEditingCoupon({
                        ...editingCoupon,
                        discountType: e.target.value
                      }),
                      className: "w-full px-4 py-3 bg-neutral-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none font-bold transition-all text-neutral-900",
                      children: [
                        /* @__PURE__ */ jsx("option", { value: "percentage", children: "Porcentaje (%)" }),
                        /* @__PURE__ */ jsx("option", { value: "fixed", children: "Monto Fijo ($)" })
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2", children: "Valor" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      value: editingCoupon.value === 0 ? "" : editingCoupon.value || "",
                      onChange: (e) => setEditingCoupon({
                        ...editingCoupon,
                        value: e.target.value ? Number(e.target.value) : 0
                      }),
                      className: "w-full px-4 py-3 bg-neutral-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none font-bold transition-all text-neutral-900",
                      required: true
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2", children: "M\xEDn. Pedido" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      value: editingCoupon.minOrderAmount === 0 ? "" : editingCoupon.minOrderAmount || "",
                      onChange: (e) => setEditingCoupon({
                        ...editingCoupon,
                        minOrderAmount: e.target.value ? Number(e.target.value) : 0
                      }),
                      className: "w-full px-4 py-3 bg-neutral-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none font-bold transition-all text-neutral-900"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2", children: "L\xEDmite de Usos" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      value: editingCoupon.usageLimit || "",
                      onChange: (e) => setEditingCoupon({
                        ...editingCoupon,
                        usageLimit: e.target.value ? Number(e.target.value) : void 0
                      }),
                      className: "w-full px-4 py-3 bg-neutral-50 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none font-bold transition-all text-neutral-900",
                      placeholder: "Ilimitado"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2", children: "Fecha Inicio" }),
                  /* @__PURE__ */ jsx(
                    DateSelector,
                    {
                      value: editingCoupon.startDate ? editingCoupon.startDate.split("T")[0] : "",
                      onChange: (val) => setEditingCoupon({
                        ...editingCoupon,
                        startDate: val
                      })
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2", children: "Fecha Fin" }),
                  /* @__PURE__ */ jsx(
                    DateSelector,
                    {
                      value: editingCoupon.endDate ? editingCoupon.endDate.split("T")[0] : "",
                      onChange: (val) => setEditingCoupon({ ...editingCoupon, endDate: val })
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx("div", { className: "col-span-2", children: /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-3 p-4 bg-neutral-50 rounded-2xl cursor-pointer hover:bg-neutral-100 transition-colors", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "checkbox",
                      checked: editingCoupon.active,
                      onChange: (e) => setEditingCoupon({
                        ...editingCoupon,
                        active: e.target.checked
                      }),
                      className: "w-5 h-5 accent-orange-500"
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-neutral-700", children: "Cup\xF3n Activo" })
                ] }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-4 pt-4", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setEditingCoupon(null),
                    className: "flex-1 py-4 bg-neutral-100 text-on-surface-variant font-black rounded-2xl hover:bg-neutral-200 transition-all",
                    children: "Cancelar"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "submit",
                    className: "flex-1 py-4 bg-orange-500 text-on-surface font-black rounded-2xl shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all",
                    children: "Guardar Cup\xF3n"
                  }
                )
              ] })
            ] })
          ] })
        ] }),
        editingUser && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl p-6 w-full max-w-md", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold mb-4", children: "Editar Rol de Usuario" }),
          /* @__PURE__ */ jsxs("p", { className: "text-neutral-600 mb-4 text-sm", children: [
            "Usuario:",
            " ",
            /* @__PURE__ */ jsx("span", { className: "font-bold", children: editingUser.email })
          ] }),
          /* @__PURE__ */ jsxs("form", { onSubmit: handleSaveUserRole, children: [
            /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-neutral-700 mb-2", children: "Seleccionar Rol" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: editingUser.role,
                  onChange: (e) => setEditingUser({
                    ...editingUser,
                    role: e.target.value
                  }),
                  className: "w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white text-neutral-900",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "user", children: "Usuario (Cliente)" }),
                    /* @__PURE__ */ jsx("option", { value: "restaurant", children: "Restaurante" }),
                    /* @__PURE__ */ jsx("option", { value: "driver", children: "Repartidor" }),
                    /* @__PURE__ */ jsx("option", { value: "admin", children: "Administrador" })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-3 justify-end", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setEditingUser(null),
                  className: "px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-xl font-medium transition-colors",
                  children: "Cancelar"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "submit",
                  className: "px-4 py-2 bg-orange-500 text-on-surface rounded-xl font-medium hover:bg-orange-600 transition-colors",
                  children: "Guardar Cambios"
                }
              )
            ] })
          ] })
        ] }) }),
        activeTab === "billing" && /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-3xl shadow-xl border border-neutral-100 overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-8 border-b border-neutral-100 flex justify-between items-center", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black text-neutral-900 tracking-tight", children: "Facturaci\xF3n" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-on-surface-muted uppercase tracking-widest mt-1", children: "Historial de cobros a restaurantes" })
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: async () => {
                  const btn = document.activeElement;
                  if (btn) btn.disabled = true;
                  toast.loading("Ejecutando motor de facturaci\xF3n...");
                  await runBillingEngine();
                  await fetchData();
                  if (btn) btn.disabled = false;
                },
                className: "bg-surface-variant text-on-surface px-6 py-3 rounded-2xl font-black text-sm transition-all flex items-center gap-3 shadow-lg shadow-neutral-200 hover:scale-105 active:scale-95",
                children: [
                  /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5 text-orange-500" }),
                  "Procesar Cortes"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-neutral-50", children: [
              /* @__PURE__ */ jsx("th", { className: "px-8 py-4 text-[10px] font-black text-on-surface-muted uppercase tracking-widest", children: "Restaurante" }),
              /* @__PURE__ */ jsx("th", { className: "px-8 py-4 text-[10px] font-black text-on-surface-muted uppercase tracking-widest", children: "Concepto" }),
              /* @__PURE__ */ jsx("th", { className: "px-8 py-4 text-[10px] font-black text-on-surface-muted uppercase tracking-widest", children: "Monto" }),
              /* @__PURE__ */ jsx("th", { className: "px-8 py-4 text-[10px] font-black text-on-surface-muted uppercase tracking-widest", children: "Fecha L\xEDmite" }),
              /* @__PURE__ */ jsx("th", { className: "px-8 py-4 text-[10px] font-black text-on-surface-muted uppercase tracking-widest", children: "Estado" }),
              /* @__PURE__ */ jsx("th", { className: "px-8 py-4 text-[10px] font-black text-on-surface-muted uppercase tracking-widest", children: "Acciones" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-neutral-100", children: invoices.length > 0 ? invoices.map((invoice) => {
              const restaurant = restaurants.find(
                (r) => r.id === invoice.restaurantId
              );
              return /* @__PURE__ */ jsxs(
                "tr",
                {
                  className: "hover:bg-neutral-50/50 transition-colors",
                  children: [
                    /* @__PURE__ */ jsxs("td", { className: "px-8 py-6", children: [
                      /* @__PURE__ */ jsx("p", { className: "font-bold text-neutral-900", children: restaurant?.name || "Desconocido" }),
                      /* @__PURE__ */ jsx("p", { className: "text-xs text-on-surface-variant", children: restaurant?.city })
                    ] }),
                    /* @__PURE__ */ jsx("td", { className: "px-8 py-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsx(
                        "span",
                        {
                          className: `w-2 h-2 rounded-full ${invoice.type === "subscription" ? "bg-blue-500" : "bg-purple-500"}`
                        }
                      ),
                      /* @__PURE__ */ jsx("p", { className: "font-bold text-neutral-700", children: invoice.description })
                    ] }) }),
                    /* @__PURE__ */ jsx("td", { className: "px-8 py-6", children: /* @__PURE__ */ jsx("p", { className: "font-black text-neutral-900", children: formatCurrency(invoice.amount) }) }),
                    /* @__PURE__ */ jsx("td", { className: "px-8 py-6", children: /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-neutral-600", children: new Date(invoice.dueDate).toLocaleDateString(
                      "es-CO",
                      { day: "numeric", month: "short" }
                    ) }) }),
                    /* @__PURE__ */ jsx("td", { className: "px-8 py-6", children: /* @__PURE__ */ jsx(
                      "span",
                      {
                        className: `px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${invoice.status === "paid" ? "bg-green-100 text-green-700" : invoice.status === "failed" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`,
                        children: invoice.status === "paid" ? "Pagado" : invoice.status === "failed" ? "Fallido" : "Pendiente"
                      }
                    ) }),
                    /* @__PURE__ */ jsxs("td", { className: "px-8 py-6 flex gap-2", children: [
                      invoice.status === "pending" && /* @__PURE__ */ jsx(
                        "button",
                        {
                          onClick: async () => {
                            if (confirm(
                              "\xBFConfirmar que este restaurante ya pag\xF3 esta factura manualmente?"
                            )) {
                              await db.updatePlatformInvoiceStatus(
                                invoice.id,
                                "paid",
                                "Confirmado manualmente por Admin"
                              );
                              toast.success(
                                "Factura marcada como pagada"
                              );
                              fetchData();
                            }
                          },
                          className: "p-2 hover:bg-green-50 rounded-xl transition-colors group",
                          title: "Confirmar Pago Manual",
                          children: /* @__PURE__ */ jsx(CheckCircle2, { className: "w-5 h-5 text-on-surface-muted group-hover:text-green-500" })
                        }
                      ),
                      /* @__PURE__ */ jsx("button", { className: "p-2 hover:bg-neutral-200 rounded-xl transition-colors", children: /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5 text-on-surface-muted" }) })
                    ] })
                  ]
                },
                invoice.id
              );
            }) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx(
              "td",
              {
                colSpan: 6,
                className: "px-8 py-12 text-center text-on-surface-variant font-bold",
                children: "No hay facturas registradas"
              }
            ) }) })
          ] }) })
        ] }),
        deleteConfirm && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-4 text-red-600", children: [
            /* @__PURE__ */ jsx("div", { className: "p-3 bg-red-100 rounded-full", children: /* @__PURE__ */ jsx(AlertTriangle, { className: "w-6 h-6" }) }),
            /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold", children: "\xBFConfirmar eliminaci\xF3n?" })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-neutral-600 mb-6 leading-relaxed", children: [
            "Est\xE1s a punto de eliminar",
            " ",
            deleteConfirm.type === "user" ? "al usuario" : "el restaurante",
            ":",
            /* @__PURE__ */ jsxs("span", { className: "font-black text-neutral-900 block mt-1", children: [
              '"',
              deleteConfirm.name,
              '"'
            ] }),
            deleteConfirm.type === "restaurant" && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-500 font-bold mt-2 block", children: "* Esta acci\xF3n eliminar\xE1 permanentemente todos los productos, categor\xEDas y pedidos asociados." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-3 justify-end", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setDeleteConfirm(null),
                className: "px-6 py-3 text-neutral-600 hover:bg-neutral-100 rounded-xl font-bold transition-colors",
                children: "Cancelar"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => deleteConfirm.type === "user" ? handleDeleteUser(deleteConfirm.id) : handleDeleteRestaurant(deleteConfirm.id),
                className: "px-6 py-3 bg-red-600 text-on-surface rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20",
                children: "Eliminar Permanentemente"
              }
            )
          ] })
        ] }) }),
        cropper && /* @__PURE__ */ jsx(
          ImageCropperModal,
          {
            isOpen: cropper.isOpen,
            imageSrc: cropper.imageSrc,
            onClose: () => setCropper(null),
            onCropComplete: handleCropComplete,
            aspectRatio: cropper.aspectRatio,
            cropWidth: cropper.cropWidth,
            cropHeight: cropper.cropHeight
          }
        ),
        auditingRestaurant && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70] overflow-y-auto text-left", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-3xl p-6 w-full max-w-xl shadow-2xl space-y-6 text-left my-8 border border-neutral-200", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start pb-3 border-b border-neutral-100", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("h2", { className: "text-lg font-black text-neutral-950 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Sparkles, { className: "w-5 h-5 text-[#FF8A00] animate-pulse" }),
                "Auditor\xEDa y Aprobaci\xF3n de Publicaci\xF3n"
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-500 font-bold mt-0.5", children: [
                "Establecimiento: ",
                /* @__PURE__ */ jsx("span", { className: "text-neutral-900 font-extrabold", children: auditingRestaurant.name })
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setAuditingRestaurant(null),
                className: "p-1.5 rounded-full text-neutral-400 hover:text-neutral-600 transition-colors",
                children: "\u2715"
              }
            )
          ] }),
          auditingLoading || !auditChecklist ? /* @__PURE__ */ jsxs("div", { className: "py-20 text-center text-sm font-bold text-neutral-400 flex flex-col items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full border-4 border-[#FF8A00] border-t-transparent animate-spin" }),
            "Calculando m\xE9tricas de auditor\xEDa en tiempo real..."
          ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "p-4 bg-orange-50 rounded-2xl border border-orange-100 text-xs font-semibold text-neutral-700 leading-relaxed", children: [
              /* @__PURE__ */ jsx("span", { className: "text-orange-650 font-black uppercase text-[10px] block mb-1", children: "\u{1F50D} DIAGN\xD3STICO DEL SISTEMA" }),
              "Este m\xF3dulo verifica que el restaurante afiliado por el embajador cumpla rigurosamente con los requerimientos t\xE9cnicos y funcionales antes de publicarse en la p\xE1gina principal, evitando fallos en la experiencia del usuario final."
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3.5", children: [
              /* @__PURE__ */ jsxs("div", { className: "p-3 bg-neutral-50 border border-neutral-150 rounded-2xl flex items-start gap-2.5", children: [
                /* @__PURE__ */ jsx("div", { className: "mt-0.5", children: auditChecklist.hasLogo ? /* @__PURE__ */ jsx(CheckCircle, { className: "w-5 h-5 text-emerald-500" }) : /* @__PURE__ */ jsx(AlertTriangle, { className: "w-5 h-5 text-amber-500" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h4", { className: "text-[11px] font-black text-neutral-900 uppercase", children: "Logo de Identidad" }),
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] text-neutral-500 font-bold leading-normal mt-0.5", children: auditChecklist.hasLogo ? "\u2713 Logo v\xE1lido configurado" : "\u26A0\uFE0F Logo ausente o placeholder" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "p-3 bg-neutral-50 border border-neutral-150 rounded-2xl flex items-start gap-2.5", children: [
                /* @__PURE__ */ jsx("div", { className: "mt-0.5", children: auditChecklist.hasCover ? /* @__PURE__ */ jsx(CheckCircle, { className: "w-5 h-5 text-emerald-500" }) : /* @__PURE__ */ jsx(AlertTriangle, { className: "w-5 h-5 text-amber-500" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h4", { className: "text-[11px] font-black text-neutral-900 uppercase", children: "Fondo de Cabecera" }),
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] text-neutral-500 font-bold leading-normal mt-0.5", children: auditChecklist.hasCover ? "\u2713 Banner premium cargado" : "\u26A0\uFE0F Imagen de fondo no definida" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "p-3 bg-neutral-50 border border-neutral-150 rounded-2xl flex items-start gap-2.5", children: [
                /* @__PURE__ */ jsx("div", { className: "mt-0.5", children: auditChecklist.hasAddress ? /* @__PURE__ */ jsx(CheckCircle, { className: "w-5 h-5 text-emerald-500" }) : /* @__PURE__ */ jsx(AlertTriangle, { className: "w-5 h-5 text-amber-500" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h4", { className: "text-[11px] font-black text-neutral-900 uppercase", children: "Direcci\xF3n F\xEDsica" }),
                  /* @__PURE__ */ jsx("div", { className: "text-[10px] text-neutral-500 font-bold leading-normal mt-0.5 truncate max-w-[170px]", children: auditChecklist.hasAddress ? `\u2713 ${auditingRestaurant.address}` : "\u26A0\uFE0F Direcci\xF3n sin configurar" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "p-3 bg-neutral-50 border border-neutral-150 rounded-2xl flex items-start gap-2.5", children: [
                /* @__PURE__ */ jsx("div", { className: "mt-0.5", children: auditChecklist.hasHours ? /* @__PURE__ */ jsx(CheckCircle, { className: "w-5 h-5 text-emerald-500" }) : /* @__PURE__ */ jsx(AlertTriangle, { className: "w-5 h-5 text-amber-500" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h4", { className: "text-[11px] font-black text-neutral-900 uppercase", children: "Horario de Operaci\xF3n" }),
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] text-neutral-500 font-bold leading-normal mt-0.5", children: auditChecklist.hasHours ? "\u2713 Horarios semanales asignados" : "\u26A0\uFE0F Horarios no programados" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "p-3 bg-neutral-50 border border-neutral-150 rounded-2xl flex items-start gap-2.5", children: [
                /* @__PURE__ */ jsx("div", { className: "mt-0.5", children: auditChecklist.hasProducts ? /* @__PURE__ */ jsx(CheckCircle, { className: "w-5 h-5 text-emerald-500" }) : /* @__PURE__ */ jsx(AlertTriangle, { className: "w-5 h-5 text-amber-500" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h4", { className: "text-[11px] font-black text-neutral-900 uppercase", children: "Men\xFA Digital" }),
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] text-neutral-500 font-bold leading-normal mt-0.5", children: auditChecklist.hasProducts ? `\u2713 ${auditChecklist.numProducts} productos configurados` : "\u26A0\uFE0F Men\xFA completamente vac\xEDo" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "p-3 bg-neutral-50 border border-neutral-150 rounded-2xl flex items-start gap-2.5", children: [
                /* @__PURE__ */ jsx("div", { className: "mt-0.5", children: auditChecklist.hasAssistant ? /* @__PURE__ */ jsx(CheckCircle, { className: "w-5 h-5 text-emerald-500" }) : /* @__PURE__ */ jsx("div", { className: "w-5 h-5 bg-neutral-200 rounded-full flex items-center justify-center text-[10px] font-black text-neutral-600 font-mono", children: "i" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h4", { className: "text-[11px] font-black text-neutral-900 uppercase", children: "Asistente Inteligente (IA)" }),
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] text-neutral-500 font-bold leading-normal mt-0.5", children: auditChecklist.hasAssistant ? "\u2713 Comportamiento IA entrenado" : "\u{1F4A1} Recomendado: Entrenar el bot de IA" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-4 bg-neutral-50 border border-neutral-150 rounded-2xl space-y-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 font-black text-neutral-900 text-xs", children: [
                /* @__PURE__ */ jsx(Award, { className: "w-4 h-4 text-[#FF8A00]" }),
                /* @__PURE__ */ jsx("h4", { children: "Din\xE1micas de Marketing Configuradas" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider text-neutral-700", children: [
                /* @__PURE__ */ jsxs("span", { className: `px-2 py-0.5 rounded-lg border ${auditChecklist.loyaltyEnabled ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-neutral-100 border-neutral-200 text-neutral-400"}`, children: [
                  "Fidelizaci\xF3n: ",
                  auditChecklist.loyaltyEnabled ? "S\xED" : "No"
                ] }),
                /* @__PURE__ */ jsxs("span", { className: `px-2 py-0.5 rounded-lg border ${auditChecklist.referralEnabled ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-neutral-100 border-neutral-200 text-neutral-400"}`, children: [
                  "Referidos: ",
                  auditChecklist.referralEnabled ? "S\xED" : "No"
                ] }),
                /* @__PURE__ */ jsxs("span", { className: `px-2 py-0.5 rounded-lg border ${auditChecklist.anniversaryEnabled ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-neutral-100 border-neutral-200 text-neutral-400"}`, children: [
                  "Aniversario: ",
                  auditChecklist.anniversaryEnabled ? "S\xED" : "No"
                ] }),
                /* @__PURE__ */ jsxs("span", { className: `px-2 py-0.5 rounded-lg border ${auditChecklist.prizesCount > 0 ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-neutral-100 border-neutral-200 text-neutral-400"}`, children: [
                  "Ruleta de Premios: ",
                  auditChecklist.prizesCount > 0 ? `${auditChecklist.prizesCount} Premios` : "No"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2 pt-3 border-t border-neutral-100", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => handleRejectPublish(auditingRestaurant),
                  className: "flex-1 py-3 border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-[#FF8A00] hover:text-orange-700 text-xs font-bold rounded-xl transition-colors uppercase tracking-wider",
                  children: "Rechazar / Regresar a Borrador"
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => handleApprovePublish(auditingRestaurant),
                  className: "flex-1 py-3 bg-[#FF8A00] hover:bg-orange-650 text-white text-xs font-black rounded-xl transition-all uppercase tracking-wider shadow-md hover:shadow-lg flex items-center justify-center gap-1.5",
                  children: [
                    /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-orange-100" }),
                    "Aprobar y Publicar Oficialmente"
                  ]
                }
              )
            ] })
          ] })
        ] }) })
      ] }) })
    ] })
  ] });
}
