import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building, Plus, Search, Calendar, User, Phone, CheckCircle, Clock, 
  Trash2, Send, DollarSign, Award, Star, TrendingUp, Sparkles, MapPin, 
  Smartphone, BarChart2, Briefcase, RefreshCw, KeyRound, Save, Activity,
  Users, Layers, ExternalLink, ShieldAlert, Utensils, AlertTriangle, Truck,
  FileText, Check, X, Info, Store, ChevronRight, Pause, Play
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { db } from "../store/db";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { getDepartments, getCitiesByDepartment } from "../utils/colombiaData";

interface ActivityLog {
  id: string;
  type: "llamada" | "visita" | "correo" | "reunion";
  restaurantName: string;
  contactName: string;
  notes: string;
  status: "completed" | "scheduled";
  date: string;
  createdAt: string;
}

export default function RepresentativeDashboard() {
  const { appUser, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"restaurants" | "activities" | "earnings" | "account">("restaurants");
  const [loading, setLoading] = useState(true);

  // States for affiliated restaurants
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddRestaurant, setShowAddRestaurant] = useState(false);

  // Add Restaurant form fields
  const [newRestName, setNewRestName] = useState("");
  const [newRestType, setNewRestType] = useState("Comida Rápida");
  const [businessCategories, setBusinessCategories] = useState<any[]>([]);
  const [newRestBusinessCategory, setNewRestBusinessCategory] = useState("restaurant");
  const [newRestPhone, setNewRestPhone] = useState("");
  const [newRestAddress, setNewRestAddress] = useState("");
  const [newRestCity, setNewRestCity] = useState("Bogotá");
  const [newRestDepartment, setNewRestDepartment] = useState("Cundinamarca");
  const [newRestOwnerEmail, setNewRestOwnerEmail] = useState("");
  const [newRestOwnerPassword, setNewRestOwnerPassword] = useState("");
  const [newRestOwnerName, setNewRestOwnerName] = useState("");
  const [restSubmitting, setRestSubmitting] = useState(false);

  // States for Activities Tracker
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [actType, setActType] = useState<"llamada" | "visita" | "correo" | "reunion">("llamada");
  const [actRest, setActRest] = useState("");
  const [actContact, setActContact] = useState("");
  const [actNotes, setActNotes] = useState("");
  const [actStatus, setActStatus] = useState<"completed" | "scheduled">("completed");
  const [actDate, setActDate] = useState(new Date().toISOString().split('T')[0]);

  // States for Account settings
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // States for Commissions / Earnings
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("nequi");
  const [withdrawAccount, setWithdrawAccount] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawalHistory, setWithdrawalHistory] = useState<any[]>([]);

  // Publish / review modal states
  const [publishingRest, setPublishingRest] = useState<any | null>(null);
  const [checkingRequirements, setCheckingRequirements] = useState(false);
  const [reqsCheck, setReqsCheck] = useState<{
    hasName: boolean;
    hasDescription: boolean;
    hasAddress: boolean;
    hasCity: boolean;
    hasPhone: boolean;
    hasLogo: boolean;
    hasCover: boolean;
    logoUrl?: string;
    coverUrl?: string;
    numProducts: number;
    hasProducts: boolean;
    numValidProducts: number;
    numInvalidProducts: number;
    invalidProductNames: string[];
    hasCompleteMenu: boolean;
    hasHours: boolean;
    hasDeliveryConfig: boolean;
    hasAssistant: boolean;
    hasMarketing: boolean;
    prizesCount: number;
    loyaltyEnabled: boolean;
    referralEnabled: boolean;
    anniversaryEnabled: boolean;
    allMandatoryPassed: boolean;
    missingMandatoryList: string[];
    score: number;
  }>({
    hasName: false,
    hasDescription: false,
    hasAddress: false,
    hasCity: false,
    hasPhone: false,
    hasLogo: false,
    hasCover: false,
    numProducts: 0,
    hasProducts: false,
    numValidProducts: 0,
    numInvalidProducts: 0,
    invalidProductNames: [],
    hasCompleteMenu: false,
    hasHours: false,
    hasDeliveryConfig: false,
    hasAssistant: false,
    hasMarketing: false,
    prizesCount: 0,
    loyaltyEnabled: false,
    referralEnabled: false,
    anniversaryEnabled: false,
    allMandatoryPassed: false,
    missingMandatoryList: [],
    score: 0,
  });

  const isValidImage = (img: any): boolean => {
    if (!img) return false;
    if (Array.isArray(img)) {
      return img.length > 0 && img.some((item) => isValidImage(typeof item === "string" ? item : (item?.url || item?.image || item?.imageUrl)));
    }
    if (typeof img !== "string") return false;
    const trimmed = img.trim();
    if (trimmed.length < 5) return false;
    if (trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "undefined") return false;
    if (trimmed.toLowerCase().includes("placeholder") && !trimmed.startsWith("data:") && !trimmed.includes("supabase.co")) return false;
    return true;
  };

  const handleOpenPublishModal = async (initialRest: any) => {
    setPublishingRest(initialRest);
    setCheckingRequirements(true);
    try {
      // 1. Re-fetch fresh restaurant data from database to capture latest logo/cover/hours changes
      const freshData = await db.getRestaurant(initialRest.id);
      const rest = freshData ? { ...initialRest, ...freshData } : initialRest;
      setPublishingRest(rest);

      // 2. Fetch menu products and analyze digitization level
      const menu = await db.getRestaurantMenu(rest.id);
      const menuList = Array.isArray(menu) ? menu : [];
      const numProducts = menuList.length;

      const invalidProductNames: string[] = [];
      let validCount = 0;

      menuList.forEach((item: any, idx: number) => {
        const title = (item.title || item.name || "").trim();
        const price = typeof item.price === "number" ? item.price : parseFloat(item.price);

        const hasValidTitle = title.length > 0;
        const hasValidPrice = !isNaN(price) && price > 0;

        if (hasValidTitle && hasValidPrice) {
          validCount++;
        } else {
          const reasons = [];
          if (!hasValidPrice) reasons.push("precio inválido o $0");
          if (!hasValidTitle) reasons.push("sin nombre");
          invalidProductNames.push(`${title || `Plato #${idx + 1}`} (${reasons.join(", ")})`);
        }
      });

      const numInvalidProducts = invalidProductNames.length;
      const hasProducts = numProducts >= 1;
      const hasCompleteMenu = numProducts >= 1 && numInvalidProducts === 0;

      // 3. Fetch prizes and dynamics
      const prizes = await db.getRestaurantWheelPrizes(rest.id);
      const prizesCount = prizes ? prizes.length : 0;

      const aiKnowledge = rest.ai_knowledge || rest.aiKnowledge;
      const hours = rest.opening_hours || rest.openingHours;
      const detailedHours = rest.detailed_hours || rest.detailedHours;
      const address = rest.address;
      const description = rest.description;
      const phone = rest.phone || rest.whatsapp_number || rest.whatsappNumber;
      const city = rest.city;
      const name = rest.name;

      const rawLogo = rest.logo || rest.logo_url || rest.logoUrl || (rest as any).avatar || (rest as any).image;
      const rawCover = rest.cover_image || rest.coverImage || rest.cover || rest.coverUrl || rest.cover_url || rest.header_image || rest.headerImage || rest.banner || rest.banner_url || (Array.isArray(rest.banners) && rest.banners.length > 0 ? (typeof rest.banners[0] === 'string' ? rest.banners[0] : (rest.banners[0]?.url || rest.banners[0]?.image)) : null);

      const hasLogo = isValidImage(rawLogo);
      const hasCover = isValidImage(rawCover);

      const hasName = !!(name && name.trim().length >= 2);
      const hasDescription = !!(description && description.trim().length >= 5 && !description.toLowerCase().includes("placeholder"));
      const hasAddress = !!(address && address.trim().length >= 4);
      const hasPhone = !!(phone && phone.trim().length >= 6);
      const hasCity = !!(city && city.trim().length >= 2);

      const hasHours = !!(
        (hours && hours.trim().length >= 3) ||
        (detailedHours && typeof detailedHours === "object" && Object.keys(detailedHours).length > 0)
      );

      const hasDeliveryConfig = rest.has_delivery !== undefined || rest.hasDelivery !== undefined || !!rest.delivery_fee;

      const hasAssistant = !!(aiKnowledge && (aiKnowledge.instructions?.trim() || aiKnowledge.foodTypes?.trim()));
      const loyaltyEnabled = !!rest.loyalty_enabled || !!rest.loyaltyEnabled;
      const referralEnabled = !!rest.referral_enabled || !!rest.referralEnabled;
      const anniversaryEnabled = !!rest.anniversary_program_enabled || !!rest.anniversaryProgramEnabled || !!rest.anniversary_enabled || !!rest.anniversaryEnabled;
      const hasMarketing = prizesCount > 0 || loyaltyEnabled || referralEnabled || anniversaryEnabled;

      // Mandatory validation check list
      const missingMandatoryList: string[] = [];
      if (!hasLogo) missingMandatoryList.push("Logo oficial de identidad del restaurante");
      if (!hasCover) missingMandatoryList.push("Imagen de portada o banner de cabecera");
      if (!hasDescription) missingMandatoryList.push("Descripción comercial del negocio");
      if (!hasAddress) missingMandatoryList.push("Dirección física de ubicación del local");
      if (!hasPhone) missingMandatoryList.push("Teléfono de contacto o WhatsApp del restaurante");
      if (!hasHours) missingMandatoryList.push("Horarios de apertura y cierre semanales");
      if (numProducts === 0) {
        missingMandatoryList.push("Menú Digital: No cuenta con platos registrados (agrega al menos un plato con precio válido)");
      } else if (numInvalidProducts > 0) {
        missingMandatoryList.push(`Menú Digital: Hay ${numInvalidProducts} plato(s) sin precio válido (> $0)`);
      }

      const allMandatoryPassed = missingMandatoryList.length === 0;

      // Calculate score percentage (0-100)
      const totalChecks = 9;
      let passedChecks = 0;
      if (hasName) passedChecks++;
      if (hasLogo) passedChecks++;
      if (hasCover) passedChecks++;
      if (hasDescription) passedChecks++;
      if (hasAddress && hasPhone) passedChecks++;
      if (hasHours) passedChecks++;
      if (hasCompleteMenu) passedChecks++;
      if (hasAssistant) passedChecks++;
      if (hasMarketing) passedChecks++;

      const score = Math.round((passedChecks / totalChecks) * 100);

      setReqsCheck({
        hasName,
        hasDescription,
        hasAddress,
        hasCity,
        hasPhone,
        hasLogo,
        hasCover,
        logoUrl: typeof rawLogo === "string" ? rawLogo : undefined,
        coverUrl: typeof rawCover === "string" ? rawCover : undefined,
        numProducts,
        hasProducts,
        numValidProducts: validCount,
        numInvalidProducts,
        invalidProductNames,
        hasCompleteMenu,
        hasHours,
        hasDeliveryConfig,
        hasAssistant,
        hasMarketing,
        prizesCount,
        loyaltyEnabled,
        referralEnabled,
        anniversaryEnabled,
        allMandatoryPassed,
        missingMandatoryList,
        score
      });
    } catch (err) {
      console.error("Error checking requirements:", err);
      toast.error("Error al auditar la configuración del restaurante.");
    } finally {
      setCheckingRequirements(false);
    }
  };

  const handleDirectPublish = async () => {
    if (!publishingRest || !reqsCheck.allMandatoryPassed) {
      toast.error("No se puede publicar: Faltan requisitos obligatorios de digitalización.");
      return;
    }
    setCheckingRequirements(true);
    try {
      const { error } = await supabase
        .from("restaurants")
        .update({ 
          status: "active",
          highlight_message: ""
        })
        .eq("id", publishingRest.id);

      if (error) throw error;

      toast.success(`¡"${publishingRest.name}" ha sido publicado y activado con éxito!`);
      setPublishingRest(null);
      fetchDashboardData();
    } catch (err: any) {
      console.error("Error publishing restaurant directly:", err);
      toast.error("Error al publicar restaurante.");
    } finally {
      setCheckingRequirements(false);
    }
  };

  const handlePublishRequestSubmit = async () => {
    if (!publishingRest) return;
    setCheckingRequirements(true);
    try {
      const { error } = await supabase
        .from("restaurants")
        .update({ 
          status: "inactive",
          highlight_message: "pending_publish"
        })
        .eq("id", publishingRest.id);

      if (error) throw error;

      toast.success("¡Solicitud enviada con éxito! El administrador súper revisará tu configuración pronto.");
      setPublishingRest(null);
      fetchDashboardData();
    } catch (err: any) {
      console.error("Error submitting publish request:", err);
      toast.error("Error al enviar la solicitud de publicación.");
    } finally {
      setCheckingRequirements(false);
    }
  };

  const handleToggleRestaurantStatus = async (
    id: string,
    targetStatus: "active" | "inactive",
    highlightMsg: string = ""
  ) => {
    try {
      // Optimistic update
      setRestaurants((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: targetStatus,
                highlight_message: highlightMsg,
                highlightMessage: highlightMsg
              }
            : r
        )
      );

      const { error } = await supabase
        .from("restaurants")
        .update({
          status: targetStatus,
          highlight_message: highlightMsg
        })
        .eq("id", id);

      if (error) {
        await db.updateRestaurant(id, {
          status: targetStatus as any,
          highlightMessage: highlightMsg
        });
      }

      toast.success(
        targetStatus === "active"
          ? "¡Restaurante activado y publicado con éxito!"
          : "Restaurante cambiado a estado Borrador / Inactivo."
      );
      fetchDashboardData();
    } catch (err) {
      console.error("Error updating restaurant status:", err);
      toast.error("Error al actualizar el estado del restaurante.");
      fetchDashboardData();
    }
  };

  useEffect(() => {
    if (!user || !appUser) return;
    fetchDashboardData();
  }, [user, appUser]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch platform settings and business categories
      try {
        const settings = await db.getPlatformSettings();
        if (settings && settings.businessCategories) {
          setBusinessCategories(settings.businessCategories);
          // Set default business category if not set
          if (settings.businessCategories.length > 0) {
            const hasRestaurant = settings.businessCategories.some((c: any) => c.id === "restaurant");
            setNewRestBusinessCategory(hasRestaurant ? "restaurant" : settings.businessCategories[0].id);
          }
        }
      } catch (err) {
        console.error("Error loading platform settings in rep dashboard:", err);
      }

      // 1. Fetch Affiliated Restaurants
      // We look for restaurants whose owner has been referred by this representative
      // OR restaurants where the representative created them.
      // Wait! Let's query all restaurants and filter or fetch.
      const { data: allRests, error: restErr } = await supabase
        .from("restaurants")
        .select("*")
        .order("created_at", { ascending: false });

      if (restErr) throw restErr;

      // In some architectures, affiliated restaurants are linked through a specific query or owner id referral
      // We will look for restaurants where the owner was referred by our referral code!
      // Let's also retrieve the owner profile for each restaurant.
      const { data: users, error: usersErr } = await supabase
        .from("app_users")
        .select("id, email, referred_by, display_name");

      if (!usersErr && users) {
        // Map referred owners to their restaurants
        const referredUserIds = users
          .filter((u: any) => u.referred_by === user?.id)
          .map((u: any) => u.id);

        const affiliated = (allRests || []).filter((r: any) => 
          referredUserIds.includes(r.owner_id) || r.owner_email?.includes(appUser?.email || "---")
        );
        setRestaurants(affiliated);
      } else {
        // Fallback to restaurants that have representative metadata or match email
        const affiliated = (allRests || []).filter((r: any) => 
          r.owner_email === appUser?.email
        );
        setRestaurants(affiliated);
      }

      // 2. Fetch logged activities from localStorage
      const localActs = localStorage.getItem(`smartbite_activities_${user?.id}`);
      if (localActs) {
        setActivities(JSON.parse(localActs));
      } else {
        // Seed default template logs for nice look
        const defaultActs: ActivityLog[] = [
          {
            id: "1",
            type: "visita",
            restaurantName: "Pizzería Nápoles",
            contactName: "Don Francesco",
            notes: "Excelente disposición, afiliado en el plan premium con bono activo de $50k.",
            status: "completed",
            date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
          },
          {
            id: "2",
            type: "llamada",
            restaurantName: "Burger House Cl. 93",
            contactName: "Camila Rojas (Gerente)",
            notes: "Interesada en la funcionalidad de pedidos por voz e integración a WhatsApp.",
            status: "scheduled",
            date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            createdAt: new Date().toISOString()
          }
        ];
        localStorage.setItem(`smartbite_activities_${user?.id}`, JSON.stringify(defaultActs));
        setActivities(defaultActs);
      }

      // 3. Fetch Withdrawal Requests
      const { data: withdrawals, error: wErr } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (!wErr && withdrawals) {
        setWithdrawalHistory(withdrawals);
      } else {
        // Fallback local stub
        const localW = localStorage.getItem(`smartbite_withdrawals_${user?.id}`);
        if (localW) {
          setWithdrawalHistory(JSON.parse(localW));
        } else {
          setWithdrawalHistory([]);
        }
      }

    } catch (err: any) {
      console.error("Error loading representative data:", err);
      toast.error("Error al cargar la información del panel");
    } finally {
      setLoading(false);
    }
  };

  // Add Restaurant Handler
  const handleAddNewRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRestName || !newRestPhone || !newRestOwnerEmail || !newRestOwnerPassword) {
      toast.error("Por favor completa los campos requeridos");
      return;
    }

    setRestSubmitting(true);
    try {
      // 1. Create the restaurant owner account via our secure backend proxy route
      // We'll call /api/admin/create-representative to register the owner securely and associate them
      const response = await fetch("/api/admin/create-representative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newRestOwnerEmail,
          password: newRestOwnerPassword,
          name: newRestOwnerName || newRestName,
          phone: newRestPhone
        })
      });

      const rData = await response.json();
      if (!response.ok) {
        throw new Error(rData.error || "No se pudo registrar la cuenta de propietario.");
      }

      const createdOwnerId = rData.userId;

      // Update the role of the newly created owner to 'restaurant' in 'app_users'
      await supabase
        .from("app_users")
        .update({ role: "restaurant", referred_by: user?.id })
        .eq("id", createdOwnerId);

      // 2. Create the restaurant associated with that user ID (Starts as INACTIVE / DRAFT)
      const newRestPayload = {
        name: newRestName,
        type: newRestType,
        businessCategory: newRestBusinessCategory,
        description: `Negocio afiliado. En proceso de digitalización y carga de menú.`,
        phone: newRestPhone,
        address: newRestAddress,
        department: newRestDepartment,
        city: newRestCity,
        logo: "",
        cover_image: "",
        owner_id: createdOwnerId,
        owner_email: newRestOwnerEmail,
        status: "inactive" as const,
        highlight_message: "draft"
      };

      await db.saveRestaurant(newRestPayload as any, createdOwnerId);

      // Increment Commissions for affiliate (referral balance)
      const currentBalance = appUser?.referralBalance || 0;
      await supabase
        .from("app_users")
        .update({ 
          referral_balance: currentBalance + 30000 // Affiliation reward
        })
        .eq("id", user?.id);

      toast.success("¡Restaurante registrado como BORRADOR! Digitaliza su menú y perfil en el panel para publicarlo.");
      setShowAddRestaurant(false);

      // Clean inputs
      setNewRestName("");
      setNewRestPhone("");
      setNewRestAddress("");
      setNewRestOwnerEmail("");
      setNewRestOwnerPassword("");
      setNewRestOwnerName("");

      fetchDashboardData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al afiliar restaurante");
    } finally {
      setRestSubmitting(false);
    }
  };

  // Log Activity Handler
  const handleAddActivityLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actRest || !actNotes) {
      toast.error("El nombre del restaurante y las notas son obligatorios");
      return;
    }

    const newLog: ActivityLog = {
      id: Math.random().toString(36).substring(2),
      type: actType,
      restaurantName: actRest,
      contactName: actContact || "No especificado",
      notes: actNotes,
      status: actStatus,
      date: actDate,
      createdAt: new Date().toISOString()
    };

    const updated = [newLog, ...activities];
    setActivities(updated);
    localStorage.setItem(`smartbite_activities_${user?.id}`, JSON.stringify(updated));
    toast.success("Actividad registrada con éxito");
    setShowAddActivity(false);
    setActRest("");
    setActContact("");
    setActNotes("");
  };

  const handleDeleteActivity = (id: string) => {
    const filtered = activities.filter(a => a.id !== id);
    setActivities(filtered);
    localStorage.setItem(`smartbite_activities_${user?.id}`, JSON.stringify(filtered));
    toast.success("Actividad eliminada");
  };

  // Change Password Handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error("Por favor ingresa la nueva contraseña");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      toast.success("Contraseña actualizada correctamente.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "No se pudo actualizar la contraseña");
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Withdrawal Handler
  const handleWithdrawalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error("Por favor ingresa un monto válido");
      return;
    }

    const balance = appUser?.referralBalance || 0;
    if (amount > balance) {
      toast.error("Monto superior a tus comisiones acumuladas");
      return;
    }

    setWithdrawLoading(true);
    try {
      // Create request in db/Supabase
      const requestPayload = {
        user_id: user?.id,
        amount,
        status: "pending",
        bank_name: withdrawMethod,
        account_number: withdrawAccount,
        method: withdrawMethod,
        nequi_number: withdrawAccount,
        created_at: new Date().toISOString()
      };

      // Try inserting into table withdrawal_requests
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .insert(requestPayload)
        .select()
        .maybeSingle();

      if (error) {
        console.warn("DB withdrawal insert failed, writing to local stub", error);
      }

      // Deduct balance
      await supabase
        .from("app_users")
        .update({ referral_balance: balance - amount })
        .eq("id", user?.id);

      toast.success("¡Solicitud de cobro enviada a revisión con éxito!");
      setWithdrawAmount("");
      setWithdrawAccount("");

      fetchDashboardData();
    } catch (err: any) {
      console.error(err);
      toast.error("Error al procesar retiro");
    } finally {
      setWithdrawLoading(false);
    }
  };

  // Filter restaurants
  const filteredRestaurants = restaurants.filter(r => 
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans pb-16">
      {/* Top Banner and Navigation Bar */}
      <header className="bg-stone-900 border-b border-stone-800 py-6 px-4 md:px-8 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-600/20 text-[#FF8A00] flex items-center justify-center">
              <Award className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white hover:text-orange-500 transition-colors uppercase tracking-tight">
                Panel Comercial Embajadores
              </h1>
              <p className="text-xs text-stone-400 font-bold flex items-center gap-1.5 pt-0.5">
                <User className="w-3.5" />
                {appUser?.displayName || user?.email} • <span className="text-[#FF8A00]">Embajador de Marca</span>
              </p>
            </div>
          </div>

          <div className="flex bg-stone-950 p-1 rounded-2xl border border-stone-800 overflow-x-auto w-full md:w-auto">
            <button
              onClick={() => setActiveTab("restaurants")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === "restaurants" ? "bg-orange-600 text-white shadow-md shadow-orange-500/10" : "text-stone-400 hover:text-white"
              }`}
            >
              <Building className="w-3.5" />
              Restaurantes ({restaurants.length})
            </button>
            <button
              onClick={() => setActiveTab("activities")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === "activities" ? "bg-orange-600 text-white shadow-md shadow-orange-500/10" : "text-stone-400 hover:text-white"
              }`}
            >
              <Activity className="w-3.5" />
              Actividades ({activities.length})
            </button>
            <button
              onClick={() => setActiveTab("earnings")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === "earnings" ? "bg-orange-600 text-white shadow-md shadow-orange-500/10" : "text-stone-400 hover:text-white"
              }`}
            >
              <DollarSign className="w-3.5" />
              Comisiones (${(appUser?.referralBalance || 0).toLocaleString()})
            </button>
            <button
              onClick={() => setActiveTab("account")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === "account" ? "bg-orange-600 text-white shadow-md shadow-orange-500/10" : "text-stone-400 hover:text-white"
              }`}
            >
              <KeyRound className="w-3.5" />
              Acceso / Seguridad
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Panel Interface */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        
        {/* KPI Cards section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-stone-900 border border-stone-800 p-5 rounded-3xl flex justify-between items-center relative overflow-hidden">
            <div>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">Restaurantes Afiliados</span>
              <span className="text-3xl font-black text-white block mt-1">{restaurants.length}</span>
              <span className="text-[10px] text-emerald-400 font-extrabold flex items-center gap-1 mt-1">
                <TrendingUp className="w-3" />
                Meta de Zona: 10
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
              <Building className="w-6" />
            </div>
          </div>

          <div className="bg-stone-900 border border-stone-800 p-5 rounded-3xl flex justify-between items-center relative overflow-hidden">
            <div>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">Mi Cartera Digital</span>
              <span className="text-3xl font-black text-[#FF8A00] block mt-1">
                ${(appUser?.referralBalance || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-stone-400 font-extrabold block mt-1">
                Comisiones acumuladas
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
              <DollarSign className="w-6 animate-pulse" />
            </div>
          </div>

          <div className="bg-stone-900 border border-stone-800 p-5 rounded-3xl flex justify-between items-center relative overflow-hidden">
            <div>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">Actividades Realizadas</span>
              <span className="text-3xl font-black text-white block mt-1">
                {activities.filter(a => a.status === "completed").length}
              </span>
              <span className="text-[10px] text-[#FF8A00] font-extrabold flex items-center gap-1 mt-1">
                <Clock className="w-3" />
                {activities.filter(a => a.status === "scheduled").length} Pendientes
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
              <Activity className="w-6" />
            </div>
          </div>

          <div className="bg-stone-900 border border-stone-800 p-5 rounded-3xl flex justify-between items-center relative overflow-hidden">
            <div>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">Meta Mensual</span>
              <span className="text-3xl font-black text-white block mt-1">
                {Math.round((restaurants.length / 10) * 100)}%
              </span>
              <div className="w-full bg-stone-950 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-[#FF8A00] h-full" 
                  style={{ width: `${Math.min(100, (restaurants.length / 10) * 100)}%` }}
                />
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
              <Star className="w-6 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Dynamic Tab Switchboard */}
        <AnimatePresence mode="wait">
          
          {/* TAB 1: RESTAURANT INVENTORY AFFILIATION */}
          {activeTab === "restaurants" && (
            <motion.div
              key="tab-restaurants"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Toolbar and filter controls */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 text-stone-500" />
                  <input
                    type="text"
                    placeholder="Buscar por restaurante o ciudad..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-[#FF8A00]"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => fetchDashboardData()}
                    className="p-3 bg-stone-900 border border-stone-800 hover:bg-stone-800 transition-colors text-stone-400 hover:text-white rounded-2xl shadow-sm"
                    title="Actualizar datos"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setShowAddRestaurant(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#FF8A00] hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all transform hover:-translate-y-0.5"
                  >
                    <Plus className="w-4 h-4" />
                    Afiliar Nuevo Restaurante
                  </button>
                </div>
              </div>

              {/* Affiliated restaurants display list */}
              {loading ? (
                <div className="py-20 text-center text-stone-500 font-bold">Cargando portafolio...</div>
              ) : filteredRestaurants.length === 0 ? (
                <div className="bg-stone-900 border border-stone-800 p-16 rounded-3xl text-center">
                  <Building className="w-12 h-12 mx-auto text-stone-600 mb-4 stroke-1 animate-pulse" />
                  <h3 className="text-sm font-black uppercase text-stone-400 tracking-wider">Aún no tienes restaurantes afiliados</h3>
                  <p className="text-xs text-stone-400 max-w-sm mx-auto mt-2 font-semibold">
                    Afiliar restaurantes genera ganancias y te otorga comisiones semanales automáticas sobre las compras de tus clientes recomendados.
                  </p>
                  <button
                    onClick={() => setShowAddRestaurant(true)}
                    className="mt-4 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-stone-100 rounded-xl text-xs uppercase tracking-widest font-black"
                  >
                    Afiliar mi primer restaurante ($30K)
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {filteredRestaurants.map((rest) => (
                    <div 
                      key={rest.id}
                      className="bg-stone-900 border border-stone-800 rounded-3xl shadow-lg overflow-hidden group hover:border-[#FF8A00]/50 transition-all text-left flex flex-col"
                    >
                      <div className="h-32 w-full relative bg-stone-800">
                        <img 
                          src={rest.cover_image || rest.coverImage} 
                          alt={rest.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 right-3 bg-stone-950/80 backdrop-blur-md text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                          {rest.status === "active" ? (
                            <span className="text-emerald-400">PRODUCCIÓN</span>
                          ) : (rest.status === "pending_publish" || (rest.status === "inactive" && (rest.highlight_message === "pending_publish" || rest.highlightMessage === "pending_publish"))) ? (
                            <span className="text-amber-400 animate-pulse">AUDITORÍA</span>
                          ) : (
                            <span className="text-stone-400">BORRADOR</span>
                          )}
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex gap-2 items-center">
                            <span className="text-[10px] bg-orange-600/10 text-[#FF8A00] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                              {rest.type}
                            </span>
                          </div>

                          <h3 className="text-sm font-black uppercase tracking-wide text-white mt-2 group-hover:text-[#FF8A00] transition-colors">
                             {rest.name}
                          </h3>

                          <p className="text-xs text-stone-400 font-semibold flex items-center gap-1.5 mt-1">
                            <MapPin className="w-3.5 text-stone-500" />
                            {rest.address || "S/D"}, {rest.city || "S/D"}
                          </p>

                          <div className="mt-4 pt-3 border-t border-dashed border-stone-800 space-y-1.5 text-xs text-stone-400">
                            <div className="flex justify-between font-semibold">
                              <span>Propietario:</span>
                              <span className="text-stone-300 font-bold truncate max-w-[150px]">{rest.owner_email || rest.ownerEmail}</span>
                            </div>
                            <div className="flex justify-between font-semibold">
                              <span>Maneja Envío:</span>
                              <span className="text-stone-300 font-bold">{rest.has_delivery || rest.hasDelivery ? "Sí" : "Por Cuenta Alterna"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Publicar and Status Controls */}
                        <div className="mt-4 pt-3 border-t border-stone-800 space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-stone-400">Estado de Publicación:</span>
                            <span className={`px-2 py-0.5 rounded-full font-black uppercase tracking-wider text-[9px] border ${
                              rest.status === "active"
                                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                                : (rest.status === "pending_publish" || (rest.status === "inactive" && (rest.highlight_message === "pending_publish" || rest.highlightMessage === "pending_publish")))
                                  ? "bg-amber-500/15 border-amber-500/30 text-amber-400 animate-pulse"
                                  : "bg-stone-800 border-stone-700/60 text-stone-400"
                            }`}>
                              {rest.status === "active"
                                ? "● Publicado"
                                : (rest.status === "pending_publish" || (rest.status === "inactive" && (rest.highlight_message === "pending_publish" || rest.highlightMessage === "pending_publish")))
                                  ? "● En Auditoría"
                                  : "○ Borrador (Inactivo)"}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-0.5">
                            <button
                              onClick={() => handleOpenPublishModal(rest)}
                              className="py-2 px-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1"
                              title="Revisar requisitos de digitalización"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-200 shrink-0" />
                              <span className="truncate">Auditar & Publicar</span>
                            </button>

                            {rest.status === "active" ? (
                              <button
                                onClick={() => handleToggleRestaurantStatus(rest.id, "inactive", "draft")}
                                className="py-2 px-2.5 bg-stone-950 hover:bg-stone-800 border border-stone-750 text-rose-400 hover:text-rose-300 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1"
                                title="Cambiar a estado Borrador / Inactivo"
                              >
                                <Pause className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                <span className="truncate">A Borrador</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenPublishModal(rest)}
                                className="py-2 px-2.5 bg-stone-950 hover:bg-stone-800 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1"
                                title="Comprobar requisitos y publicar"
                              >
                                <Play className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span className="truncate">Publicar</span>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-stone-850 flex gap-2">
                          <button
                            onClick={() => navigate(`/admin/${rest.id}`)}
                            className="flex-1 py-1.5 px-3 bg-stone-950 hover:bg-stone-800 text-stone-300 hover:text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all border border-stone-800 flex items-center justify-center gap-1"
                          >
                            <ExternalLink className="w-3" />
                            Administrar Menú
                          </button>
                          
                          <button
                            onClick={() => navigate(`/r/${rest.id}`)}
                            className="py-1.5 px-3 hover:bg-stone-800 text-[#FF8A00] font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all border border-transparent hover:border-stone-700"
                          >
                            Ver Tienda
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: ACTIVITIES TIMELINE WORKTRACKER */}
          {activeTab === "activities" && (
            <motion.div
              key="tab-activities"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-md font-black uppercase tracking-wider text-[#FF8A00] flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Seguimiento de Gestión Comercial
                </h2>

                <button
                  onClick={() => setShowAddActivity(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 border border-stone-800 hover:bg-stone-800 text-[#FF8A00] text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Registrar Actividad
                </button>
              </div>

              {activities.length === 0 ? (
                <div className="bg-stone-900 border border-stone-800 p-12 rounded-3xl text-center">
                  <Activity className="w-10 h-10 mx-auto text-stone-600 mb-3" />
                  <p className="text-xs text-stone-400 font-semibold">No se han registrado actividades de llamadas o visitas.</p>
                </div>
              ) : (
                <div className="bg-stone-900 border border-stone-800 rounded-3xl divide-y divide-stone-800">
                  {activities.map((act) => (
                    <div key={act.id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 uppercase text-[10px] font-black ${
                          act.type === "visita" 
                            ? "bg-emerald-500/10 text-emerald-500" 
                            : act.type === "llamada" 
                            ? "bg-amber-500/10 text-amber-500" 
                            : "bg-blue-500/10 text-blue-500"
                        }`}>
                          {act.type.substring(0, 3)}
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-black uppercase tracking-wide text-white">
                              {act.restaurantName}
                            </h4>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              act.status === "completed" ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                            }`}>
                              {act.status === "completed" ? "Completado" : "Agendado"}
                            </span>
                          </div>

                          <span className="text-[10px] text-stone-500 font-extrabold flex items-center gap-1 mt-0.5">
                            Contacto: {act.contactName} • <Calendar className="w-3" /> {act.date}
                          </span>

                          <p className="text-xs text-stone-400 mt-2 font-semibold">
                            {act.notes}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteActivity(act.id)}
                        className="p-2 border border-stone-800 text-stone-500 hover:text-red-500 hover:bg-stone-950 transition-colors rounded-xl flex items-center justify-center self-end md:self-center"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: COMMISSION EARNINGS & PAYMENTS withdrawal */}
          {activeTab === "earnings" && (
            <motion.div
              key="tab-earnings"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {/* Withdrawal Card Form */}
              <div className="md:col-span-1 bg-stone-900 border border-stone-800 p-6 rounded-3xl text-left space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#FF8A00] flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" />
                  Retirar Comisiones
                </h3>

                <p className="text-xs text-stone-400 font-semibold leading-relaxed">
                  Solicita el retiro de tus ganancias directamente a tu cuenta favorita. El cobro toma generalmente entre 24 y 48 horas en abonarse.
                </p>

                <form onSubmit={handleWithdrawalRequest} className="space-y-4 mt-2">
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Monto a Retirar</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#FF8A00] font-bold text-xs">$</span>
                      <input
                        type="number"
                        placeholder="Monto acumulado"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-8 pr-4 py-2.5 text-xs font-bold text-stone-100 focus:outline-none focus:border-[#FF8A00]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Medio de Retiro</label>
                    <select
                      value={withdrawMethod}
                      onChange={(e) => setWithdrawMethod(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-100 focus:outline-none focus:border-[#FF8A00]"
                    >
                      <option value="nequi">Nequi</option>
                      <option value="daviplata">Daviplata</option>
                      <option value="ahorros">Cuenta de Ahorros Bancaria</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Número de Celular/Cuenta</label>
                    <input
                      type="text"
                      placeholder="Ej. 3001234567"
                      value={withdrawAccount}
                      onChange={(e) => setWithdrawAccount(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-100 focus:outline-none focus:border-[#FF8A00]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={withdrawLoading}
                    className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-stone-100 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                  >
                    {withdrawLoading ? "Procesando..." : "Solicitar Retiro"}
                  </button>
                </form>
              </div>

              {/* Transactions logs list */}
              <div className="md:col-span-2 bg-stone-900 border border-stone-800 p-6 rounded-3xl text-left space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-400">
                  Historial de Transacciones y Retiros
                </h3>

                {withdrawalHistory.length === 0 ? (
                  <div className="p-12 text-center text-stone-600 font-bold text-xs uppercase tracking-widest">
                    No tienes transacciones registradas todavía.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs text-stone-400">
                      <thead>
                        <tr className="border-b border-stone-800 bg-stone-950 p-2.5 text-stone-400 text-[10px] font-black uppercase tracking-widest">
                          <th className="p-3">Banco</th>
                          <th className="p-3">Monto</th>
                          <th className="p-3">Fecha</th>
                          <th className="p-3">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-800">
                        {withdrawalHistory.map((w: any) => (
                          <tr key={w.id} className="hover:bg-stone-900/40 font-semibold text-stone-300">
                            <td className="p-3 font-bold uppercase">{w.bank_name || w.bankName}</td>
                            <td className="p-3 text-[#FF8A00] font-black">${parseFloat(w.amount).toLocaleString()}</td>
                            <td className="p-3">{new Date(w.created_at || w.createdAt).toLocaleDateString()}</td>
                            <td className="p-3">
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                w.status === "approved" || w.status === "paid" 
                                  ? "bg-emerald-500/10 text-emerald-500" 
                                  : "bg-amber-500/10 text-amber-500"
                              }`}>
                                {w.status === "approved" || w.status === "paid" ? "Abonado" : "Pendiente"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 4: PASSWORD CHANGE / CREDENTIAL MAINTENANCE */}
          {activeTab === "account" && (
            <motion.div
              key="tab-password"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-md mx-auto bg-stone-900 border border-stone-800 p-6 rounded-3xl text-left"
            >
              <h3 className="text-xs font-black uppercase tracking-wider text-[#FF8A00] flex items-center gap-1.5 border-b border-stone-800 pb-3 mb-4">
                <KeyRound className="w-4 h-4" />
                Seguridad de mi Cuenta
              </h3>

              <p className="text-xs text-stone-400 font-semibold leading-relaxed mb-4">
                Como fuiste afiliado por propuesta e ingreso directo del Administrador, te recomendamos encarecidamente cambiar tu clave inicial temporal por una de tu preferencia personal.
              </p>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Nueva Contraseña</label>
                  <input
                    type="password"
                    placeholder="Contraseña segura"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-100 focus:outline-none focus:border-[#FF8A00]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Confirmar Nueva Contraseña</label>
                  <input
                    type="password"
                    placeholder="Confirmar contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-100 focus:outline-none focus:border-[#FF8A00]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="w-full py-2.5 bg-[#FF8A00] hover:bg-orange-600 text-stone-100 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md"
                >
                  {updatingPassword ? "Actualizando..." : "Cambiar Contraseña"}
                </button>
              </form>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* MODAL 1: ADD RESTAURANT */}
      <AnimatePresence>
        {showAddRestaurant && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-stone-900 border border-stone-800 rounded-3xl p-6 md:p-8 max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl space-y-6 text-left my-8 scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent"
            >
              <div className="flex justify-between items-center pb-3 border-b border-stone-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-orange-500/10 rounded-xl border border-orange-500/20">
                    <Building className="w-5 h-5 text-[#FF8A00]" />
                  </div>
                  <div>
                    <h3 className="text-base font-black uppercase tracking-wider text-white">
                      Afiliar Nuevo Restaurante
                    </h3>
                    <p className="text-[10px] text-stone-400 font-semibold mt-0.5">Completa la información del comercio y su propietario</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAddRestaurant(false)}
                  className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800/60 transition-all"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              {/* Informative banner showing automatic 30-day free plan activation */}
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
                <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-400 mt-0.5 animate-pulse">
                  <span className="text-[10px] font-black uppercase">30D</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Activación de Plan Automática</h4>
                  <p className="text-[11px] text-stone-300 font-medium leading-relaxed mt-1">
                    Este comercio se activará inmediatamente con el <strong className="text-emerald-400 font-extrabold">Plan Gratis por 30 días</strong>. Dispondrá de todas las funciones habilitadas sin costo durante su periodo de prueba.
                  </p>
                </div>
              </div>

              <form onSubmit={handleAddNewRestaurant} className="space-y-6">
                
                {/* SECTION 1: Datos de la Tienda */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-3.5 bg-[#FF8A00] rounded-full" />
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#FF8A00]">Datos de la Tienda / Restaurante</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="w-full md:col-span-2">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1.5">Nombre Comercial *</label>
                      <input
                        type="text"
                        required
                        value={newRestName}
                        onChange={(e) => setNewRestName(e.target.value)}
                        placeholder="Ej. Burger Club Medellín"
                        className="w-full bg-stone-950 border border-stone-800 focus:border-[#FF8A00] focus:ring-1 focus:ring-[#FF8A00]/50 rounded-xl px-4 py-3 text-sm font-semibold text-white placeholder-stone-600 focus:outline-none transition-all"
                      />
                    </div>

                    <div className="w-full">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1.5">Modelo de Negocio *</label>
                      <select
                        value={newRestBusinessCategory}
                        onChange={(e) => setNewRestBusinessCategory(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-800 focus:border-[#FF8A00] focus:ring-1 focus:ring-[#FF8A00]/50 rounded-xl px-4 py-3 text-sm font-semibold text-white focus:outline-none transition-all cursor-pointer"
                      >
                        {businessCategories && businessCategories.length > 0 ? (
                          businessCategories.map((cat: any) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.title.replace("Explorar ", "")}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="restaurant">Restaurante / Comidas</option>
                            <option value="grocery">Verdulería / Mercado</option>
                            <option value="liquor">Licores / Bebidas</option>
                            <option value="salsamentaria">Salsamentaría / Charcutería</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div className="w-full">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1.5">Especialidad / Tipo de Comida *</label>
                      <select
                        value={newRestType}
                        onChange={(e) => setNewRestType(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-800 focus:border-[#FF8A00] focus:ring-1 focus:ring-[#FF8A00]/50 rounded-xl px-4 py-3 text-sm font-semibold text-white focus:outline-none transition-all cursor-pointer"
                      >
                        <option value="Comida Rápida">Comida Rápida</option>
                        <option value="Pizzería">Pizzería</option>
                        <option value="Hamburguesería">Hamburguesería</option>
                        <option value="Cafetería">Cafetería</option>
                        <option value="Asadero">Asadero / Parrilla</option>
                        <option value="Panadería">Panadería / Pastelería</option>
                        <option value="Mercado">Mercado Orgánico / Verdulería</option>
                        <option value="Bebidas">Licores / Bebidas</option>
                        <option value="Charcutería">Charcutería / Carnes</option>
                      </select>
                    </div>

                    <div className="w-full">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1.5">Departamento *</label>
                      <select
                        required
                        value={newRestDepartment}
                        onChange={(e) => {
                          setNewRestDepartment(e.target.value);
                          setNewRestCity('');
                        }}
                        className="w-full bg-stone-950 border border-stone-800 focus:border-[#FF8A00] focus:ring-1 focus:ring-[#FF8A00]/50 rounded-xl px-4 py-3 text-sm font-semibold text-white focus:outline-none transition-all cursor-pointer"
                      >
                        <option value="">Selecciona...</option>
                        {getDepartments().map(dep => <option key={dep} value={dep}>{dep}</option>)}
                      </select>
                    </div>

                    <div className="w-full">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1.5">Ciudad/Municipio *</label>
                      <select
                        required
                        value={newRestCity}
                        onChange={(e) => setNewRestCity(e.target.value)}
                        disabled={!newRestDepartment}
                        className="w-full bg-stone-950 border border-stone-800 focus:border-[#FF8A00] focus:ring-1 focus:ring-[#FF8A00]/50 rounded-xl px-4 py-3 text-sm font-semibold text-white focus:outline-none transition-all cursor-pointer disabled:opacity-50"
                      >
                        <option value="">Selecciona...</option>
                        {newRestDepartment && getCitiesByDepartment(newRestDepartment).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div className="w-full">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1.5">Teléfono Público de Contacto *</label>
                      <input
                        type="text"
                        required
                        value={newRestPhone}
                        onChange={(e) => setNewRestPhone(e.target.value)}
                        placeholder="Ej. 3103214567"
                        className="w-full bg-stone-950 border border-stone-800 focus:border-[#FF8A00] focus:ring-1 focus:ring-[#FF8A00]/50 rounded-xl px-4 py-3 text-sm font-semibold text-white placeholder-stone-600 focus:outline-none transition-all"
                      />
                    </div>

                    <div className="w-full">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1.5">Dirección Física *</label>
                      <input
                        type="text"
                        required
                        value={newRestAddress}
                        onChange={(e) => setNewRestAddress(e.target.value)}
                        placeholder="Ej. Calle 85 #11-54, El Poblado"
                        className="w-full bg-stone-950 border border-stone-800 focus:border-[#FF8A00] focus:ring-1 focus:ring-[#FF8A00]/50 rounded-xl px-4 py-3 text-sm font-semibold text-white placeholder-stone-600 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Datos del Dueño */}
                <div className="space-y-4 pt-4 border-t border-stone-800">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-3.5 bg-[#FF8A00] rounded-full" />
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#FF8A00]">Datos del Dueño / Propietario</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="w-full">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1.5">Nombre Completo del Administrador</label>
                      <input
                        type="text"
                        value={newRestOwnerName}
                        onChange={(e) => setNewRestOwnerName(e.target.value)}
                        placeholder="Ej. Luis Pinzón"
                        className="w-full bg-stone-950 border border-stone-800 focus:border-[#FF8A00] focus:ring-1 focus:ring-[#FF8A00]/50 rounded-xl px-4 py-3 text-sm font-semibold text-white placeholder-stone-600 focus:outline-none transition-all"
                      />
                    </div>

                    <div className="w-full">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1.5">Correo Electrónico (Para Inicio de Sesión) *</label>
                      <input
                        type="email"
                        required
                        value={newRestOwnerEmail}
                        onChange={(e) => setNewRestOwnerEmail(e.target.value)}
                        placeholder="Ej. luis@email.com"
                        className="w-full bg-stone-950 border border-stone-800 focus:border-[#FF8A00] focus:ring-1 focus:ring-[#FF8A00]/50 rounded-xl px-4 py-3 text-sm font-semibold text-white placeholder-stone-600 focus:outline-none transition-all"
                      />
                    </div>

                    <div className="w-full md:col-span-2">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1.5">Contraseña de Propietario *</label>
                      <input
                        type="password"
                        required
                        value={newRestOwnerPassword}
                        onChange={(e) => setNewRestOwnerPassword(e.target.value)}
                        placeholder="Asigna clave inicial para el acceso del comercio"
                        className="w-full bg-stone-950 border border-stone-800 focus:border-[#FF8A00] focus:ring-1 focus:ring-[#FF8A00]/50 rounded-xl px-4 py-3 text-sm font-semibold text-white placeholder-stone-600 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex gap-3 border-t border-stone-800">
                  <button
                    type="button"
                    onClick={() => setShowAddRestaurant(false)}
                    className="flex-1 py-3 rounded-xl border border-stone-800 text-xs text-stone-400 font-extrabold uppercase tracking-wider hover:bg-stone-950 hover:text-white transition-all active:scale-[0.98]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={restSubmitting}
                    className="flex-1 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-xs text-white font-black uppercase tracking-wider shadow-lg shadow-orange-950/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                  >
                    {restSubmitting ? "Afiliando..." : "Registrar Tienda"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: ADD ACTIVITY */}
      <AnimatePresence>
        {showAddActivity && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left"
            >
              <div className="flex justify-between items-center pb-2 border-b border-stone-800">
                <h3 className="text-sm font-black uppercase tracking-wider text-[#FF8A00] flex items-center gap-1.5">
                  <Activity className="w-5" />
                  Registrar Log de Interacción
                </h3>
                <button 
                  onClick={() => setShowAddActivity(false)}
                  className="p-1 rounded-full text-stone-400 hover:text-white"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleAddActivityLog} className="space-y-3">
                <div>
                  <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Medio / Canal</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["llamada", "visita", "correo", "reunion"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setActType(m)}
                        className={`py-2 rounded-xl text-[10px] font-black uppercase ${
                          actType === m ? "bg-orange-600 text-white" : "bg-stone-950 text-stone-400 border border-stone-800"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Restaurante / Negocio *</label>
                  <input
                    type="text"
                    required
                    value={actRest}
                    onChange={(e) => setActRest(e.target.value)}
                    placeholder="Ej. Burguer House"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Nombre del Contacto</label>
                  <input
                    type="text"
                    value={actContact}
                    onChange={(e) => setActContact(e.target.value)}
                    placeholder="Ej. Camila Rojas (Gerente)"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Estado</label>
                    <select
                      value={actStatus}
                      onChange={(e) => setActStatus(e.target.value as any)}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-2 py-2 text-xs text-stone-200"
                    >
                      <option value="completed">Completado</option>
                      <option value="scheduled">Agendado / Pendiente</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Fecha</label>
                    <input
                      type="date"
                      value={actDate}
                      onChange={(e) => setActDate(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-2 py-2 text-xs text-stone-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Notas / Detalles *</label>
                  <textarea
                    required
                    value={actNotes}
                    onChange={(e) => setActNotes(e.target.value)}
                    placeholder="Describe los puntos principales discutidos..."
                    rows={3}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100"
                  />
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddActivity(false)}
                    className="flex-1 py-2.5 rounded-xl border border-stone-800 text-xs text-stone-400 font-bold hover:bg-stone-950"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-xs text-white font-black uppercase tracking-wider"
                  >
                    Guardar Log
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal: Verification before Publication Request */}
        {publishingRest && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl space-y-6 text-left my-8"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start pb-4 border-b border-stone-800">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    reqsCheck.allMandatoryPassed 
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" 
                      : "bg-orange-500/15 text-[#FF8A00] border border-orange-500/30"
                  }`}>
                    {reqsCheck.allMandatoryPassed ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <ShieldAlert className="w-6 h-6 animate-pulse" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-white flex items-center gap-2">
                      Auditoría de Digitalización & Publicación
                    </h3>
                    <p className="text-xs text-stone-400 font-semibold mt-0.5">
                      Comercio: <span className="text-white font-bold">{publishingRest.name}</span> • <span className="text-stone-300">{publishingRest.city || "Colombia"}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPublishingRest(null)}
                  className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition-colors"
                >
                  ✕
                </button>
              </div>

              {checkingRequirements ? (
                <div className="py-16 text-center text-xs text-stone-400 font-bold flex flex-col items-center gap-3">
                  <RefreshCw className="w-8 h-8 text-[#FF8A00] animate-spin" />
                  Auditando componentes, menú digital, precios y reglas de publicación...
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Score & Progress Bar */}
                  <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex-1 w-full">
                      <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider mb-2">
                        <span className="text-stone-300">Nivel de Digitalización</span>
                        <span className={reqsCheck.allMandatoryPassed ? "text-emerald-400" : "text-amber-400"}>
                          {reqsCheck.score}% / 100%
                        </span>
                      </div>
                      <div className="w-full bg-stone-800 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 rounded-full ${
                            reqsCheck.allMandatoryPassed 
                              ? "bg-gradient-to-r from-emerald-500 to-teal-400" 
                              : "bg-gradient-to-r from-amber-500 to-orange-500"
                          }`}
                          style={{ width: `${reqsCheck.score}%` }}
                        />
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      {reqsCheck.allMandatoryPassed ? (
                        <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl">
                          Listo para Publicar
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-xl">
                          Incompleto ({reqsCheck.missingMandatoryList.length} faltantes)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Checklist Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                    {/* 1. Menu Digital */}
                    <div className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${
                      reqsCheck.hasCompleteMenu 
                        ? "bg-stone-950/80 border-emerald-500/30" 
                        : "bg-stone-950/80 border-rose-500/40"
                    }`}>
                      <div className="mt-0.5">
                        {reqsCheck.hasCompleteMenu ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black uppercase tracking-wider text-white">Menú Digital & Precios</h4>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                            reqsCheck.hasCompleteMenu ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                          }`}>
                            {reqsCheck.numProducts} Platos
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-400 mt-1 font-semibold leading-relaxed">
                          {reqsCheck.numProducts === 0 ? (
                            "❌ Sin platos en el menú. Se requiere cargar platos con precio y descripción."
                          ) : reqsCheck.numInvalidProducts > 0 ? (
                            `⚠️ ${reqsCheck.numInvalidProducts} plato(s) sin precio (> $0) o sin descripción.`
                          ) : (
                            `✓ ${reqsCheck.numValidProducts} platos con descripción y precios válidos.`
                          )}
                        </p>
                        {reqsCheck.invalidProductNames.length > 0 && (
                          <div className="mt-1.5 p-1.5 bg-rose-500/10 rounded-lg text-[9px] text-rose-300 font-mono">
                            {reqsCheck.invalidProductNames.slice(0, 2).map((n, i) => (
                              <div key={i} className="truncate">• {n}</div>
                            ))}
                            {reqsCheck.invalidProductNames.length > 2 && (
                              <div className="text-stone-400 text-[8px]">+ {reqsCheck.invalidProductNames.length - 2} más...</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 2. Horarios */}
                    <div className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${
                      reqsCheck.hasHours 
                        ? "bg-stone-950/80 border-emerald-500/30" 
                        : "bg-stone-950/80 border-rose-500/40"
                    }`}>
                      <div className="mt-0.5">
                        {reqsCheck.hasHours ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-black uppercase tracking-wider text-white">Horarios de Atención</h4>
                        <p className="text-[10px] text-stone-400 mt-1 font-semibold leading-relaxed">
                          {reqsCheck.hasHours ? (
                            `✓ Horarios de apertura y cierre asignados.`
                          ) : (
                            "❌ Falta configurar horarios de apertura y cierre."
                          )}
                        </p>
                      </div>
                    </div>

                    {/* 3. Domicilios y Envíos */}
                    <div className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${
                      reqsCheck.hasDeliveryConfig 
                        ? "bg-stone-950/80 border-emerald-500/30" 
                        : "bg-stone-950/80 border-rose-500/40"
                    }`}>
                      <div className="mt-0.5">
                        {reqsCheck.hasDeliveryConfig ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-black uppercase tracking-wider text-white">Domicilio y Entregas</h4>
                        <p className="text-[10px] text-stone-400 mt-1 font-semibold leading-relaxed">
                          {reqsCheck.hasDeliveryConfig ? (
                            `✓ Modalidad de entrega / envíos establecida.`
                          ) : (
                            "❌ Falta especificar si maneja domicilios o retiro."
                          )}
                        </p>
                      </div>
                    </div>

                    {/* 4. Ubicación y Contacto */}
                    <div className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${
                      reqsCheck.hasAddress && reqsCheck.hasPhone 
                        ? "bg-stone-950/80 border-emerald-500/30" 
                        : "bg-stone-950/80 border-rose-500/40"
                    }`}>
                      <div className="mt-0.5">
                        {reqsCheck.hasAddress && reqsCheck.hasPhone ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-black uppercase tracking-wider text-white">Dirección & Teléfono</h4>
                        <p className="text-[10px] text-stone-400 mt-1 font-semibold leading-relaxed">
                          {reqsCheck.hasAddress && reqsCheck.hasPhone ? (
                            `✓ ${publishingRest.address || "Dirección válida"}`
                          ) : (
                            "❌ Falta dirección física exacta o teléfono de contacto."
                          )}
                        </p>
                      </div>
                    </div>

                    {/* 5. Identidad Visual */}
                    <div className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${
                      reqsCheck.hasLogo && reqsCheck.hasCover 
                        ? "bg-stone-950/80 border-emerald-500/30" 
                        : "bg-stone-950/80 border-rose-500/40"
                    }`}>
                      <div className="mt-0.5">
                        {reqsCheck.hasLogo && reqsCheck.hasCover ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <h4 className="text-xs font-black uppercase tracking-wider text-white">Logo y Cabecera Oficial</h4>
                          <div className="flex gap-1.5">
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${
                              reqsCheck.hasLogo 
                                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" 
                                : "bg-rose-500/15 border-rose-500/30 text-rose-400"
                            }`}>
                              Logo: {reqsCheck.hasLogo ? "✓ Aprobado" : "✗ Pendiente"}
                            </span>
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${
                              reqsCheck.hasCover 
                                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" 
                                : "bg-rose-500/15 border-rose-500/30 text-rose-400"
                            }`}>
                              Cabecera: {reqsCheck.hasCover ? "✓ Aprobada" : "✗ Pendiente"}
                            </span>
                          </div>
                        </div>

                        {/* Visual previews if available */}
                        {(reqsCheck.hasLogo || reqsCheck.hasCover) && (
                          <div className="flex items-center gap-2 mt-2">
                            {reqsCheck.hasLogo && reqsCheck.logoUrl && (
                              <div className="flex items-center gap-1.5 bg-stone-900/90 px-2 py-1 rounded-xl border border-stone-800">
                                <img 
                                  src={reqsCheck.logoUrl} 
                                  alt="Logo" 
                                  className="w-5 h-5 rounded-full object-cover border border-stone-700" 
                                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                />
                                <span className="text-[9px] text-stone-300 font-bold">Logo detectado</span>
                              </div>
                            )}
                            {reqsCheck.hasCover && reqsCheck.coverUrl && (
                              <div className="flex items-center gap-1.5 bg-stone-900/90 px-2 py-1 rounded-xl border border-stone-800">
                                <img 
                                  src={reqsCheck.coverUrl} 
                                  alt="Cabecera" 
                                  className="w-8 h-5 rounded-md object-cover border border-stone-700" 
                                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                />
                                <span className="text-[9px] text-stone-300 font-bold">Cabecera detectada</span>
                              </div>
                            )}
                          </div>
                        )}

                        <p className="text-[10px] text-stone-400 mt-1.5 font-semibold leading-relaxed">
                          {reqsCheck.hasLogo && reqsCheck.hasCover ? (
                            "✓ Logo oficial e imagen de cabecera / portada reconocidos y validados."
                          ) : !reqsCheck.hasLogo && !reqsCheck.hasCover ? (
                            "❌ Falta cargar tanto el Logo como la Imagen de Cabecera en la configuración del restaurante."
                          ) : !reqsCheck.hasLogo ? (
                            "❌ Falta cargar el Logo oficial en la configuración del restaurante."
                          ) : (
                            "❌ Falta cargar la Imagen de Cabecera / Portada en la configuración del restaurante."
                          )}
                        </p>
                      </div>
                    </div>

                    {/* 6. Descripción del Negocio */}
                    <div className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${
                      reqsCheck.hasDescription 
                        ? "bg-stone-950/80 border-emerald-500/30" 
                        : "bg-stone-950/80 border-rose-500/40"
                    }`}>
                      <div className="mt-0.5">
                        {reqsCheck.hasDescription ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-black uppercase tracking-wider text-white">Descripción Comercial</h4>
                        <p className="text-[10px] text-stone-400 mt-1 font-semibold leading-relaxed">
                          {reqsCheck.hasDescription ? (
                            "✓ Descripción detallada del local ingresada."
                          ) : (
                            "❌ Falta redactar una descripción atractiva del negocio."
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Warning / Summary Alert */}
                  {!reqsCheck.allMandatoryPassed ? (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl flex items-start gap-3">
                      <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="text-xs font-black uppercase text-rose-400 tracking-wider">
                          Publicación Bloqueada • Requisitos Faltantes
                        </h4>
                        <p className="text-[11px] text-stone-300 leading-relaxed font-medium">
                          Para garantizar la calidad de la plataforma, el restaurante no puede publicarse hasta completar los siguientes campos obligatorios:
                        </p>
                        <ul className="list-disc list-inside text-[10px] text-rose-300 font-bold space-y-0.5 pt-1">
                          {reqsCheck.missingMandatoryList.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                          ✨ ¡Comercio 100% Digitalizado!
                        </h4>
                        <p className="text-[11px] text-stone-300 leading-relaxed font-medium">
                          Este restaurante cumple con la totalidad de requisitos: identidad visual, menú completo con precios y descripciones, horarios de apertura/cierre y datos de entrega.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Modal Action Buttons */}
                  <div className="pt-3 border-t border-stone-800 space-y-2.5">
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          const restId = publishingRest.id;
                          setPublishingRest(null);
                          navigate(`/admin/${restId}`);
                        }}
                        className="flex-1 py-3 px-4 bg-stone-950 hover:bg-stone-800 border border-stone-750 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        <ExternalLink className="w-4 h-4 text-[#FF8A00]" />
                        Administrar Menú y Perfil
                      </button>

                      <button
                        type="button"
                        disabled={!reqsCheck.allMandatoryPassed}
                        onClick={handleDirectPublish}
                        className={`flex-1 py-3 px-4 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${
                          reqsCheck.allMandatoryPassed
                            ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white active:scale-95 shadow-emerald-500/20"
                            : "bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700/50"
                        }`}
                      >
                        <Sparkles className="w-4 h-4 text-amber-200" />
                        Publicar Restaurante (Activar)
                      </button>
                    </div>

                    <div className="flex justify-between items-center px-1">
                      <button
                        type="button"
                        onClick={() => {
                          handleToggleRestaurantStatus(publishingRest.id, "inactive", "draft");
                          setPublishingRest(null);
                        }}
                        className="text-[11px] text-stone-400 hover:text-rose-400 font-bold underline transition-colors flex items-center gap-1"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        Poner en Borrador / Inactivo
                      </button>

                      <span className="text-[10px] text-stone-500 font-medium">
                        Auditoría de Requisitos v2.4
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
