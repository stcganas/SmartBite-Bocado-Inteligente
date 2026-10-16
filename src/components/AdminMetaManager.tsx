import React, { useState, useEffect } from "react";
import { Restaurant } from "../store/db";
import { MetaPostCreator } from "./MetaPostCreator";
import {
  Share2,
  Facebook,
  Instagram,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Key,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  Send,
  Building2,
  Layers,
  HelpCircle,
  Sliders,
  BarChart3,
  MousePointerClick,
  Check,
  X,
  Settings,
  Flame,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface AdminMetaManagerProps {
  restaurants: Restaurant[];
  onUpdateRestaurants?: () => void;
}

interface PlatformMetaConfig {
  appId: string;
  hasAppSecret: boolean;
  appSecretMasked: string | null;
  pageId: string;
  pageName: string;
  instagramId: string;
  instagramUsername: string;
  pictureUrl: string | null;
  hasToken: boolean;
  tokenMasked: string | null;
  connected: boolean;
  isSimulated: boolean;
  updatedAt: string | null;
}

interface RestaurantMetaStatus {
  id: string;
  name: string;
  logo?: string;
  city?: string;
  phone?: string;
  connected: boolean;
  pageId: string | null;
  pageName: string | null;
  instagramUsername: string | null;
  isSimulated: boolean;
  hasToken: boolean;
  tokenMasked: string | null;
  updatedAt: string | null;
}

export const AdminMetaManager: React.FC<AdminMetaManagerProps> = ({
  restaurants,
  onUpdateRestaurants,
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"publisher" | "secrets" | "audit">("publisher");

  // Platform Secrets form state
  const [platformConfig, setPlatformConfig] = useState<PlatformMetaConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [appIdInput, setAppIdInput] = useState("");
  const [appSecretInput, setAppSecretInput] = useState("");
  const [pageIdInput, setPageIdInput] = useState("");
  const [pageAccessTokenInput, setPageAccessTokenInput] = useState("");
  const [instagramIdInput, setInstagramIdInput] = useState("");
  const [isTestMode, setIsTestMode] = useState(false);
  const [showSecretText, setShowSecretText] = useState(false);
  const [showTokenText, setShowTokenText] = useState(false);
  const [isSavingSecrets, setIsSavingSecrets] = useState(false);
  const [isVerifyingPlatform, setIsVerifyingPlatform] = useState(false);
  const [showTechnicalGuide, setShowTechnicalGuide] = useState(false);

  // Publisher context: "platform" (SmartBite Global) or specific restaurant ID
  const [selectedContext, setSelectedContext] = useState<"platform" | string>("platform");
  const [restaurantSearch, setRestaurantSearch] = useState("");

  // Audit state
  const [auditList, setAuditList] = useState<RestaurantMetaStatus[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditFilter, setAuditFilter] = useState<"all" | "connected" | "pending" | "simulated">("all");
  const [auditSearch, setAuditSearch] = useState("");

  // Quick modal to configure credentials for a specific restaurant from audit
  const [modalRestaurant, setModalRestaurant] = useState<Restaurant | null>(null);
  const [modalPageId, setModalPageId] = useState("");
  const [modalAccessToken, setModalAccessToken] = useState("");
  const [modalInstagramId, setModalInstagramId] = useState("");
  const [modalIsSaving, setModalIsSaving] = useState(false);

  // Fetch platform configuration
  const fetchPlatformConfig = async () => {
    try {
      setLoadingConfig(true);
      const res = await fetch("/api/platform/meta/config");
      if (res.ok) {
        const data = await res.json();
        setPlatformConfig(data);
        setAppIdInput(data.appId || "");
        setPageIdInput(data.pageId || "");
        setInstagramIdInput(data.instagramId || "");
        setIsTestMode(data.isSimulated || false);
      }
    } catch (e) {
      console.error("Error fetching platform meta config:", e);
    } finally {
      setLoadingConfig(false);
    }
  };

  // Fetch 360 audit status
  const fetchAuditStatus = async () => {
    try {
      setLoadingAudit(true);
      const res = await fetch("/api/platform/meta/restaurants-status");
      if (res.ok) {
        const data = await res.json();
        setAuditList(data.restaurants || []);
      }
    } catch (e) {
      console.error("Error fetching audit status:", e);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    fetchPlatformConfig();
    fetchAuditStatus();
  }, []);

  // Save Platform Secrets (Phase 2)
  const handleSavePlatformSecrets = async () => {
    if (!isTestMode) {
      if (!pageIdInput.trim() && !appIdInput.trim()) {
        toast.error("Ingresa al menos el Meta App ID o el Page ID de la FanPage oficial.");
        return;
      }
    }

    try {
      setIsSavingSecrets(true);
      const res = await fetch("/api/platform/meta/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId: appIdInput.trim(),
          appSecret: appSecretInput.trim() || undefined,
          pageId: pageIdInput.trim(),
          pageAccessToken: pageAccessTokenInput.trim() || (isTestMode ? "simulated_token" : undefined),
          instagramId: instagramIdInput.trim() || undefined,
          isSimulated: isTestMode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudieron guardar los secretos de la plataforma");
      }

      toast.success("¡Secretos de la plataforma guardados exitosamente!", {
        description: data.message || `FanPage oficial: ${data.pageName}`,
      });

      setAppSecretInput("");
      setPageAccessTokenInput("");
      fetchPlatformConfig();
    } catch (err: any) {
      toast.error("Error al guardar secretos: " + err.message);
    } finally {
      setIsSavingSecrets(false);
    }
  };

  // Test Platform Connection
  const handleVerifyPlatform = async () => {
    try {
      setIsVerifyingPlatform(true);
      const res = await fetch("/api/platform/meta/verify", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok || !data.valid) {
        throw new Error(data.error || "No se pudo verificar la conexión con Facebook");
      }

      toast.success("¡Conexión verificada con Facebook Graph API!", {
        description: `FanPage activa: "${data.pageName}" (ID: ${data.pageId})`,
      });
      fetchPlatformConfig();
    } catch (err: any) {
      toast.error("Error de verificación: " + err.message);
    } finally {
      setIsVerifyingPlatform(false);
    }
  };

  // Save restaurant manual credentials from Superadmin modal
  const handleSaveRestaurantFromModal = async () => {
    if (!modalRestaurant) return;
    try {
      setModalIsSaving(true);
      const res = await fetch(`/api/social/accounts/${modalRestaurant.id}/manual-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: modalPageId.trim(),
          pageAccessToken: modalAccessToken.trim(),
          instagramId: modalInstagramId.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al configurar credenciales");
      }

      toast.success(`Credenciales guardadas para ${modalRestaurant.name}`);
      setModalRestaurant(null);
      setModalAccessToken("");
      fetchAuditStatus();
      if (onUpdateRestaurants) onUpdateRestaurants();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setModalIsSaving(false);
    }
  };

  // Virtual restaurant for SmartBite Global
  const smartBiteGlobalRestaurant: Restaurant = {
    id: "platform",
    name: platformConfig?.pageName || "SmartBite Oficial",
    type: "Plataforma Oficial",
    description: "Plataforma oficial SmartBite Delivery & Restaurantes",
    logo: platformConfig?.pictureUrl || "/smartbite-icon.png",
    coverImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200",
    phone: "+57 300 000 0000",
    address: "SmartBite Global HQ",
    city: "Colombia",
    commissionRate: 5,
    rating: 5,
    reviewsCount: 999,
    status: "active",
    openingHours: "24/7",
    menu: [],
  };

  // Determine current active restaurant for publisher
  const currentActiveRestaurant: Restaurant =
    selectedContext === "platform"
      ? smartBiteGlobalRestaurant
      : restaurants.find((r) => r.id === selectedContext) || smartBiteGlobalRestaurant;

  // Filter audit list
  const filteredAudit = auditList.filter((item) => {
    if (auditFilter === "connected" && (!item.connected || item.isSimulated)) return false;
    if (auditFilter === "pending" && item.connected) return false;
    if (auditFilter === "simulated" && !item.isSimulated) return false;
    if (
      auditSearch &&
      !item.name.toLowerCase().includes(auditSearch.toLowerCase()) &&
      !(item.city || "").toLowerCase().includes(auditSearch.toLowerCase()) &&
      !(item.pageName || "").toLowerCase().includes(auditSearch.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const connectedCount = auditList.filter((r) => r.connected && !r.isSimulated).length;
  const simulatedCount = auditList.filter((r) => r.isSimulated).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-6 md:p-8 text-white shadow-2xl border border-white/10">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider text-blue-300 border border-blue-400/30">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            Centro de Control Global · Superadministrador
          </div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight">
            Meta Social Suite: Publicaciones & Secretos
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Administra los <strong>secretos globales de Meta</strong> de la plataforma, publica en las redes oficiales de <strong>SmartBite Global</strong> o publica en nombre de cualquier restaurante de la red con enlaces inteligentes y agente de IA.
          </p>
        </div>

        {/* Floating social symbols */}
        <div className="absolute right-4 -bottom-6 opacity-15 pointer-events-none flex gap-4">
          <Facebook className="w-44 h-44 text-white" />
          <Instagram className="w-44 h-44 text-white" />
        </div>
      </div>

      {/* Metrics & Global Connection Badge Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Platform Meta status */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              SmartBite FanPage
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-gray-900 truncate max-w-[140px]">
                {platformConfig?.pageName || "SmartBite Global"}
              </span>
              {platformConfig?.connected ? (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-amber-100" />
              )}
            </div>
            <p className="text-[11px] text-gray-400">
              {platformConfig?.connected
                ? platformConfig.isSimulated
                  ? "Modo Pruebas Activo"
                  : "Conectado Oficialmente"
                : "Sin configurar"}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
            f
          </div>
        </div>

        {/* Metric 2: Connected Restaurants */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Restaurantes con Meta
            </span>
            <div className="text-2xl font-black text-gray-900">
              {connectedCount} <span className="text-xs font-semibold text-gray-400">/ {auditList.length}</span>
            </div>
            <p className="text-[11px] text-emerald-600 font-medium">
              +{simulatedCount} en modo pruebas
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg border border-emerald-200">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Meta App ID status */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Meta App ID Global
            </span>
            <div className="text-sm font-mono font-bold text-gray-800 truncate max-w-[140px]">
              {platformConfig?.appId ? platformConfig.appId : "No configurado"}
            </div>
            <p className="text-[11px] text-gray-400">
              {platformConfig?.hasAppSecret ? "✓ App Secret guardado" : "⚠️ Falta App Secret"}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg border border-indigo-200">
            <Key className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4: Direct Action to Secrets */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Gestión de Secretos
            </span>
            <div className="text-sm font-bold text-blue-950">
              {platformConfig?.connected ? "Credenciales Activas" : "Configurar Secretos"}
            </div>
            <button
              onClick={() => setActiveTab("secrets")}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline block"
            >
              Abrir panel de claves →
            </button>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <Lock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab("publisher")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition flex items-center gap-2 flex-shrink-0 ${
            activeTab === "publisher"
              ? "bg-blue-600 text-white shadow-md shadow-blue-200"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          <Send className="w-4 h-4" />
          Publicador Multi-Restaurante & Global
        </button>

        <button
          onClick={() => setActiveTab("secrets")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition flex items-center gap-2 flex-shrink-0 ${
            activeTab === "secrets"
              ? "bg-blue-600 text-white shadow-md shadow-blue-200"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          <Key className="w-4 h-4" />
          Secretos Globales de Meta (Superadmin)
          {platformConfig?.connected && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white ml-1" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition flex items-center gap-2 flex-shrink-0 ${
            activeTab === "audit"
              ? "bg-blue-600 text-white shadow-md shadow-blue-200"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Auditoría de Restaurantes (360°)
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-700">
            {auditList.length}
          </span>
        </button>
      </div>

      {/* TAB 1: PUBLISHER (MULTI-RESTAURANT & SMARTBITE GLOBAL) */}
      {activeTab === "publisher" && (
        <div className="space-y-6">
          {/* Context Switcher Bar */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block">
                  Paso 0 · Contexto de Emisión
                </span>
                <h2 className="text-base md:text-lg font-extrabold text-gray-900">
                  ¿Desde dónde deseas realizar la publicación?
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedContext("platform")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    selectedContext === "platform"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  SmartBite Global (Oficial)
                </button>

                <div className="h-6 w-px bg-gray-200" />

                <span className="text-xs font-medium text-gray-500">o Selecciona Restaurante:</span>
              </div>
            </div>

            {/* Restaurant Selector Dropdown / Search */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              <div
                onClick={() => setSelectedContext("platform")}
                className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex items-center justify-between ${
                  selectedContext === "platform"
                    ? "border-blue-600 bg-blue-50/50 shadow-sm"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow">
                    SB
                  </div>
                  <div>
                    <span className="font-bold text-xs md:text-sm text-gray-900 block">
                      SmartBite Global
                    </span>
                    <span className="text-[11px] text-gray-500 block">
                      Redes oficiales de la marca
                    </span>
                  </div>
                </div>
                {selectedContext === "platform" && (
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                )}
              </div>

              {/* Top 2 popular restaurants or selector */}
              {restaurants.slice(0, 2).map((r) => {
                const isSelected = selectedContext === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedContext(r.id)}
                    className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={r.logo || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100"}
                        alt={r.name}
                        className="w-10 h-10 rounded-xl object-cover border border-gray-200 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-xs md:text-sm text-gray-900 truncate block">
                          {r.name}
                        </span>
                        <span className="text-[11px] text-gray-500 block truncate">
                          {r.city || "Restaurante aliado"}
                        </span>
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />}
                  </div>
                );
              })}
            </div>

            {/* Complete dropdown for all restaurants */}
            {restaurants.length > 2 && (
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">
                  Buscar cualquier otro restaurante:
                </span>
                <select
                  value={selectedContext}
                  onChange={(e) => setSelectedContext(e.target.value)}
                  className="w-full sm:max-w-md px-3.5 py-2 text-xs md:text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="platform">🌐 SmartBite Global (Marca Oficial)</option>
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>
                      🏪 {r.name} {r.city ? `(${r.city})` : ""}
                    </option>
                  ))}
                </select>

                <span className="text-xs text-gray-400">
                  Total: {restaurants.length} locales disponibles
                </span>
              </div>
            )}
          </div>

          {/* Active Publisher Instance */}
          <MetaPostCreator
            restaurant={currentActiveRestaurant}
            onUpdate={fetchAuditStatus}
            allRestaurants={restaurants}
            isPlatformAdmin={true}
            onSelectRestaurant={(r) => setSelectedContext(r.id)}
          />
        </div>
      )}

      {/* TAB 2: GLOBAL META SECRETS (SUPERADMIN) */}
      {activeTab === "secrets" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-900">
                    Configuración de Secretos Globales de Meta
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Estas credenciales aplican a la plataforma SmartBite Global y a las aplicaciones de Meta for Developers.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {platformConfig?.connected && (
                  <button
                    onClick={handleVerifyPlatform}
                    disabled={isVerifyingPlatform}
                    className="px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingPlatform ? "animate-spin" : ""}`} />
                    {isVerifyingPlatform ? "Probando..." : "Verificar con Facebook"}
                  </button>
                )}
                <button
                  onClick={() => setShowTechnicalGuide(!showTechnicalGuide)}
                  className="px-3.5 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition flex items-center gap-1.5"
                >
                  <HelpCircle className="w-4 h-4 text-gray-500" />
                  {showTechnicalGuide ? "Ocultar Guía" : "Guía de Meta Developers"}
                </button>
              </div>
            </div>

            {/* Technical Guide Accordion */}
            <AnimatePresence>
              {showTechnicalGuide && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs text-slate-700 space-y-3"
                >
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    Pasos para configurar la App en Meta for Developers (developers.facebook.com)
                  </div>
                  <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed">
                    <li>
                      Crea o abre tu App en <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">developers.facebook.com</a> de tipo <strong>"Empresa" (Business)</strong>.
                    </li>
                    <li>
                      En <em>Configuración &gt; Básica</em>, copia el <strong>Identificador de la app (App ID)</strong> y la <strong>Clave secreta de la app (App Secret)</strong> y pégalos en los campos abajo.
                    </li>
                    <li>
                      Añade el producto <strong>Facebook Login for Business</strong> y en la lista de URLs de redirección OAuth válidas coloca:
                      <div className="mt-1 bg-white p-2 rounded-lg border font-mono text-[11px] text-slate-800 flex items-center justify-between">
                        <span>{window.location.origin}/auth/meta/callback</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/auth/meta/callback`);
                            toast.success("URL de callback copiada!");
                          }}
                          className="text-blue-600 hover:text-blue-800 font-sans text-xs underline ml-2"
                        >
                          Copiar
                        </button>
                      </div>
                    </li>
                    <li>
                      Para la FanPage oficial de SmartBite, genera un <strong>Page Access Token</strong> con los permisos: <code className="bg-slate-200 px-1 rounded">pages_show_list</code>, <code className="bg-slate-200 px-1 rounded">pages_manage_posts</code>, <code className="bg-slate-200 px-1 rounded">pages_read_engagement</code>, e <code className="bg-slate-200 px-1 rounded">instagram_basic</code>.
                    </li>
                  </ol>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Meta App ID */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Meta App ID (Global)
                </label>
                <input
                  type="text"
                  value={appIdInput}
                  onChange={(e) => setAppIdInput(e.target.value)}
                  placeholder="Ej: 108492048572019"
                  className="w-full px-3.5 py-2.5 text-xs md:text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Identificador de la App registrado en Meta for Developers.
                </p>
              </div>

              {/* Meta App Secret */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Meta App Secret (Clave Secreta)
                </label>
                <div className="relative">
                  <input
                    type={showSecretText ? "text" : "password"}
                    value={appSecretInput}
                    onChange={(e) => setAppSecretInput(e.target.value)}
                    placeholder={platformConfig?.hasAppSecret ? "•••••••••••••••• (Ya configurada - ingresa nueva para cambiar)" : "Clave secreta de la app en Meta"}
                    className="w-full pl-3.5 pr-10 py-2.5 text-xs md:text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecretText(!showSecretText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showSecretText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Se almacena de forma encriptada en el backend del servidor.
                </p>
              </div>

              {/* SmartBite Official FanPage ID */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ID de la FanPage Oficial de SmartBite (Page ID)
                </label>
                <input
                  type="text"
                  value={pageIdInput}
                  onChange={(e) => setPageIdInput(e.target.value)}
                  placeholder="Ej: 102938475612345"
                  className="w-full px-3.5 py-2.5 text-xs md:text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  ID de la página de Facebook principal de SmartBite.
                </p>
              </div>

              {/* SmartBite Official Page Access Token */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Token de Acceso de Página Oficial (Page Access Token)
                </label>
                <div className="relative">
                  <input
                    type={showTokenText ? "text" : "password"}
                    value={pageAccessTokenInput}
                    onChange={(e) => setPageAccessTokenInput(e.target.value)}
                    placeholder={platformConfig?.hasToken ? "•••••••••••••••• (Ya configurado - ingresa nuevo para cambiar)" : "Token de acceso oficial de la página (EAAB...)"}
                    className="w-full pl-3.5 pr-10 py-2.5 text-xs md:text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTokenText(!showTokenText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showTokenText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Token permanente o de larga duración para publicaciones oficiales.
                </p>
              </div>

              {/* Instagram Business ID */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ID de Instagram Business Oficial <span className="text-gray-400 font-normal">(Opcional)</span>
                </label>
                <input
                  type="text"
                  value={instagramIdInput}
                  onChange={(e) => setInstagramIdInput(e.target.value)}
                  placeholder="Ej: 17841400000000000"
                  className="w-full px-3.5 py-2.5 text-xs md:text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 font-mono"
                />
              </div>

              {/* Test Mode Switch */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="font-bold text-xs text-slate-800 block">
                    Modo Pruebas / Simulación
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Permite probar el publicador y enlaces inteligentes sin credenciales reales de Meta.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isTestMode}
                  onChange={(e) => setIsTestMode(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={handleSavePlatformSecrets}
                disabled={isSavingSecrets}
                className="px-6 py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition flex items-center gap-2 disabled:opacity-50"
              >
                {isSavingSecrets ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Guardando en Servidor...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" /> Guardar Secretos de Plataforma
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT & 360 RESTAURANTS STATUS */}
      {activeTab === "audit" && (
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                Auditoría de Integración Meta por Restaurante
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Supervisa el estado de conexión de Facebook e Instagram de cada restaurante en SmartBite.
              </p>
            </div>

            <button
              onClick={fetchAuditStatus}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
            >
              <RefreshCw className={`w-4 h-4 ${loadingAudit ? "animate-spin" : ""}`} />
              Actualizar
            </button>
          </div>

          {/* Filters and Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Buscar por restaurante o ciudad..."
                className="w-full pl-9 pr-3 py-2 text-xs md:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setAuditFilter("all")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  auditFilter === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
                }`}
              >
                Todos ({auditList.length})
              </button>
              <button
                onClick={() => setAuditFilter("connected")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  auditFilter === "connected" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-600"
                }`}
              >
                Oficial ({connectedCount})
              </button>
              <button
                onClick={() => setAuditFilter("simulated")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  auditFilter === "simulated" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-600"
                }`}
              >
                Pruebas ({simulatedCount})
              </button>
              <button
                onClick={() => setAuditFilter("pending")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  auditFilter === "pending" ? "bg-white text-amber-700 shadow-sm" : "text-gray-600"
                }`}
              >
                Sin Conectar ({auditList.length - connectedCount - simulatedCount})
              </button>
            </div>
          </div>

          {/* Audit Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-2xl">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Restaurante</th>
                  <th className="py-3 px-4">Estado Meta</th>
                  <th className="py-3 px-4">FanPage de Facebook</th>
                  <th className="py-3 px-4">Instagram</th>
                  <th className="py-3 px-4">Token</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAudit.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      No se encontraron restaurantes con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredAudit.map((item) => {
                    const originalRest = restaurants.find((r) => r.id === item.id);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/80 transition">
                        {/* Restaurant Name & Logo */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.logo || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100"}
                              alt={item.name}
                              className="w-9 h-9 rounded-xl object-cover border border-gray-200"
                            />
                            <div>
                              <span className="font-bold text-gray-900 block truncate max-w-[180px]">
                                {item.name}
                              </span>
                              <span className="text-[11px] text-gray-400 block">
                                {item.city || "Colombia"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-4">
                          {item.connected ? (
                            item.isSimulated ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Modo Pruebas
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                                <CheckCircle2 className="w-3 h-3" /> Oficial
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-500">
                              Sin Conectar
                            </span>
                          )}
                        </td>

                        {/* FanPage */}
                        <td className="py-3 px-4">
                          {item.pageName ? (
                            <div>
                              <span className="font-semibold text-gray-800 block truncate max-w-[160px]">
                                {item.pageName}
                              </span>
                              {item.pageId && (
                                <span className="text-[10px] text-gray-400 font-mono block">
                                  ID: {item.pageId}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">No vinculada</span>
                          )}
                        </td>

                        {/* Instagram */}
                        <td className="py-3 px-4">
                          {item.instagramUsername ? (
                            <span className="text-pink-600 font-medium">
                              {item.instagramUsername}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">No vinculado</span>
                          )}
                        </td>

                        {/* Token Masked */}
                        <td className="py-3 px-4">
                          {item.hasToken ? (
                            <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                              {item.tokenMasked || "••••••••"}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedContext(item.id);
                                setActiveTab("publisher");
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                              title="Publicar como este restaurante"
                            >
                              Publicar
                            </button>

                            <button
                              onClick={() => {
                                setModalRestaurant(originalRest || ({ id: item.id, name: item.name } as any));
                                setModalPageId(item.pageId || "");
                                setModalInstagramId("");
                                setModalAccessToken("");
                              }}
                              className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                              title="Configurar credenciales del restaurante"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Superadmin Edit Restaurant Credentials Modal */}
      <AnimatePresence>
        {modalRestaurant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Configurar Credenciales para {modalRestaurant.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Asiste al restaurante ingresando su Page ID y Token de Facebook.
                  </p>
                </div>
                <button
                  onClick={() => setModalRestaurant(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Facebook Page ID</label>
                  <input
                    type="text"
                    value={modalPageId}
                    onChange={(e) => setModalPageId(e.target.value)}
                    placeholder="104829104859182"
                    className="w-full px-3 py-2 bg-gray-50 border rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Page Access Token</label>
                  <input
                    type="password"
                    value={modalAccessToken}
                    onChange={(e) => setModalAccessToken(e.target.value)}
                    placeholder="EAAB..."
                    className="w-full px-3 py-2 bg-gray-50 border rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Instagram Business ID (Opcional)</label>
                  <input
                    type="text"
                    value={modalInstagramId}
                    onChange={(e) => setModalInstagramId(e.target.value)}
                    placeholder="17841400000000000"
                    className="w-full px-3 py-2 bg-gray-50 border rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  onClick={() => setModalRestaurant(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveRestaurantFromModal}
                  disabled={modalIsSaving}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow transition"
                >
                  {modalIsSaving ? "Guardando..." : "Guardar Credenciales"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
