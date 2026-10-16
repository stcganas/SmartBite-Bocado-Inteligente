import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import {
  db,
  Order,
  Address,
  Review,
  LoyaltyTransaction,
  Restaurant,
  WheelPrize,
} from "../store/db";
import {
  User,
  Package,
  HeartIcon,
  Heart,
  MapPin,
  Settings,
  RefreshCcw,
  ChevronRight,
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  Star,
  CreditCard,
  Bell,
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  MessageSquare,
  Layout,
  Truck,
  Minus,
  DollarSign,
  AlertCircle,
  Loader2,
  BellRing,
  Send,
  Trophy,
  Users,
  Utensils,
  Car,
  Menu,
  Home,
  Download,
  Smartphone,
  Dices,
  Gift,
  Crown,
} from "lucide-react";
import { DateSelector } from "../components/DateSelector";
import { NotificationInbox } from "../components/NotificationInbox";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Link, useLocation } from "react-router-dom";
import { LoyaltyWallet } from "../components/LoyaltyWallet";
import { GlobalGamifiedDashboard } from "../components/GlobalGamifiedDashboard";
import { NotificationDropdown } from "../components/NotificationDropdown";
import { ReferralDashboard } from "../components/ReferralDashboard";
import { ParchisGame } from "../components/ParchisGame";
import { useOneSignal } from "../hooks/useOneSignal";

import { DashboardSidebar, SidebarGroup } from "../components/DashboardSidebar";

type TabType =
  | "overview"
  | "orders"
  | "favorites"
  | "addresses"
  | "settings"
  | "loyalty"
  | "wheel"
  | "referral"
  | "inbox"
  | "parchis";

import { useNotifications } from "../contexts/NotificationContext";
import { ImageSizeInfo } from "../components/ImageSizeInfo";

import { formatCurrency } from "../utils/format";
import { GoldCoinIcon } from '../components/GoldCoinIcon';

export default function UserDashboard() {
  const { user, appUser, refreshAppUser } = useAuth();
  const { isInitialized, requestPermission } = useOneSignal();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const params = new URLSearchParams(location.search);
    const tabOption = params.get("tab");
    if (
      tabOption &&
      [
        "overview",
        "orders",
        "favorites",
        "addresses",
        "settings",
        "loyalty",
        "inbox",
        "notifications",
        "referral",
        "parchis"
      ].includes(tabOption)
    ) {
      return tabOption === "notifications" ? "inbox" : (tabOption as any);
    }
    return "overview";
  });

  const sidebarGroups: SidebarGroup[] = [
    {
      title: "Mi Actividad",
      items: [
        { id: "overview", label: "Resumen", icon: Layout },
        { id: "orders", label: "Mis Pedidos", icon: ShoppingBag },
        { id: "favorites", label: "Favoritos", icon: HeartIcon },
      ],
    },
    {
      title: "Beneficios",
      items: [
        { id: "loyalty", label: "Baúl Monedas", icon: Trophy },
        { id: "wheel", label: "Ruleta de Premios", icon: RefreshCcw },
        { id: "referral", label: "Referidos", icon: Users },
        { id: "parchis", label: "Parqués", icon: Dices },
      ],
    },
    {
      title: "Configuración",
      items: [
        { id: "addresses", label: "Direcciones", icon: MapPin },
        { id: "settings", label: "Mi Perfil", icon: Settings },
      ],
    },
  ];

  const [favoritesSubTab, setFavoritesSubTab] = useState<
    "restaurants" | "dishes"
  >("restaurants");
  const [orders, setOrders] = useState<(Order & { restaurantName?: string })[]>(
    [],
  );
  const [reviews, setReviews] = useState<Review[]>([]);
  const [totalGoldCoins, setTotalGoldCoins] = useState<number>(0);
  const [userLiveLevel, setUserLiveLevel] = useState<number>(1);
  const [userXP, setUserXP] = useState<number>(0);
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<
    LoyaltyTransaction[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<Restaurant[]>(
    [],
  );
  const [favoriteDishes, setFavoriteDishes] = useState<any[]>([]);
  const [wheelPrizes, setWheelPrizes] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<Record<string, any>>({});
  const [redemptionsCount, setRedemptionsCount] = useState(0);
  const [nextReward, setNextReward] = useState<{
    title: string;
    pointsNeeded: number;
    pointsCost: number;
  } | null>(null);

  const levelDetails = React.useMemo(() => {
    const level = userLiveLevel;
    const currentPoints = userXP;
    const nextLimit = level * 50;
    const prevLimit = (level - 1) * 50;
    const pointsRemaining = nextLimit - currentPoints;
    const percent = Math.max(0, Math.min(100, ((currentPoints - prevLimit) / 50) * 100));
    
    let nextRewardDesc = "Beneficios Exclusivos";
    if (level < 2) nextRewardDesc = "Activar membresía base";
    else if (level < 5) nextRewardDesc = "Descuentos en Envíos";
    else if (level < 10) nextRewardDesc = "Cupones de Bebidas";
    else nextRewardDesc = "Nivel VIP Global";

    return {
      level,
      currentPoints,
      nextLevelPoints: nextLimit,
      pointsRemaining: pointsRemaining > 0 ? pointsRemaining : 0,
      progressPercent: percent,
      nextRewardPoints: `${nextLimit}`,
      nextRewardDesc,
    };
  }, [userLiveLevel, userXP]);

  useEffect(() => {
    if (user) {
      db.getUserWheelPrizes(user.id).then(setWheelPrizes);
    }
  }, [user, activeTab]);

  const fetchFavorites = async () => {
    if (user) {
      try {
        const [favRestaurants, favDishes] = await Promise.all([
          db.getUserFavorites(user.id),
          db.getUserProductFavorites(user.id),
        ]);
        setFavoriteRestaurants(favRestaurants);
        setFavoriteDishes(favDishes);
      } catch (error) {
        console.error("Error fetching favorites:", error);
      }
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  // Profile Edit State
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editProfileData, setEditProfileData] = useState({
    displayName: "",
    phone: "",
    birthDate: "",
    age: 0,
    avatarUrl: "",
    primaryAddress: "",
  });

  // Address State
  // ... inside UserDashboard ...
  // Address State
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<Partial<Address>>({
    name: "",
    address: "",
    details: "",
    city: "",
  });
  // ...
  useEffect(() => {
    if (appUser) {
      const primaryAddr =
        appUser.addresses?.find(
          (a) => a.name === "Casa" || a.name === "Principal",
        )?.address || "";
      setEditProfileData({
        displayName: appUser.displayName || "",
        phone: appUser.phone || "",
        birthDate: appUser.birthDate || "",
        age: appUser.age || 0,
        avatarUrl: appUser.avatarUrl || user?.user_metadata?.avatar_url || "",
        primaryAddress: primaryAddr,
      });
    }
  }, [appUser, user]);

  const [pushStatus, setPushStatus] = useState({
    permission: typeof window !== 'undefined' ? window.Notification?.permission : 'default',
    isInitialized: false,
    subscriptionId: '',
    isOptedIn: false,
    serverRestApiKeyPresent: false,
    iframeNotice: typeof window !== 'undefined' && window.self !== window.top
  });

  useEffect(() => {
    let active = true;
    const updateStatus = async () => {
      if (typeof window === 'undefined') return;
      
      let hasConfig = false;

      try {
        const configRes = await fetch('/api/config');
        if (configRes.ok) {
          const configJson = await configRes.json();
          hasConfig = !!configJson.onesignalAppId;
        }
      } catch (err) {
        console.warn('Error reading server config for diagnostics', err);
      }
      
      const isPushAllowed = window.Notification?.permission === 'granted';
      
      if (active) {
        setPushStatus({
          permission: window.Notification?.permission || 'default',
          isInitialized: isInitialized,
          subscriptionId: isPushAllowed ? 'Suscrito vía OneSignal' : '',
          isOptedIn: isPushAllowed,
          serverRestApiKeyPresent: hasConfig,
          iframeNotice: window.self !== window.top
        });
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isInitialized]);

  useEffect(() => {
    // When profile edit completes
    if (!isEditingProfile && appUser) {
      // Done.
    }
  }, [isEditingProfile, appUser]);

  // ...
  // ...

  // Review State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [orderToReview, setOrderToReview] = useState<
    (Order & { restaurantName?: string }) | null
  >(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });

  // Refund State
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [orderToRefund, setOrderToRefund] = useState<
    (Order & { restaurantName?: string }) | null
  >(null);
  const [refundForm, setRefundForm] = useState<{
    reason: string;
    option: "money" | "resend" | "exchange";
  }>({
    reason: "",
    option: "money",
  });
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabOption = params.get("tab");
    if (
      tabOption &&
      [
        "overview",
        "orders",
        "favorites",
        "addresses",
        "settings",
        "loyalty",
        "inbox",
        "notifications",
      ].includes(tabOption)
    ) {
      setActiveTab(
        tabOption === "notifications" ? "inbox" : (tabOption as any),
      );
    }
  }, [location.search]);

  useEffect(() => {
    let cleanups: (() => void)[] = [];

    const fetchData = async () => {
      if (user) {
        try {
          const [
            userOrders,
            userReviews,
            platformPoints,
            transactions,
            prizes,
            gamData,
          ] = await Promise.all([
            db.getUserOrders(user.id),
            db.getUserReviews(user.id),
            db.getAllUserLoyaltyPoints(user.id),
            db.getLoyaltyTransactions(user.id),
            db.getUserWheelPrizes(user.id),
            db.getUserGamification(user.id),
          ]);

          setOrders(userOrders);
          setReviews(userReviews);
          setLoyaltyTransactions(transactions);
          setWheelPrizes(prizes);
          
          if (gamData) {
            setUserLiveLevel(gamData.level || 1);
            setUserXP(gamData.xp || 0);
          }

          // Sum total points across all restaurants
          const total = platformPoints.reduce(
            (sum, p) => sum + (p.pointsBalance || 0),
            0,
          );
          setTotalGoldCoins(total);

          // Fetch redemptions count
          const { count } = await supabase
            .from("loyalty_redemptions")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id);
          setRedemptionsCount(count || 0);

          // Find next achievable reward across user's active restaurants
          if (platformPoints.length > 0) {
            const activeRestIds = platformPoints
              .filter((p) => p.pointsBalance >= 0)
              .map((p) => p.restaurantId);

            if (activeRestIds.length > 0) {
              const { data: rewards } = await supabase
                .from("loyalty_rewards")
                .select("*")
                .in("restaurant_id", activeRestIds)
                .eq("is_active", true);

              if (rewards && rewards.length > 0) {
                let closestReward = null;
                let minNeeded = Infinity;

                rewards.forEach((reward) => {
                  const balance =
                    platformPoints.find(
                      (p) => p.restaurantId === reward.restaurant_id,
                    )?.pointsBalance || 0;

                  if (reward.points_cost > balance) {
                    const needed = reward.points_cost - balance;
                    if (needed < minNeeded) {
                      minNeeded = needed;
                      closestReward = {
                        title: reward.title,
                        pointsNeeded: needed,
                        pointsCost: reward.points_cost,
                      };
                    }
                  }
                });

                if (closestReward) {
                  setNextReward(closestReward);
                } else {
                  setNextReward(null);
                }
              }
            }
          }

          // 2. Subscribe to real-time order updates (Full List)
          const ordersUnsub = db.subscribeToUserOrders(
            user.id,
            (updatedOrders) => {
              setOrders(updatedOrders);
            },
          );
          cleanups.push(ordersUnsub);

          // 3. Subscribe to specific status changes for TOASTS and sound
          const statusChannel = supabase
            .channel(`user-order-status-toasts-${user.id}`)
            .on(
              "postgres_changes",
              {
                event: "UPDATE",
                schema: "public",
                table: "orders",
                filter: `customer_id=eq.${user.id}`,
              },
              async (payload) => {
                const newStatus = payload.new.status;
                const oldStatus = payload.old?.status;
                const orderId = payload.new.id;

                if (newStatus && orderId) {
                  // Update local orders state immediately for real-time card update to circumvent read-replica lag
                  setOrders((prev) =>
                    prev.map((o) =>
                      o.id === orderId ? { ...o, status: newStatus } : o,
                    ),
                  );

                  if (newStatus !== oldStatus) {
                    if (newStatus === "approved")
                      toast.success("Tu pedido ha sido aprobado.");
                    else if (newStatus === "preparing")
                      toast.info("¡Tu pedido está en preparación!");
                    else if (newStatus === "shipped")
                      toast.info("¡Tu pedido va en camino!");
                    else if (newStatus === "completed") {
                      toast.success("Tu pedido ha sido completado.");
                      // Refresh points when order is completed
                      try {
                        const platformPoints = await db.getAllUserLoyaltyPoints(
                          user.id,
                        );
                        const total = platformPoints.reduce(
                          (sum, p) => sum + (p.pointsBalance || 0),
                          0,
                        );
                        setTotalGoldCoins(total);
                      } catch (e) {
                        console.error(
                          "Error refreshing points after completion:",
                          e,
                        );
                      }
                    } else if (newStatus === "rejected")
                      toast.error("Tu pedido fue rechazado.");

                    try {
                      const ctx = new (
                        window.AudioContext ||
                        (window as any).webkitAudioContext
                      )();
                      const osc = ctx.createOscillator();
                      const gain = ctx.createGain();
                      osc.connect(gain);
                      gain.connect(ctx.destination);
                      osc.type = "sine";
                      osc.frequency.setValueAtTime(880, ctx.currentTime);
                      gain.gain.setValueAtTime(0.1, ctx.currentTime);
                      gain.gain.exponentialRampToValueAtTime(
                        0.01,
                        ctx.currentTime + 0.5,
                      );
                      osc.start();
                      osc.stop(ctx.currentTime + 0.5);
                    } catch (e) {}
                  }
                }
              },
            )
            .subscribe();
          cleanups.push(() => supabase.removeChannel(statusChannel));

          // 4. Subscribe to loyalty points changes
          const pointsChannel = supabase
            .channel(`user-loyalty-points-${user.id}`)
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: "loyalty_points",
                filter: `user_id=eq.${user.id}`,
              },
              async () => {
                try {
                  const platformPoints = await db.getAllUserLoyaltyPoints(
                    user.id,
                  );
                  const total = platformPoints.reduce(
                    (sum, p) => sum + (p.pointsBalance || 0),
                    0,
                  );
                  setTotalGoldCoins(total);
                  const transactions = await db.getLoyaltyTransactions(user.id);
                  setLoyaltyTransactions(transactions);
                } catch (e) {
                  console.error(
                    "Error updating loyalty points from subscription:",
                    e,
                  );
                }
              },
            )
            .subscribe();
          cleanups.push(() => supabase.removeChannel(pointsChannel));

          // Fetch driver names
          const driverIds = [
            ...new Set(
              userOrders.filter((o) => o.driverId).map((o) => o.driverId),
            ),
          ];
          if (driverIds.length > 0) {
            const driverProfiles = await Promise.all(
              driverIds.map((id) => db.getDriverProfile(id as string)),
            );
            const driverMap: Record<string, any> = {};
            driverProfiles.forEach((p) => {
              if (p) driverMap[p.id] = p;
            });

            const { data: userData } = await supabase
              .from("app_users")
              .select("id, display_name")
              .in("id", driverIds);
            if (userData) {
              userData.forEach((u) => {
                if (driverMap[u.id])
                  driverMap[u.id].displayName = u.display_name;
              });
            }
            setDrivers(driverMap);
          }
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
        }
      }
      setLoading(false);
    };

    fetchData();

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [user]);

  const handleSaveProfile = async () => {
    if (!appUser) return;
    setIsUploading(true);

    try {
      let finalAvatarUrl = editProfileData.avatarUrl;

      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `avatar-${appUser.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { url, error: uploadError } = await db.uploadImage(
          avatarFile,
          `avatars/${fileName}`,
        );
        if (uploadError) {
          throw uploadError;
        }
        if (url) {
          finalAvatarUrl = url;
        }
      }

      // Handle primary address
      let updatedAddresses = appUser.addresses ? [...appUser.addresses] : [];
      if (editProfileData.primaryAddress) {
        const primaryIndex = updatedAddresses.findIndex(
          (a) => a.name === "Casa" || a.name === "Principal",
        );
        if (primaryIndex >= 0) {
          updatedAddresses[primaryIndex].address =
            editProfileData.primaryAddress;
          updatedAddresses[primaryIndex].name = "Casa"; // Standardize
        } else {
          updatedAddresses.push({
            id: Math.random().toString(36).substring(7),
            name: "Casa",
            address: editProfileData.primaryAddress,
            details: "Dirección principal para pedidos",
            city: "",
          });
        }
      }

      const { error } = await db.updateAppUser(appUser.id, {
        displayName: editProfileData.displayName,
        phone: editProfileData.phone,
        birthDate: editProfileData.birthDate,
        age: editProfileData.age,
        avatarUrl: finalAvatarUrl,
        addresses: updatedAddresses,
      });

      if (error) {
        throw error;
      }

      toast.success("Perfil actualizado correctamente");
      setIsEditingProfile(false);
      setAvatarFile(null);
      if (refreshAppUser) {
        await refreshAppUser();
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al actualizar el perfil",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!appUser) return;
    if (!addressForm.name || !addressForm.address) {
      toast.error("Nombre y dirección son obligatorios");
      return;
    }

    try {
      const currentAddresses = appUser.addresses || [];
      let newAddresses;

      if (editingAddressId) {
        newAddresses = currentAddresses.map((a) =>
          a.id === editingAddressId ? ({ ...a, ...addressForm } as Address) : a,
        );
      } else {
        newAddresses = [
          ...currentAddresses,
          {
            ...addressForm,
            id: Math.random().toString(36).substring(2, 9),
          } as Address,
        ];
      }

      const { error } = await db.updateAppUser(appUser.id, {
        addresses: newAddresses,
      });
      if (error) throw error;

      toast.success(
        editingAddressId ? "Dirección actualizada" : "Dirección agregada",
      );
      setIsEditingAddress(false);
      setEditingAddressId(null);
      setAddressForm({ name: "", address: "", details: "", city: "" });
      if (refreshAppUser) await refreshAppUser();
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error("Error al guardar la dirección");
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!appUser) return;
    if (!confirm("¿Estás seguro de eliminar esta dirección?")) return;

    try {
      const newAddresses = (appUser.addresses || []).filter((a) => a.id !== id);
      const { error } = await db.updateAppUser(appUser.id, {
        addresses: newAddresses,
      });
      if (error) throw error;

      toast.success("Dirección eliminada");
      if (refreshAppUser) await refreshAppUser();
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error("Error al eliminar la dirección");
    }
  };

  const openEditAddress = (address: Address) => {
    setAddressForm(address);
    setEditingAddressId(address.id);
    setIsEditingAddress(true);
  };

  const handleSubmitReview = async () => {
    if (!user || !orderToReview) return;

    try {
      const { error } = await db.createReview({
        orderId: orderToReview.id,
        restaurantId: orderToReview.restaurantId,
        userId: user.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });

      if (error) throw error;

      toast.success("¡Gracias por tu reseña!");
      setReviewModalOpen(false);
      setOrderToReview(null);
      setReviewForm({ rating: 5, comment: "" });

      // Refresh reviews
      const updatedReviews = await db.getUserReviews(user.id);
      setReviews(updatedReviews);
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Error al enviar la reseña");
    }
  };

  const handleSubmitRefund = async () => {
    if (!user || !orderToRefund) return;
    if (!refundForm.reason.trim()) {
      toast.error("Por favor ingresa un motivo");
      return;
    }

    setIsSubmittingRefund(true);
    try {
      const { error } = await db.requestRefund(
        orderToRefund.id,
        refundForm.reason,
        refundForm.option,
      );
      if (error) throw error;

      toast.success(
        "Solicitud de reembolso enviada. Será revisada por el restaurante.",
      );
      setRefundModalOpen(false);
      setOrderToRefund(null);
      setRefundForm({ reason: "", option: "money" });

      // Refresh orders
      const userOrders = await db.getUserOrders(user.id);
      setOrders(userOrders);
    } catch (error) {
      console.error("Error submitting refund:", error);
      toast.error("Error al solicitar el reembolso");
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  if (!appUser)
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-amber-500" />;
      case "accepted":
      case "approved":
        return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      case "preparing":
        return <Clock className="w-4 h-4 text-purple-500" />;
      case "shipped":
      case "on_the_way":
        return <TrendingUp className="w-4 h-4 text-orange-500" />;
      case "assigned":
        return <Truck className="w-4 h-4 text-indigo-500" />;
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-rose-500" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente";
      case "accepted":
      case "approved":
        return "Aprobado";
      case "preparing":
        return "Preparando";
      case "shipped":
      case "on_the_way":
        return "En Camino";
      case "assigned":
        return "Asignado";
      case "completed":
        return "Completado";
      case "cancelled":
        return "Cancelado";
      case "rejected":
        return "Rechazado";
      default:
        return status;
    }
  };

  return (
    <div
      className="flex bg-surface-base overflow-hidden relative"
      style={{ minHeight: "100dvh" }}
    >
      {/* Ambient Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-tertiary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto pb-[90px] safe-area-bottom relative z-10">
        {/* Native App Top Bar */}
        <div className="bg-surface-base/60 backdrop-blur-3xl px-4 sm:px-8 py-5 sm:py-6 flex items-center justify-between shadow-2xl sticky top-0 z-50 border-b border-outline/20">
          <div className="flex items-center gap-3.5">
            <Link
              to="/"
              className="flex items-center gap-2 px-3.5 py-2 glass-card hover:glass-card/10 active:scale-95 border border-outline hover:border-outline/50 text-on-surface rounded-2xl transition-all duration-300 shadow-lg text-xs font-black uppercase tracking-wider group"
              id="dashboard_to_home_btn"
            >
              <Home
                className="w-4 h-4 text-primary group-hover:scale-110 transition-transform duration-300"
              />
              <span className="hidden sm:inline-block">Inicio</span>
            </Link>
            <h1 className="text-xl sm:text-2xl font-black text-on-surface tracking-tighter">
              Mi Perfil
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <NotificationDropdown getDashboardLink={() => "/profile"} />
            <button
              onClick={() => {
                const root = document.documentElement;
                const isLight = root.getAttribute('data-theme') === 'light';
                const newTheme = isLight ? 'dark' : 'light';
                root.setAttribute('data-theme', newTheme);
                localStorage.setItem('app-theme', newTheme);
                // Dispatch event so context can update if we were relying on it, 
                // but direct DOM manip works here for a quick visual toggle too.
                window.dispatchEvent(new Event('theme-change')); 
              }}
              className="flex items-center gap-2 px-3 py-2 bg-surface-variant hover:bg-surface-light active:scale-95 border border-outline hover:border-outline-variant text-on-surface rounded-2xl transition-all shadow-md text-xs font-bold uppercase tracking-widest"
              title="Cambiar Modo"
            >
              Tema
            </button>
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-on-surface-muted font-bold uppercase tracking-widest">
                Hola,
              </p>
              <p className="text-sm font-black text-on-surface leading-none">
                {appUser.displayName?.split(" ")[0] ||
                  appUser.email.split("@")[0]}
              </p>
            </div>
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-orange-500/50 overflow-hidden shadow-[0_0_15px_rgba(249,115,22,0.3)] cursor-pointer active:scale-95 transition-transform shrink-0"
              onClick={() => setIsEditingProfile(true)}
            >
              {appUser.avatarUrl || user?.user_metadata?.avatar_url ? (
                <img
                  src={appUser.avatarUrl || user?.user_metadata?.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-indigo-800 flex items-center justify-center">
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-300" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-3 sm:px-12 pb-24 w-full">
          {/* Main Content Area */}
          <main className="mt-8">
            <AnimatePresence mode="wait">
              {activeTab === "inbox" && (
                <motion.div
                  key="inbox"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="glass-card/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 space-y-6"
                >
                  <NotificationInbox />
                </motion.div>
              )}

              {activeTab === "favorites" && (
                <motion.div
                  key="favorites"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-black text-on-surface">
                      Mis Favoritos
                    </h2>
                    <div className="flex p-1 bg-indigo-900/50 backdrop-blur-md rounded-2xl border border-white/5">
                      {["restaurants", "dishes"].map((tab) => (
                        <button
                          key={tab}
                          onClick={() =>
                            setFavoritesSubTab(tab as "restaurants" | "dishes")
                          }
                          className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            favoritesSubTab === tab
                              ? "glass-card text-orange-600 shadow-lg"
                              : "text-indigo-300 hover:text-on-surface"
                          }`}
                        >
                          {tab === "restaurants" ? "Restaurantes" : "Platos"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(
                    favoritesSubTab === "restaurants"
                      ? favoriteRestaurants.length === 0
                      : favoriteDishes.length === 0
                  ) ? (
                    <div className="py-20 text-center bg-[#0B0B0B] rounded-[2.5rem] border border-white/20 shadow-2xl px-6 golden-glow-module">
                      <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <HeartIcon className="w-10 h-10" />
                      </div>
                      <h3 className="text-3xl font-black text-on-surface mb-3">
                        {favoritesSubTab === "restaurants"
                          ? "Sin restaurantes favoritos"
                          : "Sin platos favoritos"}
                      </h3>
                      <p className="text-on-surface-muted font-medium max-w-sm mx-auto mb-10 text-lg">
                        {favoritesSubTab === "restaurants"
                          ? "Descubre nuevos sabores y guarda tus restaurantes preferidos aquí."
                          : "Encuentra platos deliciosos y guárdalos para pedirlos más tarde."}
                      </p>
                      <button
                        onClick={() => setActiveTab("overview")}
                        className="px-12 py-5 bg-orange-600 text-on-surface rounded-2xl font-black text-base uppercase tracking-widest hover:bg-orange-500 transition-all shadow-xl shadow-orange-200"
                      >
                        Explorar ahora
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {favoritesSubTab === "restaurants"
                        ? favoriteRestaurants.map((restaurant) => (
                            <Link
                              key={restaurant.id}
                              to={`/r/${restaurant.id}`}
                              className="bg-[#0B0B0B] rounded-[2rem] shadow-lg border border-white/20 overflow-hidden group hover:shadow-2xl transition-all golden-glow-module"
                            >
                              <div className="h-40 w-full relative">
                                <img
                                  src={
                                    restaurant.coverImage ||
                                    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000"
                                  }
                                  alt={restaurant.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-4 right-4 glass-card/90 backdrop-blur-sm p-2 rounded-xl text-rose-500 shadow-sm">
                                  <HeartIcon className="w-5 h-5 fill-current" />
                                </div>
                              </div>
                              <div className="p-6">
                                <h4 className="text-xl font-black text-on-surface mb-1">
                                  {restaurant.name}
                                </h4>
                                <p className="text-sm text-on-surface-muted font-bold mb-4">
                                  {restaurant.type}
                                </p>
                                <div className="flex items-center gap-4 text-xs font-bold text-on-surface-muted">
                                  <span className="flex items-center gap-1">
                                    <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />{" "}
                                    4.5
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-orange-500" />{" "}
                                    20-30 min
                                  </span>
                                </div>
                              </div>
                            </Link>
                          ))
                        : favoriteDishes.map((dish) => (
                            <Link
                              key={dish.id}
                              to={`/r/${dish.restaurantId}`}
                              className="bg-[#0B0B0B] rounded-[2rem] shadow-lg border border-white/20 overflow-hidden group hover:shadow-2xl transition-all golden-glow-module"
                            >
                              <div className="h-40 w-full relative">
                                <img
                                  src={
                                    dish.images[0] ||
                                    "https://picsum.photos/seed/dish/400/300"
                                  }
                                  alt={dish.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-4 right-4 glass-card/90 backdrop-blur-sm p-2 rounded-xl text-rose-500 shadow-sm">
                                  <HeartIcon className="w-5 h-5 fill-current" />
                                </div>
                              </div>
                              <div className="p-6">
                                <div className="flex justify-between items-start mb-1">
                                  <h4 className="text-lg font-black text-on-surface line-clamp-1">
                                    {dish.name}
                                  </h4>
                                  <span className="text-orange-600 font-black">
                                    {formatCurrency(dish.price)}
                                  </span>
                                </div>
                                <p className="text-xs text-on-surface-muted font-bold mb-2">
                                  {dish.restaurantName}
                                </p>
                                {dish.pointsMultiplier && dish.pointsMultiplier > 1 && (
                                   <div className="mb-2 inline-flex items-center gap-1 text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm w-fit">
                                     <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                                     Multiplica x{dish.pointsMultiplier} <GoldCoinIcon className="w-3.5 h-3.5 -mt-0.5 mx-0.5 inline-block" /> Monedas
                                   </div>
                                )}
                              </div>
                            </Link>
                          ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "overview" && (
                <div className="space-y-8">
                  {/* SECCIÓN 2 - MI PROGRESO (Moved from Home) */}
                  <div className="relative w-full rounded-[2rem] bg-[#0B0B0B] p-5 sm:p-6 shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-col sm:flex-row items-center gap-5 golden-glow-module group">
                    <div className="flex-1 flex items-center gap-5 w-full relative z-10">
                      {/* Level Badge - Premium Ring */}
                      <div className="w-[80px] h-[80px] sm:w-[90px] sm:h-[90px] shrink-0 rounded-full bg-gradient-to-br from-[#FFD700] via-[#D4943E] to-[#FF8A00] p-[2px] shadow-[0_0_15px_rgba(255,215,0,0.3)]">
                        <div className="w-full h-full bg-gradient-to-b from-[#222] to-[#0A0A0A] rounded-full flex flex-col items-center justify-center relative shadow-inner">
                          <Crown className="absolute top-1.5 w-6 h-6 text-[#FFD700] drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" strokeWidth={2} />
                          <div className="relative flex flex-col items-center mt-4">
                            <span className="text-[10px] font-black uppercase text-[#FFD700] tracking-widest mb-[-2px]">Nivel</span>
                            <span className="text-[32px] sm:text-[36px] font-black text-white leading-none">
                              {!user ? 5 : levelDetails.level}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Progress Info */}
                      <div className="flex flex-col flex-1">
                        <span className="text-[12px] sm:text-[13px] text-on-surface font-normal mb-0.5">
                          Mi progreso
                        </span>
                        <div className="flex justify-between items-baseline mb-2">
                          <span className="text-[22px] sm:text-[24px] font-bold text-[#FF8A00] tracking-tight glow-text-orange leading-none">
                            {levelDetails.currentPoints} <span className="text-[12px] font-medium text-[#FF8A00] glow-none">pts</span>
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden mb-1.5 shadow-inner border border-white/5">
                           <div 
                              className="h-full rounded-full bg-gradient-to-r from-[#FF8A00] to-[#FFD700] shadow-[0_0_8px_rgba(255,138,0,0.6)]" 
                              style={{ width: `${levelDetails.progressPercent}%` }}
                           />
                        </div>
                        <span className="text-[10px] sm:text-[11px] text-[#A0A0A0] font-medium">
                          {levelDetails.pointsRemaining > 0 ? (
                            <>Faltan <span className="text-[#FF8A00] font-black">{levelDetails.pointsRemaining} XP</span> para llegar a <span className="text-[#FF8A00] font-bold">Nivel {levelDetails.level + 1}</span></>
                          ) : (
                            <span className="text-amber-400 font-bold">¡Has alcanzado el nivel máximo!</span>
                          )}
                        </span>
                      </div>
                    </div>
                    
                    {/* Vertical Divider (Desktop) */}
                    <div className="hidden sm:block w-px h-16 bg-white/10 mx-2"></div>
                    {/* Horizontal Divider (Mobile) */}
                    <div className="sm:hidden w-full h-px bg-white/10 my-1 relative z-10"></div>

                    {/* Next Reward */}
                    <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-start justify-between sm:justify-center relative z-10 shrink-0">
                       <div className="flex flex-col">
                         <span className="text-[11px] text-on-surface font-normal mb-1">Próxima recompensa</span>
                         <span className="text-[15px] font-bold text-[#FF8A00] leading-none mb-1">
                           {levelDetails.nextRewardPoints} <span className="text-[11px] text-[#FF8A00] font-medium">pts</span>
                         </span>
                         <span className="text-[12px] font-medium text-[#A0A0A0] line-clamp-1 max-w-[150px]">
                           {levelDetails.nextRewardDesc}
                         </span>
                       </div>
                       <div className="w-[55px] h-[55px] sm:w-[60px] sm:h-[60px] ml-4 relative flex items-center justify-center shrink-0">
                          <div className="absolute inset-0 bg-[#FF8A00]/20 blur-xl rounded-full"></div>
                          <img 
                            src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Wrapped%20Gift.png" 
                            alt="Regalo" 
                            className="w-full h-full object-contain relative z-10 drop-shadow-[0_8px_16px_rgba(255,138,0,0.6)] group-hover:scale-110 transition-transform duration-500 hover:rotate-3 animate-float"
                          />
                       </div>
                    </div>
                  </div>

                  {/* Quick Actions Grid (Moved from Home) */}
                  <div className="grid grid-cols-4 gap-2 pt-0 pb-0">
                    {[
                      {
                        name: "Ruleta",
                        desc: "Gira y gana",
                        icon: (
                          <div className="w-[36px] h-[36px] relative flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <img 
                              src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Slot%20Machine.png" 
                              alt="Ruleta" 
                              className="w-full h-full object-contain drop-shadow-[0_4px_8px_rgba(255,138,0,0.4)] relative z-10"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <div className="hidden absolute inset-0 flex items-center justify-center text-2xl drop-shadow-[0_4px_8px_rgba(255,138,0,0.4)]">
                              🎰
                            </div>
                          </div>
                        ),
                        onClick: () => setActiveTab("wheel")
                      },
                      { 
                        name: "Canjear XP", 
                        desc: "Catálogo",
                        icon: (
                          <div className="w-[36px] h-[36px] relative flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <img 
                              src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Shopping%20Bags.png" 
                              alt="Canjear" 
                              className="w-full h-full object-contain drop-shadow-[0_4px_8px_rgba(255,138,0,0.4)] relative z-10"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <div className="hidden absolute inset-0 flex items-center justify-center text-2xl drop-shadow-[0_4px_8px_rgba(255,138,0,0.4)]">
                              🛍️
                            </div>
                          </div>
                        ),
                        onClick: () => setActiveTab("loyalty")
                      },
                      {
                        name: "Mis niveles",
                        desc: "Sube de nivel",
                        icon: (
                          <div className="w-[36px] h-[36px] relative flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <img 
                              src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Trophy.png" 
                              alt="Niveles" 
                              className="w-full h-full object-contain drop-shadow-[0_4px_8px_rgba(255,138,0,0.4)] relative z-10"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <div className="hidden absolute inset-0 flex items-center justify-center text-2xl drop-shadow-[0_4px_8px_rgba(255,138,0,0.4)]">
                              🏆
                            </div>
                          </div>
                        ),
                        onClick: () => setActiveTab("loyalty")
                      },
                      {
                        name: "Referidos",
                        desc: "Invita y gana",
                        icon: (
                          <div className="w-[36px] h-[36px] relative flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <img 
                              src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Megaphone.png" 
                              alt="Referidos" 
                              className="w-full h-full object-contain drop-shadow-[0_4px_8px_rgba(255,138,0,0.4)] relative z-10"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <div className="hidden absolute inset-0 flex items-center justify-center text-2xl drop-shadow-[0_4px_8px_rgba(255,138,0,0.4)]">
                              📣
                            </div>
                          </div>
                        ),
                        onClick: () => setActiveTab("referral")
                      },
                    ].map((action) => {
                      const content = (
                        <>
                          <div className="w-12 h-12 rounded-[1rem] bg-[#121212] flex items-center justify-center shadow-inner mb-0.5 border border-white/5">
                            {action.icon}
                          </div>
                          <span className="text-[12px] font-bold text-on-surface text-center leading-tight">
                            {action.name}
                          </span>
                          <span className="text-[9px] font-medium text-[#A0A0A0] text-center leading-tight sm:px-1 max-w-[85px] line-clamp-1">
                            {action.desc}
                          </span>
                        </>
                      );

                      return (
                        <button
                          key={action.name}
                          onClick={action.onClick}
                          type="button"
                          className="flex flex-col items-center gap-1.5 group bg-[#0B0B0B] rounded-[1.2rem] p-3 shadow-[0_8px_20px_rgba(0,0,0,0.5)] hover:bg-[#111111] transition-colors cursor-pointer text-left w-full golden-glow-module"
                        >
                          {content}
                        </button>
                      );
                    })}
                  </div>

                  {/* Loot Widget / Widget de Botín */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-[#0B0B0B] rounded-[2.5rem] p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden golden-glow-module"
                  >
                    <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 blur-[100px] rounded-full pointer-events-none" />
                    <div className="relative z-10 space-y-8">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/20 active:scale-95 transition-transform cursor-pointer shrink-0">
                            <GoldCoinIcon className="w-10 h-10" />
                          </div>
                          <div className="text-center md:text-left">
                            <p className="text-on-surface-muted font-black text-xs uppercase tracking-[0.2em] mb-1">Tu Tesoro</p>
                            <h2 className="text-4xl sm:text-5xl font-black text-on-surface tracking-tighter glow-text-orange leading-none">
                              {totalGoldCoins.toLocaleString()}
                            </h2>
                            <div className="flex items-center justify-center md:justify-start gap-2 text-orange-500 font-bold text-[10px] uppercase tracking-widest mt-2">
                              <Trophy className="w-3 h-3" />
                              <span>Mi Botín • Tu esfuerzo vale oro</span>
                            </div>
                          </div>
                        </div>

                        {nextReward && (
                          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/5 hidden lg:block">
                            <p className="text-[10px] font-black text-orange-200 uppercase tracking-widest mb-1">Próximo Objetivo</p>
                            <p className="text-xs font-bold text-on-surface truncate max-w-[200px]">{nextReward.title}</p>
                            <div className="w-32 h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                              <div className="h-full bg-orange-500 rounded-full" style={{ width: '45%' }} />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-white/5">
                         <button 
                           onClick={() => setActiveTab('wheel')}
                           className="px-4 py-3 bg-orange-600 hover:bg-orange-500 text-on-surface rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 group active:scale-95"
                         >
                           <RefreshCcw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                           Girar Ruleta
                         </button>
                         <button 
                           onClick={() => setActiveTab('loyalty')}
                           className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-on-surface rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                         >
                           <Gift className="w-3.5 h-3.5 text-orange-500" />
                           Canjear Premios
                         </button>
                         <button 
                           onClick={() => {
                             const prompt = (window as any).deferredPrompt;
                             if (prompt) {
                               prompt.prompt();
                             } else {
                               toast.info("Si usas Chrome busca 'Instalar aplicación' en el menú. En iOS usa 'Compartir > Agregar a inicio'.");
                             }
                           }}
                           className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-on-surface rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"
                         >
                           <Download className="w-3.5 h-3.5" />
                           Instalar App
                         </button>
                      </div>
                    </div>
                  </motion.div>

                  <GlobalGamifiedDashboard
                    loyaltyPoints={totalGoldCoins}
                    loyaltyTransactions={loyaltyTransactions}
                    initialTab="program"
                  />
                </div>
              )}

              {activeTab === "loyalty" && (
                <div className="space-y-8">
                  <LoyaltyWallet />
                  <GlobalGamifiedDashboard
                    loyaltyPoints={totalGoldCoins}
                    loyaltyTransactions={loyaltyTransactions}
                    initialTab="program"
                  />
                </div>
              )}

              {activeTab === "referral" && <ReferralDashboard />}

              {activeTab === "parchis" && (
                <motion.div
                  key="parchis"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <ParchisGame />
                </motion.div>
              )}

              {activeTab === "orders" && (
                <motion.div
                  key="orders"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black tracking-tight text-on-surface">
                      Historial de Pedidos
                    </h3>
                    <div className="flex gap-2">
                      <span className="px-4 py-1.5 glass-card/10 backdrop-blur-md text-indigo-100 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                        {orders.length} Pedidos
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {orders.map((order) => {
                      const hasReviewed = reviews.some(
                        (r) => r.orderId === order.id,
                      );
                      return (
                        <div
                          key={order.id}
                          className="bg-[#0B0B0B] p-6 rounded-[2rem] shadow-xl border border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:shadow-2xl transition-all group golden-glow-module"
                        >
                          <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:bg-orange-50 transition-colors">
                              <ShoppingBag className="w-8 h-8 text-indigo-300 group-hover:text-orange-500 transition-colors" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-lg font-black text-on-surface">
                                  {order.restaurantName}
                                </h4>
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                                    order.status === "pending"
                                      ? "bg-amber-100 text-amber-700"
                                      : order.status === "accepted" ||
                                          order.status === "approved"
                                        ? "bg-blue-100 text-blue-700"
                                        : order.status === "preparing"
                                          ? "bg-purple-100 text-purple-700"
                                          : order.status === "on_the_way" ||
                                              order.status === "shipped"
                                            ? "bg-orange-100 text-orange-700"
                                            : order.status === "assigned"
                                              ? "bg-indigo-100 text-indigo-700"
                                              : order.status === "completed"
                                                ? "bg-emerald-100 text-emerald-700"
                                                : order.status === "rejected"
                                                  ? "bg-red-100 text-red-700"
                                                  : "bg-surface-variant text-on-surface-variant"
                                  }`}
                                >
                                  {getStatusText(order.status)}
                                </span>
                              </div>
                              <p className="text-xs text-on-surface-muted font-bold flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                {new Date(order.createdAt).toLocaleString()}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {order.items.map((item, i) => (
                                  <span
                                    key={i}
                                    className="text-[10px] bg-surface-base text-on-surface-muted px-2 py-0.5 rounded-lg font-bold"
                                  >
                                    {item.quantity}x {item.product.name}
                                  </span>
                                ))}
                              </div>
                              {order.paymentMethod && (
                                <div className="mt-2 flex items-center gap-2 text-xs font-bold text-on-surface-muted">
                                  <CreditCard className="w-3 h-3" />
                                  Pago:{" "}
                                  {order.paymentMethod === "cash"
                                    ? "Efectivo"
                                    : order.paymentMethod === "card"
                                      ? "Tarjeta"
                                      : "Transferencia"}
                                </div>
                              )}
                              {order.driverId && (
                                <div className="mt-3 flex items-center gap-3 bg-orange-50 px-4 py-2 rounded-2xl border border-orange-100 w-fit">
                                  <div className="w-8 h-8 glass-card rounded-full flex items-center justify-center shadow-sm">
                                    <Truck className="w-4 h-4 text-orange-600" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest leading-none mb-1">
                                      Tu Repartidor
                                    </p>
                                    <p className="text-xs font-black text-orange-700">
                                      {drivers[order.driverId]?.displayName ||
                                        "En camino"}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 border-t sm:border-t-0 pt-4 sm:pt-0">
                            <p className="text-2xl font-black text-on-surface">
                              {formatCurrency(order.total)}
                            </p>
                            <div className="flex flex-col items-end gap-2">
                              <button className="flex items-center gap-2 text-orange-600 text-[10px] font-black uppercase tracking-widest hover:underline">
                                Repetir Pedido{" "}
                                <ChevronRight className="w-3 h-3" />
                              </button>
                              {order.status === "completed" && !hasReviewed && (
                                <button
                                  onClick={() => {
                                    setOrderToReview(order);
                                    setReviewModalOpen(true);
                                  }}
                                  className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-colors"
                                >
                                  <Star className="w-3 h-3" /> Dejar Reseña
                                </button>
                              )}
                              {hasReviewed && (
                                <span className="flex items-center gap-1 text-on-surface-muted text-[10px] font-black uppercase tracking-widest">
                                  <CheckCircle2 className="w-3 h-3" /> Reseñado
                                </span>
                              )}
                              {(!order.refundStatus ||
                                order.refundStatus === "none") &&
                                ["completed", "cancelled", "rejected"].includes(
                                  order.status,
                                ) && (
                                  <button
                                    onClick={() => {
                                      setOrderToRefund(order);
                                      setRefundModalOpen(true);
                                    }}
                                    className="flex items-center gap-1 text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all active:scale-95"
                                  >
                                    <AlertCircle className="w-3 h-3" />{" "}
                                    Solicitar Reembolso
                                  </button>
                                )}
                              {order.refundStatus === "requested" && (
                                <div className="flex flex-col items-end gap-1">
                                  <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border border-amber-100">
                                    <Clock className="w-3 h-3" /> Reembolso en
                                    Revisión
                                  </span>
                                  <span className="text-[7px] text-amber-500 font-bold max-w-[140px] text-right italic leading-tight">
                                    Tu pedido será revisado para la aprobación
                                    del reembolso.
                                  </span>
                                </div>
                              )}
                              {order.refundStatus === "approved" && (
                                <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border border-emerald-100">
                                  <CheckCircle2 className="w-3 h-3" /> Reembolso
                                  Aprobado
                                </span>
                              )}
                              {order.refundStatus === "rejected" && (
                                <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border border-rose-100">
                                  <XCircle className="w-3 h-3" /> Reembolso
                                  Rechazado
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {orders.length === 0 && !loading && (
                      <div className="bg-[#0B0B0B] p-20 rounded-2xl border border-dashed border-outline text-center golden-glow-module">
                        <Package className="w-16 h-16 text-neutral-100 mx-auto mb-4" />
                        <p className="text-on-surface-muted font-bold">
                          No tienes pedidos en tu historial.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === "wheel" && (
                <GlobalGamifiedDashboard
                  loyaltyPoints={totalGoldCoins}
                  loyaltyTransactions={loyaltyTransactions}
                  initialTab="wheel"
                />
              )}

              {activeTab === "addresses" && (
                <motion.div
                  key="addresses"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black tracking-tight">
                      Mis Direcciones
                    </h3>
                    <button
                      onClick={() => {
                        setAddressForm({
                          name: "",
                          address: "",
                          details: "",
                          city: "",
                        });
                        setEditingAddressId(null);
                        setIsEditingAddress(true);
                      }}
                      className="bg-orange-500 text-on-surface px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Nueva Dirección
                    </button>
                  </div>

                  {!appUser.addresses || appUser.addresses.length === 0 ? (
                    <div className="bg-[#0B0B0B] p-12 rounded-2xl border border-dashed border-outline text-center golden-glow-module">
                      <MapPin className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
                      <p className="text-on-surface-muted font-bold mb-2">
                        Aún no tienes direcciones guardadas.
                      </p>
                      <p className="text-sm text-on-surface-muted">
                        Agrega una dirección para facilitar tus próximos
                        pedidos.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {appUser.addresses.map((address) => (
                        <div
                          key={address.id}
                          className="bg-[#0B0B0B] p-8 rounded-[2rem] border border-outline hover:border-orange-200 transition-all group relative golden-glow-module"
                        >
                          <div className="p-2 bg-surface-base text-on-surface-muted rounded-xl w-fit mb-4 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <h4 className="text-lg font-black text-on-surface mb-1">
                            {address.name}
                          </h4>
                          <p className="text-sm text-on-surface-muted font-medium mb-6">
                            {address.address}
                            {address.details && (
                              <>
                                <br />
                                {address.details}
                              </>
                            )}
                            {address.city && (
                              <>
                                <br />
                                {address.city}
                              </>
                            )}
                          </p>
                          <div className="flex gap-4">
                            <button
                              onClick={() => openEditAddress(address)}
                              className="text-xs font-black text-orange-600 uppercase tracking-widest hover:underline flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" /> Editar
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(address.id)}
                              className="text-xs font-black text-on-surface-muted uppercase tracking-widest hover:text-rose-500 transition-colors flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> Eliminar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "settings" && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-[#0B0B0B] rounded-2xl shadow-sm border border-outline overflow-hidden golden-glow-module"
                >
                  <div className="p-8 border-b border-neutral-50 px-8 flex justify-between items-center">
                    <h3 className="text-2xl font-black tracking-tight">
                      Configuración
                    </h3>
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="bg-orange-500 text-on-surface px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Actualizar Perfil
                    </button>
                  </div>
                  <div className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-3">
                          Notificaciones Web Push y Diagnóstico
                        </label>
                        
                        {pushStatus.iframeNotice && (
                          <div className="mb-4 p-4 bg-orange-950/40 border border-orange-500/30 rounded-2xl text-xs text-orange-200 leading-relaxed font-sans flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-orange-400 font-bold uppercase tracking-wider text-[10px]">
                              <AlertCircle className="w-4 h-4" /> ¡Atención en Vista Previa!
                            </div>
                            <p>
                              Por seguridad y diseño de los navegadores web modernos, las notificaciones Push no se permiten o fallan al registrarse dentro de un <strong>iframe (vista previa de AI Studio)</strong>.
                            </p>
                            <p className="font-semibold text-orange-300">
                              Para que las notificaciones funcionen y puedas recibirlas en tiempo real, debes abrir la aplicación en una pestaña independiente presionando el botón "Abrir en nueva pestaña" en la barra superior del navegador.
                            </p>
                          </div>
                        )}

                        {/* Live Diagnostic Table */}
                        <div className="mb-6 bg-surface-base border border-outline rounded-2xl p-4 font-sans space-y-3">
                          <h4 className="text-xs font-black uppercase text-on-surface-muted tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" /> Estado del Servidor y Cliente
                          </h4>
                          
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-3 bg-neutral-900 border border-outline rounded-xl flex flex-col gap-1">
                              <span className="text-[10px] uppercase font-bold text-on-surface-muted">SDK Inicializado</span>
                              <span className={`font-semibold ${pushStatus.isInitialized ? 'text-green-500' : 'text-neutral-500'}`}>
                                {pushStatus.isInitialized ? '✅ Conectado' : '⏳ Esperando...'}
                              </span>
                            </div>

                            <div className="p-3 bg-neutral-900 border border-outline rounded-xl flex flex-col gap-1">
                              <span className="text-[10px] uppercase font-bold text-on-surface-muted">Servidor REST Key</span>
                              <span className={`font-semibold ${pushStatus.serverRestApiKeyPresent ? 'text-green-500' : 'text-rose-500'}`}>
                                {pushStatus.serverRestApiKeyPresent ? '✅ Configurada' : '❌ Falta Key'}
                              </span>
                            </div>

                            <div className="p-3 bg-neutral-900 border border-outline rounded-xl flex flex-col gap-1">
                              <span className="text-[10px] uppercase font-bold text-on-surface-muted">Permiso Navegador</span>
                              <span className={`font-semibold ${
                                pushStatus.permission === 'granted' ? 'text-green-500' : 
                                pushStatus.permission === 'denied' ? 'text-red-500' : 'text-orange-500'
                              }`}>
                                {pushStatus.permission === 'granted' ? '🔔 Permitido' : 
                                 pushStatus.permission === 'denied' ? '🚫 Bloqueado' : '⏳ No solicitado'}
                              </span>
                            </div>

                            <div className="p-3 bg-neutral-900 border border-outline rounded-xl flex flex-col gap-1">
                              <span className="text-[10px] uppercase font-bold text-on-surface-muted">Registro OneSignal</span>
                              <span className={`font-semibold ${pushStatus.isOptedIn ? 'text-green-500' : 'text-orange-500'}`}>
                                {pushStatus.isOptedIn ? '🔔 Activo' : '🔕 Inactivo'}
                              </span>
                            </div>

                            <div className="p-3 bg-neutral-900 border border-outline rounded-xl flex flex-col col-span-2 gap-1 overflow-hidden">
                              <span className="text-[10px] uppercase font-bold text-on-surface-muted">Suscripción OneSignal</span>
                              <span className="font-mono text-[10px] tracking-tight truncate text-neutral-300 select-all" title={pushStatus.subscriptionId || 'Ninguno'}>
                                {pushStatus.subscriptionId ? pushStatus.subscriptionId : '❌ Ninguno (Acepta el permiso)'}
                              </span>
                            </div>
                          </div>
                          
                          {pushStatus.permission === 'denied' && (
                            <p className="text-[11px] text-red-400 font-medium leading-normal bg-red-950/25 p-3 rounded-xl border border-red-900/30">
                              ⚠️ Bloqueaste los permisos de notificación para este sitio. Haz clic en el ícono de candado junto a la URL en la barra de direcciones del navegador y cambia "Notificaciones" a "Permitir".
                            </p>
                          )}
                        </div>

                        <div className="space-y-4">
                          <label className="flex items-center justify-between p-4 bg-surface-base rounded-2xl cursor-pointer hover:bg-surface-variant transition-colors">
                            <span className="text-sm font-bold text-on-surface-variant">
                              Email Marketing
                            </span>
                            <input
                              type="checkbox"
                              defaultChecked
                              className="w-5 h-5 accent-orange-500"
                            />
                          </label>

                          <button
                            onClick={async () => {
                              if (isInitialized) {
                                const granted = await requestPermission();
                                if (granted) {
                                  toast.success("Notificaciones Push activadas 😎");
                                } else {
                                  toast.error("No se pudieron otorgar los permisos en el navegador");
                                }
                              } else {
                                const granted = await requestPermission();
                                if (granted) {
                                  toast.success("Notificaciones activas. Sincronizando...");
                                } else {
                                  toast.error("OneSignal no está listo. Revisa tu consola para más detalles.");
                                }
                              }
                            }}
                            className="w-full flex items-center justify-between p-4 bg-surface-base rounded-2xl hover:bg-surface-variant transition-colors text-left"
                          >
                            <span className="text-sm font-bold text-on-surface-variant">
                              Activar/Sincronizar Notificaciones
                            </span>
                            <div className="flex gap-2">
                              <span className="w-5 h-5 flex items-center justify-center bg-orange-100 text-orange-600 rounded-md">
                                🔔
                              </span>
                            </div>
                          </button>

                          <button
                            onClick={async () => {
                              if (!user) return toast.error("Usuario no logueado");
                              const toastId = toast.loading("Enviando y diagnosticando...");
                              try {
                                const response = await fetch("/api/notifications/send", {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    userId: user.id,
                                    title: "SmartBite Prueba Real Web Push",
                                    body: "¡Si recibes esto, las notificaciones de OneSignal funcionan!",
                                  }),
                                });
                                
                                const resData = await response.json();
                                toast.dismiss(toastId);
                                
                                if (response.ok) {
                                  if (resData.details?.warning || resData?.message?.includes("omitidas") || resData?.details?.tokenCount === 0) {
                                    toast.warning(
                                      `Grabado en BD, pero omitido en Push: ${resData.details?.warning || "El usuario no se ha registrado con token en OneSignal"}`, 
                                      { duration: 6000 }
                                    );
                                  } else {
                                    toast.success("¡Prueba de notificación OneSignal realizada con éxito! Revisa tu pantalla.");
                                  }
                                } else {
                                  toast.error(`Error de OneSignal: ${resData.error || "Falla de envío"}`);
                                }
                              } catch (e) {
                                toast.dismiss(toastId);
                                toast.error("Error de conexión con el backend");
                              }
                            }}
                            className="w-full flex items-center justify-between p-4 bg-orange-950/20 rounded-2xl hover:bg-orange-900/30 transition-colors text-left border border-orange-500/20 group"
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-orange-400">
                                Probar Notificación Real (OneSignal)
                              </span>
                              <span className="text-[11px] text-orange-500/80 font-medium">
                                Prueba el canal y diagnostica errores en vivo
                              </span>
                            </div>
                            <span className="w-5 h-5 flex items-center justify-center bg-orange-500 text-neutral-900 rounded-md group-hover:scale-110 transition-transform text-[10px] font-black">
                              TEST
                            </span>
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-3">
                          Seguridad
                        </label>
                        <button className="w-full flex items-center justify-between p-4 bg-surface-base rounded-2xl hover:bg-surface-variant transition-colors group">
                          <span className="text-sm font-bold text-on-surface-variant">
                            Cambiar Contraseña
                          </span>
                          <ChevronRight className="w-4 h-4 text-on-surface-muted group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                    <div className="pt-8 border-t border-neutral-50 flex justify-end">
                      <button className="px-10 py-4 bg-orange-600 text-on-surface rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-orange-500 transition-all shadow-xl shadow-orange-500/20 active:scale-95">
                        Guardar Cambios
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>

        {/* Edit Profile Modal */}
        <AnimatePresence>
          {isEditingProfile && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsEditingProfile(false)}
                className="absolute inset-0 bg-blue-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg glass-card rounded-[3rem] shadow-2xl overflow-hidden border border-white/20"
              >
                {/* Form Banner */}
                <div className="h-48 relative p-4">
                  <div className="absolute inset-0 m-4 rounded-[2rem] overflow-hidden bg-blue-900 shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 via-blue-900/20 to-transparent"></div>
                  </div>

                  <div className="absolute bottom-10 left-10">
                    <h2 className="text-3xl font-black text-on-surface tracking-tight">
                      Editar Perfil
                    </h2>
                    <p className="text-on-surface/70 text-xs font-bold uppercase tracking-widest">
                      Actualiza tu información personal
                    </p>
                  </div>

                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="absolute top-8 right-8 p-3 glass-card/20 backdrop-blur-md rounded-2xl text-on-surface hover:glass-card/40 transition-all active:scale-90"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2 ml-1">
                        Foto de Perfil
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-surface-variant/30 flex items-center justify-center overflow-hidden shrink-0 border-2 border-transparent group-focus-within:border-primary transition-colors">
                          {avatarFile ? (
                            <img
                              src={URL.createObjectURL(avatarFile)}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : editProfileData.avatarUrl ? (
                            <img
                              src={editProfileData.avatarUrl}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <User className="w-6 h-6 text-on-surface-variant" />
                          )}
                        </div>
                        <div className="flex-1 relative group">
                          <div className="flex items-center gap-2 mb-2">
                            <label className="text-xs font-black text-on-surface-muted uppercase tracking-widest">
                              Foto de Perfil
                            </label>
                            <ImageSizeInfo type="profile" />
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setAvatarFile(e.target.files[0]);
                              }
                            }}
                            className="w-full px-4 py-3 bg-surface-base border border-outline focus:border-orange-500 focus:glass-card rounded-lg outline-none transition-all font-medium text-on-surface text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-orange-500 file:text-on-surface hover:file:bg-orange-600 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2 ml-1">
                        Nombre Completo
                      </label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                        <input
                          type="text"
                          value={editProfileData.displayName}
                          onChange={(e) =>
                            setEditProfileData({
                              ...editProfileData,
                              displayName: e.target.value,
                            })
                          }
                          className="w-full pl-12 pr-4 py-3 bg-surface-base border border-outline focus:border-orange-500 focus:glass-card rounded-lg outline-none transition-all font-medium text-on-surface"
                          placeholder="Tu nombre"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2 ml-1">
                        Teléfono
                      </label>
                      <div className="relative group">
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                        <input
                          type="tel"
                          value={editProfileData.phone}
                          onChange={(e) =>
                            setEditProfileData({
                              ...editProfileData,
                              phone: e.target.value,
                            })
                          }
                          className="w-full pl-12 pr-4 py-3 bg-surface-base border border-outline focus:border-orange-500 focus:glass-card rounded-lg outline-none transition-all font-medium text-on-surface"
                          placeholder="Ej. 300 123 4567"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2 ml-1">
                          Fecha de Nacimiento
                        </label>
                        <div className="relative group">
                          <DateSelector
                            value={editProfileData.birthDate}
                            onChange={(dateStr) => {
                              let age = 0;
                              if (dateStr) {
                                const today = new Date();
                                const birthDate = new Date(dateStr);
                                age =
                                  today.getFullYear() - birthDate.getFullYear();
                                const m =
                                  today.getMonth() - birthDate.getMonth();
                                if (
                                  m < 0 ||
                                  (m === 0 &&
                                    today.getDate() < birthDate.getDate())
                                ) {
                                  age--;
                                }
                              }
                              setEditProfileData({
                                ...editProfileData,
                                birthDate: dateStr,
                                age,
                              });
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2 ml-1">
                          Edad
                        </label>
                        <div className="relative group">
                          <input
                            type="number"
                            value={editProfileData.age || ""}
                            readOnly
                            className="w-full px-4 py-4 bg-surface-variant/10 border-2 border-transparent rounded-2xl outline-none font-bold text-on-surface-variant cursor-not-allowed"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2 ml-1">
                        Dirección Principal para Pedidos
                        <span className="block text-[9px] text-orange-500 mt-0.5 normal-case tracking-normal font-medium">
                          * Por seguridad, esta dirección se usará para tus
                          entregas.
                        </span>
                      </label>
                      <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                        <input
                          type="text"
                          value={editProfileData.primaryAddress}
                          onChange={(e) =>
                            setEditProfileData({
                              ...editProfileData,
                              primaryAddress: e.target.value,
                            })
                          }
                          className="w-full pl-12 pr-4 py-3 bg-surface-base border border-outline focus:border-orange-500 focus:glass-card rounded-lg outline-none transition-all font-medium text-on-surface"
                          placeholder="Ej. Calle 123 #45-67"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="flex-1 py-4 bg-surface-variant/30 text-on-surface-variant font-black rounded-2xl hover:bg-surface-variant transition-all active:scale-95"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={isUploading}
                      className="flex-1 py-4 bg-primary text-on-primary font-black rounded-2xl shadow-lg shadow-primary/20 hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      {isUploading ? "Guardando..." : "Guardar"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Edit Address Modal */}
        <AnimatePresence>
          {isEditingAddress && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsEditingAddress(false)}
                className="absolute inset-0 bg-blue-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg glass-card rounded-[3rem] shadow-2xl overflow-hidden border border-white/20"
              >
                {/* Form Banner */}
                <div className="h-48 relative p-4">
                  <div className="absolute inset-0 m-4 rounded-[2rem] overflow-hidden bg-blue-900 shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 via-blue-900/20 to-transparent"></div>
                  </div>

                  <div className="absolute bottom-10 left-10">
                    <h2 className="text-3xl font-black text-on-surface tracking-tight">
                      {editingAddressId
                        ? "Editar Dirección"
                        : "Nueva Dirección"}
                    </h2>
                    <p className="text-on-surface/70 text-xs font-bold uppercase tracking-widest">
                      ¿A dónde enviamos hoy?
                    </p>
                  </div>

                  <button
                    onClick={() => setIsEditingAddress(false)}
                    className="absolute top-8 right-8 p-3 glass-card/20 backdrop-blur-md rounded-2xl text-on-surface hover:glass-card/40 transition-all active:scale-90"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2 ml-1">
                        Nombre de la dirección *
                      </label>
                      <input
                        type="text"
                        value={addressForm.name || ""}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-4 py-4 bg-surface-variant/20 border-2 border-transparent focus:border-primary focus:glass-card rounded-2xl outline-none transition-all font-bold text-on-surface"
                        placeholder="Ej. Casa, Trabajo, Novia"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2 ml-1">
                        Dirección principal *
                      </label>
                      <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                        <input
                          type="text"
                          value={addressForm.address || ""}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              address: e.target.value,
                            })
                          }
                          className="w-full pl-12 pr-4 py-4 bg-surface-variant/20 border-2 border-transparent focus:border-primary focus:glass-card rounded-2xl outline-none transition-all font-bold text-on-surface"
                          placeholder="Ej. Calle 123 #45-67"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2 ml-1">
                        Detalles (Apto, Torre, etc.)
                      </label>
                      <input
                        type="text"
                        value={addressForm.details || ""}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            details: e.target.value,
                          })
                        }
                        className="w-full px-4 py-4 bg-surface-variant/20 border-2 border-transparent focus:border-primary focus:glass-card rounded-2xl outline-none transition-all font-bold text-on-surface"
                        placeholder="Ej. Apto 402, Torre B"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2 ml-1">
                        Ciudad
                      </label>
                      <input
                        type="text"
                        value={addressForm.city || ""}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            city: e.target.value,
                          })
                        }
                        className="w-full px-4 py-4 bg-surface-variant/20 border-2 border-transparent focus:border-primary focus:glass-card rounded-2xl outline-none transition-all font-bold text-on-surface"
                        placeholder="Ej. Bogotá"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditingAddress(false)}
                      className="flex-1 py-4 bg-surface-variant/30 text-on-surface-variant font-black rounded-2xl hover:bg-surface-variant transition-all active:scale-95"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveAddress}
                      className="flex-1 py-4 bg-primary text-on-primary font-black rounded-2xl shadow-lg shadow-primary/20 hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      Guardar
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Review Modal */}
        <AnimatePresence>
          {reviewModalOpen && orderToReview && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg glass-card rounded-[3rem] shadow-2xl overflow-hidden border border-white/20 max-h-[90vh] flex flex-col"
              >
                {/* Form Banner */}
                <div className="h-48 relative p-4 shrink-0">
                  <div className="absolute inset-0 m-4 rounded-[2rem] overflow-hidden bg-blue-900 shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 via-blue-900/20 to-transparent"></div>
                  </div>

                  <div className="absolute bottom-10 left-10">
                    <h2 className="text-3xl font-black text-on-surface tracking-tight flex items-center gap-3">
                      <Star className="w-8 h-8 text-orange-400 fill-orange-400" />
                      Calificar Pedido
                    </h2>
                    <p className="text-on-surface/70 text-xs font-bold uppercase tracking-widest">
                      Tu opinión nos ayuda a mejorar
                    </p>
                  </div>

                  <button
                    onClick={() => setReviewModalOpen(false)}
                    className="absolute top-8 right-8 p-3 glass-card/20 backdrop-blur-md rounded-2xl text-on-surface hover:glass-card/40 transition-all active:scale-90"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
                  <div className="text-center">
                    <p className="text-lg font-black text-on-surface mb-4">
                      ¿Cómo estuvo tu pedido de{" "}
                      <span className="text-orange-600">
                        {orderToReview.restaurantName}
                      </span>
                      ?
                    </p>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <motion.button
                          key={star}
                          whileHover={{ scale: 1.2, rotate: 10 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() =>
                            setReviewForm({ ...reviewForm, rating: star })
                          }
                          className="p-1"
                        >
                          <Star
                            className={`w-10 h-10 sm:w-12 sm:h-12 transition-all duration-300 ${
                              star <= reviewForm.rating
                                ? "fill-orange-500 text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.4)]"
                                : "text-neutral-200"
                            }`}
                          />
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-on-surface-muted uppercase tracking-widest ml-1">
                      Comentarios (Opcional)
                    </label>
                    <textarea
                      value={reviewForm.comment}
                      onChange={(e) =>
                        setReviewForm({
                          ...reviewForm,
                          comment: e.target.value,
                        })
                      }
                      className="w-full p-4 bg-surface-base border-2 border-transparent focus:border-orange-500 focus:glass-card rounded-[2rem] outline-none transition-all font-bold text-on-surface resize-none h-32 sm:h-40 shadow-inner"
                      placeholder="¿Qué te pareció la comida y el servicio?"
                    />
                  </div>
                </div>

                {/* Action Buttons - Moved outside scrollable area */}
                <div className="p-6 sm:p-8 pt-0 shrink-0 border-t border-outline glass-card">
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => setReviewModalOpen(false)}
                      className="flex-1 py-4 text-on-surface-muted font-black uppercase tracking-widest text-xs hover:bg-surface-variant rounded-2xl transition-all"
                    >
                      Omitir
                    </button>
                    <button
                      onClick={handleSubmitReview}
                      className="flex-[2] py-4 bg-gradient-to-r from-orange-500 to-rose-500 text-on-surface font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-orange-500/20 hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                      <MessageSquare className="w-5 h-5" />
                      Enviar Reseña
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Refund Modal */}
        <AnimatePresence>
          {refundModalOpen && orderToRefund && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg glass-card rounded-[3rem] shadow-2xl overflow-hidden border border-white/20"
              >
                <div className="h-48 relative p-4">
                  <div className="absolute inset-0 m-4 rounded-[2rem] overflow-hidden bg-blue-900 shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 via-blue-900/20 to-transparent"></div>
                  </div>

                  <div className="absolute bottom-10 left-10">
                    <h2 className="text-3xl font-black text-on-surface tracking-tight flex items-center gap-3">
                      <AlertCircle className="w-8 h-8 text-rose-400" />
                      Solicitar Reembolso
                    </h2>
                    <p className="text-on-surface/70 text-xs font-bold uppercase tracking-widest">
                      Pedido #{orderToRefund.id.slice(-6).toUpperCase()}
                    </p>
                  </div>

                  <button
                    onClick={() => setRefundModalOpen(false)}
                    className="absolute top-8 right-8 p-3 glass-card/20 backdrop-blur-md rounded-2xl text-on-surface hover:glass-card/40 transition-all active:scale-90"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-8 space-y-6">
                  <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 mb-6">
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">
                      Nota importante
                    </p>
                    <p className="text-xs font-bold text-rose-700 leading-relaxed italic">
                      "Tu pedido será revisado por el restaurante para la
                      aprobación del reembolso. Si fue cancelado por demora o
                      problemas de calidad, se procederá según tu preferencia."
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2 ml-1">
                        Motivo del reembolso
                      </label>
                      <textarea
                        value={refundForm.reason}
                        onChange={(e) =>
                          setRefundForm({
                            ...refundForm,
                            reason: e.target.value,
                          })
                        }
                        className="w-full p-4 bg-surface-base border-2 border-transparent focus:border-rose-500 rounded-2xl outline-none font-bold text-on-surface resize-none h-32"
                        placeholder="Ej. Demora excesiva, comida fría, pedido equivocado..."
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2 ml-1">
                        Opción preferida
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "money", label: "Dinero", icon: DollarSign },
                          { id: "resend", label: "Re-enviar", icon: Truck },
                          { id: "exchange", label: "Cambio", icon: Layout },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() =>
                              setRefundForm({
                                ...refundForm,
                                option: opt.id as any,
                              })
                            }
                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                              refundForm.option === opt.id
                                ? "border-rose-500 bg-rose-50 text-rose-700"
                                : "border-transparent bg-surface-base text-on-surface-muted hover:bg-surface-variant"
                            }`}
                          >
                            {/* We need to import DollarSign if not exists, checking the imports later */}
                            {/* For now use simple text if unsure of icon name mapping */}
                            <span className="text-[10px] font-black uppercase tracking-widest">
                              {opt.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => setRefundModalOpen(false)}
                      className="flex-1 py-5 text-on-surface-muted font-black uppercase tracking-widest text-[10px] hover:bg-surface-variant rounded-2xl transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSubmitRefund}
                      disabled={isSubmittingRefund}
                      className="flex-[2] py-5 bg-gradient-to-r from-rose-500 to-rose-700 text-on-surface font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-rose-500/20 hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isSubmittingRefund ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5" />
                      )}
                      Solicitar Reembolso
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* Bottom Mobile-First Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#0A1A2F]/80 backdrop-blur-3xl border-t border-white/10 pb-safe z-[100] shadow-2xl">
          <div className="flex items-center justify-around h-16 sm:h-20 px-2 sm:px-6 max-w-md mx-auto">
            <button
              onClick={() => {
                setActiveTab("overview");
                setShowMoreMenu(false);
              }}
              className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-all duration-300 ${activeTab === "overview" && !showMoreMenu ? "text-orange-400 scale-105" : "text-indigo-300/60"}`}
            >
              <Trophy
                className="w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300"
                style={{
                  color:
                    activeTab === "overview" && !showMoreMenu
                      ? "#fbbf24"
                      : "#b45309",
                  filter:
                    activeTab === "overview" && !showMoreMenu
                      ? "drop-shadow(1.5px 2px 0px rgba(0,0,0,0.9)) drop-shadow(0px 3px 8px rgba(245,158,11,0.6))"
                      : "drop-shadow(1px 1.5px 0px rgba(0,0,0,0.8)) drop-shadow(0px 1px 2px rgba(245,158,11,0.2))",
                }}
              />
              <span
                className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-colors duration-300 ${activeTab === "overview" && !showMoreMenu ? "text-orange-400" : ""}`}
              >
                Inicio
              </span>
            </button>
            <button
              onClick={() => {
                setActiveTab("orders");
                setShowMoreMenu(false);
              }}
              className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-all duration-300 ${activeTab === "orders" && !showMoreMenu ? "text-orange-400 scale-105" : "text-indigo-300/60"}`}
            >
              <ShoppingBag
                className="w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300"
                style={{
                  color:
                    activeTab === "orders" && !showMoreMenu
                      ? "#34d399"
                      : "#047857",
                  filter:
                    activeTab === "orders" && !showMoreMenu
                      ? "drop-shadow(1.5px 2px 0px rgba(0,0,0,0.9)) drop-shadow(0px 3px 8px rgba(16,185,129,0.6))"
                      : "drop-shadow(1px 1.5px 0px rgba(0,0,0,0.8)) drop-shadow(0px 1px 2px rgba(16,185,129,0.2))",
                }}
              />
              <span
                className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-colors duration-300 ${activeTab === "orders" && !showMoreMenu ? "text-orange-400" : ""}`}
              >
                Pedidos
              </span>
            </button>
            <button
              onClick={() => {
                setActiveTab("referral");
                setShowMoreMenu(false);
              }}
              className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-all duration-300 ${activeTab === "referral" && !showMoreMenu ? "text-orange-400 scale-105" : "text-indigo-300/60"}`}
            >
              <Users
                className="w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300"
                style={{
                  color:
                    activeTab === "referral" && !showMoreMenu
                      ? "#22d3ee"
                      : "#0369a1",
                  filter:
                    activeTab === "referral" && !showMoreMenu
                      ? "drop-shadow(1.5px 2px 0px rgba(0,0,0,0.9)) drop-shadow(0px 3px 8px rgba(6,182,212,0.6))"
                      : "drop-shadow(1px 1.5px 0px rgba(0,0,0,0.8)) drop-shadow(0px 1px 2px rgba(6,182,212,0.2))",
                }}
              />
              <span
                className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-colors duration-300 ${activeTab === "referral" && !showMoreMenu ? "text-orange-400" : ""}`}
              >
                Referidos
              </span>
            </button>
            <button
              onClick={() => setShowMoreMenu(true)}
              className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-all duration-300 ${showMoreMenu ? "text-orange-400 scale-105" : "text-indigo-300/60"}`}
            >
              <div className="relative">
                <Menu
                  className="w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300"
                  style={{
                    color: showMoreMenu ? "#f472b6" : "#be185d",
                    filter: showMoreMenu
                      ? "drop-shadow(1.5px 2px 0px rgba(0,0,0,0.9)) drop-shadow(0px 3px 8px rgba(236,72,153,0.6))"
                      : "drop-shadow(1px 1.5px 0px rgba(0,0,0,0.8)) drop-shadow(0px 1px 2px rgba(236,72,153,0.2))",
                  }}
                />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-indigo-900"></span>
                )}
              </div>
              <span
                className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-colors duration-300 ${showMoreMenu ? "text-orange-400" : ""}`}
              >
                Más
              </span>
            </button>
          </div>
        </div>

        {/* More Menu Action Sheet */}
        <AnimatePresence>
          {showMoreMenu && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMoreMenu(false)}
                className="fixed inset-0 bg-blue-950/40 backdrop-blur-sm z-[110]"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 bg-blue-900/95 backdrop-blur-2xl rounded-t-[2rem] z-[120] pb-safe shadow-2xl max-w-lg mx-auto border-t border-white/10"
              >
                <div
                  className="w-full flex justify-center pt-3 pb-2"
                  onClick={() => setShowMoreMenu(false)}
                >
                  <div className="w-12 h-1.5 glass-card/20 rounded-full"></div>
                </div>
                <div className="px-6 pb-8 pt-2 h-[60vh] overflow-y-auto hide-scrollbar">
                  <h3 className="text-xl font-black text-on-surface mb-6">
                    Más Opciones
                  </h3>
                  <div className="grid grid-cols-3 gap-y-8 gap-x-4">
                    <button
                      onClick={() => {
                        setActiveTab("inbox");
                        setShowMoreMenu(false);
                      }}
                      className="flex flex-col items-center gap-3 group"
                    >
                      <div className="relative w-16 h-16 glass-card/5 rounded-[1.5rem] flex items-center justify-center group-hover:glass-card/10 group-active:scale-95 transition-all duration-300 border border-white/10 shadow-lg">
                        <BellRing
                          className="w-7 h-7 transition-all duration-300 group-hover:scale-110"
                          style={{
                            color: "#f43f5e",
                            filter:
                              "drop-shadow(1.5px 2px 0px rgba(0,0,0,0.9)) drop-shadow(0px 3px 6px rgba(244,63,94,0.5))",
                          }}
                        />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-on-surface text-[10px] font-black rounded-full flex items-center justify-center shadow-sm border-2 border-indigo-900">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-black text-indigo-200 text-center uppercase tracking-widest line-clamp-1">
                        Avisos
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("loyalty");
                        setShowMoreMenu(false);
                      }}
                      className="flex flex-col items-center gap-3 group"
                    >
                      <div className="w-16 h-16 glass-card/5 rounded-[1.5rem] flex items-center justify-center group-hover:glass-card/10 group-active:scale-95 transition-all duration-300 border border-white/10 shadow-lg">
                        <Trophy
                          className="w-7 h-7 transition-all duration-300 group-hover:scale-110"
                          style={{
                            color: "#fbbf24",
                            filter:
                              "drop-shadow(1.5px 2px 0px rgba(0,0,0,0.9)) drop-shadow(0px 3px 6px rgba(245,158,11,0.5))",
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-indigo-200 text-center uppercase tracking-widest line-clamp-1">
                        Lealtad
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("wheel");
                        setShowMoreMenu(false);
                      }}
                      className="flex flex-col items-center gap-3 group"
                    >
                      <div className="w-16 h-16 glass-card/5 rounded-[1.5rem] flex items-center justify-center group-hover:glass-card/10 group-active:scale-95 transition-all duration-300 border border-white/10 shadow-lg">
                        <RefreshCcw
                          className="w-7 h-7 transition-all duration-300 group-hover:scale-110"
                          style={{
                            color: "#a78bfa",
                            filter:
                              "drop-shadow(1.5px 2px 0px rgba(0,0,0,0.9)) drop-shadow(0px 3px 6px rgba(167,139,250,0.5))",
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-indigo-200 text-center uppercase tracking-widest line-clamp-1">
                        Premios
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("addresses");
                        setShowMoreMenu(false);
                      }}
                      className="flex flex-col items-center gap-3 group"
                    >
                      <div className="w-16 h-16 glass-card/5 rounded-[1.5rem] flex items-center justify-center group-hover:glass-card/10 group-active:scale-95 transition-all duration-300 border border-white/10 shadow-lg">
                        <MapPin
                          className="w-7 h-7 transition-all duration-300 group-hover:scale-110"
                          style={{
                            color: "#10b981",
                            filter:
                              "drop-shadow(1.5px 2px 0px rgba(0,0,0,0.9)) drop-shadow(0px 3px 6px rgba(16,185,129,0.5))",
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-indigo-200 text-center uppercase tracking-widest line-clamp-1">
                        Ubicación
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingProfile(true);
                        setShowMoreMenu(false);
                      }}
                      className="flex flex-col items-center gap-3 group"
                    >
                      <div className="w-16 h-16 glass-card/5 rounded-[1.5rem] flex items-center justify-center group-hover:glass-card/10 group-active:scale-95 transition-all duration-300 border border-white/10 shadow-lg">
                        <User
                          className="w-7 h-7 transition-all duration-300 group-hover:scale-110"
                          style={{
                            color: "#22d3ee",
                            filter:
                              "drop-shadow(1.5px 2px 0px rgba(0,0,0,0.9)) drop-shadow(0px 3px 6px rgba(6,182,212,0.5))",
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-indigo-200 text-center uppercase tracking-widest line-clamp-1">
                        Perfil
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("settings");
                        setShowMoreMenu(false);
                      }}
                      className="flex flex-col items-center gap-3 group"
                    >
                      <div className="w-16 h-16 glass-card/5 rounded-[1.5rem] flex items-center justify-center group-hover:glass-card/10 group-active:scale-95 transition-all duration-300 border border-white/10 shadow-lg">
                        <Settings
                          className="w-7 h-7 transition-all duration-300 group-hover:scale-110"
                          style={{
                            color: "#cbd5e1",
                            filter:
                              "drop-shadow(1.5px 2px 0px rgba(0,0,0,0.9)) drop-shadow(0px 3px 6px rgba(148,163,184,0.4))",
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-indigo-200 text-center uppercase tracking-widest line-clamp-1">
                        Ajustes
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("favorites");
                        setShowMoreMenu(false);
                      }}
                      className="flex flex-col items-center gap-3 group"
                    >
                      <div className="w-16 h-16 glass-card/5 rounded-[1.5rem] flex items-center justify-center group-hover:glass-card/10 group-active:scale-95 transition-all duration-300 border border-white/10 shadow-lg">
                        <HeartIcon
                          className="w-7 h-7 transition-all duration-300 group-hover:scale-110"
                          style={{
                            color: "#ec4899",
                            filter:
                              "drop-shadow(1.5px 2px 0px rgba(0,0,0,0.9)) drop-shadow(0px 3px 6px rgba(236,72,153,0.5))",
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-indigo-200 text-center uppercase tracking-widest line-clamp-1">
                        Favoritos
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("parchis");
                        setShowMoreMenu(false);
                      }}
                      className="flex flex-col items-center gap-3 group"
                    >
                      <div className="relative w-16 h-16 glass-card/5 rounded-[1.5rem] flex items-center justify-center group-hover:glass-card/10 group-active:scale-95 transition-all duration-300 border border-white/10 shadow-lg">
                        <Dices
                          className="w-7 h-7 transition-all duration-300 group-hover:scale-110"
                          style={{
                            color: "#f97316",
                            filter:
                              "drop-shadow(1.5px 2px 0px rgba(0,0,0,0.9)) drop-shadow(0px 3px 6px rgba(249,115,22,0.5))",
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-indigo-200 text-center uppercase tracking-widest line-clamp-1">
                        Parqués
                      </span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
