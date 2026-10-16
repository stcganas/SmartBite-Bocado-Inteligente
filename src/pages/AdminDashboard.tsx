import React, { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import { calculateRestaurantMeritScore } from "../utils/meritSystem";
import { supabase } from "../lib/supabase";
import {
  db,
  Restaurant,
  Product,
  Banner,
  Order,
  Category,
  Review,
  AppUser,
  DriverProfile,
  Plan,
  RestaurantSubscription,
  PlatformInvoice,
  PlatformSettings,
  SupportTicket,
  WheelConfig,
  WheelSegment,
  WheelPrize,
  Coupon,
} from "../store/db";
import { suggestMenuImprovements } from "../services/ai";
import { processPlatformPayment } from "../services/paymentService";
import { DashboardSidebar, SidebarGroup } from "../components/DashboardSidebar";
import {
  Plus,
  Home,
  Edit,
  Edit2,
  Trash2,
  Wand2,
  Save,
  X,
  Image as ImageIcon,
  LayoutList,
  Store,
  TrendingUp,
  ShoppingBag,
  Users,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Truck,
  Brain,
  Loader2,
  Star,
  QrCode,
  Download,
  ExternalLink,
  Settings,
  Sparkles,
  Menu as MenuIcon,
  Package as PackageIcon,
  BarChart3,
  QrCode as QrCodeIcon,
  Bike,
  Car,
  BellRing,
  Heart,
  CreditCard,
  Banknote,
  FileText,
  MessageSquare,
  Send,
  Trophy,
  Gamepad2,
  Zap,
  Calendar,
  RefreshCcw,
  LayoutDashboard,
  PlusCircle,
  User,
  Upload,
  Ticket,
  Pause,
  Rocket,
  Smartphone,
  BrainCircuit, Activity,
  Share2
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useOneSignal } from "../hooks/useOneSignal";
import { AdminTrafficDashboard } from "../components/AdminTrafficDashboard";
import { MetaPostCreator } from "../components/MetaPostCreator";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { formatCurrency } from "../utils/format";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import AITrainingSection from "../components/AITrainingSection";
import AIAgentMarketing from "../components/AIAgentMarketing";
import { RestaurantLoyalty } from "./RestaurantLoyalty";
import { ImageSizeInfo } from "../components/ImageSizeInfo";

import { NotificationInbox } from "../components/NotificationInbox";
import { useNotifications } from "../contexts/NotificationContext";

import { getDepartments, getCitiesByDepartment } from "../utils/colombiaData";
import { GoldCoinIcon } from '../components/GoldCoinIcon';

export default function AdminDashboard() {
  const { id: urlRestaurantId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, appUser, loading: authLoading } = useAuth();
  const { isInitialized, requestPermission } = useOneSignal();
  // useNotifications removed to prevent re-renders on notification changes

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [platformSettings, setPlatformSettings] =
    useState<PlatformSettings | null>(null);

  const productionUrl =
    platformSettings?.productionUrl ||
    "https://ais-pre-vwxtz7i5u6etdfshis6t4s-122130928241.us-east1.run.app";

  const getPublicUrl = (table?: string) => {
    if (!restaurant?.id) return "";
    const base = `${productionUrl}/#/r/${restaurant.id}`;
    return table ? `${base}?table=${encodeURIComponent(table)}` : base;
  };
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isImproving, setIsImproving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search);
    const tabOption = params.get("tab");
    return tabOption || "overview";
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabOption = params.get("tab");
    if (tabOption && tabOption !== activeTab) {
      setActiveTab(tabOption);
    }
  }, [location.search, activeTab]);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] =
    useState<RestaurantSubscription | null>(null);
  const [restaurantInvoices, setRestaurantInvoices] = useState<
    PlatformInvoice[]
  >([]);
  const [activeCategoryTab, setActiveCategoryTab] = useState("all");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isHoursExpanded, setIsHoursExpanded] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [isAddingTable, setIsAddingTable] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    title: "",
    body: "",
    target: "restaurant_customers" as
      | "restaurant_customers"
      | "specific_customer"
      | "restaurant_drivers",
    targetUserId: "",
    isScheduled: false,
    scheduledDate: "",
    scheduledTime: "",
    category: "promoción",
  });
  const [scheduledNotes, setScheduledNotes] = useState<any[]>([]);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [bulkTablePrefix, setBulkTablePrefix] = useState("Mesa");
  const [bulkTableCount, setBulkTableCount] = useState(1);
  const [tableCreationMode, setTableCreationMode] = useState<"single" | "bulk">(
    "single",
  );
  const [editingTableOriginal, setEditingTableOriginal] = useState<
    string | null
  >(null);
  const [editingTableName, setEditingTableName] = useState("");
  const [itemToDelete, setItemToDelete] = useState<{
    type:
      | "table"
      | "product"
      | "banner"
      | "category"
      | "customer"
      | "customers_bulk";
    id: string;
    name?: string;
  } | null>(null);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon> | null>(
    null,
  );
  const [wheelConfig, setWheelConfig] = useState<WheelConfig | null>(null);
  const [wheelPrizes, setWheelPrizes] = useState<WheelPrize[]>([]);
  const [anniversaryUsers, setAnniversaryUsers] = useState<AppUser[]>([]);
  const [customersList, setCustomersList] = useState<AppUser[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(
    new Set(),
  );
  const [editingCustomer, setEditingCustomer] = useState<AppUser | null>(null);

  const handleToggleCustomerStatus = async (user: AppUser) => {
    const newStatus = user.status === "active" ? "paused" : "active";
    const { error } = await db.updateAppUser(user.id, { status: newStatus });
    if (error) {
      toast.error(`Error al actualizar estado`);
    } else {
      toast.success(
        `Usuario ${newStatus === "active" ? "activado" : "pausado"}`,
      );
      setCustomersList((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u)),
      );
    }
  };

  const confirmDeleteCustomer = async (id: string) => {
    const { error } = await db.deleteAppUser(id);
    if (error) {
      toast.error("Error al eliminar el usuario");
    } else {
      toast.success("Usuario eliminado");
      setCustomersList((prev) => prev.filter((u) => u.id !== id));
      setSelectedCustomers((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const confirmBulkDeleteCustomers = async () => {
    let successCount = 0;
    for (const id of selectedCustomers) {
      const { error } = await db.deleteAppUser(id);
      if (!error) successCount++;
    }
    toast.success(`${successCount} usuarios eliminados masivamente`);
    setCustomersList((prev) =>
      prev.filter((u) => !selectedCustomers.has(u.id)),
    );
    setSelectedCustomers(new Set());
  };

  const handleDeleteCustomer = (id: string, email: string) => {
    setItemToDelete({ type: "customer", id, name: email });
  };

  const handleBulkDeleteCustomers = () => {
    if (selectedCustomers.size === 0) return;
    setItemToDelete({
      type: "customers_bulk",
      id: "bulk",
      name: selectedCustomers.size.toString(),
    });
  };

  const handleToggleSelectCustomer = (id: string) => {
    const newSelected = new Set(selectedCustomers);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCustomers(newSelected);
  };

  const handleSelectAllCustomers = () => {
    if (
      selectedCustomers.size === customersList.length &&
      customersList.length > 0
    ) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(customersList.map((u) => u.id)));
    }
  };

  const [isSavingWheel, setIsSavingWheel] = useState(false);
  const [isUpdatingPrize, setIsUpdatingPrize] = useState<string | null>(null);

  const DAYS = [
    { id: "monday", label: "Lunes" },
    { id: "tuesday", label: "Martes" },
    { id: "wednesday", label: "Miércoles" },
    { id: "thursday", label: "Jueves" },
    { id: "friday", label: "Viernes" },
    { id: "saturday", label: "Sábado" },
    { id: "sunday", label: "Domingo" },
  ];

  const defaultDetailedHours = DAYS.reduce(
    (acc, day) => ({
      ...acc,
      [day.id]: {
        enabled: true,
        shifts: [
          { open: "08:00", close: "12:00" },
          { open: "14:00", close: "22:00" },
        ],
      },
    }),
    {},
  );

  const [drivers, setDrivers] = useState<Record<string, any>>({});

  const [driversList, setDriversList] = useState<
    (AppUser & { profile: DriverProfile })[]
  >([]);

  const handleAddTable = async () => {
    if (!restaurant) return;

    let newTablesToAdd: string[] = [];

    if (tableCreationMode === "single") {
      if (!newTableName.trim()) return;
      newTablesToAdd = [newTableName.trim()];
    } else {
      if (bulkTableCount < 1) return;
      for (let i = 1; i <= bulkTableCount; i++) {
        newTablesToAdd.push(`${bulkTablePrefix.trim()} ${i}`);
      }
    }

    const existingTables = restaurant.tables || [];
    const uniqueNewTables = newTablesToAdd.filter(
      (t) => !existingTables.includes(t),
    );

    if (uniqueNewTables.length === 0) {
      toast.error("Las mesas ya existen");
      return;
    }

    const updatedTables = [...existingTables, ...uniqueNewTables];

    try {
      await db.updateRestaurant(restaurant.id, { tables: updatedTables });
      setRestaurant({ ...restaurant, tables: updatedTables });
      setNewTableName("");
      setBulkTableCount(1);
      setIsAddingTable(false);
      toast.success(
        `${uniqueNewTables.length} mesa(s) añadida(s) correctamente`,
      );
    } catch (error) {
      toast.error("Error al añadir mesas");
    }
  };

  const handleDeleteTable = async (tableName: string) => {
    setItemToDelete({ type: "table", id: tableName, name: tableName });
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon || !restaurant) return;

    try {
      await db.saveCoupon({
        ...editingCoupon,
        restaurantId: restaurant.id,
      });
      toast.success(
        editingCoupon.id ? "Cupón actualizado" : "Cupón creado con éxito",
      );
      setEditingCoupon(null);
      // Refresh coupons
      const updatedCoupons = await db.getCoupons(restaurant.id);
      setCoupons(updatedCoupons);
    } catch (error: any) {
      console.error("Error saving coupon:", error);
      toast.error(
        `Error al guardar el cupón: ${error.message || "Intente nuevamente"}`,
      );
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este cupón?")) return;
    try {
      await db.deleteCoupon(id);
      toast.success("Cupón eliminado");
      setCoupons(coupons.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Error deleting coupon:", error);
      toast.error("Error al eliminar el cupón");
    }
  };

  const confirmDeleteTable = async (tableName: string) => {
    if (!restaurant) return;
    const updatedTables = (restaurant.tables || []).filter(
      (t) => t !== tableName,
    );
    try {
      await db.updateRestaurant(restaurant.id, { tables: updatedTables });
      setRestaurant({ ...restaurant, tables: updatedTables });
      toast.success("Mesa eliminada");
    } catch (error) {
      toast.error("Error al eliminar mesa");
    }
  };

  const handleEditTable = async () => {
    if (!restaurant || !editingTableOriginal || !editingTableName.trim())
      return;

    const newName = editingTableName.trim();
    if (newName === editingTableOriginal) {
      setEditingTableOriginal(null);
      return;
    }

    const existingTables = restaurant.tables || [];
    if (existingTables.includes(newName)) {
      toast.error("Ya existe una mesa con ese nombre");
      return;
    }

    const updatedTables = existingTables.map((t) =>
      t === editingTableOriginal ? newName : t,
    );

    try {
      await db.updateRestaurant(restaurant.id, { tables: updatedTables });
      setRestaurant({ ...restaurant, tables: updatedTables });
      setEditingTableOriginal(null);
      setEditingTableName("");
      toast.success("Mesa actualizada correctamente");
    } catch (error) {
      toast.error("Error al actualizar mesa");
    }
  };

  const isFetchingRef = React.useRef(false);

  const fetchData = async (retryCount = 0) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    console.log(
      `AdminDashboard: fetchData called (attempt ${retryCount + 1})`,
      { urlRestaurantId, user: user?.id, appUserRole: appUser?.role },
    );
    if (!user) {
      console.log("AdminDashboard: no user, returning early");
      return;
    }

    try {
      let r: Restaurant | null = null;

      if (urlRestaurantId) {
        console.log(
          "AdminDashboard: Fetching specific restaurant by ID:",
          urlRestaurantId,
        );
        r = await db.getRestaurant(urlRestaurantId);

        // Security check: if not admin, must be owner or a representative who affiliated the restaurant
        let isAuthorizedRepresentative = false;
        if (appUser?.role === "representative" && r) {
          try {
            const { data: ownerUser, error: ownerErr } = await supabase
              .from("app_users")
              .select("referred_by")
              .eq("id", (r as any).owner_id || r.ownerId)
              .maybeSingle();
            
            if (!ownerErr && ownerUser && ownerUser.referred_by === user?.id) {
              isAuthorizedRepresentative = true;
              console.log("AdminDashboard: Authorized representative access to affiliated restaurant:", urlRestaurantId);
            }
          } catch (repErr) {
            console.error("Error verifying representative affiliation:", repErr);
          }
        }

        if (r && appUser?.role !== "admin" && !isAuthorizedRepresentative && r.ownerId !== user?.id) {
          console.warn(
            "AdminDashboard: Unauthorized access attempt to restaurant:",
            urlRestaurantId,
          );
          toast.error("No tienes permiso para gestionar este restaurante");
          navigate("/admin");
          return;
        }
      } else {
        console.log("AdminDashboard: fetching restaurant by owner");
        if (appUser?.role === "representative") {
          console.warn("AdminDashboard: Representative accessed /admin without ID. Redirecting to /representative.");
          toast.info("Por favor selecciona un restaurante para administrar desde tu panel comercial.");
          navigate("/representative");
          return;
        }
        r = await db.getRestaurantByOwner(user.id);
      }

      console.log(
        "AdminDashboard: restaurant fetched result:",
        r ? "found" : "not found",
      );

      // If not found and it's a restaurant user, retry a couple of times before giving up or creating
      if (
        !r &&
        !urlRestaurantId &&
        retryCount < 2 &&
        (appUser?.role === "restaurant" || appUser?.role === "admin")
      ) {
        console.log(
          `AdminDashboard: Restaurant not found, retrying in 1.5s... (retry ${retryCount + 1}/2)`,
        );
        setTimeout(() => fetchData(retryCount + 1), 1500);
        return;
      }

      if (
        !r &&
        !urlRestaurantId &&
        (appUser?.role === "restaurant" || appUser?.role === "admin")
      ) {
        console.log(
          "AdminDashboard: no restaurant found after retries, checking again before creating",
        );
        // Double check with a direct query to be absolutely sure
        const { data: existing, error: checkError } = await supabase
          .from("restaurants")
          .select("id")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (checkError) {
          console.error(
            "AdminDashboard: Error checking for existing restaurant:",
            checkError,
          );
        }

        if (!existing || existing.length === 0) {
          console.log("AdminDashboard: confirmed no restaurant, creating one");
          const metadata = user.user_metadata;
          const bType = metadata?.business_type;
          const validBusinessType =
            bType === "physical" || bType === "online" ? bType : "physical";

          const { data, error: saveError } = await db.saveRestaurant(
            {
              id: "",
              name:
                metadata?.restaurant_name ||
                metadata?.full_name ||
                "Mi Restaurante",
              type: metadata?.restaurant_type || "Comida Rápida",
              description: "El mejor lugar para comer.",
              logo: "",
              coverImage: "",
              phone: metadata?.phone || "573000000000",
              address: metadata?.address || "",
              businessType: validBusinessType,
              handlesPromotions:
                metadata?.handles_promotions === true ||
                metadata?.handles_promotions === "true",
              hasDelivery:
                metadata?.has_delivery !== false &&
                metadata?.has_delivery !== "false",
              banners: [],
              openingHours: "Lun - Dom: 8am - 10pm",
              detailedHours: defaultDetailedHours,
              whatsappNumber: metadata?.phone || "",
              aiKnowledge: {
                instructions: "",
                openingHours: "",
                allergens: "",
                popularDishes: "",
                peakHours: "",
                foodTypes: "",
                promotions: "",
                coupons: "",
              },
            },
            user.id,
          );

          if (saveError) {
            console.error(
              "AdminDashboard: error saving restaurant:",
              saveError,
            );
            toast.error("Error al crear el perfil del restaurante");
          }
          if (data) {
            console.log(
              "AdminDashboard: New restaurant created successfully",
              data.id,
            );
            r = await db.getRestaurantByOwner(user.id);
          }
        } else {
          // If it existed after all, fetch it properly
          console.log(
            "AdminDashboard: Restaurant actually exists, fetching it now",
          );
          r = await db.getRestaurantByOwner(user.id);
        }
      }

      if (r) {
        console.log("AdminDashboard: fetching data for restaurant", r.id);

        // Use Promise.allSettled for more resilient data fetching
        const fetchResults = await Promise.allSettled([
          db.getRestaurantMenu(r.id),
          db.getRestaurantOrders(r.id),
          db.getCategories(r.id),
          db.getRestaurantReviews(r.id),
          db.getRestaurantDrivers(r.id),
          db.getPlans(),
          db.getRestaurantSubscription(r.id),
          db.getPlatformInvoices(r.id),
          db.getPlatformSettings(),
          db.getRestaurantSupportTickets(r.id),
          db.getScheduledNotifications(),
          db.getWheelConfig(r.id),
          db.getRestaurantWheelPrizes(r.id),
          db.getAppUsers(),
          db.getCoupons(r.id),
        ]);

        const getValue = <T,>(idx: number, fallback: T): T => {
          const res = fetchResults[idx];
          if (res.status === "rejected") {
            console.error(
              `AdminDashboard: Error fetching data at index ${idx}:`,
              res.reason,
            );
            return fallback;
          }
          return res.value as T;
        };

        const menu = getValue<Product[]>(0, []);
        const restaurantOrders = getValue<Order[]>(1, []);
        const restaurantCategories = getValue<Category[]>(2, []);
        const restaurantReviews = getValue<Review[]>(3, []);
        const restaurantDrivers = getValue<
          (AppUser & { profile: DriverProfile })[]
        >(4, []);
        const plans = getValue<Plan[]>(5, []);
        const sub = getValue<RestaurantSubscription | null>(6, null);
        const bills = getValue<PlatformInvoice[]>(7, []);
        const settings = getValue<any>(8, null);
        const tickets = getValue<SupportTicket[]>(9, []);
        const scheduledData = getValue<any[]>(10, []);
        const wheelData = getValue<WheelConfig | null>(11, null);
        const prizesData = getValue<WheelPrize[]>(12, []);
        const allUsersData = getValue<AppUser[]>(13, []);
        const couponsData = getValue<Coupon[]>(14, []);

        // Filter users who have ordered at this restaurant AND have an anniversary today
        const userIdsWithOrders = new Set(
          restaurantOrders.map((o) => o.customerId).filter(Boolean),
        );
        const today = new Date();
        const currentDay = today.getDate();
        const currentMonth = today.getMonth();

        const celebrateUsers = allUsersData.filter((u) => {
          if (!userIdsWithOrders.has(u.id)) return false;

          // Check Birthday
          if (u.birthDate) {
            const birth = new Date(u.birthDate + "T12:00:00");
            if (
              birth.getDate() === today.getDate() &&
              birth.getMonth() === today.getMonth()
            )
              return true;
          }

          // Check Extra Anniversaries
          return u.anniversaries?.some((ann) => {
            if (!ann.date) return false;
            const annDate = new Date(ann.date + "T12:00:00");
            return (
              annDate.getDate() === today.getDate() &&
              annDate.getMonth() === today.getMonth()
            );
          });
        });

        setAnniversaryUsers(celebrateUsers);

        const restaurantUsers = allUsersData.filter((u) =>
          userIdsWithOrders.has(u.id),
        );
        setCustomersList(restaurantUsers);

        setScheduledNotes(
          (scheduledData || []).filter((s: any) => s.restaurantId === r?.id),
        );
        setWheelConfig(wheelData);
        setWheelPrizes(prizesData);

        setRestaurant({
          ...r,
          menu,
          detailedHours:
            r.detailedHours && Object.keys(r.detailedHours).length > 0
              ? r.detailedHours
              : defaultDetailedHours,
        });
        setOrders(restaurantOrders);
        setCategories(restaurantCategories);
        setReviews(restaurantReviews);
        setDriversList(restaurantDrivers);
        setAvailablePlans(plans);
        setSubscription(sub);
        setRestaurantInvoices(bills);
        setPlatformSettings(settings);
        setSupportTickets(tickets);
        setCoupons(couponsData || []);
        console.log("AdminDashboard: data loaded and state updated");

        // Fetch driver names for orders that have a driver assigned
        const driverIds = [
          ...new Set(
            restaurantOrders.filter((o) => o.driverId).map((o) => o.driverId),
          ),
        ];
        if (driverIds.length > 0) {
          const driverProfiles = await Promise.all(
            driverIds.map((id) => db.getDriverProfile(id!)),
          );
          const driverMap: Record<string, any> = {};
          driverProfiles.forEach((p) => {
            if (p) driverMap[p.id] = p;
          });

          // Also fetch app_user data for display names
          const { data: userData } = await supabase
            .from("app_users")
            .select("id, display_name")
            .in("id", driverIds);
          if (userData) {
            userData.forEach((u) => {
              if (driverMap[u.id]) {
                driverMap[u.id].displayName = u.display_name;
              }
            });
          }
          setDrivers(driverMap);
        }
      }
    } catch (error) {
      console.error("Error fetching restaurant data:", error);
    } finally {
      console.log("AdminDashboard: setting loading to false");
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    let cleanupOrders: (() => void) | undefined;
    let cleanupNotifs: (() => void) | undefined;

    if (restaurant?.id) {
      // 1. Subscribe to real-time order updates
      cleanupOrders = db.subscribeToRestaurantOrders(
        restaurant.id,
        (updatedOrders) => {
          setOrders(updatedOrders);
        },
      );

      // 2. Subscribe to real-time wheel prize updates (winners tray)
      const cleanupPrizes = db.subscribeToWheelPrizes(
        restaurant.id,
        (updatedPrizes) => {
          setWheelPrizes(updatedPrizes);
        },
      );

      // 3. Subscribe to real-time new orders (INSERT) for notifications
      const newOrderSubscription = supabase
        .channel(`admin-orders-insert-${restaurant.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "orders",
            filter: `restaurant_id=eq.${restaurant.id}`,
          },
          (payload) => {
            toast.success(
              `¡Nuevo pedido de ${payload.new.customer_name || "Invitado"}!`,
              {
                description: "Revisa tu panel de pedidos.",
                duration: 5000,
              },
            );
            try {
              const ctx = new (
                window.AudioContext || (window as any).webkitAudioContext
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
          },
        )
        .subscribe();

      // 3. Subscription to internal notifications is handled by NotificationContext
      // No need for manual subscription here as it was causing TS errors

      return () => {
        if (cleanupOrders) cleanupOrders();
        if (cleanupPrizes) cleanupPrizes();
        supabase.removeChannel(newOrderSubscription);
      };
    }
  }, [restaurant?.id, user?.id]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (user && appUser) {
      fetchData();
      // Safety timeout for fetchData
      timeoutId = setTimeout(() => {
        if (loading) {
          console.warn("AdminDashboard fetchData timed out");
          setLoading(false);
        }
      }, 6000);
    } else if (!authLoading) {
      setLoading(false);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user?.id, appUser?.role, authLoading, urlRestaurantId]);

  const sidebarGroups = React.useMemo(
    () => [
      {
        title: "Pedidos",
        items: [
          {
            id: "orders",
            label: "Pedidos Activos",
            icon: ShoppingBag,
            badge: orders.filter(
              (o) => o.status === "pending" || o.status === "preparing",
            ).length,
            inactiveColor: "text-emerald-500",
            activeClass:
              "text-emerald-600 bg-emerald-50 shadow-[0_8px_16px_rgba(16,185,129,0.2)] drop-shadow-md border border-emerald-100",
          },
        ],
      },
    {
      title: "Principal",
      items: [
        {
          id: "overview",
          label: "Resumen",
          icon: TrendingUp,
          inactiveColor: "text-blue-500",
          activeClass:
            "text-blue-600 bg-blue-50 shadow-[0_8px_16px_rgba(37,99,235,0.2)] drop-shadow-md border border-blue-100",
        },
        {
          id: "traffic",
          label: "Visitas y Métricas",
          icon: Activity,
          inactiveColor: "text-rose-500",
          activeClass:
            "text-rose-600 bg-rose-50 shadow-[0_8px_16px_rgba(225,29,72,0.2)] drop-shadow-md border border-rose-100",
        },
        {
          id: "sales",
          label: "Ventas y Ganancias",
          icon: DollarSign,
          inactiveColor: "text-green-500",
          activeClass:
            "text-green-600 bg-green-50 shadow-[0_8px_16px_rgba(34,197,94,0.2)] drop-shadow-md border border-green-100",
        },
        {
          id: "drivers",
          label: "Repartidores",
          icon: Truck,
          inactiveColor: "text-amber-500",
          activeClass:
            "text-amber-600 bg-amber-50 shadow-[0_8px_16px_rgba(245,158,11,0.2)] drop-shadow-md border border-amber-100",
        },
        {
          id: "reviews",
          label: "Reseñas",
          icon: Star,
          inactiveColor: "text-yellow-500",
          activeClass:
            "text-yellow-600 bg-yellow-50 shadow-[0_8px_16px_rgba(234,179,8,0.2)] drop-shadow-md border border-yellow-100",
        },
      ],
    },
    {
      title: "Catálogo",
      items: [
        {
          id: "menu",
          label: "Menú Digital",
          icon: LayoutList,
          inactiveColor: "text-violet-500",
          activeClass:
            "text-violet-600 bg-violet-50 shadow-[0_8px_16px_rgba(139,92,246,0.2)] drop-shadow-md border border-violet-100",
        },
        {
          id: "categories",
          label: "Categorías",
          icon: LayoutList,
          inactiveColor: "text-fuchsia-500",
          activeClass:
            "text-fuchsia-600 bg-fuchsia-50 shadow-[0_8px_16px_rgba(217,70,239,0.2)] drop-shadow-md border border-fuchsia-100",
        },
        {
          id: "banners",
          label: "Banners Publi",
          icon: ImageIcon,
          inactiveColor: "text-pink-500",
          activeClass:
            "text-pink-600 bg-pink-50 shadow-[0_8px_16px_rgba(236,72,153,0.2)] drop-shadow-md border border-pink-100",
        },
      ],
    },
    {
      title: "Herramientas",
      items: [
        {
          id: "qr",
          label: "Código QR",
          icon: QrCodeIcon,
          inactiveColor: "text-sky-500",
          activeClass:
            "text-sky-600 bg-sky-50 shadow-[0_8px_16px_rgba(14,165,233,0.2)] drop-shadow-md border border-sky-100",
        },
        {
          id: "ai",
          label: "Configuración IA",
          icon: Brain,
          inactiveColor: "text-indigo-500",
          activeClass:
            "text-indigo-600 bg-indigo-50 shadow-[0_8px_16px_rgba(99,102,241,0.2)] drop-shadow-md border border-indigo-100",
        },
      ],
    },
    {
      title: "Crecimiento",
      items: [
        {
          id: "meta_social",
          label: "Creador de Posts Meta",
          icon: Share2,
          badge: "NUEVO",
          inactiveColor: "text-blue-500",
          activeClass:
            "text-blue-600 bg-blue-50 shadow-[0_8px_16px_rgba(59,130,246,0.2)] drop-shadow-md border border-blue-100",
        },
        {
          id: "ai_marketing",
          label: "Estrategias IA",
          icon: BrainCircuit,
          inactiveColor: "text-purple-500",
          activeClass:
            "text-purple-600 bg-purple-50 shadow-[0_8px_16px_rgba(168,85,247,0.2)] drop-shadow-md border border-purple-100",
        },
        {
          id: "marketing",
          label: "Marketing Push",
          icon: BellRing,
          inactiveColor: "text-rose-500",
          activeClass:
            "text-rose-600 bg-rose-50 shadow-[0_8px_16px_rgba(244,63,94,0.2)] drop-shadow-md border border-rose-100",
        },
        {
          id: "loyalty",
          label: "Gamificación",
          icon: Gamepad2,
          badge: restaurant?.gamificationEnabled ? "ACTIVO" : undefined,
          inactiveColor: "text-orange-500",
          activeClass:
            "text-orange-600 bg-orange-50 shadow-[0_8px_16px_rgba(249,115,22,0.2)] drop-shadow-md border border-orange-100",
        },
        {
          id: "merit_tasks",
          label: "Tareas de Nivel",
          icon: Trophy,
          inactiveColor: "text-amber-500",
          activeClass:
            "text-amber-600 bg-amber-50 shadow-[0_8px_16px_rgba(245,158,11,0.2)] drop-shadow-md border border-amber-100",
        },
        {
          id: "coupons",
          label: "Cupones",
          icon: Ticket,
          inactiveColor: "text-rose-500",
          activeClass:
            "text-rose-600 bg-rose-50 shadow-[0_8px_16px_rgba(244,63,94,0.2)] drop-shadow-md border border-rose-100",
        },
        {
          id: "anniversaries",
          label: "Aniversarios",
          icon: Heart,
          inactiveColor: "text-rose-400",
          activeClass:
            "text-rose-600 bg-rose-50 shadow-[0_8px_16px_rgba(225,29,72,0.2)] drop-shadow-md border border-rose-100",
          badge:
            anniversaryUsers.length > 0 ? anniversaryUsers.length : undefined,
        },
      ],
    },
    {
      title: "Fidelización",
      items: [
        {
          id: "wheel",
          label: "Ruleta Premios",
          icon: RefreshCcw,
          inactiveColor: "text-emerald-500",
          activeClass:
            "text-emerald-600 bg-emerald-50 shadow-[0_8px_16px_rgba(16,185,129,0.2)] drop-shadow-md border border-emerald-100",
        },
        {
          id: "wheel_prizes",
          label: "Ganadores Ruleta",
          icon: Trophy,
          inactiveColor: "text-teal-500",
          activeClass:
            "text-teal-600 bg-teal-50 shadow-[0_8px_16px_rgba(20,184,166,0.2)] drop-shadow-md border border-teal-100",
        },
        {
          id: "customers",
          label: "Mis Clientes",
          icon: Users,
          inactiveColor: "text-cyan-500",
          activeClass:
            "text-cyan-600 bg-cyan-50 shadow-[0_8px_16px_rgba(6,182,212,0.2)] drop-shadow-md border border-cyan-100",
        },
      ],
    },
    {
      title: "Ajustes",
      items: [
        {
          id: "settings",
          label: "Configuración",
          icon: Store,
          inactiveColor: "text-slate-500",
          activeClass:
            "text-slate-600 bg-slate-50 shadow-[0_8px_16px_rgba(100,116,139,0.2)] drop-shadow-md border border-slate-100",
        },
        {
          id: "payments",
          label: "Pasarelas",
          icon: CreditCard,
          inactiveColor: "text-emerald-500",
          activeClass:
            "text-emerald-600 bg-emerald-50 shadow-[0_8px_16px_rgba(16,185,129,0.2)] drop-shadow-md border border-emerald-100",
        },
        {
          id: "billing",
          label: "Plan y Facturación",
          icon: FileText,
          inactiveColor: "text-blue-500",
          activeClass:
            "text-blue-600 bg-blue-50 shadow-[0_8px_16px_rgba(37,99,235,0.2)] drop-shadow-md border border-blue-100",
        },
        {
          id: "support",
          label: "Soporte Clientes",
          icon: MessageSquare,
          inactiveColor: "text-rose-500",
          activeClass:
            "text-rose-600 bg-rose-50 shadow-[0_8px_16px_rgba(244,63,94,0.2)] drop-shadow-md border border-rose-100",
        },
      ],
    },
  ], [orders, anniversaryUsers.length]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!restaurant) {
    const handleCreateRestaurant = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const metadata = user.user_metadata;
        const bType = metadata?.business_type;
        const validBusinessType =
          bType === "physical" || bType === "online" ? bType : "physical";

        const { data, error } = await db.saveRestaurant(
          {
            id: "",
            name:
              metadata?.restaurant_name ||
              metadata?.full_name ||
              "Mi Restaurante",
            type: metadata?.restaurant_type || "Comida Rápida",
            description: "El mejor lugar para comer.",
            logo: "",
            coverImage: "",
            phone: metadata?.phone || "573000000000",
            address: metadata?.address || "",
            businessType: validBusinessType,
            handlesPromotions:
              metadata?.handles_promotions === true ||
              metadata?.handles_promotions === "true",
            hasDelivery:
              metadata?.has_delivery !== false &&
              metadata?.has_delivery !== "false",
            banners: [],
            openingHours: "Lun - Dom: 8am - 10pm",
            whatsappNumber: metadata?.phone || "",
          },
          user.id,
        );

        if (error) {
          toast.error("Error al crear el restaurante: " + error.message);
          console.error(
            "AdminDashboard: Error creating restaurant manually:",
            error,
          );
        } else if (data) {
          toast.success("Restaurante creado exitosamente");
          fetchData(); // Reload data
        }
      } catch (err: any) {
        toast.error("Ocurrió un error inesperado");
        console.error(
          "AdminDashboard: Exception creating restaurant manually:",
          err,
        );
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-orange-50 p-6 rounded-full mb-4">
          <Store className="w-12 h-12 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-on-surface mb-2">
          No tienes un restaurante asignado
        </h2>
        <p className="text-on-surface-muted max-w-md mb-6">
          {appUser?.role === "admin"
            ? "Eres administrador de la plataforma. Si deseas gestionar un restaurante de prueba, puedes crearlo aquí."
            : "Parece que tu cuenta tiene el rol de restaurante, pero aún no se ha creado el perfil de tu negocio."}
        </p>
        <button
          onClick={handleCreateRestaurant}
          className="px-6 py-3 bg-orange-600 text-on-surface rounded-xl font-medium hover:bg-orange-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Crear mi restaurante ahora
        </button>
      </div>
    );
  }

  const handleImproveDescription = async () => {
    if (!editingProduct) return;
    setIsImproving(true);
    try {
      const improved = await suggestMenuImprovements(
        editingProduct.name,
        editingProduct.description,
      );
      setEditingProduct({ ...editingProduct, description: improved });
    } catch (e) {
      console.error(e);
    } finally {
      setIsImproving(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!editingProduct || !restaurant) return;

    // Ensure category name is synced with categoryId
    const categoryName =
      categories.find((c) => c.id === editingProduct.categoryId)?.name ||
      editingProduct.category;
    const productToSave = { ...editingProduct, category: categoryName };

    console.log("Saving product:", productToSave);
    const { error } = await db.saveProduct(productToSave, restaurant.id);
    if (!error) {
      toast.success("Producto guardado");
      fetchData();
      setEditingProduct(null);
    } else {
      console.error("Error saving product:", error);
      toast.error(
        `Error al guardar el producto: ${error.message || "Error desconocido"}`,
      );
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !restaurant || !editingProduct) return;

    setIsUploading(true);
    try {
      const { url, error } = await db.uploadImage(
        file,
        `restaurants/${restaurant.id}/products`,
      );
      if (error) throw error;
      if (url) {
        setEditingProduct((prev) => (prev ? { ...prev, images: [url] } : prev));
        toast.success("Imagen subida correctamente");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(
        "Error al subir la imagen. Verifica la configuración de almacenamiento.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleRestaurantFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "coverImage",
  ) => {
    const file = e.target.files?.[0];
    if (!file || !restaurant) return;

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setRestaurant((prev) =>
          prev ? { ...prev, [type]: event.target?.result as string } : prev,
        );
      }
    };
    reader.readAsDataURL(file);

    if (type === "logo") setIsUploadingLogo(true);
    else setIsUploadingCover(true);
    setIsUploading(true);

    try {
      console.log(`AdminDashboard: Uploading ${type}...`);
      const { url, error } = await db.uploadImage(
        file,
        `restaurants/${restaurant.id}/assets`,
      );
      if (error) {
        console.error(`AdminDashboard: Error uploading ${type}:`, error);
        throw error;
      }
      if (url) {
        console.log(`AdminDashboard: ${type} uploaded successfully:`, url);
        // Update local state first to show the preview immediately
        setRestaurant((prev) => {
          const updated = prev ? { ...prev, [type]: url } : prev;
          console.log("AdminDashboard: Updating restaurant state:", updated);
          return updated;
        });

        // Also update database for this specific field to prevent data loss if fetchData runs
        console.log(`AdminDashboard: Updating database for ${type}...`);
        await db.updateRestaurant(restaurant.id, { [type]: url });

        toast.success(
          type === "logo"
            ? "Logo actualizado"
            : "Imagen de cabecera actualizada",
        );
      } else {
        console.warn(`AdminDashboard: No URL returned for ${type}`);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Error al subir la imagen.");
    } finally {
      if (type === "logo") setIsUploadingLogo(false);
      else setIsUploadingCover(false);
      setIsUploading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const product = restaurant?.menu.find((p) => p.id === id);
    setItemToDelete({ type: "product", id, name: product?.name });
  };

  const confirmDeleteProduct = async (id: string) => {
    await db.deleteProduct(id);
    toast.success("Producto eliminado");
    fetchData();
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    status: Order["status"],
  ) => {
    // Update locally first for immediate feedback
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
    );

    const { error } = await db.updateOrderStatus(orderId, status);
    if (!error) {
      toast.success(`Pedido ${status.toUpperCase()} exitosamente`);

      const order = orders.find((o) => o.id === orderId);

      // Automatic Commission Billing
      if (status === "completed" && order && restaurant) {
        try {
          const commissionAmount =
            (order.total * (restaurant.commissionRate || 5)) / 100;
          if (commissionAmount > 0) {
            await db.savePlatformInvoice({
              restaurantId: restaurant.id,
              amount: commissionAmount,
              description: `Comisión por pedido #${orderId.slice(-6).toUpperCase()}`,
              type: "commission",
              status: "pending",
              dueDate: new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000,
              ).toISOString(), // 7 days to pay
            });
            console.log("Commission invoice generated for order:", orderId);
          }
        } catch (e) {
          console.warn(
            "Commission invoice could not be saved (table might be missing):",
            e,
          );
        }
      }

      // fetchData removed: relying on real-time subscription for orders list updates
    } else {
      toast.error("Error al actualizar el pedido");
    }
  };

  const handleRefundAction = async (
    orderId: string,
    status: "approved" | "rejected",
  ) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, refundStatus: status } : o)),
    );
    const { error } = await db.updateRefundStatus(orderId, status);
    if (!error) {
      toast.success(
        status === "approved" ? "Reembolso aprobado" : "Reembolso rechazado",
      );
      fetchData();
    } else {
      toast.error("Error al procesar la acción de reembolso");
    }
  };

  const handleAssignDriver = async (orderId: string, driverId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, driverId } : o)),
    );
    const { error } = await db.assignDriverToOrder(orderId, driverId);
    if (!error) {
      toast.success("Repartidor asignado exitosamente");
    } else {
      toast.error("Error al asignar repartidor");
    }
  };

  const handleSaveBanner = async () => {
    if (!editingBanner || !restaurant) return;

    const updatedBanners = restaurant.banners ? [...restaurant.banners] : [];
    if (editingBanner.id) {
      const index = updatedBanners.findIndex((b) => b.id === editingBanner.id);
      if (index !== -1) updatedBanners[index] = editingBanner;
    } else {
      updatedBanners.push({ ...editingBanner, id: crypto.randomUUID() });
    }

    try {
      const { error } = await db.updateRestaurant(restaurant.id, {
        banners: updatedBanners,
      });
      if (error) throw error;
      toast.success("Banner guardado");
      fetchData();
      setEditingBanner(null);
    } catch (error) {
      toast.error("Error al guardar el banner");
    }
  };

  const handleDeleteBanner = async (id: string) => {
    setItemToDelete({ type: "banner", id });
  };

  const confirmDeleteBanner = async (id: string) => {
    if (!restaurant) return;
    const updatedBanners = (restaurant.banners || []).filter(
      (b) => b.id !== id,
    );
    try {
      const { error } = await db.updateRestaurant(restaurant.id, {
        banners: updatedBanners,
      });
      if (error) throw error;
      toast.success("Banner eliminado");
      fetchData();
    } catch (error) {
      toast.error("Error al eliminar el banner");
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !restaurant) return;
    try {
      await db.saveCategory({
        restaurantId: restaurant.id,
        name: newCategoryName.trim(),
      });
      toast.success("Categoría creada");
      setNewCategoryName("");
      setIsAddingCategory(false);
      fetchData();
    } catch (error) {
      toast.error("Error al crear la categoría");
    }
  };

  const handleDeleteCategory = (id: string) => {
    const category = categories.find((c) => c.id === id);
    setItemToDelete({ type: "category", id, name: category?.name });
  };

  const confirmDeleteCategory = async (id: string) => {
    try {
      const { error } = await db.deleteCategory(id);
      if (error) throw error;
      toast.success("Categoría eliminada");
      fetchData();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Error al eliminar la categoría.");
    }
  };

  // Mock data for charts
  const salesData = [
    { name: "Lun", sales: 4000, orders: 24 },
    { name: "Mar", sales: 3000, orders: 18 },
    { name: "Mie", sales: 2000, orders: 12 },
    { name: "Jue", sales: 2780, orders: 20 },
    { name: "Vie", sales: 1890, orders: 15 },
    { name: "Sab", sales: 2390, orders: 25 },
    { name: "Dom", sales: 3490, orders: 30 },
  ];

  const pendingRefundsCount = orders.filter(
    (o) => o.refundStatus === "requested",
  ).length;

  const stats = [
    {
      label: "Ventas Totales",
      value: formatCurrency(orders.reduce((sum, o) => sum + o.total, 0)),
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Pedidos Hoy",
      value: orders.length.toString(),
      icon: ShoppingBag,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Ticket Promedio",
      value: formatCurrency(
        orders.length > 0
          ? orders.reduce((sum, o) => sum + o.total, 0) / orders.length
          : 0,
      ),
      icon: TrendingUp,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "Reembolsos",
      value: pendingRefundsCount.toString(),
      icon: AlertCircle,
      color: pendingRefundsCount > 0 ? "text-rose-600" : "text-on-surface-muted",
      bg: pendingRefundsCount > 0 ? "bg-rose-50" : "bg-surface-base",
    },
  ];

  // sidebarGroups defined above to avoid violating React rules of hooks


  const mobileNavItems = [
    {
      id: "overview",
      label: "Inicio",
      icon: LayoutDashboard,
      inactiveColor: "text-blue-500",
      activeClass:
        "text-blue-600 bg-blue-50 shadow-[0_8px_16px_rgba(37,99,235,0.2)] drop-shadow-md border border-blue-100",
    },
    {
      id: "orders",
      label: "Pedidos",
      icon: ShoppingBag,
      inactiveColor: "text-emerald-500",
      activeClass:
        "text-emerald-600 bg-emerald-50 shadow-[0_8px_16px_rgba(16,185,129,0.2)] drop-shadow-md border border-emerald-100",
    },
    {
      id: "marketing",
      label: "Marketing",
      icon: BellRing,
      inactiveColor: "text-rose-500",
      activeClass:
        "text-rose-600 bg-rose-50 shadow-[0_8px_16px_rgba(225,29,72,0.2)] drop-shadow-md border border-rose-100",
    },
    {
      id: "menu",
      label: "Añadir",
      icon: PlusCircle,
      inactiveColor: "text-violet-500",
      activeClass:
        "text-violet-600 bg-violet-50 shadow-[0_8px_16px_rgba(124,58,237,0.2)] drop-shadow-md border border-violet-100",
    },
    {
      id: "more",
      label: "Más",
      icon: MenuIcon,
      inactiveColor: "text-orange-500",
      activeClass:
        "text-orange-600 bg-orange-50 shadow-[0_8px_16px_rgba(249,115,22,0.2)] drop-shadow-md border border-orange-100",
    },
  ];

  return (
    <div className="flex min-h-screen bg-surface-base overflow-hidden relative">
      <DashboardSidebar
        title={restaurant?.name || "Restaurante"}
        subtitle="Panel de Gestión"
        groups={sidebarGroups}
        activeId={activeTab}
        onItemClick={(id) => setActiveTab(id)}
        isMobileOpen={isMobileOpen}
        onMobileOpenChange={setIsMobileOpen}
        showHomeLink={true}
        logo={
          restaurant?.logo ? (
            <img
              src={restaurant.logo}
              className="w-8 h-8 object-cover rounded-lg"
              alt="Logo"
              referrerPolicy="no-referrer"
            />
          ) : undefined
        }
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto pb-24 md:pb-0">
        {/* Header Banner - Android Style */}
        <div className="relative min-h-[16rem] overflow-hidden shrink-0 flex flex-col justify-end z-10">
          {/* Top Quick Actions Bar / Home Button */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-30 flex items-center gap-3">
            {restaurant && (
              <button
                onClick={async () => {
                  const newStatus = restaurant.status === 'active' ? 'inactive' : 'active';
                  setRestaurant(prev => prev ? { ...prev, status: newStatus } : prev);
                  try {
                    await db.updateRestaurant(restaurant.id, { status: newStatus });
                    toast.success(newStatus === 'active' ? 'Restaurante abierto' : 'Pausa de emergencia activada');
                  } catch (e) {
                    toast.error('Error al actualizar el estado');
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 bg-black/30 hover:bg-black/50 active:scale-95 border ${restaurant.status === 'active' ? 'border-emerald-500/50 hover:border-emerald-500 text-emerald-400' : 'border-rose-500/50 hover:border-rose-500 text-rose-400'} rounded-2xl transition-all duration-300 backdrop-blur-md shadow-xl text-xs font-black uppercase tracking-wider group`}
              >
                {restaurant.status === 'active' ? <Store className="w-4 h-4" /> : <AlertCircle className="w-4 h-4 animate-pulse" />}
                <span>{restaurant.status === 'active' ? 'Abierto' : 'Pausado'}</span>
              </button>
            )}
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 bg-black/30 hover:bg-black/50 active:scale-95 border border-white/20 hover:border-white/40 text-on-surface rounded-2xl transition-all duration-300 backdrop-blur-md shadow-xl text-xs font-black uppercase tracking-wider group"
              id="admin_dashboard_to_home_btn"
            >
              <Home className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform duration-300 animate-pulse" />
              <span>Ir a Inicio</span>
            </Link>
          </div>

          <div className="absolute inset-0 bg-gradient-to-br from-orange-700 via-orange-600 to-amber-700 -z-10">
            {restaurant?.coverImage && (
              <img
                src={restaurant.coverImage}
                alt="Cover"
                className="w-full h-full object-cover opacity-50"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.6),transparent_70%)]"></div>
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 3, 0],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-24 -right-24 w-[30rem] h-[30rem] glass-card text-on-surface/10 rounded-full blur-3xl pointer-events-none"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-50 via-neutral-50/10 to-transparent -z-10 pointer-events-none"></div>

          <div className="relative z-20 p-6 sm:p-8 pt-20 flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left mt-auto">
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              className="relative shrink-0"
            >
              <div className="absolute inset-0 bg-orange-500/30 blur-2xl rounded-full"></div>
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl glass-card text-on-surface border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden relative z-10 bg-white">
                {restaurant?.logo ? (
                  <img
                    src={restaurant.logo}
                    alt="Logo"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
                    <Store className="w-12 h-12 text-orange-600" />
                  </div>
                )}
              </div>
            </motion.div>
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex-1 min-w-0 pb-1 flex flex-col items-center sm:items-start"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3 w-full justify-center sm:justify-start">
                <h1 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tighter drop-shadow-sm flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="truncate max-w-full block">{restaurant?.name || "Cargando..."}</span>
                  {restaurant && (
                    <button 
                      onClick={() => setActiveTab("merit_tasks")}
                      className="bg-amber-500 text-amber-950 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-1 hover:bg-amber-400 transition-colors cursor-pointer shrink-0"
                      title="Explora cómo subir de nivel"
                    >
                      <Trophy className="w-3 h-3" />
                      Nivel {calculateRestaurantMeritScore(restaurant, reviews?.length || 0, restaurant.rating || 0, driversList.length, !!subscription?.plan?.id && subscription.plan.id !== "free").level} ({calculateRestaurantMeritScore(restaurant, reviews?.length || 0, restaurant.rating || 0, driversList.length, !!subscription?.plan?.id && subscription.plan.id !== "free").score} XP)
                      <span className="ml-1 bg-white/30 px-1 rounded text-[8px] leading-tight">Ver Tareas</span>
                    </button>
                  )}
                  {restaurant?.gamificationEnabled && (
                    <span className="bg-emerald-500 text-emerald-950 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm shrink-0">
                      Gamificación
                    </span>
                  )}
                </h1>
                {appUser?.role === "admin" && (
                  <Link
                    to="/platform"
                    className="bg-surface-variant text-on-surface px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-surface-light transition-colors w-fit shrink-0"
                  >
                    Panel Global
                  </Link>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <span className="bg-orange-600 text-white px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                  Panel de Control
                </span>
                <span className="text-on-surface-muted text-sm font-bold glass-card text-on-surface/50 backdrop-blur-sm px-3 py-1 rounded-xl border border-white/50">
                  {restaurant?.type || "Restaurante"}
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="px-6 sm:px-12 w-full flex flex-col gap-8 pb-24">
          {/* Short Header Info (Replacing horizontal nav for quick info if needed) */}
          {!["overview", "settings"].includes(activeTab) && (
            <div className="shrink-0 -mt-6 relative z-20">
              <div className="glass-card text-on-surface/80 backdrop-blur-xl p-4 rounded-xl shadow-lg border border-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                    {(() => {
                      const Icon = sidebarGroups
                        .flatMap((g) => g.items)
                        .find((i) => i.id === activeTab)?.icon;
                      return Icon ? <Icon className="w-5 h-5" /> : null;
                    })()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-black text-on-surface uppercase tracking-widest leading-none mb-1 truncate">
                      {
                        sidebarGroups
                          .flatMap((g) => g.items)
                          .find((i) => i.id === activeTab)?.label
                      }
                    </h2>
                    <p className="text-[10px] text-on-surface-muted font-bold uppercase tracking-widest truncate">
                      {restaurant?.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <a
                    href={getPublicUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-surface-variant text-on-surface rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-surface-light transition-all shadow-lg shadow-neutral-100 group whitespace-nowrap"
                  >
                    <ExternalLink className="w-3 h-3 group-hover:rotate-12 transition-transform" />
                    Página Pública
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {activeTab === "drivers" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-black text-on-surface">
                      Mis Repartidores
                    </h2>
                    <div className="flex gap-4">
                      <div className="glass-card text-on-surface px-4 py-2 rounded-xl border border-outline shadow-sm flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-xs font-bold text-on-surface-muted">
                          {driversList.filter((d) => d.profile.isOnline).length}{" "}
                          En línea
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {driversList.length === 0 ? (
                      <div className="col-span-full py-12 text-center glass-card text-on-surface rounded-[2rem] border-2 border-dashed border-outline">
                        <Truck className="w-12 h-12 text-on-surface-variant mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-on-surface">
                          No tienes repartidores vinculados
                        </h3>
                        <p className="text-on-surface-muted max-w-xs mx-auto mt-2">
                          Los repartidores pueden vincularse a tu restaurante
                          durante su registro.
                        </p>
                      </div>
                    ) : (
                      driversList.map((driver) => (
                        <motion.div
                          key={driver.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="glass-card p-6 rounded-[2rem] border border-outline shadow-sm hover:shadow-xl transition-all group"
                        >
                          <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-2xl bg-surface-variant overflow-hidden border-2 border-white shadow-md">
                                {driver.profile.profilePhoto ? (
                                  <img
                                    src={driver.profile.profilePhoto}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <Users className="w-8 h-8 text-on-surface-variant m-4" />
                                )}
                              </div>
                              <div>
                                <h3 className="font-black text-on-surface group-hover:text-orange-600 transition-colors">
                                  {driver.displayName || "Sin nombre"}
                                </h3>
                                <p className="text-xs font-bold text-on-surface-muted">
                                  {driver.email}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span
                                    className={`w-2 h-2 rounded-full ${driver.profile.isOnline ? "bg-emerald-500" : "bg-neutral-300"}`}
                                  ></span>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-muted">
                                    {driver.profile.isOnline
                                      ? "En línea"
                                      : "Desconectado"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="bg-surface-base p-4 rounded-2xl border border-outline grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-1">
                                  Vehículo
                                </p>
                                <div className="flex items-center gap-2 text-on-surface">
                                  {driver.profile.vehicleType ===
                                    "motorcycle" && (
                                    <Bike className="w-4 h-4" />
                                  )}
                                  {driver.profile.vehicleType ===
                                    "motocarro" && (
                                    <Truck className="w-4 h-4" />
                                  )}
                                  {driver.profile.vehicleType === "bicycle" && (
                                    <Bike className="w-4 h-4" />
                                  )}
                                  {driver.profile.vehicleType === "car" && (
                                    <Car className="w-4 h-4" />
                                  )}
                                  <span className="text-xs font-bold capitalize">
                                    {driver.profile.vehicleType}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-1">
                                  Placa
                                </p>
                                <p className="text-xs font-mono font-bold text-on-surface">
                                  {driver.profile.licensePlate || "N/A"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                              <div className="flex flex-col">
                                <p className="text-[10px] font-black text-on-surface-muted uppercase tracking-widest">
                                  Estado Aprobación
                                </p>
                                <span
                                  className={`text-[10px] font-black uppercase tracking-widest mt-1 ${
                                    driver.profile.approvalStatus === "approved"
                                      ? "text-emerald-600"
                                      : driver.profile.approvalStatus ===
                                          "rejected"
                                        ? "text-rose-600"
                                        : "text-amber-600"
                                  }`}
                                >
                                  {driver.profile.approvalStatus === "approved"
                                    ? "Aprobado"
                                    : driver.profile.approvalStatus ===
                                        "rejected"
                                      ? "Rechazado"
                                      : "Pendiente"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="p-2 bg-orange-50 rounded-lg">
                                  <ShoppingBag className="w-4 h-4 text-orange-600" />
                                </div>
                                <div className="flex flex-col">
                                  <p className="text-[10px] font-black text-on-surface-muted uppercase tracking-widest">
                                    Entregas
                                  </p>
                                  <p className="text-sm font-black text-on-surface">
                                    {
                                      orders.filter(
                                        (o) =>
                                          o.driverId === driver.id &&
                                          o.status === "completed",
                                      ).length
                                    }
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              )}
              {activeTab === "traffic" && (
                <div className="mb-6">
                  <AdminTrafficDashboard isRestaurantAdmin={true} restaurant={restaurant} />
                </div>
              )}
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, idx) => (
                      <div
                        key={idx}
                        className={`${stat.bg} p-6 rounded-2xl border border-white shadow-sm`}
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <div
                            className={`p-3 glass-card rounded-2xl shadow-sm ${stat.color}`}
                          >
                            <stat.icon className="w-6 h-6" />
                          </div>
                          <h3 className="font-black text-sm uppercase tracking-widest text-on-surface-muted">
                            {stat.label}
                          </h3>
                        </div>
                        <p className={`text-3xl font-black ${stat.color}`}>
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "sales" && (
                <motion.div
                  key="sales"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="glass-card p-8 rounded-2xl shadow-xl border border-outline">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                      <div>
                        <h2 className="text-2xl font-black tracking-tight">
                          Ventas y Ganancias
                        </h2>
                        <p className="text-on-surface-muted font-bold text-sm uppercase tracking-widest mt-1">
                          Control de ingresos y comisiones
                        </p>
                      </div>
                      <div className="flex items-center gap-3 bg-surface-base p-2 rounded-2xl border border-outline">
                        <BarChart3 className="w-4 h-4 text-on-surface-muted ml-2" />
                        <select
                          className="bg-transparent border-none outline-none text-xs font-black uppercase tracking-widest text-on-surface-muted pr-4"
                          defaultValue="30"
                        >
                          <option value="7">Últimos 7 días</option>
                          <option value="30">Últimos 30 días</option>
                          <option value="90">Últimos 90 días</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 p-8 rounded-2xl text-on-surface shadow-xl shadow-neutral-200">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">
                          Ventas Brutas
                        </p>
                        <p className="text-3xl font-black">
                          {formatCurrency(
                            orders.reduce((sum, o) => sum + o.total, 0),
                          )}
                        </p>
                        <div className="mt-4 flex items-center gap-2 text-emerald-400 text-xs font-bold">
                          <TrendingUp className="w-4 h-4" />
                          <span>+12.5% vs mes anterior</span>
                        </div>
                      </div>
                      <div className="glass-card p-8 rounded-2xl border-2 border-outline shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-muted mb-2">
                          Comisión App ({restaurant?.commissionRate || 5}%)
                        </p>
                        <p className="text-3xl font-black text-on-surface">
                          {formatCurrency(
                            orders.reduce((sum, o) => sum + o.total, 0) *
                              ((restaurant?.commissionRate || 5) / 100),
                          )}
                        </p>
                        <p className="mt-4 text-[10px] font-black text-on-surface-muted uppercase tracking-widest">
                          Monto a pagar a la plataforma
                        </p>
                      </div>
                      <div className="bg-orange-50 p-8 rounded-2xl border-2 border-orange-100 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600/60 mb-2">
                          Tu Ganancia Neta
                        </p>
                        <p className="text-3xl font-black text-orange-600">
                          {formatCurrency(
                            orders.reduce((sum, o) => sum + o.total, 0) *
                              (1 - (restaurant?.commissionRate || 5) / 100),
                          )}
                        </p>
                        <div className="mt-4 flex items-center gap-2 text-orange-600 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Disponible para retiro</span>
                        </div>
                      </div>
                    </div>

                    <div className="h-80 w-full mt-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={salesData}>
                          <defs>
                            <linearGradient
                              id="colorSales"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#f97316"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor="#f97316"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#f3f4f6"
                          />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fontSize: 10,
                              fontWeight: 900,
                              fill: "#9ca3af",
                            }}
                            dy={10}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fontSize: 10,
                              fontWeight: 900,
                              fill: "#9ca3af",
                            }}
                          />
                          <Tooltip
                            contentStyle={{
                              borderRadius: "20px",
                              border: "none",
                              boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
                              padding: "15px",
                            }}
                            itemStyle={{ fontWeight: 900, fontSize: "12px" }}
                          />
                          <Area
                            type="monotone"
                            dataKey="sales"
                            stroke="#f97316"
                            strokeWidth={4}
                            fillOpacity={1}
                            fill="url(#colorSales)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="glass-card p-8 rounded-2xl shadow-xl border border-outline">
                    <h3 className="text-xl font-black mb-6">
                      Desglose de Pedidos
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-[10px] font-black text-on-surface-muted uppercase tracking-[0.2em] border-b border-outline">
                            <th className="pb-4">ID Pedido</th>
                            <th className="pb-4">Fecha</th>
                            <th className="pb-4">Total</th>
                            <th className="pb-4">
                              Comisión ({restaurant?.commissionRate || 5}%)
                            </th>
                            <th className="pb-4">Neto</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-50">
                          {orders.map((order) => {
                            const commission =
                              order.total *
                              ((restaurant?.commissionRate || 5) / 100);
                            const net = order.total - commission;
                            return (
                              <tr
                                key={order.id}
                                className="text-sm font-bold text-on-surface-variant"
                              >
                                <td className="py-4 font-mono text-xs text-on-surface-muted">
                                  #{order.id.slice(0, 8)}
                                </td>
                                <td className="py-4">
                                  {new Date(
                                    order.createdAt,
                                  ).toLocaleDateString()}
                                </td>
                                <td className="py-4">
                                  {formatCurrency(order.total)}
                                </td>
                                <td className="py-4 text-red-500">
                                  -{formatCurrency(commission)}
                                </td>
                                <td className="py-4 text-emerald-600">
                                  {formatCurrency(net)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "orders" && (
                <>
                  <h3 className="text-xl font-black mb-4">Pedidos Recientes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {orders.length > 0 ? (
                      orders.map((order) => (
                          <div
                            key={order.id}
                            className={`glass-card p-5 rounded-[2rem] shadow-sm border ${order.isWaiterCalled ? "border-amber-500 bg-amber-500/5 ring-4 ring-amber-500/10" : "border-outline"} flex flex-col relative overflow-hidden`}
                          >
                            {order.isWaiterCalled && <div className="absolute top-0 left-0 w-2 h-full bg-amber-500 animate-pulse" />}
                            
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1 min-w-0 pr-4">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <p className="font-bold text-on-surface truncate">
                                    {order.customerName}
                                  </p>
                                  {!order.customerId && (
                                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border border-emerald-500/20">
                                      Invitado
                                    </span>
                                  )}
                                  {order.tableNumber && (
                                    <span className="bg-surface-variant text-on-surface text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">
                                      Mesa: {order.tableNumber}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-on-surface-muted">
                                  {new Date(order.createdAt).toLocaleString()}
                                </p>
                              </div>
                              
<div className="text-right flex flex-col items-end gap-2">
                                <div>
                                  {!order.isWaiterCalled && (
                                    <>
                                      <p className="font-black text-orange-600">
                                        {formatCurrency(order.total)}
                                      </p>
                                      {(order.tipAmount || 0) > 0 && (
                                        <p className="text-[9px] font-bold text-emerald-600">
                                          Propina: {formatCurrency(order.tipAmount || 0)}
                                          {order.tipPercentage && ` (${order.tipPercentage}%)`}
                                        </p>
                                      )}
                                    </>
                                  )}
                                  <span
                                    className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                                      order.status === "pending"
                                        ? "bg-amber-100 text-amber-600"
                                        : order.status === "approved" ||
                                            order.status === "accepted"
                                          ? "bg-blue-100 text-blue-600"
                                          : order.status === "preparing"
                                            ? "bg-purple-100 text-purple-600"
                                            : order.status === "shipped" ||
                                                order.status === "on_the_way"
                                              ? "bg-orange-100 text-orange-600"
                                              : order.status === "assigned"
                                                ? "bg-indigo-100 text-indigo-600"
                                                : order.status === "completed"
                                                  ? "bg-emerald-100 text-emerald-600"
                                                  : "bg-surface-variant text-on-surface-muted"
                                    }`}
                                  >
                                    {order.isWaiterCalled
                                      ? "Llamado"
                                      : order.status === "pending"
                                        ? "Pendiente"
                                        : order.status === "approved" ||
                                            order.status === "accepted"
                                          ? "Aprobado"
                                          : order.status === "preparing"
                                            ? "Preparando"
                                            : order.status === "shipped" ||
                                                order.status === "on_the_way"
                                              ? "Enviado"
                                              : order.status === "assigned"
                                                ? "Asignado"
                                                : order.status === "completed"
                                                  ? "Completado"
                                                  : order.status === "rejected"
                                                    ? "Rechazado"
                                                    : order.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-1 bg-surface-base/50 p-3 rounded-xl border border-outline mb-4">
                                <p className="text-xs text-on-surface-muted">
                                  <span className="font-bold">Para:</span>{" "}
                                  {order.recipientName || order.customerName}
                                </p>
                                <p className="text-xs text-on-surface-muted">
                                  <span className="font-bold">Tel:</span>{" "}
                                  {order.customerPhone || "N/A"}
                                </p>
                                {order.address && (
                                  <p className="text-xs text-on-surface-muted">
                                    <span className="font-bold">
                                      Ubicación:
                                    </span>{" "}
                                    {order.address}
                                  </p>
                                )}
                                {(order.paymentMethod ||
                                  order.paymentStatus) && (
                                  <p className="text-xs text-on-surface-muted">
                                    <span className="font-bold">Pago:</span>{" "}
                                    {order.paymentMethod === "cash"
                                      ? "Efectivo"
                                      : order.paymentMethod === "card"
                                        ? "Tarjeta"
                                        : order.paymentMethod === "transfer"
                                          ? "Transferencia"
                                          : order.paymentMethod || "N/A"}{" "}
                                    <span className="opacity-75">
                                      (
                                      {order.paymentStatus === "paid"
                                        ? "Pagado"
                                        : order.paymentStatus === "pending"
                                          ? "Pendiente"
                                          : order.paymentStatus === "failed"
                                            ? "Fallido"
                                            : order.paymentStatus ||
                                              "Pendiente"}
                                      )
                                    </span>
                                  </p>
                                )}
                            </div>
                                {(() => {
                                  // Fallback checking wheel_prizes table directly
                                  // in case RLS blocked the addPrizeToOrder update
                                  const dbItemsPrizeAdded = (
                                    (order.items as any[]) || []
                                  ).some(
                                    (i: any) =>
                                      i.type === "prize" ||
                                      (i.product?.name || "").includes(
                                        "🎁 Giro",
                                      ) ||
                                      (i.product?.name || "").includes(
                                        "💬 Giro",
                                      ),
                                  );

                                  const matchPrizes = !dbItemsPrizeAdded
                                    ? wheelPrizes.filter(
                                        (p: any) =>
                                          (p.userId || p.user_id) ===
                                            order.customerId &&
                                          Math.abs(
                                            new Date(
                                              p.createdAt || p.created_at,
                                            ).getTime() -
                                              new Date(
                                                order.createdAt,
                                              ).getTime(),
                                          ) <
                                            5 * 60000, // 5 minutes window
                                      )
                                    : [];

                                  return (order.items &&
                                    order.items.length > 0) ||
                                    matchPrizes.length > 0 ? (
                                    <div className="mt-3 p-3 bg-surface-base rounded-xl border border-outline">
                                      <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-muted mb-2">
                                        Productos
                                      </p>
                                      <div className="space-y-1">
                                        {order.items &&
                                          (order.items as any[]).map(
                                            (item, idx) => (
                                              <div
                                                key={`item-${idx}`}
                                                className="flex justify-between items-center text-xs"
                                              >
                                                <span className="font-medium text-on-surface-variant">
                                                  {item.quantity}x{" "}
                                                  {item.product?.name ||
                                                    item.name}
                                                </span>
                                                <span className="text-on-surface-muted">
                                                  {formatCurrency(
                                                    (item.product?.price ||
                                                      item.price ||
                                                      0) * item.quantity,
                                                  )}
                                                </span>
                                              </div>
                                            ),
                                          )}
                                        {matchPrizes.map((pz: any, idx) => (
                                          <div
                                            key={`prize-${idx}`}
                                            className="flex justify-between items-center text-xs text-secondary-dark font-bold"
                                          >
                                            <span className="font-bold">
                                              1x{" "}
                                              {pz.isPrize !== false &&
                                              pz.is_prize !== false
                                                ? "🎁"
                                                : "💬"}{" "}
                                              Premio Ruleta:{" "}
                                              {pz.prizeText || pz.prize_text}
                                            </span>
                                            <span>Gratis</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : null;
                                })()}
                                {order.note && (
                                  <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-100 italic text-[11px] text-amber-900">
                                    " {order.note} "
                                  </div>
                                )}
                                {order.isWaiterCalled && (
                                  <p className="text-xs font-black text-amber-600 uppercase tracking-widest mt-1">
                                    ¡Solicita Mesero!
                                  </p>
                                )}
                              <div className="flex flex-wrap justify-end gap-2 mt-2">
                                {order.status === "pending" &&
                                  !order.isWaiterCalled && (
                                    <>
                                      <button
                                        onClick={() =>
                                          handleUpdateOrderStatus(
                                            order.id,
                                            "approved",
                                          )
                                        }
                                        className="bg-emerald-500 text-on-surface px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-1"
                                      >
                                        <CheckCircle2 className="w-3 h-3" />{" "}
                                        Aprobar
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleUpdateOrderStatus(
                                            order.id,
                                            "rejected",
                                          )
                                        }
                                        className="bg-rose-500 text-on-surface px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all flex items-center gap-1"
                                      >
                                        <XCircle className="w-3 h-3" /> Rechazar
                                      </button>
                                    </>
                                  )}

                                {(order.status === "approved" ||
                                  order.status === "accepted") && (
                                  <div className="flex flex-wrap gap-2 w-full mt-3">
                                    <button
                                      onClick={() =>
                                        handleUpdateOrderStatus(
                                          order.id,
                                          "preparing",
                                        )
                                      }
                                      className="flex-[2] bg-purple-500 text-on-surface py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 transition-all flex items-center justify-center gap-1 shadow-md shadow-purple-200"
                                    >
                                      <Clock className="w-3 h-3" /> Preparando
                                    </button>
                                    <button
                                      onClick={async () => {
                                        const onlineDrivers =
                                          driversList.filter(
                                            (d) => d.profile.isOnline,
                                          );
                                        const availableDrivers =
                                          onlineDrivers.filter((d) => {
                                            const hasActiveOrder = orders.some(
                                              (o) =>
                                                o.driverId === d.id &&
                                                (o.status === "shipped" ||
                                                  o.status === "on_the_way" ||
                                                  o.status === "assigned"),
                                            );
                                            return !hasActiveOrder;
                                          });

                                        const candidates =
                                          availableDrivers.length > 0
                                            ? availableDrivers
                                            : onlineDrivers;

                                        if (candidates.length > 0) {
                                          const chosenDriver =
                                            candidates[
                                              Math.floor(
                                                Math.random() *
                                                  candidates.length,
                                              )
                                            ];
                                          handleAssignDriver(
                                            order.id,
                                            chosenDriver.id,
                                          );
                                        } else {
                                          toast.info(
                                            "No hay repartidores en línea. Cambiando estado a en camino sin repartidor asignado.",
                                          );
                                        }
                                        handleUpdateOrderStatus(
                                          order.id,
                                          "shipped",
                                        );
                                      }}
                                      className="flex-1 bg-indigo-50 text-indigo-600 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center justify-center gap-1 border border-indigo-200"
                                    >
                                      <Truck className="w-3 h-3" /> Auto
                                    </button>
                                    <select
                                      className="flex-1 bg-surface border border-outline/10 text-on-surface px-2 py-2 rounded-xl text-[10px] font-bold min-w-[100px]"
                                      onChange={async (e) => {
                                        if (e.target.value) {
                                          handleAssignDriver(
                                            order.id,
                                            e.target.value,
                                          );
                                        }
                                      }}
                                      value={order.driverId || ""}
                                    >
                                      <option value="">
                                        Asignar...
                                      </option>
                                      {driversList.map((d) => (
                                        <option key={d.id} value={d.id}>
                                          {d.displayName || d.email} (
                                          {d.profile.isOnline
                                            ? "Línea"
                                            : "Off"}
                                          )
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}

                                {order.status === "preparing" && (
                                  <div className="flex flex-wrap gap-2 w-full mt-3">
                                    <button
                                      onClick={async () => {
                                        const onlineDrivers =
                                          driversList.filter(
                                            (d) => d.profile.isOnline,
                                          );
                                        const availableDrivers =
                                          onlineDrivers.filter((d) => {
                                            const hasActiveOrder = orders.some(
                                              (o) =>
                                                o.driverId === d.id &&
                                                (o.status === "shipped" ||
                                                  o.status === "on_the_way" ||
                                                  o.status === "assigned"),
                                            );
                                            return !hasActiveOrder;
                                          });

                                        const candidates =
                                          availableDrivers.length > 0
                                            ? availableDrivers
                                            : onlineDrivers;

                                        if (
                                          !order.driverId &&
                                          candidates.length > 0
                                        ) {
                                          const chosenDriver =
                                            candidates[
                                              Math.floor(
                                                Math.random() *
                                                  candidates.length,
                                              )
                                            ];
                                          handleAssignDriver(
                                            order.id,
                                            chosenDriver.id,
                                          );
                                        }
                                        handleUpdateOrderStatus(
                                          order.id,
                                          "shipped",
                                        );
                                      }}
                                      className="flex-[2] bg-orange-500 text-on-surface py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all flex items-center justify-center gap-1 shadow-md shadow-orange-200"
                                    >
                                      <Truck className="w-3 h-3" /> En camino
                                    </button>
                                    <select
                                      className="flex-1 bg-surface border border-outline/10 text-on-surface px-2 py-2 rounded-xl text-[10px] font-bold min-w-[100px]"
                                      onChange={async (e) => {
                                        if (e.target.value) {
                                          handleAssignDriver(
                                            order.id,
                                            e.target.value,
                                          );
                                        }
                                      }}
                                      value={order.driverId || ""}
                                    >
                                      <option value="">
                                        Asignar...
                                      </option>
                                      {driversList.map((d) => (
                                        <option key={d.id} value={d.id}>
                                          {d.displayName || d.email} (
                                          {d.profile.isOnline
                                            ? "Línea"
                                            : "Off"}
                                          )
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}

                                {(order.status === "shipped" ||
                                  order.status === "on_the_way") && (
                                  <div className="flex flex-wrap gap-2 w-full mt-3">
                                    <button
                                      onClick={() =>
                                        handleUpdateOrderStatus(
                                          order.id,
                                          "completed",
                                        )
                                      }
                                      className="w-full bg-emerald-500 text-on-surface py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-1 shadow-md shadow-emerald-200"
                                    >
                                      <CheckCircle2 className="w-3 h-3" />{" "}
                                      Completar
                                    </button>
                                  </div>
                                )}
                              </div>

                              {order.driverId && (
                                <div className="mt-3 flex items-center justify-center gap-2 bg-emerald-50 px-3 py-2 w-full rounded-xl border border-emerald-100">
                                  <Truck className="w-4 h-4 text-emerald-600" />
                                  <span className="text-[10px] font-bold text-emerald-700">
                                    Repartidor:{" "}
                                    {drivers[order.driverId]?.displayName ||
                                      "Asignado"}
                                  </span>
                                </div>
                              )}

                              {order.refundStatus === "requested" && (
                                <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-left w-full">
                                  <div className="flex items-center gap-2 mb-2">
                                    <AlertCircle className="w-4 h-4 text-rose-500" />
                                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">
                                      Solicitud de Reembolso
                                    </p>
                                  </div>
                                  <p className="text-xs font-bold text-rose-700 mb-2 leading-relaxed">
                                    "{order.refundReason}"
                                  </p>
                                  <div className="flex items-center gap-2 mb-3">
                                    <span className="text-[9px] font-black text-rose-400 uppercase">
                                      Preferencia:
                                    </span>
                                    <span className="text-[9px] font-black text-rose-600 bg-white px-2 py-0.5 rounded-lg border border-rose-100">
                                      {order.refundOption === "money"
                                        ? "Dinero"
                                        : order.refundOption === "resend"
                                          ? "Re-enviar"
                                          : "Cambio"}
                                    </span>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() =>
                                        handleRefundAction(order.id, "approved")
                                      }
                                      className="flex-1 py-2 bg-emerald-500 text-on-surface rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md shadow-emerald-200"
                                    >
                                      Aprobar
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleRefundAction(order.id, "rejected")
                                      }
                                      className="flex-1 py-2 bg-rose-200 text-rose-700 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-300 transition-all"
                                    >
                                      Rechazar
                                    </button>
                                  </div>
                                </div>
                              )}

                              {order.refundStatus === "approved" && (
                                <div className="mt-3 w-full justify-center flex items-center gap-1.5 bg-emerald-50 py-2 rounded-xl text-emerald-600 font-bold text-[10px] border border-emerald-100">
                                  <CheckCircle2 className="w-3.5 h-3.5" />{" "}
                                  Reembolso Aprobado
                                </div>
                              )}

                              {order.refundStatus === "rejected" && (
                                <div className="mt-3 w-full justify-center flex items-center gap-1.5 bg-rose-50 py-2 rounded-xl text-rose-500 font-bold text-[10px] border border-rose-100">
                                  <XCircle className="w-3.5 h-3.5" /> Reembolso
                                  Rechazado
                                </div>
                              )}

                              {order.isWaiterCalled &&
                                order.status === "pending" && (
                                  <button
                                    onClick={() =>
                                      handleUpdateOrderStatus(
                                        order.id,
                                        "completed",
                                      )
                                    }
                                    className="w-full mt-3 py-3 rounded-xl bg-emerald-500/10 text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:bg-emerald-500/20 transition-colors"
                                  >
                                    Marcar como Atendido
                                  </button>
                                )}
                            </div>
                        ))
                    ) : (
                      <div className="col-span-full py-16 text-center text-on-surface-muted glass-card rounded-[2.5rem] border border-dashed border-outline">
                        <ShoppingBag className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
                        <p className="font-bold">No hay pedidos recientes.</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {activeTab === "menu" && (
                <motion.div
                  key="menu"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black">Gestión de Menú</h3>
                    <button
                      onClick={() =>
                        setEditingProduct({
                          id: "",
                          name: "",
                          description: "",
                          price: 0,
                          category: "",
                          categoryId: "",
                          images: [],
                          available: true,
                          hasDiscount: false,
                          isPromotion: false,
                          isPartOfCombo: false,
                          isFeatured: false,
                          recommendedProductIds: [],
                          pointsMultiplier: 1,
                        })
                      }
                      className="bg-orange-500 text-on-surface px-6 py-3 rounded-2xl font-black hover:bg-orange-600 flex items-center gap-2 shadow-lg shadow-orange-200 transition-all hover:scale-105 active:scale-95"
                    >
                      <Plus className="w-5 h-5" /> Nuevo Producto
                    </button>
                  </div>
                  <div className="flex overflow-x-auto pb-2 mb-4 gap-2 hide-scrollbar">
                    <button
                      onClick={() => setActiveCategoryTab("all")}
                      className={`shrink-0 px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                        activeCategoryTab === "all"
                          ? "bg-surface-variant text-on-surface shadow-md"
                          : "glass-card text-on-surface text-on-surface-muted hover:bg-surface-base border border-outline"
                      }`}
                    >
                      Todos
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategoryTab(cat.id)}
                        className={`shrink-0 px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                          activeCategoryTab === cat.id
                            ? "bg-surface-variant text-on-surface shadow-md"
                            : "glass-card text-on-surface text-on-surface-muted hover:bg-surface-base border border-outline"
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                    {restaurant.menu.some(
                      (p) =>
                        !p.categoryId ||
                        !categories.find((c) => c.id === p.categoryId),
                    ) && (
                      <button
                        onClick={() => setActiveCategoryTab("uncategorized")}
                        className={`shrink-0 px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                          activeCategoryTab === "uncategorized"
                            ? "bg-rose-600 text-on-surface shadow-md"
                            : "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                        }`}
                      >
                        Sin Categoría (
                        {
                          restaurant.menu.filter(
                            (p) =>
                              !p.categoryId ||
                              !categories.find((c) => c.id === p.categoryId),
                          ).length
                        }
                        )
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-4">
                    {(() => {
                      const filteredProducts = restaurant.menu.filter(
                        (product) => {
                          if (activeCategoryTab === "all") return true;

                          // "Uncategorized" logic
                          if (activeCategoryTab === "uncategorized") {
                            const hasValidCategory = categories.some(
                              (cat) =>
                                cat.id === product.categoryId ||
                                cat.name === product.category,
                            );
                            return !product.categoryId || !hasValidCategory;
                          }

                          const categoryName = categories.find(
                            (c) => c.id === activeCategoryTab,
                          )?.name;
                          return (
                            product.categoryId === activeCategoryTab ||
                            product.category === categoryName
                          );
                        },
                      );

                      if (filteredProducts.length === 0) {
                        return (
                          <div className="text-center py-12 glass-card text-on-surface rounded-2xl border border-outline">
                            <LayoutList className="w-12 h-12 text-on-surface-variant mx-auto mb-4" />
                            <p className="text-on-surface-muted font-medium">
                              {activeCategoryTab === "uncategorized"
                                ? "¡Excelente! No tienes productos sin categoría."
                                : "No hay productos en esta categoría."}
                            </p>
                          </div>
                        );
                      }

                      return filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          className="glass-card rounded-2xl shadow-sm border border-outline overflow-hidden group hover:shadow-md transition-all duration-300 flex items-center p-4 gap-4"
                        >
                          <div className="h-24 w-24 flex-shrink-0 relative overflow-hidden bg-surface-variant rounded-xl">
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                                <ImageIcon className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-bold text-on-surface truncate pr-4">
                                {product.name}
                              </h4>
                              <span className="font-black text-orange-600 whitespace-nowrap">
                                {formatCurrency(product.price)}
                              </span>
                            </div>
                            {product.pointsMultiplier && product.pointsMultiplier > 1 && (
                               <div className="mb-2 inline-flex items-center gap-1.5 text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider w-fit shrink-0">
                                 <span>🎯 Multiplica x{product.pointsMultiplier} <GoldCoinIcon className="w-3.5 h-3.5 -mt-0.5 mx-0.5 inline-block" /> Monedas</span>
                               </div>
                            )}
                            <p className="text-sm text-on-surface-muted line-clamp-2 mb-2">
                              {product.description}
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingProduct(product)}
                                className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                              >
                                <Edit2 className="w-3.5 h-3.5" /> Editar
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Eliminar
                              </button>
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </motion.div>
              )}

              {activeTab === "categories" && (
                <motion.div
                  key="categories"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black">
                      Gestión de Categorías
                    </h3>
                    {!isAddingCategory ? (
                      <button
                        onClick={() => setIsAddingCategory(true)}
                        className="bg-orange-500 text-on-surface px-6 py-3 rounded-2xl font-black hover:bg-orange-600 flex items-center gap-2 shadow-lg shadow-orange-200 transition-all hover:scale-105 active:scale-95"
                      >
                        <Plus className="w-5 h-5" /> Nueva Categoría
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="Nombre de categoría"
                          className="border-2 border-outline rounded-2xl px-4 py-2 focus:border-orange-500 outline-none font-bold"
                          autoFocus
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleAddCategory()
                          }
                        />
                        <button
                          onClick={handleAddCategory}
                          className="bg-emerald-500 text-on-surface p-3 rounded-2xl hover:bg-emerald-600 transition-colors"
                        >
                          <Save className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setIsAddingCategory(false);
                            setNewCategoryName("");
                          }}
                          className="bg-surface-variant text-on-surface-muted p-3 rounded-2xl hover:bg-neutral-300 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(() => {
                      // Find categories that exist in products but not in categories table
                      const ghostCategoryNames = Array.from(
                        new Set(
                          restaurant.menu
                            .map((p) => p.category)
                            .filter(
                              (name) =>
                                name &&
                                !categories.some((c) => c.name === name),
                            ),
                        ),
                      );

                      return ghostCategoryNames.map((name) => (
                        <div
                          key={`ghost-${name}`}
                          className="p-6 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col gap-4 shadow-sm relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 p-1 bg-rose-500 text-[8px] font-black text-on-surface uppercase tracking-tighter px-2 rounded-bl-lg">
                            Inconsistencia
                          </div>
                          <div>
                            <h3 className="font-black text-lg text-rose-900 flex items-center gap-2">
                              <AlertCircle className="w-5 h-5 text-rose-500" />
                              {name || "Sin Nombre"}
                            </h3>
                            <p className="text-xs text-rose-600 font-bold">
                              Esta categoría se usa en productos pero no existe
                              oficialmente.
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                if (!name || !restaurant) return;
                                try {
                                  await db.saveCategory({
                                    restaurantId: restaurant.id,
                                    name: name,
                                  });
                                  toast.success(
                                    `Categoría "${name}" creada exitosamente`,
                                  );
                                  fetchData();
                                } catch (e) {
                                  toast.error("Error al crear la categoría");
                                }
                              }}
                              className="flex-1 glass-card text-on-surface border border-rose-200 text-rose-600 px-3 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-rose-100 transition-colors"
                            >
                              Crear Oficialmente
                            </button>
                          </div>
                        </div>
                      ));
                    })()}

                    {categories.map((cat) => (
                      <div
                        key={cat.id}
                        className="p-6 glass-card text-on-surface border border-outline rounded-2xl flex justify-between items-center shadow-sm hover:shadow-md transition-all group"
                      >
                        <div>
                          <h3 className="font-black text-lg text-on-surface">
                            {cat.name}
                          </h3>
                          <p className="text-sm text-on-surface-muted">
                            {cat.description || "Sin descripción"}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="text-rose-500 hover:bg-rose-50 p-3 rounded-xl transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    {categories.length === 0 && !isAddingCategory && (
                      <div className="col-span-full py-12 text-center bg-surface-base rounded-2xl border-2 border-dashed border-outline">
                        <LayoutList className="w-12 h-12 text-on-surface-variant mx-auto mb-4" />
                        <p className="text-on-surface-muted font-medium">
                          No hay categorías creadas aún.
                        </p>
                        <button
                          onClick={() => setIsAddingCategory(true)}
                          className="text-orange-600 font-black mt-2 hover:underline"
                        >
                          Crear la primera categoría
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === "banners" && (
                <motion.div
                  key="banners"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black">
                      Banners Promocionales
                    </h3>
                    <button
                      onClick={() =>
                        setEditingBanner({
                          id: "",
                          imageUrl: "",
                          title: "Nueva Promoción",
                          active: true,
                          location: "interstitial",
                          type: "image",
                          content: "",
                          startDate: null,
                          endDate: null,
                          durationSeconds: 20,
                          actionUrl: "",
                          actionText: "Ver Promoción",
                        })
                      }
                      className="bg-orange-500 text-on-surface px-6 py-3 rounded-2xl font-black hover:bg-orange-600 flex items-center gap-2 shadow-lg shadow-orange-200 transition-all hover:scale-105 active:scale-95"
                    >
                      <Plus className="w-5 h-5" /> Nuevo Banner
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {(restaurant.banners || []).map((banner) => (
                      <div
                        key={banner.id}
                        className="glass-card rounded-2xl shadow-sm border border-outline overflow-hidden group hover:shadow-xl transition-all duration-300"
                      >
                        <div className="h-48 w-full relative overflow-hidden bg-surface-variant flex items-center justify-center">
                          {banner.imageUrl ? (
                            <img
                              src={banner.imageUrl}
                              alt={banner.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <ImageIcon className="w-12 h-12 text-on-surface-variant" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6">
                            <h3 className="text-on-surface font-black text-xl leading-tight">
                              {banner.title}
                            </h3>
                          </div>
                          {!banner.active && (
                            <div className="absolute top-4 left-4 bg-rose-500 text-on-surface text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                              Inactivo
                            </div>
                          )}
                        </div>
                        <div className="p-4 flex justify-end gap-2 bg-surface-base/50">
                          <button
                            onClick={() => setEditingBanner(banner)}
                            className="text-blue-500 hover:bg-blue-100 p-2.5 rounded-xl transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBanner(banner.id)}
                            className="text-rose-500 hover:bg-rose-100 p-2.5 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "customers" && (
                <motion.div
                  key="customers"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="glass-card rounded-2xl shadow-sm border border-outline overflow-hidden"
                >
                  <div className="p-6 border-b border-outline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-xl font-black">Gestión de Clientes</h3>
                    {selectedCustomers.size > 0 && (
                      <button
                        onClick={handleBulkDeleteCustomers}
                        className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-rose-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" /> Eliminar Seleccionados (
                        {selectedCustomers.size})
                      </button>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-base border-b border-outline text-on-surface-muted text-xs uppercase tracking-widest flex items-center">
                          <th className="p-6 w-16">
                            <input
                              type="checkbox"
                              checked={
                                customersList.length > 0 &&
                                selectedCustomers.size === customersList.length
                              }
                              onChange={handleSelectAllCustomers}
                              className="w-4 h-4 accent-orange-500 rounded border-neutral-300"
                            />
                          </th>
                          <th className="p-6 font-black flex-1 min-w-[200px]">
                            Cliente
                          </th>
                          <th className="p-6 font-black flex-1">
                            Email / Teléfono
                          </th>
                          <th className="p-6 font-black w-32 text-center">
                            Estado
                          </th>
                          <th className="p-6 font-black w-32 text-center">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 block max-h-[60vh] overflow-y-auto">
                        {customersList.map((customer) => (
                          <tr
                            key={customer.id}
                            className={`flex items-center hover:bg-surface-base transition-colors ${selectedCustomers.has(customer.id) ? "bg-orange-50/50" : ""}`}
                          >
                            <td className="p-6 w-16">
                              <input
                                type="checkbox"
                                checked={selectedCustomers.has(customer.id)}
                                onChange={() =>
                                  handleToggleSelectCustomer(customer.id)
                                }
                                className="w-4 h-4 accent-orange-500 rounded border-neutral-300"
                              />
                            </td>
                            <td className="p-6 font-bold text-on-surface flex-1 min-w-[200px]">
                              {customer.displayName || "Sin Nombre"}
                              <div className="text-xs font-medium text-on-surface-muted mt-1">
                                {customer?.id?.substring(0, 8)}
                              </div>
                            </td>
                            <td className="p-6 text-on-surface-muted flex-1">
                              <div>{customer.email}</div>
                              {customer.phone && (
                                <div className="text-xs text-on-surface-muted mt-1">
                                  {customer.phone}
                                </div>
                              )}
                            </td>
                            <td className="p-6 w-32 text-center">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${customer.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}
                              >
                                {customer.status === "active"
                                  ? "Activo"
                                  : "Pausado"}
                              </span>
                            </td>
                            <td className="p-6 w-32 flex justify-center gap-2">
                              <button
                                onClick={() =>
                                  handleToggleCustomerStatus(customer)
                                }
                                className={`p-2 rounded-xl transition-colors ${customer.status === "active" ? "bg-amber-50 text-amber-600 hover:bg-amber-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}
                                title={
                                  customer.status === "active"
                                    ? "Pausar Usuario"
                                    : "Activar Usuario"
                                }
                              >
                                {customer.status === "active" ? (
                                  <Pause className="w-4 h-4" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteCustomer(
                                    customer.id,
                                    customer.email,
                                  )
                                }
                                className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors"
                                title="Eliminar Usuario"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {customersList.length === 0 && (
                          <tr className="flex">
                            <td className="p-8 w-full text-center text-on-surface-muted">
                              Aún no tienes clientes registrados.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activeTab === "inbox" && (
                <motion.div
                  key="inbox"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="glass-card text-on-surface rounded-[2.5rem] shadow-sm border border-outline p-10 lg:p-16">
                    <NotificationInbox />
                  </div>
                </motion.div>
              )}

              {activeTab === "marketing" && (
                <motion.div
                  key="marketing"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="glass-card text-on-surface rounded-[2.5rem] shadow-sm border border-outline overflow-hidden"
                >
                  <div className="p-10 lg:p-16 max-w-4xl">
                    <div className="mb-12">
                      <div className="w-16 h-16 bg-orange-100 rounded-3xl flex items-center justify-center mb-6">
                        <BellRing className="w-8 h-8 text-orange-600" />
                      </div>
                      <h3 className="text-3xl font-black text-on-surface tracking-tight mb-4">
                        Marketing de Notificaciones Push
                      </h3>
                      <p className="text-on-surface-muted text-lg font-medium leading-relaxed">
                        Comunícate directamente con tus clientes. Envía
                        promociones, avisos de nuevo menú o simplemente un
                        recordatorio de tus delicias directamente a sus
                        celulares.
                      </p>
                    </div>

                    <div className="space-y-8">
                      <div className="p-8 bg-surface-base rounded-[2rem] border border-outline">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="glass-card p-2 rounded-xl shadow-sm">
                            <Users className="w-5 h-5 text-orange-500" />
                          </div>
                          <span className="text-sm font-black text-on-surface uppercase tracking-widest">
                            Público Objetivo
                          </span>
                        </div>

                        <div className="space-y-4">
                          <select
                            value={notificationForm.target}
                            onChange={(e) =>
                              setNotificationForm({
                                ...notificationForm,
                                target: e.target.value as any,
                                targetUserId: "",
                              })
                            }
                            className="w-full p-4 glass-card text-on-surface border-2 border-outline rounded-2xl font-bold focus:border-orange-500 outline-none transition-all appearance-none"
                          >
                            <option value="restaurant_customers">
                              👥 Todos mis Clientes
                            </option>
                            <option value="specific_customer">
                              👤 Un Cliente Específico
                            </option>
                            <option value="restaurant_drivers">
                              🚲 Mis Repartidores
                            </option>
                          </select>

                          {notificationForm.target === "specific_customer" && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                              <label className="block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2 ml-4">
                                Seleccionar Cliente
                              </label>
                              <select
                                value={notificationForm.targetUserId}
                                onChange={(e) =>
                                  setNotificationForm({
                                    ...notificationForm,
                                    targetUserId: e.target.value,
                                  })
                                }
                                className="w-full p-4 glass-card text-on-surface border-2 border-outline rounded-2xl font-bold focus:border-orange-500 outline-none transition-all appearance-none"
                              >
                                <option value="">
                                  Selecciona un cliente...
                                </option>
                                {Array.from(
                                  new Map(
                                    orders
                                      .filter((o) => o.customerId)
                                      .map((o) => [
                                        o.customerId,
                                        o.customerName,
                                      ]),
                                  ).entries(),
                                ).map(([id, name]) => (
                                  <option key={id} value={id}>
                                    {name || "Usuario sin nombre"}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {notificationForm.target === "restaurant_drivers" && (
                            <div className="p-4 bg-surface-variant rounded-2xl border border-outline">
                              <p className="text-xs text-on-surface-muted font-bold text-center">
                                Se enviará a los {driversList.length}{" "}
                                repartidores asociados a tu restaurante.
                              </p>
                            </div>
                          )}

                          <div className="glass-card p-6 rounded-2xl border border-outline flex items-center justify-between">
                            <div>
                              <p className="font-bold text-on-surface">
                                {notificationForm.target ===
                                "restaurant_customers"
                                  ? "Mis Clientes Frecuentes"
                                  : notificationForm.target ===
                                      "specific_customer"
                                    ? "Mensaje Individual"
                                    : "Mis Repartidores Operativos"}
                              </p>
                              <p className="text-xs text-on-surface-muted font-medium tracking-wide mt-1">
                                {notificationForm.target ===
                                "restaurant_customers"
                                  ? "Todos los usuarios que han pedido en tu negocio."
                                  : notificationForm.target ===
                                      "specific_customer"
                                    ? "Envía un mensaje directo a un cliente para soporte o promociones VIP."
                                    : "Directo a la app de repartidores asociados."}
                              </p>
                            </div>
                            <span className="bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                              {notificationForm.target ===
                              "restaurant_customers"
                                ? `${new Set(orders.map((o) => o.customerName)).size} Clientes`
                                : notificationForm.target ===
                                    "specific_customer"
                                  ? "1 Usuario"
                                  : `${driversList.length} Repartidores`}
                            </span>
                          </div>

                          <div className="pt-2">
                            <label className="block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2 ml-4">
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
                              className="w-full p-4 glass-card text-on-surface border-2 border-outline rounded-2xl font-bold focus:border-orange-500 outline-none transition-all appearance-none"
                            >
                              <option value="promoción">
                                🎁 Promoción / Oferta
                              </option>
                              <option value="apertura">
                                🔓 Apertura del Restaurante
                              </option>
                              <option value="cierre">
                                🔒 Cierre del Restaurante
                              </option>
                              <option value="descuento">
                                🎟️ Descuento Especial
                              </option>
                              <option value="especial">
                                📅 Día Especial / Evento
                              </option>
                            </select>
                          </div>

                          <div className="glass-card p-6 rounded-2xl border border-outline flex items-center justify-between">
                            <div>
                              <p className="font-bold text-on-surface">
                                Programar Envío
                              </p>
                              <p className="text-[10px] text-on-surface-muted font-bold uppercase tracking-widest">
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
                              className={`w-12 h-6 rounded-full transition-all relative ${notificationForm.isScheduled ? "bg-orange-500" : "bg-surface-variant"}`}
                            >
                              <div
                                className={`absolute top-1 w-4 h-4 rounded-full glass-card text-on-surface transition-all ${notificationForm.isScheduled ? "left-7" : "left-1"}`}
                              />
                            </button>
                          </div>

                          {notificationForm.isScheduled && (
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                              <div>
                                <label className="block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2 ml-4">
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
                                  className="w-full p-4 glass-card text-on-surface border-2 border-outline rounded-2xl font-bold focus:border-orange-500 outline-none transition-all"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2 ml-4">
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
                                  className="w-full p-4 glass-card text-on-surface border-2 border-outline rounded-2xl font-bold focus:border-orange-500 outline-none transition-all"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-3">
                          <label className="block text-[10px] font-black text-on-surface-muted uppercase tracking-widest ml-4">
                            Título del Mensaje
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
                            placeholder="Ej: ¡2x1 en Hamburguesas solo por Hoy! 🍔"
                            className="w-full p-6 glass-card text-on-surface border-2 border-neutral-50 rounded-[1.5rem] font-bold text-on-surface focus:border-orange-500 outline-none transition-all shadow-sm focus:shadow-md"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="block text-[10px] font-black text-on-surface-muted uppercase tracking-widest ml-4">
                            Cuerpo de la Notificación
                          </label>
                          <textarea
                            value={notificationForm.body}
                            onChange={(e) =>
                              setNotificationForm({
                                ...notificationForm,
                                body: e.target.value,
                              })
                            }
                            placeholder="Escribe aquí los detalles de tu promoción o mensaje..."
                            rows={4}
                            className="w-full p-6 glass-card text-on-surface border-2 border-neutral-50 rounded-[1.5rem] font-bold text-on-surface focus:border-orange-500 outline-none transition-all resize-none shadow-sm focus:shadow-md"
                          />
                        </div>
                      </div>

                      <div className="pt-6">
                        <button
                          disabled={
                            isSendingNotification ||
                            !notificationForm.title ||
                            !notificationForm.body ||
                            !restaurant ||
                            (notificationForm.target === "specific_customer" &&
                              !notificationForm.targetUserId) ||
                            (notificationForm.isScheduled &&
                              (!notificationForm.scheduledDate ||
                                !notificationForm.scheduledTime))
                          }
                          onClick={async () => {
                            if (!restaurant) return;
                            setIsSendingNotification(true);
                            try {
                              if (notificationForm.isScheduled) {
                                const scheduledDateTime = new Date(
                                  `${notificationForm.scheduledDate}T${notificationForm.scheduledTime}`,
                                ).toISOString();

                                await db.scheduleNotification({
                                  senderId: user?.id || "",
                                  restaurantId: restaurant.id,
                                  title: notificationForm.title,
                                  body: notificationForm.body,
                                  category: notificationForm.category,
                                  targetSegment:
                                    notificationForm.target ===
                                    "specific_customer"
                                      ? "all"
                                      : notificationForm.target,
                                  scheduledFor: scheduledDateTime,
                                });

                                toast.success(
                                  "¡Aviso programado correctamente!",
                                );
                                const resScheduled =
                                  await db.getScheduledNotifications();
                                setScheduledNotes(
                                  (resScheduled || []).filter(
                                    (s: any) =>
                                      s.restaurantId === restaurant.id,
                                  ),
                                );
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
                                      topic:
                                        notificationForm.target ===
                                        "specific_customer"
                                          ? undefined
                                          : notificationForm.target,
                                      userId:
                                        notificationForm.target ===
                                        "specific_customer"
                                          ? notificationForm.targetUserId
                                          : undefined,
                                      restaurantId: restaurant.id,
                                      senderId: user?.id,
                                      title: notificationForm.title,
                                      body: notificationForm.body,
                                      data: {
                                        restaurantId: restaurant.id,
                                        type: "marketing",
                                      },
                                    }),
                                  },
                                );

                                if (response.ok) {
                                  const result = await response.json();
                                  toast.success(
                                    result.message ||
                                      "¡Campaña enviada exitosamente!",
                                  );
                                  setNotificationForm({
                                    ...notificationForm,
                                    title: "",
                                    body: "",
                                    isScheduled: false,
                                  });
                                } else {
                                  const err = await response.json();
                                  toast.error(
                                    `Error: ${err.error || "No se pudo enviar"}`,
                                  );
                                }
                              }
                            } catch (e) {
                              toast.error(
                                "Error de conexión. Inténtalo de nuevo.",
                              );
                            } finally {
                              setIsSendingNotification(false);
                            }
                          }}
                          className="w-full py-6 bg-surface-variant text-on-surface font-black rounded-[1.5rem] shadow-2xl shadow-neutral-200 hover:bg-surface-light transition-all disabled:opacity-50 flex items-center justify-center gap-4 active:scale-95 group"
                        >
                          {isSendingNotification ? (
                            <span className="animate-spin text-orange-500 text-xl font-black">
                              ⏳
                            </span>
                          ) : (
                            <BellRing className="w-6 h-6 text-orange-500" />
                          )}
                          {isSendingNotification
                            ? "Procesando..."
                            : notificationForm.isScheduled
                              ? "Programar Aviso"
                              : "Lanzar Campaña Inmediata"}
                        </button>

                        {scheduledNotes.length > 0 && (
                          <div className="pt-12">
                            <div className="flex items-center gap-4 mb-6">
                              <div className="glass-card p-2 rounded-xl shadow-sm">
                                <Calendar className="w-5 h-5 text-orange-500" />
                              </div>
                              <span className="text-sm font-black text-on-surface uppercase tracking-widest">
                                Avisos Programados
                              </span>
                            </div>
                            <div className="grid gap-4">
                              {scheduledNotes.map((note) => (
                                <div
                                  key={note.id}
                                  className="glass-card p-6 rounded-2xl border border-outline flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-4">
                                    <div
                                      className={`w-2 h-2 rounded-full ${note.isSent ? "bg-emerald-500" : "bg-blue-500 animate-pulse"}`}
                                    />
                                    <div>
                                      <p className="font-bold text-on-surface">
                                        {note.title}
                                      </p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="bg-surface-variant text-on-surface-muted px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">
                                          {note.category}
                                        </span>
                                        <p className="text-[10px] text-on-surface-muted font-bold uppercase tracking-widest">
                                          {new Date(
                                            note.scheduledFor,
                                          ).toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  {!note.isSent && (
                                    <button
                                      onClick={async () => {
                                        if (
                                          confirm(
                                            "¿Deseas eliminar este aviso programado?",
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
                                      className="p-3 text-on-surface-muted hover:text-red-500 hover:bg-red-50 transition-all rounded-xl"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-8 p-6 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-4">
                          <Sparkles className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[10px] text-orange-800 font-bold uppercase tracking-widest leading-relaxed">
                              Tips de Oro: Los mensajes con emojis y llamados a
                              la acción claros (como "Solo por hoy") tienen un
                              40% más de efectividad. ¡Úsalos a tu favor!
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* OneSignal Notifications Section */}
                      <div className="mt-8 pt-8 border-t border-outline">
                        <div className="max-w-md">
                          <h4 className="text-sm font-black text-on-surface-muted uppercase tracking-widest mb-4">
                            Notificaciones OneSignal
                          </h4>
                          <div className="bg-orange-50 p-6 rounded-2xl border-2 border-orange-100 flex flex-col justify-between group">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 glass-card rounded-xl shadow-sm flex items-center justify-center">
                                  <BellRing className="w-6 h-6 text-orange-500" />
                                </div>
                                <div>
                                  <p className="font-black text-on-surface">
                                    Estado de Alertas
                                  </p>
                                  <p className="text-[10px] text-orange-600 font-bold uppercase tracking-widest">
                                    Listo para configurar
                                  </p>
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-on-surface-muted font-medium mb-6 leading-relaxed">
                              Como administrador, es vital recibir alertas de
                              nuevos pedidos y soporte. Haz clic abajo para
                              asociar tu dispositivo y verificar la conexión a
                              OneSignal.
                            </p>
                            <div className="flex gap-3">
                              <button
                                onClick={async () => {
                                  if (isInitialized) {
                                    const granted = await requestPermission();
                                    if (granted) {
                                      toast.success(
                                        "Dispositivo asociado correctamente en OneSignal",
                                      );
                                    } else {
                                      toast.error(
                                        "Permiso denegado por el navegador",
                                      );
                                    }
                                  } else {
                                    toast.error(
                                      "OneSignal no inicializado. Faltan las variables de entorno de OneSignal.",
                                    );
                                  }
                                }}
                                className="flex-1 py-3 glass-card text-on-surface text-orange-600 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 border border-orange-200"
                              >
                                Activar <BellRing className="w-4 h-4" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (isInitialized) {
                                    try {
                                      const response = await fetch(
                                        "/api/notifications/send",
                                        {
                                          method: "POST",
                                          headers: {
                                            "Content-Type": "application/json",
                                          },
                                          body: JSON.stringify({
                                            userId: user?.id,
                                            title: "Panel de Control SmartBite",
                                            body: "¡Las notificaciones de OneSignal están activas y funcionando!",
                                          }),
                                        },
                                      );
                                      if (response.ok) {
                                        toast.success(
                                          "Notificación de prueba enviada al dispositivo",
                                        );
                                      } else {
                                        toast.error(
                                          "Error al enviar la prueba desde el servidor",
                                        );
                                      }
                                    } catch (e) {
                                      toast.error(
                                        "Error en la llamada al servidor de notificaciones",
                                      );
                                    }
                                  } else {
                                    toast.error(
                                      "OneSignal no está inicializado",
                                    );
                                  }
                                }}
                                className="flex-1 py-3 bg-orange-500 text-on-surface rounded-xl text-xs font-black uppercase tracking-widest shadow-sm hover:shadow-md hover:bg-orange-600 transition-all flex items-center justify-center gap-2 border border-orange-600"
                              >
                                Probar <Send className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-xs space-y-2 text-on-surface">
                              <p className="font-black text-orange-700 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
                                ⚠️ Guía de Diagnóstico para Chrome (Web Push)
                              </p>
                              <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-on-surface-muted leading-relaxed">
                                <li><strong>No usar iframes (Preview):</strong> Si tienes la aplicación abierta dentro de la vista previa de AI Studio, Chrome bloquea activamente el registro del Service Worker por seguridad. <strong>Abre el link de arriba en una NUEVA PESTAÑA</strong>.</li>
                                <li><strong>Aceptar permisos:</strong> Haz clic en el botón <strong>"Activar"</strong> de arriba y asegúrate de permitir las notificaciones cuando el candado/configuración de la barra de direcciones de Chrome te lo pida.</li>
                                <li><strong>Test Manual:</strong> Una vez suscrito, usa el botón <strong>"Probar"</strong> de arriba para comprobar la recepción inmediata de la notificación en tu Chrome.</li>
                                <li><strong>Dominio autorizado:</strong> Verifica que la URL del sitio web esté registrada como dominio de entrega de OneSignal.</li>
                              </ol>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "wheel" && restaurant && (
                <motion.div
                  key="wheel"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="glass-card rounded-3xl shadow-sm border border-outline p-8">
                    <div className="flex flex-col items-center text-center mb-8 space-y-6">
                      <div>
                        <h3 className="text-2xl font-black">
                          Ruleta de Premios
                        </h3>
                        <p className="text-on-surface-muted text-sm font-medium mt-2 max-w-lg mx-auto">
                          Configura una ruleta interactiva para premiar a tus
                          clientes después de su compra.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-4 w-full">
                        {wheelConfig && (
                          <>
                            <button
                              onClick={() => setActiveTab("wheel_prizes")}
                              className="flex items-center gap-2 px-4 py-2.5 bg-teal-50 text-teal-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-teal-100 transition-all border border-teal-200 shadow-sm whitespace-nowrap"
                            >
                              <Trophy className="w-4 h-4" />
                              Ver Ganadores
                            </button>
                            <div className="flex items-center justify-center gap-2 bg-surface-variant p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto no-scrollbar">
                              <button
                                onClick={async () => {
                                  const newConfig = {
                                    ...wheelConfig,
                                    isActive: true,
                                  };
                                  setWheelConfig(newConfig);
                                  try {
                                    await db.saveWheelConfig(newConfig);
                                    toast.success("Ruleta ACTIVADA");
                                  } catch (e: any) {
                                    toast.error(
                                      `Error al actualizar: ${e.message || "Error desconocido"}`,
                                    );
                                  }
                                }}
                                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${wheelConfig.isActive ? "bg-emerald-500 text-on-surface shadow-lg shadow-emerald-200 scale-105" : "text-on-surface-muted hover:text-on-surface-muted"}`}
                              >
                                <div className="flex items-center gap-2">
                                  {wheelConfig.isActive && (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  )}
                                  Activa
                                </div>
                              </button>
                              <button
                                onClick={async () => {
                                  const newConfig = {
                                    ...wheelConfig,
                                    isActive: false,
                                  };
                                  setWheelConfig(newConfig);
                                  try {
                                    await db.saveWheelConfig(newConfig);
                                    toast.success("Ruleta DESACTIVADA");
                                  } catch (e: any) {
                                    toast.error(
                                      `Error al actualizar: ${e.message || "Error desconocido"}`,
                                    );
                                  }
                                }}
                                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${!wheelConfig.isActive ? "bg-surface-light text-on-surface shadow-lg shadow-neutral-200 scale-105" : "text-on-surface-muted hover:text-on-surface-muted"}`}
                              >
                                <div className="flex items-center gap-2">
                                  {!wheelConfig.isActive && (
                                    <XCircle className="w-3.5 h-3.5" />
                                  )}
                                  Inactiva
                                </div>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {!wheelConfig ? (
                      <div className="text-center py-12">
                        <button
                          onClick={() =>
                            setWheelConfig({
                              id: "",
                              restaurantId: restaurant.id,
                              isActive: false,
                              minOrderAmount: 50.0,
                              countdownSeconds: 60,
                              spinDuration: 5,
                              segments: [
                                {
                                  text: "10% Desc",
                                  color: "#f59e0b",
                                  value: "coupon_10",
                                },
                                {
                                  text: "Bebida Gratis",
                                  color: "#10b981",
                                  value: "free_drink",
                                },
                                {
                                  text: "Sigue Intentando",
                                  color: "#6b7280",
                                  value: "nothing",
                                },
                                {
                                  text: "Postre Gratis",
                                  color: "#ec4899",
                                  value: "free_dessert",
                                },
                                {
                                  text: "20% Desc",
                                  color: "#f59e0b",
                                  value: "coupon_20",
                                },
                                {
                                  text: "Sorpresa",
                                  color: "#8b5cf6",
                                  value: "surprise",
                                },
                              ],
                              createdAt: new Date().toISOString(),
                            })
                          }
                          className="px-8 py-4 bg-orange-600 text-on-surface rounded-2xl font-black shadow-lg shadow-orange-100 hover:scale-105 transition-all"
                        >
                          Crear Configuración de Ruleta
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-muted mb-2">
                                Compra Mínima ($)
                              </label>
                              <input
                                type="number"
                                value={wheelConfig.minOrderAmount}
                                onChange={(e) =>
                                  setWheelConfig({
                                    ...wheelConfig,
                                    minOrderAmount:
                                      parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="w-full px-4 py-3 bg-surface-base border border-outline rounded-2xl outline-none focus:border-orange-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-muted mb-2">
                                Cuenta Regresiva (seg)
                              </label>
                              <input
                                type="number"
                                value={wheelConfig.countdownSeconds}
                                onChange={(e) =>
                                  setWheelConfig({
                                    ...wheelConfig,
                                    countdownSeconds:
                                      parseInt(e.target.value) || 0,
                                  })
                                }
                                className="w-full px-4 py-3 bg-surface-base border border-outline rounded-2xl outline-none focus:border-orange-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-muted mb-2">
                                Velocidad de Giro (seg)
                              </label>
                              <input
                                type="number"
                                value={wheelConfig.spinDuration}
                                onChange={(e) =>
                                  setWheelConfig({
                                    ...wheelConfig,
                                    spinDuration: parseInt(e.target.value) || 0,
                                  })
                                }
                                className="w-full px-4 py-3 bg-surface-base border border-outline rounded-2xl outline-none focus:border-orange-500 font-bold"
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-muted">
                                Segmentos de la Ruleta
                              </label>
                              <button
                                onClick={() =>
                                  setWheelConfig({
                                    ...wheelConfig,
                                    segments: [
                                      ...wheelConfig.segments,
                                      {
                                        text: "Nuevo Premio",
                                        color: "#000000",
                                        value: "custom",
                                      },
                                    ],
                                  })
                                }
                                className="text-xs font-black text-orange-600 uppercase tracking-widest flex items-center gap-1"
                              >
                                <Plus className="w-4 h-4" /> Añadir
                              </button>
                            </div>

                            <div className="space-y-3">
                              {wheelConfig.segments.map((seg, idx) => (
                                <div
                                  key={idx}
                                  className="flex gap-3 items-start flex-col sm:flex-row"
                                >
                                  <div className="flex gap-3 w-full">
                                    <input
                                      type="color"
                                      value={seg.color}
                                      onChange={(e) => {
                                        const newSegments = [
                                          ...wheelConfig.segments,
                                        ];
                                        newSegments[idx].color = e.target.value;
                                        setWheelConfig({
                                          ...wheelConfig,
                                          segments: newSegments,
                                        });
                                      }}
                                      className="w-12 h-12 rounded-lg border-none cursor-pointer shrink-0"
                                    />
                                    <div className="flex-1 space-y-2 w-full">
                                      <input
                                        type="text"
                                        value={seg.text}
                                        onChange={(e) => {
                                          const newSegments = [
                                            ...wheelConfig.segments,
                                          ];
                                          newSegments[idx].text =
                                            e.target.value;
                                          setWheelConfig({
                                            ...wheelConfig,
                                            segments: newSegments,
                                          });
                                        }}
                                        placeholder="Texto del premio (o mensaje)"
                                        className="w-full px-4 py-3 bg-surface-base border border-outline rounded-2xl outline-none focus:border-orange-500 font-bold"
                                      />
                                      <label className="flex items-center gap-2 px-2">
                                        <input
                                          type="checkbox"
                                          checked={seg.isPrize !== false}
                                          onChange={(e) => {
                                            const newSegments = [
                                              ...wheelConfig.segments,
                                            ];
                                            newSegments[idx].isPrize =
                                              e.target.checked;
                                            setWheelConfig({
                                              ...wheelConfig,
                                              segments: newSegments,
                                            });
                                          }}
                                          className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                                        />
                                        <span className="text-xs font-bold text-on-surface-muted">
                                          Es un Premio Real (vs. Mensaje)
                                        </span>
                                      </label>
                                    </div>
                                    <button
                                      onClick={() => {
                                        const newSegments =
                                          wheelConfig.segments.filter(
                                            (_, i) => i !== idx,
                                          );
                                        setWheelConfig({
                                          ...wheelConfig,
                                          segments: newSegments,
                                        });
                                      }}
                                      className="p-3 text-on-surface-muted hover:text-red-500 transition-colors shrink-0"
                                      title="Eliminar segmento"
                                    >
                                      <X className="w-5 h-5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <button
                            disabled={isSavingWheel}
                            onClick={async () => {
                              setIsSavingWheel(true);
                              try {
                                await db.saveWheelConfig(wheelConfig);
                                toast.success(
                                  "Configuración de ruleta guardada",
                                );
                              } catch (e: any) {
                                toast.error(
                                  `Error al guardar: ${e.message || "Error desconocido"}`,
                                );
                              } finally {
                                setIsSavingWheel(false);
                              }
                            }}
                            className="w-full py-4 bg-orange-600 text-on-surface rounded-2xl font-black shadow-lg shadow-orange-100 hover:scale-105 transition-all flex items-center justify-center gap-2"
                          >
                            {isSavingWheel ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Save className="w-5 h-5" />
                            )}
                            GUARDAR CONFIGURACIÓN
                          </button>
                        </div>

                        <div className="flex flex-col items-center justify-center bg-surface-base rounded-3xl p-8 border border-outline min-h-[400px]">
                          <div className="relative w-64 h-64 rounded-full border-8 border-neutral-900 shadow-2xl flex items-center justify-center overflow-hidden">
                            <svg
                              viewBox="0 0 100 100"
                              className="w-full h-full"
                            >
                              {wheelConfig.segments.map((seg, i) => {
                                const angle = 360 / wheelConfig.segments.length;
                                const startAngle = i * angle;
                                const endAngle = (i + 1) * angle;
                                const x1 =
                                  50 +
                                  50 * Math.cos((Math.PI * startAngle) / 180);
                                const y1 =
                                  50 +
                                  50 * Math.sin((Math.PI * startAngle) / 180);
                                const x2 =
                                  50 +
                                  50 * Math.cos((Math.PI * endAngle) / 180);
                                const y2 =
                                  50 +
                                  50 * Math.sin((Math.PI * endAngle) / 180);
                                const largeArcFlag = angle > 180 ? 1 : 0;
                                return (
                                  <path
                                    key={i}
                                    d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                                    fill={seg.color}
                                  />
                                );
                              })}
                            </svg>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.4),transparent_70%)] pointer-events-none" />
                            <div className="absolute inset-0 m-auto w-10 h-10 glass-card text-on-surface rounded-full border-4 border-neutral-900 flex items-center justify-center z-10">
                              <Trophy className="w-4 h-4 text-amber-500" />
                            </div>
                          </div>
                          <p className="mt-8 text-xs font-black text-on-surface-muted uppercase tracking-[0.3em]">
                            Vista Previa
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === "wheel_prizes" && restaurant && (
                <motion.div
                  key="wheel_prizes"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="glass-card rounded-3xl shadow-sm border border-outline p-8">
                    <div className="flex flex-col items-center text-center gap-4 mb-8 space-y-4">
                      <div>
                        <h3 className="text-2xl font-black">
                          Ganadores de la Ruleta
                        </h3>
                        <p className="text-on-surface-muted text-sm font-medium mt-2">
                          Gestiona y entrega los premios ganados por tus
                          clientes.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-3 w-full">
                        <button
                          onClick={async () => {
                            const data = await db.getRestaurantWheelPrizes(
                              restaurant.id,
                            );
                            setWheelPrizes(data);
                            toast.success("Listado actualizado");
                          }}
                          className="p-3 bg-surface-variant text-on-surface-muted rounded-xl hover:bg-surface-variant transition-all shadow-sm"
                          title="Actualizar"
                        >
                          <RefreshCcw className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setActiveTab("wheel")}
                          className="flex items-center gap-2 px-6 py-3 bg-surface-variant text-on-surface rounded-xl text-xs font-black uppercase tracking-widest hover:bg-surface-light transition-all shadow-lg"
                        >
                          <Settings className="w-4 h-4" /> Configurar Ruleta
                        </button>
                        <button
                          onClick={async () => {
                            if (
                              window.confirm(
                                "¿Seguro que deseas eliminar todos los premios con estado 'Entregado'?",
                              )
                            ) {
                              const { error } =
                                await db.deleteDeliveredWheelPrizes(
                                  restaurant.id,
                                );
                              if (error) {
                                toast.error("Error al eliminar los registros");
                              } else {
                                toast.success("Registros limpios");
                                const data = await db.getRestaurantWheelPrizes(
                                  restaurant.id,
                                );
                                setWheelPrizes(data);
                              }
                            }
                          }}
                          className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-all shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" /> Eliminar Entregados
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                        <p className="text-[10px] font-black uppercase text-orange-600/60 tracking-wider mb-1">
                          Premios Totales
                        </p>
                        <p className="text-3xl font-black text-orange-600">
                          {wheelPrizes.length}
                        </p>
                      </div>
                      <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                        <p className="text-[10px] font-black uppercase text-amber-600/60 tracking-wider mb-1">
                          Pendientes de Entrega
                        </p>
                        <p className="text-3xl font-black text-amber-600">
                          {
                            wheelPrizes.filter((p) => p.status === "pending")
                              .length
                          }
                        </p>
                      </div>
                      <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                        <p className="text-[10px] font-black uppercase text-emerald-600/60 tracking-wider mb-1">
                          Entregados
                        </p>
                        <p className="text-3xl font-black text-emerald-600">
                          {
                            wheelPrizes.filter((p) => p.status === "delivered")
                              .length
                          }
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto -mx-8 sm:mx-0">
                      <table className="w-full text-left min-w-[800px]">
                        <thead>
                          <tr className="border-b border-outline bg-surface-base/50">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-muted">
                              Cliente
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-muted">
                              Premio Ganado
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-muted">
                              Fecha y Hora
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-muted">
                              Estado
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-muted text-right">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-50">
                          {wheelPrizes.length === 0 ? (
                            <tr>
                              <td
                                colSpan={5}
                                className="px-6 py-12 text-center text-on-surface-muted font-bold italic"
                              >
                                No se han registrado ganadores aún.
                              </td>
                            </tr>
                          ) : (
                            wheelPrizes.map((prize) => (
                              <tr
                                key={prize.id}
                                className="group hover:bg-surface-base transition-colors"
                              >
                                <td className="px-6 py-4">
                                  <div className="flex flex-col">
                                    <div className="font-bold text-on-surface flex items-center gap-3">
                                      <div className="w-10 h-10 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-xl flex items-center justify-center text-xs font-black shadow-sm group-hover:scale-110 transition-all">
                                        {(prize.userName || prize.userId)
                                          .slice(0, 2)
                                          .toUpperCase()}
                                      </div>
                                      <div>
                                        <p className="font-black text-sm">
                                          {prize.userName ||
                                            `Usuario #${prize.userId.slice(-6).toUpperCase()}`}
                                        </p>
                                        <p className="text-[10px] font-bold text-on-surface-muted uppercase tracking-wider">
                                          ID: {prize.userId.slice(0, 8)}
                                        </p>
                                      </div>
                                    </div>
                                    {prize.userPhone && (
                                      <div className="text-[10px] text-on-surface-muted font-bold ml-13 mt-1 flex items-center gap-1">
                                        <span className="w-1 h-1 rounded-full bg-neutral-300"></span>
                                        {prize.userPhone}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-col">
                                    <div className="font-black text-orange-600 flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                                        <Sparkles className="w-4 h-4" />
                                      </div>
                                      {prize.prizeText}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-xs text-on-surface-muted font-bold flex flex-col">
                                    <div className="flex items-center gap-2 bg-surface-variant w-fit px-2 py-1 rounded-lg">
                                      <Clock className="w-3 h-3" />
                                      {new Date(
                                        prize.createdAt,
                                      ).toLocaleDateString()}
                                    </div>
                                    <span className="mt-1 ml-1 text-[10px] opacity-60">
                                      {new Date(
                                        prize.createdAt,
                                      ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${
                                      prize.status === "delivered"
                                        ? "bg-emerald-100 text-emerald-600 border border-emerald-200"
                                        : "bg-amber-100 text-amber-600 border border-amber-200 animate-pulse"
                                    }`}
                                  >
                                    {prize.status === "delivered" ? (
                                      <CheckCircle2 className="w-3 h-3" />
                                    ) : (
                                      <Clock className="w-3 h-3" />
                                    )}
                                    {prize.status === "delivered"
                                      ? "Entregado"
                                      : "Pendiente"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <button
                                    disabled={isUpdatingPrize === prize.id}
                                    onClick={async () => {
                                      setIsUpdatingPrize(prize.id);
                                      try {
                                        const newStatus =
                                          prize.status === "pending"
                                            ? "delivered"
                                            : "pending";
                                        await db.updateWheelPrizeStatus(
                                          prize.id,
                                          newStatus,
                                        );
                                        setWheelPrizes((prev) =>
                                          prev.map((p) =>
                                            p.id === prize.id
                                              ? { ...p, status: newStatus }
                                              : p,
                                          ),
                                        );
                                        toast.success(
                                          newStatus === "delivered"
                                            ? "Premio marcado como ENTREGADO"
                                            : "Premio marcado como PENDIENTE",
                                        );
                                      } catch (e) {
                                        toast.error(
                                          "Error al actualizar el estado del premio",
                                        );
                                      } finally {
                                        setIsUpdatingPrize(null);
                                      }
                                    }}
                                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all inline-flex items-center gap-2 shadow-sm ${
                                      prize.status === "pending"
                                        ? "bg-surface-variant text-on-surface hover:bg-surface-light hover:scale-105"
                                        : "bg-surface-variant text-on-surface-muted hover:bg-surface-variant"
                                    }`}
                                  >
                                    {isUpdatingPrize === prize.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <RefreshCcw className="w-3.5 h-3.5" />
                                    )}
                                    {prize.status === "pending"
                                      ? "Marcar Entregado"
                                      : "Revertir a Pendiente"}
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                          {wheelPrizes.length === 0 && (
                            <tr>
                              <td
                                colSpan={5}
                                className="px-6 py-24 text-center"
                              >
                                <div className="max-w-xs mx-auto">
                                  <div className="w-20 h-20 bg-surface-variant rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Trophy className="w-10 h-10 text-on-surface-variant" />
                                  </div>
                                  <h4 className="text-lg font-black text-on-surface mb-2">
                                    No hay ganadores aún
                                  </h4>
                                  <p className="text-on-surface-muted text-sm font-medium">
                                    Cuando los clientes giren la ruleta y ganen
                                    premios, aparecerán listados aquí.
                                  </p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "reviews" && (
                <motion.div
                  key="reviews"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black">Reseñas de Clientes</h3>
                    <div className="flex items-center gap-2 glass-card text-on-surface px-4 py-2 rounded-xl shadow-sm border border-outline">
                      <Star className="w-5 h-5 text-orange-500 fill-orange-500" />
                      <span className="font-black text-on-surface">
                        {reviews.length > 0
                          ? (
                              reviews.reduce((acc, r) => acc + r.rating, 0) /
                              reviews.length
                            ).toFixed(1)
                          : "0.0"}
                      </span>
                      <span className="text-sm text-on-surface-muted font-medium">
                        ({reviews.length} reseñas)
                      </span>
                    </div>
                  </div>

                  {reviews.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {reviews.map((review) => {
                        const order = orders.find(
                          (o) => o.id === review.orderId,
                        );

                        const handleStatusUpdate = async (
                          status: "approved" | "rejected",
                        ) => {
                          try {
                            const { error } = await db.updateReviewStatus(
                              review.id,
                              status,
                            );
                            if (error) {
                              toast.error("Error al actualizar la reseña");
                            } else {
                              toast.success(
                                status === "approved"
                                  ? "Reseña aprobada y publicada"
                                  : "Reseña rechazada correctamente",
                              );
                              fetchData();
                            }
                          } catch (e) {
                            toast.error("Error al actualizar la reseña");
                          }
                        };

                        return (
                          <div
                            key={review.id}
                            className="glass-card p-6 rounded-2xl shadow-sm border border-outline flex flex-col justify-between hover:border-outline transition-all"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-4 h-4 ${star <= review.rating ? "fill-orange-500 text-orange-500" : "fill-neutral-200 text-neutral-200"}`}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs font-bold text-on-surface-muted">
                                  {new Date(
                                    review.createdAt,
                                  ).toLocaleDateString()}
                                </span>
                              </div>

                              {/* Status Badge */}
                              <div className="mb-3">
                                {review.status === "approved" ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3" />{" "}
                                    Publicada
                                  </span>
                                ) : review.status === "rejected" ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                    <X className="w-3 h-3" /> Rechazada
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    <AlertCircle className="w-3 h-3 animate-pulse" />{" "}
                                    Pendiente
                                  </span>
                                )}
                              </div>

                              {review.comment && (
                                <p className="text-on-surface-variant font-medium italic mb-4 leading-relaxed">
                                  "{review.comment}"
                                </p>
                              )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-outline">
                              {order && (
                                <div className="mb-4">
                                  <p className="text-xs font-bold text-on-surface-muted uppercase tracking-widest mb-1">
                                    Pedido #{order.id.slice(-6).toUpperCase()}
                                  </p>
                                  <p className="text-sm font-medium text-on-surface">
                                    {order.customerName}
                                  </p>
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex gap-2">
                                {(review.status === "pending" ||
                                  review.status === "rejected") && (
                                  <button
                                    onClick={() =>
                                      handleStatusUpdate("approved")
                                    }
                                    className="flex-1 inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-on-surface hover:bg-emerald-500 transition-colors shadow-sm active:scale-95"
                                  >
                                    Aprobar
                                  </button>
                                )}
                                {(review.status === "pending" ||
                                  review.status === "approved") && (
                                  <button
                                    onClick={() =>
                                      handleStatusUpdate("rejected")
                                    }
                                    className="flex-1 inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-xs font-bold bg-surface-variant text-on-surface-variant hover:bg-surface-variant transition-colors active:scale-95"
                                  >
                                    Rechazar
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center p-12 glass-card text-on-surface rounded-2xl border border-outline shadow-sm">
                      <Star className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
                      <p className="text-on-surface-muted font-bold">
                        Aún no hay reseñas registradas.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "ai" && restaurant && (
                <motion.div
                  key="ai"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <AITrainingSection
                    restaurant={restaurant}
                    onUpdate={fetchData}
                  />
                </motion.div>
              )}

              {activeTab === "meta_social" && restaurant && (
                <motion.div
                  key="meta_social"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <MetaPostCreator
                    restaurant={restaurant}
                    onUpdate={fetchData}
                  />
                </motion.div>
              )}

              {activeTab === "ai_marketing" && restaurant && (
                <motion.div
                  key="ai_marketing"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <AIAgentMarketing
                    restaurant={restaurant}
                    orders={orders}
                    products={restaurant.menu}
                  />
                </motion.div>
              )}

              {activeTab === "qr" && restaurant && (
                <motion.div
                  key="qr"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="glass-card rounded-2xl shadow-sm border border-outline p-8">
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <h3 className="text-2xl font-black">
                          Código QR General
                        </h3>
                        <p className="text-on-surface-muted text-sm font-medium">
                          Usa este QR para tu menú digital general
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => {
                            const url = getPublicUrl();
                            navigator.clipboard.writeText(url);
                            toast.success("Enlace copiado al portapapeles");
                          }}
                          className="text-on-surface-muted font-bold text-xs uppercase tracking-widest hover:text-orange-600 flex items-center gap-2 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Copiar Enlace
                        </button>
                        <a
                          href={getPublicUrl()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-600 font-black text-sm uppercase tracking-widest hover:underline flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Ver Menú Público
                        </a>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center py-6">
                      <div
                        className="glass-card p-6 rounded-2xl shadow-lg border border-outline mb-6"
                        id="qr-code-container"
                      >
                        <div className="text-center mb-4">
                          <h4 className="text-xl font-black text-on-surface">
                            {restaurant.name}
                          </h4>
                          <p className="text-xs text-on-surface-muted font-medium">
                            Escanea para ver nuestro menú
                          </p>
                        </div>
                        <div className="flex justify-center glass-card p-2 rounded-xl">
                          <QRCodeSVG
                            id="restaurant-qr"
                            value={getPublicUrl()}
                            size={200}
                            level="H"
                            includeMargin={true}
                          />
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={() => {
                            const svg =
                              document.getElementById("restaurant-qr");
                            if (!svg) return;
                            const svgData =
                              new XMLSerializer().serializeToString(svg);
                            const canvas = document.createElement("canvas");
                            const ctx = canvas.getContext("2d");
                            const img = new Image();
                            img.onload = () => {
                              canvas.width = img.width;
                              canvas.height = img.height;
                              ctx?.drawImage(img, 0, 0);
                              const pngFile = canvas.toDataURL("image/png");
                              const downloadLink = document.createElement("a");
                              downloadLink.download = `qr-${restaurant.name.replace(/\s+/g, "-").toLowerCase()}.png`;
                              downloadLink.href = `${pngFile}`;
                              downloadLink.click();
                            };
                            img.src =
                              "data:image/svg+xml;base64," +
                              btoa(unescape(encodeURIComponent(svgData)));
                          }}
                          className="px-6 py-2.5 bg-orange-500 text-on-surface rounded-xl font-black text-sm hover:bg-orange-600 transition-colors flex items-center gap-2 shadow-lg shadow-orange-200"
                        >
                          <Download className="w-4 h-4" />
                          Descargar
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card rounded-2xl shadow-sm border border-outline p-8">
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <h3 className="text-2xl font-black">
                          Gestión de Mesas
                        </h3>
                        <p className="text-on-surface-muted text-sm font-medium">
                          Crea QRs específicos para cada mesa y recibe pedidos
                          directos
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            window.print();
                          }}
                          className="flex items-center gap-2 bg-surface-variant text-on-surface-variant px-4 py-2 rounded-xl font-bold text-sm hover:bg-surface-variant transition-all"
                        >
                          <Download className="w-4 h-4" />
                          Imprimir Todos
                        </button>
                        <button
                          onClick={() => setIsAddingTable(true)}
                          className="flex items-center gap-2 bg-surface-variant text-on-surface px-4 py-2 rounded-xl font-bold text-sm hover:bg-surface-light transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          Añadir Mesa
                        </button>
                      </div>
                    </div>

                    {isAddingTable && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 p-6 bg-surface-base rounded-2xl border border-outline"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-black">Añadir Mesas</h4>
                          <div className="flex bg-surface-variant p-1 rounded-lg">
                            <button
                              onClick={() => setTableCreationMode("single")}
                              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${tableCreationMode === "single" ? "glass-card text-on-surface shadow-sm text-on-surface" : "text-on-surface-muted hover:text-on-surface-variant"}`}
                            >
                              Individual
                            </button>
                            <button
                              onClick={() => setTableCreationMode("bulk")}
                              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${tableCreationMode === "bulk" ? "glass-card text-on-surface shadow-sm text-on-surface" : "text-on-surface-muted hover:text-on-surface-variant"}`}
                            >
                              Masiva
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                          {tableCreationMode === "single" ? (
                            <input
                              type="text"
                              value={newTableName}
                              onChange={(e) => setNewTableName(e.target.value)}
                              placeholder="Ej: Mesa 1, Terraza 4..."
                              className="flex-1 px-4 py-2 glass-card text-on-surface border border-outline rounded-xl outline-none focus:border-orange-500 font-bold"
                            />
                          ) : (
                            <div className="flex flex-1 gap-2">
                              <input
                                type="text"
                                value={bulkTablePrefix}
                                onChange={(e) =>
                                  setBulkTablePrefix(e.target.value)
                                }
                                placeholder="Prefijo (ej: Mesa)"
                                className="flex-1 px-4 py-2 glass-card text-on-surface border border-outline rounded-xl outline-none focus:border-orange-500 font-bold"
                              />
                              <input
                                type="number"
                                min="1"
                                max="50"
                                value={bulkTableCount}
                                onChange={(e) =>
                                  setBulkTableCount(
                                    parseInt(e.target.value) || 1,
                                  )
                                }
                                className="w-24 px-4 py-2 glass-card text-on-surface border border-outline rounded-xl outline-none focus:border-orange-500 font-bold"
                              />
                            </div>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={handleAddTable}
                              className="px-6 py-2 bg-orange-500 text-on-surface rounded-xl font-black hover:bg-orange-600 transition-all"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => setIsAddingTable(false)}
                              className="px-6 py-2 bg-surface-variant text-on-surface-muted rounded-xl font-black hover:bg-neutral-300 transition-all"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div
                      id="qr-print-area"
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                      {(restaurant.tables || []).map((table) => (
                        <div
                          key={table}
                          className="bg-surface-base p-6 rounded-2xl border border-outline flex flex-col items-center group relative print-break-inside-avoid"
                        >
                          <div className="absolute top-2 right-2 flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all">
                            <button
                              onClick={() => {
                                setEditingTableOriginal(table);
                                setEditingTableName(table);
                              }}
                              className="p-2 text-on-surface-muted hover:text-blue-500"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTable(table)}
                              className="p-2 text-on-surface-muted hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div
                            className="glass-card p-4 rounded-xl shadow-sm border border-outline mb-4"
                            id={`qr-table-${table}`}
                          >
                            <div className="text-center mb-2">
                              <h5 className="font-black text-sm">
                                {restaurant.name}
                              </h5>
                              <p className="text-[10px] text-on-surface-muted font-bold uppercase tracking-widest">
                                {table}
                              </p>
                            </div>
                            <QRCodeSVG
                              id={`qr-svg-${table}`}
                              value={getPublicUrl(table)}
                              size={140}
                              level="H"
                              includeMargin={true}
                            />
                          </div>

                          {editingTableOriginal === table ? (
                            <div className="flex gap-2 w-full mb-4">
                              <input
                                type="text"
                                value={editingTableName}
                                onChange={(e) =>
                                  setEditingTableName(e.target.value)
                                }
                                className="flex-1 px-3 py-1 text-sm glass-card text-on-surface border border-outline rounded-lg outline-none focus:border-blue-500 font-bold"
                                autoFocus
                              />
                              <button
                                onClick={handleEditTable}
                                className="p-1.5 bg-blue-500 text-on-surface rounded-lg hover:bg-blue-600"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingTableOriginal(null)}
                                className="p-1.5 bg-surface-variant text-on-surface-muted rounded-lg hover:bg-neutral-300"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <h4 className="font-black text-on-surface mb-4">
                              {table}
                            </h4>
                          )}

                          <div className="flex gap-2 w-full">
                            <button
                              onClick={() => {
                                const svg = document.getElementById(
                                  `qr-svg-${table}`,
                                );
                                if (!svg) return;
                                const svgData =
                                  new XMLSerializer().serializeToString(svg);
                                const canvas = document.createElement("canvas");
                                const ctx = canvas.getContext("2d");
                                const img = new Image();
                                img.onload = () => {
                                  canvas.width = img.width;
                                  canvas.height = img.height;
                                  ctx?.drawImage(img, 0, 0);
                                  const pngFile = canvas.toDataURL("image/png");
                                  const downloadLink =
                                    document.createElement("a");
                                  downloadLink.download = `qr-${restaurant.name}-${table}.png`;
                                  downloadLink.href = `${pngFile}`;
                                  downloadLink.click();
                                };
                                img.src =
                                  "data:image/svg+xml;base64," +
                                  btoa(unescape(encodeURIComponent(svgData)));
                              }}
                              className="flex-1 flex items-center justify-center gap-2 py-2 glass-card text-on-surface border border-outline rounded-xl text-xs font-black hover:bg-surface-variant transition-all"
                            >
                              <Download className="w-3 h-3" />
                              PNG
                            </button>
                            <button
                              onClick={() => {
                                const printWindow = window.open("", "_blank");
                                if (!printWindow) return;
                                const container = document.getElementById(
                                  `qr-table-${table}`,
                                );
                                if (!container) return;
                                printWindow.document.write(`
                            <html>
                              <head>
                                <title>Imprimir QR - ${table}</title>
                                <style>
                                  body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                                  .container { text-align: center; padding: 2rem; border: 2px solid #f0f0f0; border-radius: 1.5rem; }
                                  h4 { margin: 0 0 0.5rem 0; font-size: 1.5rem; font-weight: 900; }
                                  p { margin: 0 0 1.5rem 0; color: #737373; font-size: 1rem; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; }
                                </style>
                              </head>
                              <body>
                                <div class="container">
                                  ${container.innerHTML}
                                </div>
                                <script>
                                  window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); }
                                </script>
                              </body>
                            </html>
                          `);
                                printWindow.document.close();
                              }}
                              className="flex-1 flex items-center justify-center gap-2 py-2 bg-surface-variant text-on-surface rounded-xl text-xs font-black hover:bg-surface-light transition-all"
                            >
                              Imprimir
                            </button>
                          </div>
                        </div>
                      ))}

                      {(!restaurant.tables ||
                        restaurant.tables.length === 0) && (
                        <div className="col-span-full py-12 text-center bg-surface-base rounded-2xl border border-dashed border-neutral-300">
                          <QrCode className="w-12 h-12 text-on-surface-variant mx-auto mb-4" />
                          <p className="text-on-surface-muted font-bold">
                            Aún no has configurado mesas.
                          </p>
                          <button
                            onClick={() => setIsAddingTable(true)}
                            className="mt-4 text-orange-600 font-black text-sm hover:underline"
                          >
                            Crear mi primera mesa
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "settings" && restaurant && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="glass-card rounded-2xl shadow-sm border border-outline p-8"
                >
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black">
                      Configuración del Restaurante
                    </h3>
                    <button
                      onClick={async () => {
                        if (!restaurant) return;
                        try {
                          // Use the latest state values
                          const updateData = {
                            name: restaurant.name,
                            type: restaurant.type,
                            description: restaurant.description,
                            businessType: restaurant.businessType,
                            handlesPromotions: restaurant.handlesPromotions,
                            address: restaurant.address,
                            department: restaurant.department,
                            city: restaurant.city,
                            phone: restaurant.phone,
                            whatsappNumber: restaurant.whatsappNumber,
                            openingHours: restaurant.openingHours,
                            hasDelivery: restaurant.hasDelivery,
                            deliveryFee: restaurant.deliveryFee,
                            logo: restaurant.logo,
                            coverImage: restaurant.coverImage,
                            detailedHours: restaurant.detailedHours,
                            aiKnowledge: restaurant.aiKnowledge,
                            highlightMessage: restaurant.highlightMessage,
                            status: restaurant.status,
                            generalDiscount: restaurant.generalDiscount,
                            generalDiscountEnabled:
                              restaurant.generalDiscountEnabled,
                            gamificationEnabled:
                              restaurant.gamificationEnabled,
                          };

                          await db.updateRestaurant(restaurant.id, updateData);
                          toast.success("Configuración guardada");
                          fetchData();
                        } catch (error: any) {
                          console.error(
                            "Error saving restaurant settings:",
                            error,
                          );
                          toast.error(
                            `Error al guardar: ${error.message || "Error desconocido"}`,
                          );
                        }
                      }}
                      disabled={isUploading}
                      className={`bg-orange-500 text-on-surface px-8 py-3 rounded-2xl font-black hover:bg-orange-600 flex items-center gap-2 shadow-lg shadow-orange-200 transition-all hover:scale-105 active:scale-95 ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {isUploading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      {isUploading ? "Subiendo..." : "Guardar Cambios"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Información Básica */}
                    <div className="space-y-6">
                      <h4 className="text-sm font-black text-on-surface-muted uppercase tracking-widest border-b border-outline pb-2">
                        Información Básica
                      </h4>

                      <div>
                        <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">
                          Nombre del Restaurante / Razón Social
                        </label>
                        <input
                          type="text"
                          value={restaurant.name || ""}
                          onChange={(e) =>
                            setRestaurant((prev) =>
                              prev ? { ...prev, name: e.target.value } : prev,
                            )
                          }
                          className="w-full border-2 border-outline rounded-2xl px-5 py-3 focus:border-orange-500 outline-none transition-colors font-bold"
                          placeholder="Ej: La Pizzería de Juan"
                        />
                      </div>

                      {/* Add Status Toggle Here */}
                      <div className="flex items-center gap-4 p-4 bg-surface-base rounded-2xl border-2 border-outline">
                        <span className="font-black text-on-surface">
                          Estado:
                        </span>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={restaurant.status === "active"}
                            onChange={(e) =>
                              setRestaurant((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      status: e.target.checked
                                        ? "active"
                                        : "inactive",
                                    }
                                  : prev,
                              )
                            }
                            className="w-5 h-5 accent-orange-500"
                          />
                          <span className="font-bold text-sm">
                            {restaurant.status === "active"
                              ? "Activo (Visible en App)"
                              : "Inactivo (Oculto)"}
                          </span>
                        </label>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">
                          Descripción
                        </label>
                        <textarea
                          value={restaurant.description || ""}
                          onChange={(e) =>
                            setRestaurant((prev) =>
                              prev
                                ? { ...prev, description: e.target.value }
                                : prev,
                            )
                          }
                          className="w-full border-2 border-outline rounded-2xl px-5 py-3 focus:border-orange-500 outline-none transition-colors font-bold resize-none h-24"
                          placeholder="Describe tu restaurante brevemente..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">
                            Modelo de Negocio
                          </label>
                          <select
                            value={restaurant.businessCategory || "restaurant"}
                            onChange={(e) =>
                              setRestaurant((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      businessCategory: e.target.value,
                                    }
                                  : prev,
                              )
                            }
                            className="w-full border-2 border-outline rounded-2xl px-5 py-3 focus:border-orange-500 outline-none transition-colors font-bold glass-card text-on-surface"
                          >
                            {(platformSettings?.businessCategories || []).map((cat: any) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.title.replace("Explorar ", "")}
                              </option>
                            ))}
                            {!platformSettings?.businessCategories && (
                              <>
                                <option value="restaurant">Restaurante / Comidas</option>
                                <option value="grocery">Verdulería / Mercado</option>
                                <option value="liquor">Licores / Bebidas</option>
                              </>
                            )}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">
                            Especialidad
                          </label>
                          <input
                            type="text"
                            value={restaurant.type || ""}
                            onChange={(e) =>
                              setRestaurant((prev) =>
                                prev ? { ...prev, type: e.target.value } : prev,
                              )
                            }
                            className="w-full border-2 border-outline rounded-2xl px-5 py-3 focus:border-orange-500 outline-none transition-colors font-bold"
                            placeholder="Ej: Comida Rápida"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">
                            Tipo de Establecimiento
                          </label>
                          <select
                            value={restaurant.businessType || "physical"}
                            onChange={(e) =>
                              setRestaurant((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      businessType: e.target.value as
                                        | "physical"
                                        | "online",
                                    }
                                  : prev,
                              )
                            }
                            className="w-full border-2 border-outline rounded-2xl px-5 py-3 focus:border-orange-500 outline-none transition-colors font-bold glass-card text-on-surface"
                          >
                            <option value="physical">Local Físico</option>
                            <option value="online">
                              Solo Online / Cocina Oculta
                            </option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-outline">
                        <h4 className="text-sm font-black text-on-surface-muted uppercase tracking-widest border-b border-outline pb-2 mb-4">
                          Mensaje Destacado (Página Principal)
                        </h4>
                        <div className="bg-blue-50 rounded-[2rem] p-6 border-2 border-blue-100">
                          <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">
                            Mensaje para atraer clientes (Pulsante)
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-blue-600">
                              Aviso.!
                            </span>
                            <input
                              type="text"
                              value={restaurant.highlightMessage || ""}
                              onChange={(e) =>
                                setRestaurant((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        highlightMessage: e.target.value,
                                      }
                                    : prev,
                                )
                              }
                              className="w-full border-2 border-blue-200 rounded-2xl pl-24 pr-5 py-3 focus:border-blue-500 outline-none transition-colors font-bold"
                              placeholder="Ej: ¡Hoy tenemos promociones!"
                            />
                          </div>
                          <p className="text-[10px] text-blue-400 font-bold mt-2 italic px-2">
                            Este mensaje aparecerá en la página principal con
                            una animación llamativa.
                          </p>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-outline">
                        <h4 className="text-sm font-black text-on-surface-muted uppercase tracking-widest border-b border-outline pb-2 mb-4">
                          Gamificación
                        </h4>
                        <div className="bg-emerald-50 rounded-[2rem] p-6 border-2 border-emerald-100">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-black text-on-surface">
                                  Tareas y Niveles
                                </p>
                                {restaurant.gamificationEnabled && (
                                  <span className="bg-emerald-500 text-on-surface px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">
                                    Activo
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-on-surface-muted font-medium italic">
                                Activa el sistema de misiones y niveles para
                                tus clientes.
                              </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={restaurant.gamificationEnabled || false}
                                onChange={(e) =>
                                  setRestaurant((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          gamificationEnabled: e.target.checked,
                                        }
                                      : prev,
                                  )
                                }
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:glass-card text-on-surface after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-outline">
                        <h4 className="text-sm font-black text-on-surface-muted uppercase tracking-widest border-b border-outline pb-2 mb-4">
                          Descuentos del Restaurante
                        </h4>
                        <div className="bg-orange-50 rounded-[2rem] p-6 border-2 border-orange-100">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="font-black text-on-surface">
                                Descuento General
                              </p>
                              <p className="text-xs text-on-surface-muted font-medium italic">
                                Aplica un descuento a todos los productos del
                                menú (excluyendo los que ya tengan descuento
                                individual)
                              </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={
                                  restaurant.generalDiscountEnabled || false
                                }
                                onChange={(e) =>
                                  setRestaurant((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          generalDiscountEnabled:
                                            e.target.checked,
                                        }
                                      : prev,
                                  )
                                }
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:glass-card text-on-surface after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                            </label>
                          </div>

                          {restaurant.generalDiscountEnabled && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="mt-4"
                            >
                              <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">
                                Porcentaje de Descuento (%)
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={restaurant.generalDiscount || 0}
                                  onChange={(e) =>
                                    setRestaurant((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            generalDiscount: Number(
                                              e.target.value,
                                            ),
                                          }
                                        : prev,
                                    )
                                  }
                                  className="w-full border-2 border-orange-200 rounded-2xl px-5 py-3 focus:border-orange-500 outline-none transition-colors font-bold text-lg pr-12"
                                  placeholder="Ej: 10"
                                />
                                <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-orange-500">
                                  %
                                </span>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">
                          Dirección Física
                        </label>
                        <input
                          type="text"
                          value={restaurant.address || ""}
                          onChange={(e) =>
                            setRestaurant((prev) =>
                              prev
                                ? { ...prev, address: e.target.value }
                                : prev,
                            )
                          }
                          className="w-full border-2 border-outline rounded-2xl px-5 py-3 focus:border-orange-500 outline-none transition-colors font-bold"
                          placeholder="Calle 123 # 45-67"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">
                            Departamento
                          </label>
                          <select
                            value={restaurant.department || ""}
                            onChange={(e) => {
                              const dept = e.target.value;
                              setRestaurant((prev) =>
                                prev
                                  ? { ...prev, department: dept, city: "" }
                                  : prev,
                              );
                            }}
                            className="w-full border-2 border-outline rounded-2xl px-5 py-3 focus:border-orange-500 outline-none transition-colors font-bold glass-card text-on-surface"
                          >
                            <option value="">Seleccionar Departamento</option>
                            {getDepartments().map((dept) => (
                              <option key={dept} value={dept}>
                                {dept}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">
                            Ciudad
                          </label>
                          <select
                            value={restaurant.city || ""}
                            onChange={(e) =>
                              setRestaurant((prev) =>
                                prev ? { ...prev, city: e.target.value } : prev,
                              )
                            }
                            disabled={!restaurant.department}
                            className="w-full border-2 border-outline rounded-2xl px-5 py-3 focus:border-orange-500 outline-none transition-colors font-bold glass-card text-on-surface disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="">Seleccionar Ciudad</option>
                            {restaurant.department &&
                              getCitiesByDepartment(restaurant.department).map(
                                (city) => (
                                  <option key={city} value={city}>
                                    {city}
                                  </option>
                                ),
                              )}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">
                            Teléfono de Pedidos
                          </label>
                          <input
                            type="text"
                            value={restaurant.phone || ""}
                            onChange={(e) =>
                              setRestaurant((prev) =>
                                prev
                                  ? { ...prev, phone: e.target.value }
                                  : prev,
                              )
                            }
                            className="w-full border-2 border-outline rounded-2xl px-5 py-3 focus:border-orange-500 outline-none transition-colors font-bold"
                            placeholder="Ej: 310 123 4567"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">
                            WhatsApp (Pedidos)
                          </label>
                          <input
                            type="text"
                            value={restaurant.whatsappNumber || ""}
                            onChange={(e) =>
                              setRestaurant((prev) =>
                                prev
                                  ? { ...prev, whatsappNumber: e.target.value }
                                  : prev,
                              )
                            }
                            className="w-full border-2 border-outline rounded-2xl px-5 py-3 focus:border-orange-500 outline-none transition-colors font-bold"
                            placeholder="Ej: 57 310 123 4567"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-blue-600 uppercase tracking-widest mb-2">
                            Facebook (URL)
                          </label>
                          <input
                            type="url"
                            value={restaurant.facebookUrl || ""}
                            onChange={(e) =>
                              setRestaurant((prev) =>
                                prev
                                  ? { ...prev, facebookUrl: e.target.value }
                                  : prev,
                              )
                            }
                            className="w-full border-2 border-outline rounded-2xl px-5 py-3 focus:border-blue-500 outline-none transition-colors font-bold"
                            placeholder="https://facebook.com/turestaurante"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-pink-600 uppercase tracking-widest mb-2">
                            Instagram (URL)
                          </label>
                          <input
                            type="url"
                            value={restaurant.instagramUrl || ""}
                            onChange={(e) =>
                              setRestaurant((prev) =>
                                prev
                                  ? { ...prev, instagramUrl: e.target.value }
                                  : prev,
                              )
                            }
                            className="w-full border-2 border-outline rounded-2xl px-5 py-3 focus:border-pink-500 outline-none transition-colors font-bold"
                            placeholder="https://instagram.com/turestaurante"
                          />
                        </div>
                      </div>

                      <div className="bg-[#0B0B0B] text-on-surface border-2 border-outline rounded-2xl overflow-hidden golden-glow-module">
                        <button
                          onClick={() => setIsHoursExpanded(!isHoursExpanded)}
                          className="w-full flex items-center justify-between p-5 hover:bg-surface-base transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-xl">
                              <Clock className="w-5 h-5 text-orange-600" />
                            </div>
                            <div className="text-left">
                              <span className="block font-black text-on-surface uppercase tracking-widest text-xs">
                                Horarios de Atención Detallados
                              </span>
                              <span className="text-[10px] text-on-surface-muted font-bold uppercase tracking-widest">
                                Configura turnos por día
                              </span>
                            </div>
                          </div>
                          <ChevronRight
                            className={`w-5 h-5 text-on-surface-muted transition-transform ${isHoursExpanded ? "rotate-90" : ""}`}
                          />
                        </button>

                        <AnimatePresence>
                          {isHoursExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-outline bg-surface-base/50"
                            >
                              <div className="p-6 space-y-4">
                                {DAYS.map((day) => {
                                  const dayData = (restaurant.detailedHours ||
                                    defaultDetailedHours)[day.id] || {
                                    enabled: false,
                                    shifts: [],
                                  };
                                  return (
                                    <div
                                      key={day.id}
                                      className="glass-card p-4 rounded-2xl border border-outline shadow-sm"
                                    >
                                      <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                          <button
                                            onClick={() => {
                                              const newHours = {
                                                ...(restaurant.detailedHours ||
                                                  defaultDetailedHours),
                                              };
                                              newHours[day.id] = {
                                                ...dayData,
                                                enabled: !dayData.enabled,
                                              };
                                              setRestaurant((prev) =>
                                                prev
                                                  ? {
                                                      ...prev,
                                                      detailedHours: newHours,
                                                    }
                                                  : prev,
                                              );
                                            }}
                                            className={`w-10 h-6 rounded-full transition-all flex items-center px-1 ${dayData.enabled ? "bg-emerald-500 justify-end" : "bg-neutral-300 justify-start"}`}
                                          >
                                            <div className="w-4 h-4 glass-card rounded-full shadow-sm" />
                                          </button>
                                          <span className="font-black text-on-surface text-sm uppercase tracking-widest">
                                            {day.label}
                                          </span>
                                        </div>
                                        {!dayData.enabled && (
                                          <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-2 py-1 rounded-lg">
                                            Cerrado
                                          </span>
                                        )}
                                      </div>

                                      {dayData.enabled && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                          {dayData.shifts.map(
                                            (shift: any, sIdx: number) => (
                                              <div
                                                key={sIdx}
                                                className="space-y-2"
                                              >
                                                <label className="text-[10px] font-black text-on-surface-muted uppercase tracking-widest">
                                                  {sIdx === 0
                                                    ? "Turno Mañana"
                                                    : "Turno Tarde/Noche"}
                                                </label>
                                                <div className="flex items-center gap-2">
                                                  <input
                                                    type="time"
                                                    value={shift.open}
                                                    onChange={(e) => {
                                                      const newHours = {
                                                        ...(restaurant.detailedHours ||
                                                          defaultDetailedHours),
                                                      };
                                                      newHours[day.id].shifts[
                                                        sIdx
                                                      ].open = e.target.value;
                                                      setRestaurant((prev) =>
                                                        prev
                                                          ? {
                                                              ...prev,
                                                              detailedHours:
                                                                newHours,
                                                            }
                                                          : prev,
                                                      );
                                                    }}
                                                    className="flex-1 bg-surface-base border border-outline rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-orange-500 transition-colors"
                                                  />
                                                  <span className="text-on-surface-variant font-bold">
                                                    -
                                                  </span>
                                                  <input
                                                    type="time"
                                                    value={shift.close}
                                                    onChange={(e) => {
                                                      const newHours = {
                                                        ...(restaurant.detailedHours ||
                                                          defaultDetailedHours),
                                                      };
                                                      newHours[day.id].shifts[
                                                        sIdx
                                                      ].close = e.target.value;
                                                      setRestaurant((prev) =>
                                                        prev
                                                          ? {
                                                              ...prev,
                                                              detailedHours:
                                                                newHours,
                                                            }
                                                          : prev,
                                                      );
                                                    }}
                                                    className="flex-1 bg-surface-base border border-outline rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-orange-500 transition-colors"
                                                  />
                                                </div>
                                              </div>
                                            ),
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">
                          Horario de Atención (Resumen Texto)
                        </label>
                        <input
                          type="text"
                          value={restaurant.openingHours || ""}
                          onChange={(e) =>
                            setRestaurant((prev) =>
                              prev
                                ? { ...prev, openingHours: e.target.value }
                                : prev,
                            )
                          }
                          className="w-full border-2 border-outline rounded-2xl px-5 py-3 focus:border-orange-500 outline-none transition-colors font-bold"
                          placeholder="Lun - Vie: 8am - 10pm / Sáb - Dom: 10am - 11pm"
                        />
                      </div>
                    </div>

                    {/* Domicilios y Visual */}
                    <div className="space-y-6">
                      <h4 className="text-sm font-black text-on-surface-muted uppercase tracking-widest border-b border-outline pb-2">
                        Domicilios y Apariencia
                      </h4>

                      <div className="flex items-center justify-between p-4 bg-surface-base rounded-2xl border-2 border-outline">
                        <div>
                          <span className="block font-black text-on-surface">
                            Maneja Promociones
                          </span>
                          <span className="text-xs text-on-surface-muted">
                            Activa si ofreces descuentos o combos
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            setRestaurant((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    handlesPromotions: !prev.handlesPromotions,
                                  }
                                : prev,
                            )
                          }
                          className={`w-14 h-8 rounded-full transition-all flex items-center px-1 ${restaurant.handlesPromotions ? "bg-orange-500 justify-end" : "bg-neutral-300 justify-start"}`}
                        >
                          <div className="w-6 h-6 glass-card rounded-full shadow-md" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-surface-base rounded-2xl border-2 border-outline">
                        <div>
                          <span className="block font-black text-on-surface">
                            Servicio de Domicilio
                          </span>
                          <span className="text-xs text-on-surface-muted">
                            Activa si realizas entregas a casa
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            setRestaurant((prev) =>
                              prev
                                ? { ...prev, hasDelivery: !prev.hasDelivery }
                                : prev,
                            )
                          }
                          className={`w-14 h-8 rounded-full transition-all flex items-center px-1 ${restaurant.hasDelivery ? "bg-orange-500 justify-end" : "bg-neutral-300 justify-start"}`}
                        >
                          <div className="w-6 h-6 glass-card rounded-full shadow-md" />
                        </button>
                      </div>

                      {restaurant.hasDelivery && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="p-4 bg-orange-50 rounded-2xl border-2 border-orange-100"
                        >
                          <label className="block text-xs font-black text-orange-600 uppercase tracking-widest mb-2">
                            Valor del Domicilio (COP)
                          </label>
                          <input
                            type="number"
                            value={
                              restaurant.deliveryFee === 0
                                ? ""
                                : restaurant.deliveryFee || ""
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              setRestaurant((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      deliveryFee:
                                        val === ""
                                          ? 0
                                          : isNaN(Number(val))
                                            ? 0
                                            : Number(val),
                                    }
                                  : prev,
                              );
                            }}
                            className="w-full border-2 border-orange-200 rounded-xl px-4 py-2 focus:border-orange-500 outline-none transition-colors font-bold glass-card text-on-surface"
                          />
                        </motion.div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest">
                              Logo del Restaurante
                            </label>
                            <ImageSizeInfo type="logo" />
                          </div>
                          <div className="relative group">
                            <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-outline flex items-center justify-center overflow-hidden bg-surface-base group-hover:border-orange-500 transition-colors relative">
                              {restaurant.logo ? (
                                <img
                                  src={restaurant.logo}
                                  alt="Logo"
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src =
                                      "https://picsum.photos/seed/logo/200/200";
                                  }}
                                />
                              ) : (
                                <ImageIcon className="w-8 h-8 text-on-surface-variant" />
                              )}
                              {isUploadingLogo && (
                                <div className="absolute inset-0 glass-card text-on-surface/80 backdrop-blur-sm flex items-center justify-center z-10">
                                  <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                                </div>
                              )}
                              <input
                                type="file"
                                disabled={isUploadingLogo}
                                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                onChange={(e) =>
                                  handleRestaurantFileUpload(e, "logo")
                                }
                              />
                            </div>
                            <div className="mt-2 text-[10px] font-bold text-on-surface-muted text-center uppercase tracking-widest">
                              Click para subir
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest">
                              Imagen de Cabecera
                            </label>
                            <ImageSizeInfo type="cover" />
                          </div>
                          <div className="relative group">
                            <div className="w-full h-32 rounded-2xl border-2 border-dashed border-outline flex items-center justify-center overflow-hidden bg-surface-base group-hover:border-orange-500 transition-colors relative">
                              {restaurant.coverImage ? (
                                <img
                                  src={restaurant.coverImage}
                                  alt="Cover"
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src =
                                      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000";
                                  }}
                                />
                              ) : (
                                <ImageIcon className="w-8 h-8 text-on-surface-variant" />
                              )}
                              {isUploadingCover && (
                                <div className="absolute inset-0 glass-card text-on-surface/80 backdrop-blur-sm flex items-center justify-center z-10">
                                  <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                                </div>
                              )}
                              <input
                                type="file"
                                disabled={isUploadingCover}
                                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                onChange={(e) =>
                                  handleRestaurantFileUpload(e, "coverImage")
                                }
                              />
                            </div>
                            <div className="mt-2 text-[10px] font-bold text-on-surface-muted text-center uppercase tracking-widest">
                              Click para subir
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "billing" && (
                <motion.div
                  key="billing"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8 pb-20"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Current Subscription Card */}
                    <div className="lg:col-span-1">
                      <div className="bg-[#0B0B0B] text-on-surface rounded-3xl p-8 border border-outline shadow-xl relative overflow-hidden h-full golden-glow-module">
                        <div className="absolute top-0 right-0 p-6 opacity-5">
                          <FileText className="w-24 h-24" />
                        </div>

                        <p className="text-sm font-black text-on-surface-muted uppercase tracking-widest mb-2">
                          Plan Actual
                        </p>
                        <h3 className="text-4xl font-black text-on-surface mb-6">
                          {subscription?.plan?.name || "Plan Gratis"}
                        </h3>

                        {subscription ? (
                          <div className="space-y-6">
                            <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-center">
                              Estado:{" "}
                              {subscription.status === "active"
                                ? "Activo"
                                : "Pendiente"}
                            </div>

                            <div className="space-y-2">
                              <p className="text-sm font-bold text-on-surface-muted">
                                Próximo cobro:
                              </p>
                              <p className="text-xl font-black text-on-surface">
                                {new Date(
                                  subscription.currentPeriodEnd,
                                ).toLocaleDateString("es-CO", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </p>
                              {platformSettings?.billingCutDay && (
                                <p className="text-[10px] font-bold text-on-surface-muted">
                                  Día de corte de la plataforma:{" "}
                                  {platformSettings.billingCutDay} de cada mes
                                </p>
                              )}
                            </div>

                            <div className="pt-6 border-t border-outline">
                              <p className="text-xs font-bold text-on-surface-muted uppercase tracking-widest mb-4">
                                Incluye:
                              </p>
                              <div className="space-y-3">
                                {Array.isArray(subscription.plan?.features) ? (
                                  subscription.plan.features.map(
                                    (feature: string, idx: number) => (
                                      <div
                                        key={idx}
                                        className="flex items-center gap-2 text-sm font-bold text-on-surface-muted"
                                      >
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        {feature}
                                      </div>
                                    ),
                                  )
                                ) : (
                                  <>
                                    <div className="flex items-center gap-2 text-sm font-bold text-on-surface-muted">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                      {subscription.plan?.features
                                        ?.max_categories === null
                                        ? "Categorías Ilimitadas"
                                        : `${subscription.plan?.features?.max_categories || 0} Categorías`}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-bold text-on-surface-muted">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                      {subscription.plan?.features
                                        ?.max_products === null
                                        ? "Productos Ilimitados"
                                        : `${subscription.plan?.features?.max_products || 0} Productos`}
                                    </div>
                                    {subscription.plan?.features
                                      ?.allow_loyalty && (
                                      <div className="flex items-center gap-2 text-sm font-bold text-on-surface-muted">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        Programa de Fidelización
                                      </div>
                                    )}
                                    {subscription.plan?.features
                                      ?.allow_coupons && (
                                      <div className="flex items-center gap-2 text-sm font-bold text-on-surface-muted">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        Cupones de Descuento
                                      </div>
                                    )}
                                    {subscription.plan?.features?.allow_pos && (
                                      <div className="flex items-center gap-2 text-sm font-bold text-on-surface-muted">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        Módulo POS
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <p className="text-on-surface-muted font-bold mb-6">
                              Actualmente estás en el plan gratis. Cámbiate a un
                              plan Básico o Avanzado para desbloquear más
                              funcionalidades.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Available Plans Selection */}
                    <div className="lg:col-span-2">
                      <div className="glass-card text-on-surface rounded-3xl p-8 border border-outline shadow-xl h-full">
                        <h3 className="text-xl font-black text-on-surface mb-6">
                          Planes Disponibles
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {availablePlans
                            .filter((p) => p.isActive)
                            .map((plan) => (
                              <div
                                key={plan.id}
                                className={`p-6 flex flex-col rounded-2xl border-2 transition-all cursor-pointer hover:shadow-lg ${
                                  subscription?.planId === plan.id
                                    ? "border-orange-500 bg-orange-50 relative overflow-hidden"
                                    : "border-outline bg-surface-base relative overflow-hidden"
                                }`}
                              >
                                {plan.type === "free" && (
                                  <div className="absolute top-0 right-0 bg-slate-500 text-on-surface text-[10px] uppercase font-black tracking-wider px-3 py-1 rounded-bl-xl">
                                    Gratis
                                  </div>
                                )}
                                {plan.type === "commission" && (
                                  <div className="absolute top-0 right-0 bg-blue-500 text-on-surface text-[10px] uppercase font-black tracking-wider px-3 py-1 rounded-bl-xl">
                                    Básico
                                  </div>
                                )}
                                {plan.type === "fixed" && (
                                  <div className="absolute top-0 right-0 bg-emerald-500 text-on-surface text-[10px] uppercase font-black tracking-wider px-3 py-1 rounded-bl-xl">
                                    Avanzado
                                  </div>
                                )}

                                <div className="flex justify-between items-start mb-2 mt-2">
                                  <h4 className="font-black text-on-surface">
                                    {plan.name}
                                  </h4>
                                </div>
                                <p className="text-xs text-on-surface-muted font-bold mb-4 h-12">
                                  {plan.description}
                                </p>
                                <div className="text-2xl font-black text-orange-600 mb-2">
                                  {formatCurrency(plan.price)}
                                  <span className="text-xs font-bold text-on-surface-muted ml-1">
                                    {plan.type === "commission"
                                      ? `+ ${plan.commission_percentage}% / venta`
                                      : plan.type === "free"
                                        ? "gratis"
                                        : `/ ${plan.billingCycle}`}
                                  </span>
                                </div>

                                <div className="space-y-2 mb-6 flex-1">
                                  <div className="flex items-center gap-2 text-xs font-bold text-on-surface-muted">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    {plan.features?.max_categories === null
                                      ? "Categorías Ilimitadas"
                                      : `${plan.features?.max_categories || 0} Categorías`}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs font-bold text-on-surface-muted">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    {plan.features?.max_products === null
                                      ? "Productos Ilimitados"
                                      : `${plan.features?.max_products || 0} Productos`}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs font-bold text-on-surface-muted">
                                    {plan.features?.allow_loyalty ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    ) : (
                                      <X className="w-3.5 h-3.5 text-on-surface-variant" />
                                    )}
                                    Fidelización
                                  </div>
                                  <div className="flex items-center gap-2 text-xs font-bold text-on-surface-muted">
                                    {plan.features?.allow_pos ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    ) : (
                                      <X className="w-3.5 h-3.5 text-on-surface-variant" />
                                    )}
                                    Módulo POS
                                  </div>
                                </div>

                                <button
                                  disabled={subscription?.planId === plan.id}
                                  onClick={() =>
                                    toast.success(
                                      "Solicitud de cambio de plan enviada al administrador.",
                                    )
                                  }
                                  className={`w-full py-3 mt-auto rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                                    subscription?.planId === plan.id
                                      ? "bg-orange-500 text-on-surface"
                                      : "glass-card text-on-surface text-on-surface border border-outline hover:bg-surface-variant hover:text-on-surface"
                                  }`}
                                >
                                  {subscription?.planId === plan.id
                                    ? "Plan Actual"
                                    : "Solicitar Cambio"}
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Invoices List */}
                  <div className="glass-card rounded-3xl shadow-xl border border-outline overflow-hidden">
                    <div className="p-8 border-b border-outline flex justify-between items-center">
                      <h3 className="text-xl font-black text-on-surface">
                        Historial de Pagos y Facturas
                      </h3>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-surface-base/50">
                            <th className="px-8 py-4 text-[10px] font-black text-on-surface-muted uppercase tracking-widest">
                              Concepto
                            </th>
                            <th className="px-8 py-4 text-[10px] font-black text-on-surface-muted uppercase tracking-widest">
                              Fecha
                            </th>
                            <th className="px-8 py-4 text-[10px] font-black text-on-surface-muted uppercase tracking-widest">
                              Monto
                            </th>
                            <th className="px-8 py-4 text-[10px] font-black text-on-surface-muted uppercase tracking-widest">
                              Estado
                            </th>
                            <th className="px-8 py-4 text-[10px] font-black text-on-surface-muted uppercase tracking-widest text-right">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {restaurantInvoices.length > 0 ? (
                            restaurantInvoices.map((invoice) => (
                              <tr
                                key={invoice.id}
                                className="hover:bg-surface-base/30 transition-colors"
                              >
                                <td className="px-8 py-6">
                                  <p className="font-bold text-on-surface">
                                    {invoice.description}
                                  </p>
                                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                                    {invoice.type === "subscription"
                                      ? "Suscripción"
                                      : "Comisiones"}
                                  </p>
                                </td>
                                <td className="px-8 py-6">
                                  <p className="text-sm font-bold text-on-surface-muted">
                                    {new Date(
                                      invoice.createdAt || "",
                                    ).toLocaleDateString("es-CO")}
                                  </p>
                                </td>
                                <td className="px-8 py-6">
                                  <p className="font-black text-on-surface">
                                    {formatCurrency(invoice.amount)}
                                  </p>
                                </td>
                                <td className="px-8 py-6">
                                  <span
                                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                      invoice.status === "paid"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : invoice.status === "failed"
                                          ? "bg-rose-100 text-rose-700"
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
                                <td className="px-8 py-6 text-right flex items-center justify-end gap-2">
                                  {invoice.status === "pending" && (
                                    <button
                                      onClick={async () => {
                                        if (
                                          !platformSettings?.paymentGateways
                                        ) {
                                          toast.error(
                                            "No hay métodos de pago configurados por la plataforma.",
                                          );
                                          return;
                                        }

                                        const success =
                                          await processPlatformPayment({
                                            amount: invoice.amount,
                                            description: invoice.description,
                                            invoiceId: invoice.id,
                                            gateways:
                                              platformSettings.paymentGateways,
                                          });

                                        if (success) {
                                          await db.updatePlatformInvoiceStatus(
                                            invoice.id,
                                            "paid",
                                            "Pago procesado por pasarela",
                                          );
                                          toast.success(
                                            "Pago completado correctamente",
                                          );
                                          fetchData();
                                        }
                                      }}
                                      className="px-4 py-2 bg-orange-500 text-on-surface text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-100"
                                    >
                                      Pagar Ahora
                                    </button>
                                  )}
                                  <button className="p-3 bg-surface-base hover:bg-surface-variant rounded-xl transition-all border border-outline group">
                                    <Download className="w-5 h-5 text-on-surface-muted group-hover:text-on-surface" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={5}
                                className="px-8 py-12 text-center text-on-surface-muted font-bold"
                              >
                                No hay facturas registradas todavía.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "payments" && restaurant && (
                <motion.div
                  key="payments"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="glass-card rounded-2xl shadow-sm border border-outline p-8 space-y-8"
                >
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-2xl font-black text-on-surface">
                        Métodos de Pago
                      </h3>
                      <p className="text-on-surface-muted mt-1">
                        Configura las pasarelas para recibir pagos de tus
                        clientes.
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        if (!restaurant) return;
                        try {
                          await db.updateRestaurant(restaurant.id, {
                            paymentGateways: restaurant.paymentGateways,
                          });
                          toast.success("Configuración de pagos guardada");
                          fetchData();
                        } catch (error: any) {
                          console.error(
                            "Error saving restaurant payments:",
                            error,
                          );
                          toast.error(
                            `Error al guardar: ${error.message || "Error desconocido"}`,
                          );
                        }
                      }}
                      className="flex items-center gap-2 px-6 py-3 bg-surface-variant text-on-surface rounded-xl hover:bg-surface-light transition-colors font-bold shadow-lg shadow-neutral-200"
                    >
                      <Save className="w-4 h-4" />
                      Guardar Cambios
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Nequi Configuration */}
                    <div className="bg-surface-base p-6 rounded-2xl border border-outline">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-3">
                          <CreditCard className="w-5 h-5 text-purple-600" />
                          Nequi API (Automático)
                        </h3>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <span className="text-sm font-medium text-on-surface-muted">
                            Activo
                          </span>
                          <input
                            type="checkbox"
                            checked={
                              restaurant.paymentGateways?.nequi?.active || false
                            }
                            onChange={(e) =>
                              setRestaurant({
                                ...restaurant,
                                paymentGateways: {
                                  ...restaurant.paymentGateways,
                                  nequi: {
                                    ...(restaurant.paymentGateways?.nequi ||
                                      {}),
                                    active: e.target.checked,
                                  } as any,
                                },
                              })
                            }
                            className="w-5 h-5 accent-orange-500 rounded cursor-pointer"
                          />
                        </label>
                      </div>
                      <p className="text-xs text-on-surface-muted mb-4">
                        Integración directa con Nequi para cobros automáticos.
                      </p>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-on-surface-variant mb-1">
                            Client ID
                          </label>
                          <input
                            type="text"
                            value={
                              restaurant.paymentGateways?.nequi?.clientId || ""
                            }
                            onChange={(e) =>
                              setRestaurant({
                                ...restaurant,
                                paymentGateways: {
                                  ...restaurant.paymentGateways,
                                  nequi: {
                                    ...restaurant.paymentGateways?.nequi,
                                    clientId: e.target.value,
                                  } as any,
                                },
                              })
                            }
                            className="w-full p-3 border border-outline rounded-xl glass-card text-on-surface text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-on-surface-variant mb-1">
                            Client Secret
                          </label>
                          <input
                            type="password"
                            value={
                              restaurant.paymentGateways?.nequi?.clientSecret ||
                              ""
                            }
                            onChange={(e) =>
                              setRestaurant({
                                ...restaurant,
                                paymentGateways: {
                                  ...restaurant.paymentGateways,
                                  nequi: {
                                    ...restaurant.paymentGateways?.nequi,
                                    clientSecret: e.target.value,
                                  } as any,
                                },
                              })
                            }
                            className="w-full p-3 border border-outline rounded-xl glass-card text-on-surface text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                            placeholder="************************"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-on-surface-variant mb-1">
                            API Key
                          </label>
                          <input
                            type="password"
                            value={
                              restaurant.paymentGateways?.nequi?.apiKey || ""
                            }
                            onChange={(e) =>
                              setRestaurant({
                                ...restaurant,
                                paymentGateways: {
                                  ...restaurant.paymentGateways,
                                  nequi: {
                                    ...restaurant.paymentGateways?.nequi,
                                    apiKey: e.target.value,
                                  } as any,
                                },
                              })
                            }
                            className="w-full p-3 border border-outline rounded-xl glass-card text-on-surface text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                            placeholder="************************"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Transferencia Manual Configuration */}
                    <div className="bg-surface-base p-6 rounded-2xl border border-outline">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-3">
                          <Smartphone className="w-5 h-5 text-indigo-500" />
                          Transferencia Manual
                        </h3>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <span className="text-sm font-medium text-on-surface-muted">
                            Activo
                          </span>
                          <input
                            type="checkbox"
                            checked={
                              restaurant.paymentGateways?.transfer?.active || false
                            }
                            onChange={(e) =>
                              setRestaurant({
                                ...restaurant,
                                paymentGateways: {
                                  ...restaurant.paymentGateways,
                                  transfer: {
                                    ...(restaurant.paymentGateways?.transfer ||
                                      {}),
                                    active: e.target.checked,
                                  } as any,
                                },
                              })
                            }
                            className="w-5 h-5 accent-orange-500 rounded cursor-pointer"
                          />
                        </label>
                      </div>
                      <p className="text-xs text-on-surface-muted mb-4">
                        Permite a tus clientes pagar enviando dinero manual a tu Nequi o Daviplata.
                      </p>
                    </div>

                    {/* Datáfono Configuration */}
                    <div className="bg-surface-base p-6 rounded-2xl border border-outline">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-3">
                          <CreditCard className="w-5 h-5 text-teal-600" />
                          Pago con Datáfono
                        </h3>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <span className="text-sm font-medium text-on-surface-muted">
                            Activo
                          </span>
                          <input
                            type="checkbox"
                            checked={
                              restaurant.paymentGateways?.cardTerminal?.active || false
                            }
                            onChange={(e) =>
                              setRestaurant({
                                ...restaurant,
                                paymentGateways: {
                                  ...restaurant.paymentGateways,
                                  cardTerminal: {
                                    ...(restaurant.paymentGateways?.cardTerminal ||
                                      {}),
                                    active: e.target.checked,
                                  } as any,
                                },
                              })
                            }
                            className="w-5 h-5 accent-orange-500 rounded cursor-pointer"
                          />
                        </label>
                      </div>
                      <p className="text-xs text-on-surface-muted mb-4">
                        El domiciliario llevará un datáfono para cobrar con tarjeta al entregar.
                      </p>
                    </div>

                    {/* Mercado Pago Configuration */}
                    <div className="bg-surface-base p-6 rounded-2xl border border-outline">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-3">
                          <CreditCard className="w-5 h-5 text-blue-500" />
                          Mercado Pago
                        </h3>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <span className="text-sm font-medium text-on-surface-muted">
                            Activo
                          </span>
                          <input
                            type="checkbox"
                            checked={
                              restaurant.paymentGateways?.mercadoPago?.active ||
                              false
                            }
                            onChange={(e) =>
                              setRestaurant({
                                ...restaurant,
                                paymentGateways: {
                                  ...restaurant.paymentGateways,
                                  mercadoPago: {
                                    ...(restaurant.paymentGateways
                                      ?.mercadoPago || {}),
                                    active: e.target.checked,
                                  } as any,
                                },
                              })
                            }
                            className="w-5 h-5 accent-orange-500 rounded cursor-pointer"
                          />
                        </label>
                      </div>
                      <p className="text-xs text-on-surface-muted mb-4">
                        Recibe pagos con tarjetas o saldo de Mercado Pago.
                      </p>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-on-surface-variant mb-1">
                            Public Key
                          </label>
                          <input
                            type="text"
                            value={
                              restaurant.paymentGateways?.mercadoPago
                                ?.publicKey || ""
                            }
                            onChange={(e) =>
                              setRestaurant({
                                ...restaurant,
                                paymentGateways: {
                                  ...restaurant.paymentGateways,
                                  mercadoPago: {
                                    ...restaurant.paymentGateways?.mercadoPago,
                                    publicKey: e.target.value,
                                  } as any,
                                },
                              })
                            }
                            className="w-full p-3 border border-outline rounded-xl glass-card text-on-surface text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                            placeholder="APP_USR-xxxx-xxxx-xxxx-xxxx"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-on-surface-variant mb-1">
                            Access Token
                          </label>
                          <input
                            type="password"
                            value={
                              restaurant.paymentGateways?.mercadoPago
                                ?.accessToken || ""
                            }
                            onChange={(e) =>
                              setRestaurant({
                                ...restaurant,
                                paymentGateways: {
                                  ...restaurant.paymentGateways,
                                  mercadoPago: {
                                    ...restaurant.paymentGateways?.mercadoPago,
                                    accessToken: e.target.value,
                                  } as any,
                                },
                              })
                            }
                            className="w-full p-3 border border-outline rounded-xl glass-card text-on-surface text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                            placeholder="APP_USR-xxxxxxxxxxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxx"
                          />
                        </div>
                      </div>
                    </div>

                    {/* PayPal Configuration */}
                    <div className="bg-surface-base p-6 rounded-2xl border border-outline">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-3">
                          <CreditCard className="w-5 h-5 text-blue-800" />
                          PayPal
                        </h3>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <span className="text-sm font-medium text-on-surface-muted">
                            Activo
                          </span>
                          <input
                            type="checkbox"
                            checked={
                              restaurant.paymentGateways?.paypal?.active ||
                              false
                            }
                            onChange={(e) =>
                              setRestaurant({
                                ...restaurant,
                                paymentGateways: {
                                  ...restaurant.paymentGateways,
                                  paypal: {
                                    ...(restaurant.paymentGateways?.paypal ||
                                      {}),
                                    active: e.target.checked,
                                  } as any,
                                },
                              })
                            }
                            className="w-5 h-5 accent-orange-500 rounded cursor-pointer"
                          />
                        </label>
                      </div>
                      <p className="text-xs text-on-surface-muted mb-4">
                        Ideal para pagos internacionales.
                      </p>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-on-surface-variant mb-1">
                            Client ID
                          </label>
                          <input
                            type="text"
                            value={
                              restaurant.paymentGateways?.paypal?.clientId || ""
                            }
                            onChange={(e) =>
                              setRestaurant({
                                ...restaurant,
                                paymentGateways: {
                                  ...restaurant.paymentGateways,
                                  paypal: {
                                    ...restaurant.paymentGateways?.paypal,
                                    clientId: e.target.value,
                                  } as any,
                                },
                              })
                            }
                            className="w-full p-3 border border-outline rounded-xl glass-card text-on-surface text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                            placeholder="Id del cliente"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-on-surface-variant mb-1">
                            Secret Key
                          </label>
                          <input
                            type="password"
                            value={
                              restaurant.paymentGateways?.paypal?.secret || ""
                            }
                            onChange={(e) =>
                              setRestaurant({
                                ...restaurant,
                                paymentGateways: {
                                  ...restaurant.paymentGateways,
                                  paypal: {
                                    ...restaurant.paymentGateways?.paypal,
                                    secret: e.target.value,
                                  } as any,
                                },
                              })
                            }
                            className="w-full p-3 border border-outline rounded-xl glass-card text-on-surface text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                            placeholder="************************"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Cash & Terminal */}
                    <div className="bg-surface-base p-6 rounded-2xl border border-outline flex flex-col justify-center">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-on-surface flex items-center gap-3">
                          <Banknote className="w-5 h-5 text-green-600" />
                          Pago en Efectivo (Contra Entrega)
                        </h3>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <span className="text-sm font-medium text-on-surface-muted">
                            Activo
                          </span>
                          <input
                            type="checkbox"
                            checked={
                              restaurant.paymentGateways?.cash?.active !== false
                            }
                            onChange={(e) =>
                              setRestaurant({
                                ...restaurant,
                                paymentGateways: {
                                  ...restaurant.paymentGateways,
                                  cash: {
                                    ...(restaurant.paymentGateways?.cash || {}),
                                    active: e.target.checked,
                                  },
                                },
                              })
                            }
                            className="w-5 h-5 accent-orange-500 rounded cursor-pointer"
                          />
                        </label>
                      </div>
                      <p className="text-xs text-on-surface-muted mb-6">
                        Permitir a los clientes pagar en efectivo al recibir su
                        orden.
                      </p>

                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-on-surface flex items-center gap-3">
                          <CreditCard className="w-5 h-5 text-on-surface" />
                          Datáfono (Contra Entrega)
                        </h3>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <span className="text-sm font-medium text-on-surface-muted">
                            Activo
                          </span>
                          <input
                            type="checkbox"
                            checked={
                              restaurant.paymentGateways?.cardTerminal
                                ?.active !== false
                            }
                            onChange={(e) =>
                              setRestaurant({
                                ...restaurant,
                                paymentGateways: {
                                  ...restaurant.paymentGateways,
                                  cardTerminal: {
                                    ...(restaurant.paymentGateways
                                      ?.cardTerminal || {}),
                                    active: e.target.checked,
                                  },
                                },
                              })
                            }
                            className="w-5 h-5 accent-orange-500 rounded cursor-pointer"
                          />
                        </label>
                      </div>
                      <p className="text-xs text-on-surface-muted">
                        Permitir a los clientes pagar con tarjeta cuando el
                        repartidor llegue con datáfono.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "support" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 px-4 sm:px-0"
                >
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-2xl font-black text-on-surface">
                        Tickets de Soporte
                      </h3>
                      <p className="text-on-surface-muted mt-1">
                        Gestiona las solicitudes de ayuda de tus clientes.
                      </p>
                    </div>
                  </div>

                  <div className="glass-card rounded-2xl shadow-sm border border-outline overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-surface-base border-b border-outline">
                          <tr>
                            <th className="px-6 py-4 text-xs font-black text-on-surface-muted uppercase tracking-widest">
                              Asunto
                            </th>
                            <th className="px-6 py-4 text-xs font-black text-on-surface-muted uppercase tracking-widest">
                              Estado
                            </th>
                            <th className="px-6 py-4 text-xs font-black text-on-surface-muted uppercase tracking-widest">
                              Prioridad
                            </th>
                            <th className="px-6 py-4 text-xs font-black text-on-surface-muted uppercase tracking-widest">
                              Fecha
                            </th>
                            <th className="px-6 py-4 text-xs font-black text-on-surface-muted uppercase tracking-widest">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-50">
                          {supportTickets.length > 0 ? (
                            supportTickets.map((ticket) => (
                              <tr
                                key={ticket.id}
                                className="hover:bg-surface-base transition-colors"
                              >
                                <td className="px-6 py-4">
                                  <p className="font-bold text-on-surface">
                                    {ticket.subject}
                                  </p>
                                  <p className="text-xs text-on-surface-muted truncate max-w-xs">
                                    {ticket.description}
                                  </p>
                                </td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                      ticket.status === "open"
                                        ? "bg-amber-100 text-amber-700"
                                        : ticket.status === "in_progress"
                                          ? "bg-blue-100 text-blue-700"
                                          : ticket.status === "resolved"
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-surface-variant text-on-surface-variant"
                                    }`}
                                  >
                                    {ticket.status === "open"
                                      ? "Abierto"
                                      : ticket.status === "in_progress"
                                        ? "En Progreso"
                                        : "Resuelto"}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                      ticket.priority === "high"
                                        ? "bg-rose-100 text-rose-700"
                                        : ticket.priority === "medium"
                                          ? "bg-orange-100 text-orange-700"
                                          : "bg-emerald-100 text-emerald-700"
                                    }`}
                                  >
                                    {ticket.priority.toUpperCase()}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-on-surface-muted">
                                  {new Date(
                                    ticket.createdAt,
                                  ).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                  <Link
                                    to={`/support/ticket/${ticket.id}`}
                                    className="text-orange-600 hover:text-orange-700 font-bold text-sm flex items-center gap-1"
                                  >
                                    Ver Detalle{" "}
                                    <ChevronRight className="w-4 h-4" />
                                  </Link>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={5}
                                className="px-6 py-20 text-center text-on-surface-muted font-bold"
                              >
                                No hay tickets de soporte para este restaurante.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "merit_tasks" && restaurant && (
                <motion.div
                  key="merit_tasks"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-2xl font-black text-on-surface flex items-center gap-2">
                       <Trophy className="w-8 h-8 text-amber-500" />
                       Tareas de Nivel (XP)
                    </h3>
                    <p className="text-on-surface-muted mt-1 font-medium">
                      Completa estas tareas inteligentes para optimizar el perfil de tu restaurante y ganar Puntos de Experiencia (XP). El sistema detectará automáticamente cuando una tarea sea completada y te sumará los puntos.
                    </p>
                  </div>

                  <div className="bg-surface-base border border-outline-variant p-6 rounded-3xl shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                       <h4 className="font-black text-lg text-on-surface">Tu Nivel Actual</h4>
                       <span className="bg-amber-500 text-white font-black px-4 py-1.5 rounded-full text-md drop-shadow">
                         Nivel {calculateRestaurantMeritScore(restaurant, reviews?.length || 0, restaurant.rating || 0, driversList.length, !!subscription?.plan?.id && subscription.plan.id !== "free").level}
                       </span>
                    </div>
                    <div className="flex bg-neutral-200 h-4 rounded-full overflow-hidden shadow-inner">
                       <div 
                         className="bg-gradient-to-r from-amber-400 to-amber-600 h-full transition-all duration-1000 ease-out relative" 
                         style={{ width: `${Math.min(100, calculateRestaurantMeritScore(restaurant, reviews?.length || 0, restaurant.rating || 0, driversList.length, !!subscription?.plan?.id && subscription.plan.id !== "free").score / 350 * 100)}%` }}
                       >
                         <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.2) 10px, rgba(255,255,255,0.2) 20px)' }}></div>
                       </div>
                    </div>
                    <p className="text-right text-sm font-black text-amber-600 mt-2">
                      {calculateRestaurantMeritScore(restaurant, reviews?.length || 0, restaurant.rating || 0, driversList.length, !!subscription?.plan?.id && subscription.plan.id !== "free").score} XP / 450 XP
                    </p>
                  </div>

                  <div className="space-y-6">
                     {[
                        { 
                           category: "Perfil Completo",
                           items: [
                             { title: "Descripción del restaurante (> 20 caracteres)", xp: 10, isCompleted: restaurant.description && restaurant.description.length > 20, linkTo: "settings" },
                             { title: "Sube un logo de alta calidad", xp: 15, isCompleted: restaurant.logo && !restaurant.logo.includes("placeholder"), linkTo: "settings" },
                             { title: "Sube una foto de portada", xp: 15, isCompleted: restaurant.coverImage && !restaurant.coverImage.includes("placeholder"), linkTo: "settings" },
                             { title: "Dirección física configurada", xp: 10, isCompleted: !!restaurant.address, linkTo: "settings" },
                             { title: "Teléfono de contacto", xp: 10, isCompleted: !!restaurant.phone, linkTo: "settings" },
                             { title: "Número de WhatsApp habilitado", xp: 5, isCompleted: !!restaurant.whatsappNumber, linkTo: "settings" },
                             { title: "Horarios comerciales definidos", xp: 5, isCompleted: !!(restaurant.detailedHours || restaurant.openingHours), linkTo: "settings" },
                             { title: "Vincular cuenta de Facebook", xp: 10, isCompleted: !!restaurant.facebookUrl, linkTo: "settings" },
                             { title: "Vincular cuenta de Instagram", xp: 10, isCompleted: !!restaurant.instagramUrl, linkTo: "settings" },
                           ]
                        },
                        {
                           category: "Funciones Especiales",
                           items: [
                             { title: "Generar Estrategia de Marketing IA", xp: 30, isCompleted: !!(restaurant.aiKnowledge?.marketingHistory && restaurant.aiKnowledge.marketingHistory.length > 0), linkTo: "ai_marketing" },
                             { title: "Entrenar Asistente de IA", xp: 40, isCompleted: !!(restaurant.aiKnowledge && Object.values(restaurant.aiKnowledge).some(v => v && v.length > 10)), linkTo: "ai" },
                             { title: "Habilitar Gamificación de Tareas", xp: 30, isCompleted: !!restaurant.gamificationEnabled, linkTo: "loyalty" },
                             { title: "Activar Ruleta de Premios", xp: 30, isCompleted: !!restaurant.luckyWheelEnabled, linkTo: "wheel" },
                             { title: "Ofrecer Descuentos Generales", xp: 20, isCompleted: !!restaurant.generalDiscountEnabled, linkTo: "settings" },
                             { title: "Crear Cupones de Descuento", xp: 20, isCompleted: coupons.length > 0, linkTo: "coupons" },
                             { title: "Programa de Aniversarios", xp: 20, isCompleted: !!restaurant.anniversaryProgramEnabled, linkTo: "anniversaries" },
                             { title: "Activar Monedas de Oro", xp: 20, isCompleted: !!restaurant.loyaltyEnabled, linkTo: "loyalty" },
                             { title: "Configurar Mesas con QR", xp: 30, isCompleted: (restaurant.tables?.length || 0) > 0, linkTo: "qr" },
                             { title: "Activar Opciones de Pago (Transferencia y Datáfono)", xp: 40, isCompleted: !!(restaurant.paymentGateways?.transfer?.active && restaurant.paymentGateways?.cardTerminal?.active), linkTo: "payments" },
                           ]
                        },
                        {
                           category: "Operación y Crecimiento",
                           items: [
                             { title: "Activación de Repartidores", xp: 30, isCompleted: driversList.length > 0, linkTo: "drivers", progress: driversList.length > 0 ? "Activo" : "Pendiente" },
                             { title: "Tener un Plan Premium Activo", xp: 50, isCompleted: !!subscription?.plan?.id && subscription.plan.id !== "free", linkTo: "billing", progress: !!subscription?.plan?.id && subscription.plan.id !== "free" ? "Activo" : "Gratis" },
                             { title: "Configurar Banners Promocionales", xp: 20, isCompleted: !!(restaurant.banners && restaurant.banners.length > 0), linkTo: "banners" },
                           ]
                        },
                        {
                           category: "Oferta Gastronómica",
                           items: [
                             { title: "Agrega al menos 10 productos a tu menú", xp: 50, isCompleted: (restaurant.menu?.length || 0) >= 10, linkTo: "menu", progress: `${Math.min(10, restaurant.menu?.length || 0)}/10`, currentXp: Math.min((restaurant.menu?.length || 0) * 5, 50) }
                           ]
                        },
                        {
                           category: "Calidad de Servicio",
                           items: [
                             { title: "Consigue más de 5 reseñas", xp: 10, isCompleted: (reviews?.length || 0) > 5, progress: `${reviews?.length || 0}/5` },
                             { title: "Consigue más de 20 reseñas", xp: 10, isCompleted: (reviews?.length || 0) > 20, progress: `${reviews?.length || 0}/20` },
                             { title: "Mantén calificación mayor a 4.0", xp: 5, isCompleted: (restaurant.rating || 0) >= 4.0, progress: `${restaurant.rating || 0}/4.0` },
                             { title: "Logra calificación mayor a 4.5", xp: 5, isCompleted: (restaurant.rating || 0) >= 4.5, progress: `${restaurant.rating || 0}/4.5` },
                           ]
                        }
                     ].map((section, idx) => (
                        <div key={idx} className="bg-white rounded-3xl border-2 border-outline-variant overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                           <div className="bg-gradient-to-r from-neutral-50 to-white px-6 py-4 border-b-2 border-outline-variant">
                             <h4 className="font-black text-neutral-900 uppercase tracking-widest">{section.category}</h4>
                           </div>
                           <div className="divide-y-2 divide-outline-variant/50">
                             {section.items.map((task, tIdx) => (
                               <div key={tIdx} className={`px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${task.isCompleted ? 'bg-emerald-50/20 hover:bg-emerald-50/40' : 'hover:bg-neutral-50/50'}`}>
                                 <div className="flex items-start sm:items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 shadow-sm ${task.isCompleted ? 'bg-emerald-500 border-emerald-600' : 'bg-white border-neutral-300'}`}>
                                      {task.isCompleted ? <CheckCircle2 className="w-6 h-6 text-white" /> : <div className="w-3 h-3 rounded-full bg-neutral-300" />}
                                    </div>
                                    <div>
                                      <h5 className={`font-bold text-md ${task.isCompleted ? 'text-emerald-900 line-through opacity-80' : 'text-neutral-900'}`}>{task.title}</h5>
                                      {task.progress && !task.isCompleted && (
                                        <p className="text-xs text-neutral-500 font-black mt-1 uppercase tracking-wider">Progreso: <span className="text-amber-600">{task.progress}</span></p>
                                      )}
                                    </div>
                                 </div>

                                 <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0 pl-14 sm:pl-0">
                                   <div className={`px-3 py-1 rounded-full border-2 ${task.isCompleted ? 'bg-emerald-100 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                                     <span className={`font-black text-sm ${task.isCompleted ? 'text-emerald-700' : 'text-amber-600'}`}>
                                       +{task.currentXp !== undefined ? task.currentXp : task.xp} XP
                                     </span>
                                   </div>
                                   {task.linkTo && !task.isCompleted && (
                                     <button 
                                       onClick={() => setActiveTab(task.linkTo!)} 
                                       className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                       title="Ir a configurar"
                                     >
                                       <ChevronRight className="w-5 h-5" />
                                     </button>
                                   )}
                                 </div>
                               </div>
                             ))}
                           </div>
                        </div>
                     ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "loyalty" && restaurant && (
                <motion.div
                  key="loyalty"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <RestaurantLoyalty
                    restaurant={restaurant}
                    onUpdate={() => fetchData()}
                  />
                </motion.div>
              )}

              {activeTab === "coupons" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-2xl font-black text-on-surface">
                        Cupones de Descuento
                      </h3>
                      <p className="text-on-surface-muted mt-1">
                        Crea ofertas especiales para atraer y fidelizar
                        clientes.
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setEditingCoupon({
                          code: "",
                          discountType: "percentage",
                          value: 0,
                          minOrderAmount: 0,
                          active: true,
                          timesUsed: 0,
                        })
                      }
                      className="bg-orange-500 text-on-surface px-6 py-3 rounded-2xl font-black hover:bg-orange-600 flex items-center gap-2 shadow-lg shadow-orange-200 transition-all"
                    >
                      <Plus className="w-5 h-5" /> Nuevo Cupón
                    </button>
                  </div>

                  <div className="glass-card rounded-2xl shadow-sm border border-outline overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-surface-base border-b border-outline">
                          <tr>
                            <th className="px-6 py-4 text-xs font-black text-on-surface-muted uppercase tracking-widest">
                              Código
                            </th>
                            <th className="px-6 py-4 text-xs font-black text-on-surface-muted uppercase tracking-widest">
                              Descuento
                            </th>
                            <th className="px-6 py-4 text-xs font-black text-on-surface-muted uppercase tracking-widest">
                              Mín. Pedido
                            </th>
                            <th className="px-6 py-4 text-xs font-black text-on-surface-muted uppercase tracking-widest">
                              Vigencia
                            </th>
                            <th className="px-6 py-4 text-xs font-black text-on-surface-muted uppercase tracking-widest">
                              Uso
                            </th>
                            <th className="px-6 py-4 text-xs font-black text-on-surface-muted uppercase tracking-widest text-right">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-50">
                          {coupons.map((coupon) => (
                            <tr
                              key={coupon.id}
                              className="hover:bg-surface-base transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <Ticket className="w-4 h-4 text-orange-500" />
                                  <span className="font-bold text-on-surface">
                                    {coupon.code}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="font-black text-on-surface">
                                  {coupon.discountType === "percentage"
                                    ? `${coupon.value}%`
                                    : formatCurrency(coupon.value)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-on-surface-muted">
                                {formatCurrency(coupon.minOrderAmount)}
                              </td>
                              <td className="px-6 py-4 text-xs text-on-surface-muted">
                                {coupon.startDate
                                  ? new Date(
                                      coupon.startDate,
                                    ).toLocaleDateString()
                                  : "N/A"}{" "}
                                -{" "}
                                {coupon.endDate
                                  ? new Date(
                                      coupon.endDate,
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="text-xs font-black text-on-surface-variant uppercase tracking-wider">
                                    {coupon.timesUsed} usos
                                  </span>
                                  {coupon.usageLimit && (
                                    <span className="text-[10px] text-on-surface-muted font-bold">
                                      Límite: {coupon.usageLimit}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setEditingCoupon(coupon)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteCoupon(coupon.id)
                                    }
                                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {coupons.length === 0 && (
                            <tr>
                              <td
                                colSpan={6}
                                className="px-6 py-12 text-center text-on-surface-muted font-bold"
                              >
                                No has creado cupones todavía.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "anniversaries" && restaurant && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-3xl font-black text-on-surface flex items-center gap-2">
                        <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
                        Panel de Aniversarios
                      </h2>
                      <p className="text-on-surface-muted font-medium">
                        Homenajea a tus clientes en sus fechas especiales
                      </p>
                    </div>

                    <div className="flex items-center gap-4 glass-card p-2 rounded-2xl border border-outline shadow-sm">
                      <div className="flex flex-col text-right pr-2">
                        <span className="text-[10px] font-black uppercase text-on-surface-muted">
                          Programa de Regalos
                        </span>
                        <span
                          className={`text-xs font-bold ${restaurant.anniversaryProgramEnabled ? "text-emerald-600" : "text-on-surface-muted"}`}
                        >
                          {restaurant.anniversaryProgramEnabled
                            ? "ACTIVADO"
                            : "DESACTIVADO"}
                        </span>
                      </div>
                      <button
                        onClick={async () => {
                          const newVal = !restaurant.anniversaryProgramEnabled;
                          const { error } = await db.updateRestaurant(
                            restaurant.id,
                            { anniversaryProgramEnabled: newVal },
                          );
                          if (error) {
                            toast.error("Error al actualizar la base de datos");
                            return;
                          }
                          setRestaurant({
                            ...restaurant,
                            anniversaryProgramEnabled: newVal,
                          });
                          toast.success(
                            newVal
                              ? "Programa de aniversarios activado"
                              : "Programa desactivado",
                          );
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${restaurant.anniversaryProgramEnabled ? "bg-emerald-500" : "bg-surface-variant"}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full glass-card text-on-surface transition-transform ${restaurant.anniversaryProgramEnabled ? "translate-x-6" : "translate-x-1"}`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-card p-6 rounded-[2.5rem] border border-outline shadow-sm col-span-1 md:col-span-2">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-black text-on-surface">
                          Celebrantes de Hoy
                        </h3>
                        <div className="bg-rose-50 px-3 py-1 rounded-full text-rose-600 text-xs font-black">
                          {new Date().toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "long",
                          })}
                        </div>
                      </div>

                      <div className="space-y-4">
                        {anniversaryUsers.length === 0 ? (
                          <div className="py-12 text-center">
                            <div className="w-16 h-16 bg-surface-base rounded-full flex items-center justify-center mx-auto mb-4">
                              <Calendar className="w-8 h-8 text-on-surface-variant" />
                            </div>
                            <h4 className="text-on-surface font-bold">
                              No hay aniversarios hoy
                            </h4>
                            <p className="text-on-surface-muted text-sm max-w-xs mx-auto">
                              Vuelve mañana para ver quién está de celebración.
                            </p>
                          </div>
                        ) : (
                          anniversaryUsers.map((u) => {
                            const isBirthday =
                              u.birthDate &&
                              new Date(u.birthDate).getDate() ===
                                new Date().getDate() &&
                              new Date(u.birthDate).getMonth() ===
                                new Date().getMonth();
                            const otherAnn = u.anniversaries?.find((a) => {
                              const d = new Date(a.date);
                              return (
                                d.getDate() === new Date().getDate() &&
                                d.getMonth() === new Date().getMonth()
                              );
                            });

                            return (
                              <motion.div
                                key={u.id}
                                layout
                                className="flex items-center justify-between p-4 bg-surface-base rounded-2xl border border-outline group hover:shadow-lg transition-all"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-xl glass-card text-on-surface border border-outline flex items-center justify-center overflow-hidden shrink-0">
                                    {u.avatarUrl ? (
                                      <img
                                        src={u.avatarUrl}
                                        className="w-full h-full object-cover"
                                        alt=""
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <User className="w-6 h-6 text-on-surface-variant" />
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="font-black text-on-surface">
                                      {u.displayName || "Cliente Sin Nombre"}
                                    </h4>
                                    <div className="flex items-center gap-2">
                                      {isBirthday && (
                                        <span className="flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-black uppercase">
                                          🎂 Cumpleaños
                                        </span>
                                      )}
                                      {otherAnn && (
                                        <span className="flex items-center gap-1 text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-black uppercase">
                                          ❤️ {otherAnn.type}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <button
                                  onClick={() => {
                                    setNotificationForm({
                                      ...notificationForm,
                                      target: "specific_customer",
                                      targetUserId: u.id,
                                      title: `🎈 ¡Felicidades, ${u.displayName?.split(" ")[0]}!`,
                                      body: `En ${restaurant.name} queremos celebrar tu día especial. ¡Pide hoy y recibe una sorpresa!`,
                                    });
                                    setActiveTab("marketing");
                                  }}
                                  className="glass-card p-2 rounded-xl border border-outline shadow-sm text-on-surface-muted hover:text-rose-600 hover:border-rose-200 transition-all"
                                >
                                  <BellRing className="w-5 h-5" />
                                </button>
                              </motion.div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <div className="col-span-1 space-y-6">
                      <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-6 rounded-[2.5rem] text-on-surface shadow-xl shadow-rose-500/20">
                        <Sparkles className="w-8 h-8 mb-4 text-rose-200" />
                        <h3 className="text-xl font-black mb-2">
                          Fomenta la Lealtad
                        </h3>
                        <p className="text-rose-100 text-sm leading-relaxed mb-6">
                          El agente de ventas felicita automáticamente a los
                          clientes y les anuncia el regalo sorpresa si están
                          registrados y han comprado antes.
                        </p>
                        <div className="glass-card text-on-surface/20 p-4 rounded-2xl">
                          <p className="text-xs font-bold mb-2">
                            🎁 Recomendación:
                          </p>
                          <p className="text-[10px] text-rose-50 italic">
                            "Una cortesía o un descuento especial crea clientes
                            de por vida."
                          </p>
                        </div>
                      </div>

                      <div className="glass-card p-6 rounded-[2.5rem] border border-outline shadow-sm">
                        <h3 className="text-lg font-black text-on-surface mb-4">
                          Métricas
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">
                              Total Celebrantes
                            </p>
                            <p className="text-3xl font-black text-rose-600">
                              {anniversaryUsers.length}
                            </p>
                          </div>
                          <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">
                              Próximos 7 días
                            </p>
                            <p className="text-3xl font-black text-orange-600">
                              ...
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modals remain similar but with UI polish */}
              {editingProduct && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="glass-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                  >
                    <div className="p-8 border-b border-outline flex justify-between items-center glass-card text-on-surface">
                      <h2 className="text-2xl font-black tracking-tight">
                        {editingProduct.id
                          ? "Editar Producto"
                          : "Nuevo Producto"}
                      </h2>
                      <button
                        onClick={() => setEditingProduct(null)}
                        className="p-3 hover:bg-surface-variant rounded-2xl transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="p-8 space-y-8 overflow-y-auto flex-1">
                      <div className="grid grid-cols-2 gap-8">
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">
                            Nombre
                          </label>
                          <input
                            type="text"
                            value={editingProduct.name}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                name: e.target.value,
                              })
                            }
                            className="w-full border-2 border-outline rounded-2xl px-5 py-3 focus:border-orange-500 outline-none transition-colors font-bold"
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">
                            Precio (COP)
                          </label>
                          <input
                            type="number"
                            value={
                              editingProduct.price === 0
                                ? ""
                                : editingProduct.price || ""
                            }
                            onChange={(e) => {
                              const newPrice = e.target.value
                                ? Number(e.target.value)
                                : 0;
                              const percentage =
                                editingProduct.discountPercentage || 0;
                              const discPrice =
                                percentage > 0
                                  ? Math.round(
                                      newPrice * (1 - percentage / 100),
                                    )
                                  : undefined;
                              setEditingProduct({
                                ...editingProduct,
                                price: newPrice,
                                discountPrice: discPrice,
                              });
                            }}
                            className="w-full border-2 border-outline rounded-2xl px-5 py-3 focus:border-orange-500 outline-none transition-colors font-bold"
                          />
                        </div>

                        <div className="col-span-2 bg-surface-base p-6 rounded-[2rem] border-2 border-outline space-y-6">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-on-surface-muted uppercase tracking-widest">
                              Configuración de Descuento
                            </h4>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editingProduct.hasDiscount}
                                onChange={(e) => {
                                  setEditingProduct({
                                    ...editingProduct,
                                    hasDiscount: e.target.checked,
                                    discountPercentage: e.target.checked
                                      ? editingProduct.discountPercentage || 0
                                      : undefined,
                                    discountPrice: e.target.checked
                                      ? editingProduct.discountPrice ||
                                        editingProduct.price
                                      : undefined,
                                  });
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:glass-card text-on-surface after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                            </label>
                          </div>

                          {editingProduct.hasDiscount && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="grid grid-cols-2 gap-6"
                            >
                              <div>
                                <label className="block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2">
                                  Porcentaje (%)
                                </label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={
                                      editingProduct.discountPercentage || 0
                                    }
                                    onChange={(e) => {
                                      const pVal = Number(e.target.value);
                                      const discPrice = Math.round(
                                        editingProduct.price * (1 - pVal / 100),
                                      );
                                      setEditingProduct({
                                        ...editingProduct,
                                        discountPercentage: pVal,
                                        discountPrice: discPrice,
                                      });
                                    }}
                                    className="w-full border-2 border-outline rounded-xl px-4 py-2 focus:border-orange-500 outline-none font-black text-orange-600"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-orange-400">
                                    %
                                  </span>
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2">
                                  Precio Final
                                </label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    value={editingProduct.discountPrice || 0}
                                    onChange={(e) => {
                                      const dVal = Number(e.target.value);
                                      const pVal = Math.round(
                                        (1 - dVal / editingProduct.price) * 100,
                                      );
                                      setEditingProduct({
                                        ...editingProduct,
                                        discountPrice: dVal,
                                        discountPercentage: pVal,
                                      });
                                    }}
                                    className="w-full border-2 border-outline rounded-xl px-4 py-2 focus:border-orange-500 outline-none font-black text-green-600"
                                  />
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-green-400">
                                    $
                                  </span>
                                </div>
                              </div>

                              <div className="col-span-2 p-4 glass-card text-on-surface rounded-2xl border-2 border-orange-100 flex items-center justify-between">
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-black text-on-surface-muted uppercase">
                                    Vista previa
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-on-surface-muted line-through text-sm font-bold">
                                      {formatCurrency(editingProduct.price)}
                                    </span>
                                    <span className="text-orange-600 font-black text-lg">
                                      {formatCurrency(
                                        editingProduct.discountPrice || 0,
                                      )}
                                    </span>
                                  </div>
                                </div>
                                <div className="px-3 py-1 bg-orange-100 text-orange-600 rounded-lg font-black text-xs">
                                  -{editingProduct.discountPercentage}% OFF
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>

                        {/* Loyalty Points Multiplier */}
                        <div className="col-span-2 bg-purple-50 p-6 rounded-[2rem] border-2 border-purple-100/60 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <h4 className="text-sm font-black text-purple-900 uppercase tracking-tight">
                                Multiplicador de Monedas de Oro
                              </h4>
                              <p className="text-xs text-on-surface-muted">
                                Multiplica las Monedas de Oro ganadas al
                                comprar este producto
                              </p>
                            </div>
                            <select
                              value={editingProduct.pointsMultiplier || 1}
                              onChange={(e) => {
                                setEditingProduct({
                                  ...editingProduct,
                                  pointsMultiplier: Number(e.target.value),
                                });
                              }}
                              className="border-2 border-purple-200 rounded-xl px-4 py-2 focus:border-purple-500 outline-none font-black text-purple-700 glass-card text-on-surface cursor-pointer"
                            >
                              <option value={1}>Sin multiplicador (1x)</option>
                              <option value={2}>Multiplicador x2 (Doble Monedas)</option>
                              <option value={3}>Multiplicador x3 (Triple Monedas)</option>
                              <option value={4}>Multiplicador x4</option>
                              <option value={5}>Multiplicador x5</option>
                              <option value={6}>Multiplicador x6</option>
                              <option value={7}>Multiplicador x7</option>
                              <option value={8}>Multiplicador x8</option>
                              <option value={9}>Multiplicador x9</option>
                              <option value={10}>
                                Multiplicador x10 (Máximo)
                              </option>
                            </select>
                          </div>
                          {editingProduct.pointsMultiplier &&
                            editingProduct.pointsMultiplier > 1 && (
                              <div className="flex items-center gap-2 bg-purple-100 text-purple-700 font-bold text-xs px-3 py-1.5 rounded-xl w-fit">
                                🎯 Etiqueta activa: "Multiplica x
                                {editingProduct.pointsMultiplier} <GoldCoinIcon className="w-3.5 h-3.5 -mt-0.5 mx-0.5 inline-block" /> Monedas"
                              </div>
                            )}
                        </div>

                        <div className="col-span-2">
                          <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2 flex justify-between">
                            <span>Descripción</span>
                            <button
                              onClick={handleImproveDescription}
                              disabled={
                                isImproving ||
                                !editingProduct.name ||
                                !editingProduct.description
                              }
                              className="text-orange-600 text-[10px] font-black flex items-center gap-1 hover:text-orange-700 disabled:opacity-50 uppercase tracking-widest"
                            >
                              <Wand2 className="w-3 h-3" />
                              {isImproving ? "Mejorando..." : "Mejorar con IA"}
                            </button>
                          </label>
                          <textarea
                            rows={4}
                            value={editingProduct.description}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                description: e.target.value,
                              })
                            }
                            className="w-full border-2 border-outline rounded-2xl px-5 py-3 focus:border-orange-500 outline-none transition-colors font-medium resize-none"
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">
                            Categoría
                          </label>
                          <select
                            value={editingProduct.categoryId || ""}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                categoryId: e.target.value,
                              })
                            }
                            className="w-full border-2 border-outline rounded-2xl px-5 py-3 focus:border-orange-500 outline-none transition-colors font-bold glass-card text-on-surface"
                          >
                            <option value="">Sin categoría</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <div className="flex items-center gap-2 mb-2">
                            <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest">
                              Imagen del Producto
                            </label>
                            <ImageSizeInfo type="product" />
                          </div>
                          <div className="space-y-3">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="URL de la imagen"
                                value={editingProduct.images[0] || ""}
                                onChange={(e) =>
                                  setEditingProduct({
                                    ...editingProduct,
                                    images: [e.target.value],
                                  })
                                }
                                className="flex-1 border-2 border-outline rounded-2xl px-5 py-3 focus:border-orange-500 outline-none transition-colors font-bold text-sm"
                              />
                            </div>
                            <div className="relative">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="product-image-upload"
                                disabled={isUploading}
                              />
                              <label
                                htmlFor="product-image-upload"
                                className={`w-full flex items-center justify-center gap-2 px-5 py-3 border-2 border-dashed border-outline rounded-2xl cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-all ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
                              >
                                {isUploading ? (
                                  <Clock className="w-5 h-5 animate-spin text-orange-500" />
                                ) : (
                                  <ImageIcon className="w-5 h-5 text-on-surface-muted" />
                                )}
                                <span className="text-sm font-bold text-on-surface-muted">
                                  {isUploading
                                    ? "Subiendo..."
                                    : "Subir imagen personalizada"}
                                </span>
                              </label>
                            </div>
                            {editingProduct.images[0] && (
                              <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-outline">
                                <img
                                  src={editingProduct.images[0]}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="col-span-2">
                          <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">
                            Productos Recomendados (Upselling)
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {restaurant.menu
                              .filter((p) => p.id !== editingProduct.id)
                              .map((p) => (
                                <label
                                  key={p.id}
                                  className="flex items-center gap-2 p-3 border-2 border-outline rounded-xl cursor-pointer hover:border-orange-200"
                                >
                                  <input
                                    type="checkbox"
                                    checked={editingProduct.recommendedProductIds?.includes(
                                      p.id,
                                    )}
                                    onChange={(e) => {
                                      const ids =
                                        editingProduct.recommendedProductIds ||
                                        [];
                                      setEditingProduct({
                                        ...editingProduct,
                                        recommendedProductIds: e.target.checked
                                          ? [...ids, p.id]
                                          : ids.filter((id) => id !== p.id),
                                      });
                                    }}
                                    className="accent-orange-500"
                                  />
                                  <span className="text-sm font-bold text-on-surface-variant">
                                    {p.name}
                                  </span>
                                </label>
                              ))}
                          </div>
                        </div>

                        <div className="col-span-2 flex gap-6">
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <div
                              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${editingProduct.available ? "bg-orange-500 border-orange-500" : "border-outline"}`}
                            >
                              {editingProduct.available && (
                                <CheckCircle2 className="w-4 h-4 text-on-surface" />
                              )}
                            </div>
                            <input
                              type="checkbox"
                              checked={editingProduct.available}
                              onChange={(e) =>
                                setEditingProduct({
                                  ...editingProduct,
                                  available: e.target.checked,
                                })
                              }
                              className="hidden"
                            />
                            <span className="text-sm font-bold text-on-surface-variant">
                              Disponible
                            </span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <div
                              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${editingProduct.isPromotion ? "bg-orange-500 border-orange-500" : "border-outline"}`}
                            >
                              {editingProduct.isPromotion && (
                                <CheckCircle2 className="w-4 h-4 text-on-surface" />
                              )}
                            </div>
                            <input
                              type="checkbox"
                              checked={editingProduct.isPromotion}
                              onChange={(e) =>
                                setEditingProduct({
                                  ...editingProduct,
                                  isPromotion: e.target.checked,
                                })
                              }
                              className="hidden"
                            />
                            <span className="text-sm font-bold text-on-surface-variant">
                              Promoción
                            </span>
                          </label>

                          <label className="flex items-center gap-3 cursor-pointer group">
                            <div
                              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${editingProduct.isFeatured ? "bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-200" : "border-outline"}`}
                            >
                              {editingProduct.isFeatured && (
                                <Star className="w-4 h-4 text-on-surface fill-current" />
                              )}
                            </div>
                            <input
                              type="checkbox"
                              checked={editingProduct.isFeatured || false}
                              onChange={(e) =>
                                setEditingProduct({
                                  ...editingProduct,
                                  isFeatured: e.target.checked,
                                })
                              }
                              className="hidden"
                            />
                            <span className="text-sm font-bold text-on-surface-variant">
                              Destacado
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="p-8 border-t border-outline bg-surface-base flex justify-end gap-4">
                      <button
                        onClick={() => setEditingProduct(null)}
                        className="px-8 py-3 rounded-2xl font-black text-on-surface-muted hover:bg-surface-variant transition-colors uppercase tracking-widest text-xs"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveProduct}
                        className="px-10 py-3 rounded-2xl font-black bg-orange-500 text-on-surface hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 flex items-center gap-2 uppercase tracking-widest text-xs"
                      >
                        <Save className="w-4 h-4" /> Guardar Producto
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Edit Banner Modal remains similar but with UI polish */}
              {editingBanner && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="glass-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                  >
                    <div className="p-8 border-b border-outline flex justify-between items-center">
                      <h2 className="text-2xl font-black tracking-tight">
                        {editingBanner.id ? "Editar Banner" : "Nuevo Banner"}
                      </h2>
                      <button
                        onClick={() => setEditingBanner(null)}
                        className="p-3 hover:bg-surface-variant rounded-2xl transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                      <div>
                        <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">
                          Título
                        </label>
                        <input
                          type="text"
                          value={editingBanner.title}
                          onChange={(e) =>
                            setEditingBanner({
                              ...editingBanner,
                              title: e.target.value,
                            })
                          }
                          className="w-full border-2 border-outline rounded-2xl px-5 py-3 focus:border-orange-500 outline-none transition-colors font-bold"
                          placeholder="Ej: ¡2x1 en Hamburguesas!"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">
                            Ubicación
                          </label>
                          <select
                            value={editingBanner.location || "general"}
                            onChange={(e) =>
                              setEditingBanner({
                                ...editingBanner,
                                location: e.target.value as any,
                              })
                            }
                            className="w-full border-2 border-outline rounded-2xl px-5 py-3 focus:border-orange-500 outline-none transition-colors font-bold"
                          >
                            <option value="general">Carrusel Principal</option>
                            <option value="interstitial">
                              Intersticial (Pantalla Completa)
                            </option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">
                            Tipo
                          </label>
                          <select
                            value={editingBanner.type || "image"}
                            onChange={(e) =>
                              setEditingBanner({
                                ...editingBanner,
                                type: e.target.value as any,
                              })
                            }
                            className="w-full border-2 border-outline rounded-2xl px-5 py-3 focus:border-orange-500 outline-none transition-colors font-bold"
                          >
                            <option value="image">Imagen</option>
                            <option value="video">Video Externo (URL)</option>
                            <option value="text">Solo Texto</option>
                          </select>
                        </div>
                      </div>

                      {editingBanner.location === "interstitial" && (
                        <div className="grid grid-cols-1 gap-4 bg-orange-50 p-4 rounded-2xl border border-orange-100">
                          <div className="flex flex-col gap-2">
                            <label className="block text-xs font-black text-orange-600 uppercase tracking-widest">
                              Duración (segundos)
                            </label>
                            <p className="text-xs text-orange-500/80 mb-1">
                              Entre 5 y 60 segundos.
                            </p>
                            <input
                              type="number"
                              min="5"
                              max="60"
                              value={editingBanner.durationSeconds || 20}
                              onChange={(e) =>
                                setEditingBanner({
                                  ...editingBanner,
                                  durationSeconds: parseInt(e.target.value),
                                })
                              }
                              className="w-full border-2 border-orange-100 rounded-2xl px-5 py-3 focus:border-orange-500 outline-none transition-colors font-bold"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                              <label className="block text-xs font-black text-orange-600 uppercase tracking-widest">
                                Enlace del botón (URL)
                              </label>
                              <p className="text-xs text-orange-500/80 mb-1">
                                Si está vacío, no habrá botón.
                              </p>
                              <input
                                type="url"
                                placeholder="Ej: /restaurante/123#Postres"
                                value={editingBanner.actionUrl || ""}
                                onChange={(e) =>
                                  setEditingBanner({
                                    ...editingBanner,
                                    actionUrl: e.target.value,
                                  })
                                }
                                className="w-full border-2 border-orange-100 rounded-2xl px-5 py-3 focus:border-orange-500 outline-none transition-colors font-bold"
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="block text-xs font-black text-orange-600 uppercase tracking-widest">
                                Texto del botón
                              </label>
                              <p className="text-xs text-orange-500/80 mb-1">
                                Ej: Ver Promoción
                              </p>
                              <input
                                type="text"
                                placeholder="Ver Promoción"
                                value={
                                  editingBanner.actionText || "Ver Promoción"
                                }
                                onChange={(e) =>
                                  setEditingBanner({
                                    ...editingBanner,
                                    actionText: e.target.value,
                                  })
                                }
                                className="w-full border-2 border-orange-100 rounded-2xl px-5 py-3 focus:border-orange-500 outline-none transition-colors font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">
                            Inicio (Opcional)
                          </label>
                          <input
                            type="datetime-local"
                            value={editingBanner.startDate || ""}
                            onChange={(e) =>
                              setEditingBanner({
                                ...editingBanner,
                                startDate: e.target.value || null,
                              })
                            }
                            className="w-full border-2 border-outline rounded-2xl px-5 py-3 focus:border-orange-500 outline-none transition-colors font-bold text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">
                            Fin (Opcional)
                          </label>
                          <input
                            type="datetime-local"
                            value={editingBanner.endDate || ""}
                            onChange={(e) =>
                              setEditingBanner({
                                ...editingBanner,
                                endDate: e.target.value || null,
                              })
                            }
                            className="w-full border-2 border-outline rounded-2xl px-5 py-3 focus:border-orange-500 outline-none transition-colors font-bold text-sm"
                          />
                        </div>
                      </div>

                      {(editingBanner.type === "image" ||
                        !editingBanner.type) && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest">
                              Imagen Banner
                            </label>
                            <ImageSizeInfo type="banner" />
                          </div>
                          {editingBanner.location === "interstitial" && (
                            <p className="text-xs text-on-surface-muted mb-2">
                              Para pantalla completa, recomendamos formato
                              vertical (ej. 1080x1920). Se comprimen
                              automáticamente para no perder calidad.
                            </p>
                          )}
                          <div className="relative group">
                            <input
                              type="file"
                              accept="image/jpeg, image/png, image/webp"
                              onChange={async (e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const file = e.target.files[0];
                                  if (file.size > 2 * 1024 * 1024) {
                                    toast.error(
                                      "La imagen no debe superar los 2MB.",
                                    );
                                    return;
                                  }
                                  toast.loading("Subiendo imagen...");
                                  const { url, error } = await db.uploadImage(
                                    file,
                                    `banners/${restaurant?.id || "general"}`,
                                  );
                                  toast.dismiss();
                                  if (error) {
                                    toast.error("Error al subir la imagen");
                                  } else if (url) {
                                    setEditingBanner({
                                      ...editingBanner,
                                      imageUrl: url,
                                    });
                                    toast.success("Imagen subida");
                                  }
                                }
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="w-full border-2 border-dashed border-outline rounded-2xl px-5 py-3 group-hover:border-orange-500 transition-colors flex items-center justify-center gap-2 bg-surface-base">
                              <Upload className="w-4 h-4 text-on-surface-muted" />
                              <span className="text-sm font-bold text-on-surface-muted">
                                {editingBanner.imageUrl
                                  ? "Cambiar imagen"
                                  : "Seleccionar imagen (Max 2MB)"}
                              </span>
                            </div>
                          </div>

                          <div className="h-40 w-full rounded-2xl overflow-hidden bg-surface-variant mt-2 relative shadow-inner border-2 border-outline flex items-center justify-center">
                            {editingBanner.imageUrl ? (
                              <img
                                src={editingBanner.imageUrl}
                                alt="Preview"
                                className="h-full object-contain"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                                <ImageIcon className="w-10 h-10" />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {editingBanner.type === "video" && (
                        <div>
                          <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">
                            URL del Video (MP4)
                          </label>
                          <input
                            type="url"
                            value={editingBanner.videoUrl || ""}
                            onChange={(e) =>
                              setEditingBanner({
                                ...editingBanner,
                                videoUrl: e.target.value,
                              })
                            }
                            className="w-full border-2 border-outline rounded-2xl px-5 py-3 focus:border-orange-500 outline-none transition-colors font-bold"
                            placeholder="https://ejemplo.com/video.mp4"
                          />
                        </div>
                      )}

                      {editingBanner.type === "text" && (
                        <div>
                          <label className="block text-xs font-black text-on-surface-muted uppercase tracking-widest mb-2">
                            Contenido del Text
                          </label>
                          <textarea
                            rows={3}
                            value={editingBanner.content || ""}
                            onChange={(e) =>
                              setEditingBanner({
                                ...editingBanner,
                                content: e.target.value,
                              })
                            }
                            className="w-full border-2 border-outline rounded-2xl px-5 py-3 focus:border-orange-500 outline-none transition-colors font-bold resize-none"
                            placeholder="Escribe el mensaje de la promoción..."
                          />
                        </div>
                      )}

                      <div className="mt-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${editingBanner.active ? "bg-orange-500 border-orange-500" : "border-outline"}`}
                          >
                            {editingBanner.active && (
                              <CheckCircle2 className="w-4 h-4 text-on-surface" />
                            )}
                          </div>
                          <input
                            type="checkbox"
                            checked={editingBanner.active}
                            onChange={(e) =>
                              setEditingBanner({
                                ...editingBanner,
                                active: e.target.checked,
                              })
                            }
                            className="hidden"
                          />
                          <span className="text-sm font-bold text-on-surface-variant">
                            Banner Activo
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="p-8 border-t border-outline bg-surface-base flex justify-end gap-4">
                      <button
                        onClick={() => setEditingBanner(null)}
                        className="px-8 py-3 rounded-2xl font-black text-on-surface-muted hover:bg-surface-variant transition-colors uppercase tracking-widest text-xs"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveBanner}
                        className="px-10 py-3 rounded-2xl font-black bg-orange-500 text-on-surface hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 flex items-center gap-2 uppercase tracking-widest text-xs"
                      >
                        <Save className="w-4 h-4" /> Guardar
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
            {/* Confirmation Modal */}
            {itemToDelete && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card text-on-surface rounded-[2rem] max-w-md w-full overflow-hidden shadow-2xl"
                >
                  <div className="p-8">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                      <Trash2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-black text-center mb-2">
                      ¿Estás seguro?
                    </h3>
                    <p className="text-on-surface-muted text-center font-medium">
                      Estás a moneda de oro de eliminar{" "}
                      {itemToDelete.type === "table"
                        ? `la mesa "${itemToDelete.name}"`
                        : itemToDelete.type === "product"
                          ? `el producto "${itemToDelete.name}"`
                          : itemToDelete.type === "category"
                            ? `la categoría "${itemToDelete.name}"`
                            : itemToDelete.type === "customer"
                              ? `el usuario "${itemToDelete.name}"`
                              : itemToDelete.type === "customers_bulk"
                                ? `los ${itemToDelete.name} usuarios seleccionados`
                                : "este banner"}
                      . Esta acción no se puede deshacer.
                    </p>
                  </div>
                  <div className="p-6 bg-surface-base border-t border-outline flex gap-4">
                    <button
                      onClick={() => setItemToDelete(null)}
                      className="flex-1 py-3 rounded-xl font-black text-on-surface-muted bg-surface-variant hover:bg-neutral-300 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        if (itemToDelete.type === "table")
                          confirmDeleteTable(itemToDelete.id);
                        else if (itemToDelete.type === "product")
                          confirmDeleteProduct(itemToDelete.id);
                        else if (itemToDelete.type === "category")
                          confirmDeleteCategory(itemToDelete.id);
                        else if (itemToDelete.type === "banner")
                          confirmDeleteBanner(itemToDelete.id);
                        else if (itemToDelete.type === "customer")
                          confirmDeleteCustomer(itemToDelete.id);
                        else if (itemToDelete.type === "customers_bulk")
                          confirmBulkDeleteCustomers();
                        setItemToDelete(null);
                      }}
                      className="flex-1 py-3 rounded-xl font-black text-on-surface bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
                    >
                      Sí, eliminar
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Coupon Modal */}
      {editingCoupon && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setEditingCoupon(null)}
          />
          <div className="relative w-full max-w-lg glass-card rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-outline flex justify-between items-center">
              <h3 className="text-2xl font-black text-on-surface">
                {editingCoupon.id ? "Editar Cupón" : "Nuevo Cupón"}
              </h3>
              <button
                onClick={() => setEditingCoupon(null)}
                className="p-2 hover:bg-surface-variant rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-on-surface-muted" />
              </button>
            </div>
            <form onSubmit={handleSaveCoupon} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
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
                    className="w-full px-4 py-3 bg-surface-base border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none font-bold transition-all"
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
                    className="w-full px-4 py-3 bg-surface-base border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none font-bold transition-all"
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
                      editingCoupon.value === 0 ? "" : editingCoupon.value || ""
                    }
                    onChange={(e) =>
                      setEditingCoupon({
                        ...editingCoupon,
                        value: e.target.value ? Number(e.target.value) : 0,
                      })
                    }
                    className="w-full px-4 py-3 bg-surface-base border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none font-bold transition-all"
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
                    className="w-full px-4 py-3 bg-surface-base border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none font-bold transition-all"
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
                    className="w-full px-4 py-3 bg-surface-base border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none font-bold transition-all"
                    placeholder="Ilimitado"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={
                      editingCoupon.startDate
                        ? editingCoupon.startDate.split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      setEditingCoupon({
                        ...editingCoupon,
                        startDate: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-surface-base border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none font-bold transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-on-surface-muted uppercase tracking-widest mb-2">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={
                      editingCoupon.endDate
                        ? editingCoupon.endDate.split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      setEditingCoupon({
                        ...editingCoupon,
                        endDate: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-surface-base border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none font-bold transition-all"
                  />
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-3 p-4 bg-surface-base rounded-2xl cursor-pointer hover:bg-surface-variant transition-colors text-xs font-black uppercase tracking-widest text-on-surface-muted">
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
                    Cupón Activo
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingCoupon(null)}
                  className="flex-1 py-4 bg-surface-variant text-on-surface-muted font-black rounded-2xl hover:bg-surface-variant transition-all uppercase tracking-widest text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-orange-500 text-on-surface font-black rounded-2xl shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all uppercase tracking-widest text-xs"
                >
                  Guardar Cupón
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <motion.div
        drag="y"
        dragConstraints={{ top: -window.innerHeight + 100, bottom: 0 }}
        dragElastic={0.1}
        className="md:hidden fixed bottom-4 left-4 right-4 glass-card rounded-[2rem] shadow-2xl border border-outline flex flex-col items-center justify-center p-2 z-[9999] overflow-hidden group touch-none"
      >
        <div
          className="w-10 h-1 bg-surface-variant rounded-full mb-2 cursor-grab active:cursor-grabbing"
          title="Arrastra para mover"
        />
        <div className="flex items-center justify-around w-full">
          {mobileNavItems.map((item) => {
            const isActive = activeTab === item.id;
            const isMore = item.id === "more";
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (isMore) {
                    setIsMobileOpen(true);
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                className={cn(
                  "relative flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300",
                  isActive ? item.activeClass : "hover:bg-surface-base",
                )}
              >
                <item.icon
                  className={cn(
                    "w-6 h-6 transition-all duration-300",
                    isActive ? "scale-110 mb-1" : item.inactiveColor,
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-black uppercase tracking-tighter transition-all duration-300",
                    isActive
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-75 hidden",
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
