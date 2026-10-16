import React, { useState, useEffect, useRef } from "react";
import { Restaurant, Product } from "../store/db";
import {
  Share2,
  Facebook,
  Instagram,
  Sparkles,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Send,
  Trash2,
  RefreshCw,
  AlertCircle,
  Info,
  Layers,
  ShoppingBag,
  Tag,
  Flame,
  Search,
  Check,
  MousePointerClick,
  Bot,
  Link as LinkIcon,
  ShieldCheck,
  Megaphone,
  Upload,
  Image as ImageIcon,
  Key,
  Lock,
  Settings,
  HelpCircle,
  X,
  Activity,
  Heart,
  MessageCircle,
  Repeat,
  BarChart2,
  Award,
  Clock,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface MetaPostCreatorProps {
  restaurant: Restaurant;
  onUpdate?: () => void;
  isPlatformAdmin?: boolean;
  allRestaurants?: Restaurant[];
  onSelectRestaurant?: (restaurant: Restaurant) => void;
}

interface SocialAccountStatus {
  connected: boolean;
  pageId?: string;
  pageName?: string;
  instagramId?: string;
  instagramUsername?: string;
  pictureUrl?: string;
  hasToken?: boolean;
  tokenMasked?: string;
  connectedAt?: string;
  isSimulated?: boolean;
  isManualConfig?: boolean;
  isNeverExpiring?: boolean;
}

export interface MetaHealthReport {
  status: "optimal" | "warning" | "critical";
  score: number;
  isConfigured: boolean;
  isSimulated: boolean;
  tokenInfo: {
    isValid: boolean;
    type: string;
    expiresAt: string | null;
    daysLeft: number | null;
    isNeverExpiring: boolean;
    scopes: string[];
    missingScopes: string[];
  };
  pageInfo: {
    id: string;
    name: string;
    pictureUrl?: string | null;
    canPost: boolean;
    fanCount?: number;
  };
  instagramInfo: {
    isConnected: boolean;
    id?: string | null;
    username?: string | null;
  };
  issues: Array<{
    severity: "info" | "warning" | "error";
    title: string;
    description: string;
    action?: string;
  }>;
  checkedAt: string;
}

interface SocialPostItem {
  id: string;
  restaurantId?: string;
  productId?: string;
  productName: string;
  caption: string;
  imageUrl?: string;
  smartLink: string;
  publishToFacebook: boolean;
  publishToInstagram: boolean;
  publishedAt: string;
  isSimulated?: boolean;
  results?: any;
  metrics?: {
    clicks: number;
    orders: number;
    reactions?: number;
    comments?: number;
    shares?: number;
    impressions?: number;
    lastSyncedAt?: string;
  };
}

export const MetaPostCreator: React.FC<MetaPostCreatorProps> = ({
  restaurant,
  onUpdate,
  isPlatformAdmin = false,
  allRestaurants = [],
  onSelectRestaurant,
}) => {
  const [accountStatus, setAccountStatus] = useState<SocialAccountStatus>({
    connected: false,
  });
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Phase 3: Live Health Check & Token Diagnostics state
  const [healthReport, setHealthReport] = useState<MetaHealthReport | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [isRenewingToken, setIsRenewingToken] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [syncingMetricsId, setSyncingMetricsId] = useState<string | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  // Manual Credentials Configuration Modal state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [manualPageId, setManualPageId] = useState("");
  const [manualAccessToken, setManualAccessToken] = useState("");
  const [manualInstagramId, setManualInstagramId] = useState("");
  const [showTokenText, setShowTokenText] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showHelpGuide, setShowHelpGuide] = useState(false);

  // Products & selection (aggregated if platform context)
  const products: Product[] = React.useMemo(() => {
    if (restaurant.id === "platform" && allRestaurants && allRestaurants.length > 0) {
      const items: Product[] = [];
      allRestaurants.forEach((r) => {
        const menu = (r as any).menu || [];
        menu.forEach((p: Product) => {
          items.push({
            ...p,
            restaurantId: r.id,
            restaurantName: r.name,
          });
        });
      });
      return items;
    }
    return (restaurant as any).menu || [];
  }, [restaurant.id, restaurant, allRestaurants]);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(() => {
    return products.find((p) => p.isPromotion || p.hasDiscount) || products[0] || null;
  });

  // Re-select product when restaurant changes
  useEffect(() => {
    const nextSelected = products.find((p) => p.isPromotion || p.hasDiscount) || products[0] || null;
    setSelectedProduct(nextSelected);
  }, [restaurant.id, products]);

  const [filterType, setFilterType] = useState<"all" | "promo" | "combo">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Post image state (Crucial: user emphasized inserting custom promo image)
  const [postImageUrl, setPostImageUrl] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Post form state
  const [caption, setCaption] = useState("");
  const [publishToFacebook, setPublishToFacebook] = useState(true);
  const [publishToInstagram, setPublishToInstagram] = useState(true);
  const [previewPlatform, setPreviewPlatform] = useState<"facebook" | "instagram">("facebook");
  const [isPublishing, setIsPublishing] = useState(false);

  // History
  const [postHistory, setPostHistory] = useState<SocialPostItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Smart link calculation with multi-restaurant support
  const baseUrl = window.location.origin;
  const targetRestId = (selectedProduct as any)?.restaurantId || (restaurant.id !== "platform" ? restaurant.id : null);
  const smartLink = targetRestId
    ? `${baseUrl}/r/${targetRestId}?promo=${selectedProduct?.id || ""}&agent_open=true&utm_source=meta`
    : `${baseUrl}/?agent_open=true&utm_source=meta_global`;

  // Fetch account status
  const fetchAccountStatus = async () => {
    try {
      setLoadingStatus(true);
      const res = await fetch(`/api/social/accounts/${restaurant.id}`);
      if (res.ok) {
        const data = await res.json();
        setAccountStatus(data);
        if (data.pageId) setManualPageId(data.pageId);
        if (data.instagramId) setManualInstagramId(data.instagramId);
        if (data.isSimulated) setIsTestMode(true);
      }
    } catch (e) {
      console.error("Error fetching social account status:", e);
    } finally {
      setLoadingStatus(false);
    }
  };

  // Fetch post history
  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch(`/api/social/posts/${restaurant.id}`);
      if (res.ok) {
        const data = await res.json();
        setPostHistory(data.posts || []);
      }
    } catch (e) {
      console.error("Error fetching post history:", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Phase 3: Fetch Health Check & Diagnostic Report
  const fetchHealthCheck = async () => {
    try {
      setLoadingHealth(true);
      const res = await fetch(`/api/social/accounts/${restaurant.id}/health`);
      if (res.ok) {
        const data: MetaHealthReport = await res.json();
        setHealthReport(data);
      }
    } catch (e) {
      console.error("Error fetching health check:", e);
    } finally {
      setLoadingHealth(false);
    }
  };

  // Phase 3: Auto-Renew Token to Permanent Page Token
  const handleRenewToken = async () => {
    try {
      setIsRenewingToken(true);
      const res = await fetch(`/api/social/accounts/${restaurant.id}/exchange-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo renovar el token.");
      }
      toast.success(data.message || "¡Token convertido exitosamente a Token Permanente!");
      fetchAccountStatus();
      fetchHealthCheck();
    } catch (err: any) {
      toast.error(err.message || "Error al renovar token");
    } finally {
      setIsRenewingToken(false);
    }
  };

  // Phase 3: Synchronize Live Metrics for a single post
  const handleSyncMetrics = async (postId: string) => {
    try {
      setSyncingMetricsId(postId);
      const res = await fetch(`/api/social/posts/${postId}/sync-metrics`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al sincronizar métricas.");
      }
      toast.success("Métricas actualizadas en tiempo real.");
      setPostHistory((prev) =>
        prev.map((p) => (p.id === postId && data.post ? { ...p, metrics: data.post.metrics } : p))
      );
    } catch (err: any) {
      toast.error(err.message || "No se pudo sincronizar métricas.");
    } finally {
      setSyncingMetricsId(null);
    }
  };

  // Phase 3: Synchronize all posts
  const handleSyncAllMetrics = async () => {
    try {
      setIsSyncingAll(true);
      const res = await fetch("/api/social/posts/sync-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId: restaurant.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al sincronizar");
      }
      toast.success(data.message || "Métricas sincronizadas");
      fetchHistory();
    } catch (err: any) {
      toast.error(err.message || "Error al sincronizar");
    } finally {
      setIsSyncingAll(false);
    }
  };

  useEffect(() => {
    fetchAccountStatus();
    fetchHealthCheck();
    fetchHistory();
  }, [restaurant.id]);

  // Set default image when selected product changes
  useEffect(() => {
    if (selectedProduct) {
      generateSmartCopy(selectedProduct);
      const prodImg =
        selectedProduct.images && selectedProduct.images.length > 0
          ? selectedProduct.images[0]
          : restaurant.coverImage || restaurant.logo || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800";
      setPostImageUrl(prodImg);
    } else {
      setPostImageUrl(restaurant.coverImage || restaurant.logo || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800");
    }
  }, [selectedProduct?.id]);

  // Smart copy generation
  const generateSmartCopy = (prod: Product) => {
    const priceFormatted = `$${prod.price.toLocaleString("es-CO")}`;
    const discountText =
      prod.hasDiscount && prod.discountPercentage
        ? `🔥 ¡OFERTA ESPECIAL CON EL ${prod.discountPercentage}% DE DESCUENTO!`
        : prod.isPromotion
        ? "⭐ ¡NUESTRA MEJOR PROMOCIÓN DE HOY!"
        : "✨ ¡RECOMENDADO DE LA CASA!";

    const defaultCaption = `${discountText}

¿Antojo de algo verdaderamente delicioso en ${restaurant.name}?
Prueba nuestro irresistible "${prod.name}" por solo ${priceFormatted}. ${
      prod.description ? `\n\n"${prod.description}"` : ""
    }

📲 Toca el enlace abajo para pedir directamente con nuestro Asistente Inteligente en SmartBite, que te atenderá de inmediato y sin esperas.

¡Haz tu pedido en segundos! 👇
#${restaurant.name.replace(/\s+/g, "")} #SmartBite #${prod.name
      .replace(/[^a-zA-Z0-9]/g, "")} #ComidaADomicilio #Delivery`;

    setCaption(defaultCaption);
  };

  // Upload custom promotional image
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/social/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al subir la imagen");
      }

      setPostImageUrl(data.url);
      toast.success("¡Imagen promocional cargada exitosamente!", {
        description: "Esta imagen se publicará en Facebook e Instagram.",
      });
    } catch (err: any) {
      toast.error("Error al subir imagen: " + err.message);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Save manual credentials for this restaurant
  const handleSaveManualConfig = async () => {
    if (!isTestMode) {
      if (!manualPageId.trim()) {
        toast.error("Ingresa el ID de tu FanPage de Facebook.");
        return;
      }
      if (!manualAccessToken.trim()) {
        toast.error("Ingresa el Token de Acceso de la Página.");
        return;
      }
    }

    try {
      setIsSavingConfig(true);
      const res = await fetch(`/api/social/accounts/${restaurant.id}/manual-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: manualPageId.trim(),
          pageAccessToken: isTestMode ? "simulated_token" : manualAccessToken.trim(),
          instagramId: manualInstagramId.trim() || undefined,
          isSimulated: isTestMode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo conectar con Facebook");
      }

      toast.success("¡Credenciales guardadas con éxito!", {
        description: data.message || `Conectado con la página: ${data.pageName}`,
      });

      setShowConfigModal(false);
      setManualAccessToken(""); // Clear raw token from local state for security
      fetchAccountStatus();
    } catch (err: any) {
      toast.error("Error al guardar credenciales: " + err.message);
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Verify connection
  const handleVerifyConnection = async () => {
    try {
      setIsVerifying(true);
      const res = await fetch(`/api/social/accounts/${restaurant.id}/verify`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok || !data.valid) {
        throw new Error(data.error || "No se pudo verificar la conexión con Facebook");
      }

      toast.success("¡Conexión verificada con Facebook!", {
        description: `Página activa: "${data.pageName}" (ID: ${data.pageId})`,
      });
      fetchAccountStatus();
    } catch (err: any) {
      toast.error("Error de conexión: " + err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  // Disconnect accounts
  const handleDisconnect = async () => {
    if (!window.confirm("¿Seguro que deseas desconectar las credenciales de Facebook de este restaurante?")) {
      return;
    }

    try {
      const res = await fetch(`/api/social/accounts/${restaurant.id}/disconnect`, {
        method: "POST",
      });
      if (res.ok) {
        toast.info("Credenciales desconectadas correctamente.");
        setAccountStatus({ connected: false });
        setManualAccessToken("");
      }
    } catch (e) {
      toast.error("Error al desconectar cuentas");
    }
  };

  // Publish to Facebook & Instagram
  const handlePublish = async () => {
    if (!accountStatus.connected) {
      toast.error("Configura primero las credenciales de Facebook de este restaurante.", {
        description: "Haz clic en 'Configurar Credenciales' para ingresar tu FanPage y Token.",
      });
      setShowConfigModal(true);
      return;
    }

    if (!publishToFacebook && !publishToInstagram) {
      toast.error("Debes seleccionar al menos un canal (Facebook o Instagram).");
      return;
    }

    if (!caption.trim()) {
      toast.error("Escribe un texto o descripción para la publicación.");
      return;
    }

    if (!postImageUrl) {
      toast.error("Selecciona o sube una imagen para la publicación.");
      return;
    }

    try {
      setIsPublishing(true);

      const res = await fetch("/api/social/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          productId: selectedProduct?.id,
          productName: selectedProduct?.name || "Promoción Especial",
          caption,
          smartLink,
          imageUrl: postImageUrl,
          publishToFacebook,
          publishToInstagram,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Fallo en la publicación");
      }

      toast.success("¡Publicado en Facebook exitosamente!", {
        description: "Tu publicación con la imagen promocional y el enlace inteligente ya está activa.",
      });

      fetchHistory();
    } catch (err: any) {
      console.error("Publish error:", err);
      toast.error("No se pudo publicar: " + err.message, {
        description: "Verifica que el Token de Acceso tenga el permiso 'pages_manage_posts'.",
        duration: 7000,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    if (filterType === "promo" && !p.hasDiscount && !p.isPromotion) return false;
    if (filterType === "combo" && !p.isPartOfCombo) return false;
    if (
      searchQuery &&
      !p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(p.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const copyToClipboard = (text: string, label: string = "Enlace") => {
    navigator.clipboard.writeText(text);
    toast.success(`¡${label} copiado al portapapeles!`);
  };

  const copyFullPost = () => {
    const fullText = `${caption}\n\n👉 Pide aquí: ${smartLink}`;
    copyToClipboard(fullText, "Publicación completa");
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-pink-600 p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            Meta Social Suite Oficial
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
            Creador de Publicaciones en Facebook & Meta
          </h1>
          <p className="text-blue-100 text-sm md:text-base leading-relaxed">
            Publica tus platos, promociones e imágenes directamente en la FanPage de Facebook e Instagram de <strong>{restaurant.name}</strong>.
            Cada post incluye automáticamente tu <strong>imagen promocional</strong> y un <strong>Enlace Inteligente</strong> que activa de inmediato a tu agente de IA Gemini con el contexto de la oferta.
          </p>
        </div>

        {/* Floating social logos */}
        <div className="absolute right-4 -bottom-6 opacity-20 md:opacity-30 pointer-events-none flex gap-4">
          <Facebook className="w-40 h-40 text-white" />
          <Instagram className="w-40 h-40 text-white" />
        </div>
      </div>

      {/* Meta Account Status & Independent Configuration Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2 flex-shrink-0">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md ring-2 ring-white font-bold text-xl">
                f
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center text-white shadow-md ring-2 ring-white">
                <Instagram className="w-6 h-6" />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-gray-900 text-base md:text-lg">
                  Facebook Oficial de {restaurant.name}
                </h3>
                {accountStatus.connected ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Conectado Oficialmente
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                    <AlertCircle className="w-3.5 h-3.5" /> Sin Configurar
                  </span>
                )}

                {/* Phase 3: Semáforo de Salud Score Badge */}
                {healthReport && (
                  <button
                    onClick={() => setShowHealthModal(true)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold transition shadow-sm hover:opacity-90 ${
                      healthReport.status === "optimal"
                        ? "bg-emerald-500 text-white"
                        : healthReport.status === "warning"
                        ? "bg-amber-500 text-white"
                        : "bg-rose-500 text-white"
                    }`}
                    title="Ver auditoría y semáforo de salud de la conexión"
                  >
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span>Salud: {healthReport.score}%</span>
                    <span className="text-[10px] opacity-90">
                      ({healthReport.status === "optimal" ? "Óptimo" : healthReport.status === "warning" ? "Atención" : "Crítico"})
                    </span>
                  </button>
                )}

                {/* Phase 3: Token Lifespan Badge */}
                {accountStatus.connected && (
                  healthReport?.tokenInfo?.isNeverExpiring || accountStatus.isNeverExpiring ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      <Zap className="w-3 h-3 text-indigo-500" /> Token Permanente
                    </span>
                  ) : healthReport?.tokenInfo?.daysLeft !== null && healthReport?.tokenInfo?.daysLeft !== undefined ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <Clock className="w-3 h-3 text-amber-500" /> Expira en {healthReport.tokenInfo.daysLeft} días
                    </span>
                  ) : null
                )}

                {accountStatus.isSimulated && (
                  <span className="text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                    Modo Pruebas
                  </span>
                )}
              </div>

              {accountStatus.connected ? (
                <div className="text-xs md:text-sm text-gray-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>
                    Página: <strong className="text-gray-900">{accountStatus.pageName}</strong>
                  </span>
                  {accountStatus.pageId && (
                    <span className="text-gray-400">
                      ID: <span className="font-mono text-gray-600">{accountStatus.pageId}</span>
                    </span>
                  )}
                  {accountStatus.tokenMasked && (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-mono text-[11px] bg-emerald-50 px-2 py-0.5 rounded">
                      <Lock className="w-3 h-3" /> Token: {accountStatus.tokenMasked}
                    </span>
                  )}
                  {accountStatus.instagramUsername && (
                    <span className="text-pink-600 font-medium">
                      Instagram: {accountStatus.instagramUsername}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  Configura de forma manual e independiente el ID de la Página de Facebook y el Token de Acceso para este restaurante.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Phase 3: Semáforo & Health Diagnostics Button */}
            <button
              onClick={() => {
                fetchHealthCheck();
                setShowHealthModal(true);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition flex items-center gap-1.5 shadow-sm border border-emerald-200"
              title="Auditoría 360° y Diagnóstico del Token"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>Semáforo de Salud</span>
            </button>

            {/* Phase 3: One-click Token Upgrade if not permanent */}
            {accountStatus.connected && !healthReport?.tokenInfo?.isNeverExpiring && !accountStatus.isNeverExpiring && !accountStatus.isSimulated && (
              <button
                onClick={handleRenewToken}
                disabled={isRenewingToken}
                className="px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition flex items-center gap-1.5 shadow-sm border border-indigo-200 disabled:opacity-50"
                title="Convertir este token a Permanente de FanPage (Sin caducidad)"
              >
                {isRenewingToken ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-indigo-600" />
                )}
                <span>Hacer Permanente</span>
              </button>
            )}

            {accountStatus.connected && (
              <button
                onClick={handleVerifyConnection}
                disabled={isVerifying}
                className="px-3.5 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition flex items-center gap-1.5"
                title="Probar llamada a Facebook Graph API"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? "animate-spin" : ""}`} />
                {isVerifying ? "Verificando..." : "Verificar"}
              </button>
            )}

            <button
              onClick={() => {
                setShowConfigModal(true);
                if (accountStatus.pageId) setManualPageId(accountStatus.pageId);
                if (accountStatus.instagramId) setManualInstagramId(accountStatus.instagramId);
              }}
              className="px-4 py-2 text-xs font-semibold text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition flex items-center gap-2 shadow-sm"
            >
              <Settings className="w-3.5 h-3.5 text-gray-600" />
              {accountStatus.connected ? "Editar Credenciales" : "⚙️ Configurar Credenciales de Facebook"}
            </button>

            {accountStatus.connected && (
              <button
                onClick={handleDisconnect}
                className="p-2 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition"
                title="Desconectar credenciales"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Manual Configuration Modal / Dialog */}
      <AnimatePresence>
        {showConfigModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto space-y-6"
            >
              <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                    f
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Configuración de Credenciales de Facebook
                    </h3>
                    <p className="text-xs text-gray-500">
                      Configuración exclusiva para <strong>{restaurant.name}</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowConfigModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Security info box */}
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 text-xs text-blue-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-blue-950">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Almacenamiento Seguro e Independiente
                </div>
                <p className="text-blue-800 leading-relaxed">
                  Cada restaurante tiene su propio almacenamiento seguro. Las credenciales ingresadas aquí se guardan de forma encriptada en el servidor y solo se usan para publicar los platos de este restaurante.
                </p>
              </div>

              {/* Inputs Form */}
              <div className="space-y-4">
                {/* Facebook Page ID */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    ID de la Página de Facebook (Page ID) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={manualPageId}
                    onChange={(e) => setManualPageId(e.target.value)}
                    placeholder="Ej: 104829104859182 o nombre-de-la-pagina"
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition font-mono"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    El identificador numérico de tu FanPage de Facebook.
                  </p>
                </div>

                {/* Facebook Page Access Token */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Token de Acceso de la Página (Page Access Token) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showTokenText ? "text" : "password"}
                      value={manualAccessToken}
                      onChange={(e) => setManualAccessToken(e.target.value)}
                      placeholder={accountStatus.hasToken ? "•••••••••••••••••••••••••••••••• (Ya configurado - ingresa uno nuevo para cambiar)" : "Pega tu Token generado de Facebook aquí (EAAB...)"}
                      className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition font-mono text-xs"
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
                    Token con permisos <code className="bg-gray-100 text-gray-700 px-1 py-0.5 rounded">pages_manage_posts</code> y <code className="bg-gray-100 text-gray-700 px-1 py-0.5 rounded">pages_read_engagement</code>.
                  </p>
                </div>

                {/* Instagram Business Account ID */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    ID de Cuenta de Instagram Business <span className="text-gray-400 font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={manualInstagramId}
                    onChange={(e) => setManualInstagramId(e.target.value)}
                    placeholder="Ej: 17841400000000000 (Se detecta automáticamente si está vinculado a tu FanPage)"
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white transition font-mono"
                  />
                </div>

                {/* Test Mode Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="font-semibold text-xs text-gray-800 block">
                      Modo Pruebas / Simulación
                    </span>
                    <span className="text-[11px] text-gray-500 block">
                      Permite probar la interfaz y publicaciones sin requerir un token real de Meta.
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

              {/* Instructions Accordion */}
              <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50">
                <button
                  type="button"
                  onClick={() => setShowHelpGuide(!showHelpGuide)}
                  className="w-full flex items-center justify-between text-xs font-bold text-gray-800"
                >
                  <span className="flex items-center gap-2 text-indigo-700">
                    <HelpCircle className="w-4 h-4" />
                    ¿Cómo obtener el Page ID y Token de Facebook en 3 pasos?
                  </span>
                  <span>{showHelpGuide ? "▲ Ocultar" : "▼ Ver pasos"}</span>
                </button>

                {showHelpGuide && (
                  <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600 space-y-2.5 leading-relaxed">
                    <div className="flex gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                        1
                      </span>
                      <p>
                        <strong>Obtener Page ID:</strong> Abre tu FanPage en Facebook, ve a <em>Configuración &gt; Información de la página</em>. Allí encontrarás el número de tu ID de Página.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                        2
                      </span>
                      <p>
                        <strong>Generar Token de Acceso:</strong> En <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" className="text-blue-600 font-semibold underline">Meta Graph API Explorer</a> o en Meta Business Suite, selecciona tu FanPage y asegúrate de marcar los permisos <code>pages_manage_posts</code> y <code>pages_read_engagement</code>. Haz clic en "Generate Access Token".
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                        3
                      </span>
                      <p>
                        <strong>Pégalo aquí y guarda:</strong> SmartBite verificará en tiempo real tu página en la Graph API de Facebook y la dejará lista para publicar al instante.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Dialog Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleSaveManualConfig}
                  disabled={isSavingConfig}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isSavingConfig ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verificando en Facebook...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" /> Verificar y Guardar Credenciales
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Phase 3: Comprehensive Health Diagnostics Modal (Semáforo de Salud) */}
      <AnimatePresence>
        {showHealthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto space-y-6"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-md ${
                      healthReport?.status === "optimal"
                        ? "bg-emerald-500 shadow-emerald-200"
                        : healthReport?.status === "warning"
                        ? "bg-amber-500 shadow-amber-200"
                        : "bg-rose-500 shadow-rose-200"
                    }`}
                  >
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        Auditoría y Semáforo de Salud Meta
                      </h3>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          healthReport?.status === "optimal"
                            ? "bg-emerald-100 text-emerald-800"
                            : healthReport?.status === "warning"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {healthReport?.status === "optimal"
                          ? "Estado Óptimo"
                          : healthReport?.status === "warning"
                          ? "Advertencia"
                          : "Crítico"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Diagnóstico profundo de tokens, permisos de Graph API y vinculación para <strong>{restaurant.name}</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowHealthModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Health Score Banner */}
              <div
                className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                  healthReport?.status === "optimal"
                    ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                    : healthReport?.status === "warning"
                    ? "bg-amber-50/70 border-amber-200 text-amber-900"
                    : "bg-rose-50/70 border-rose-200 text-rose-900"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 flex items-center justify-center rounded-2xl bg-white shadow-sm border border-gray-100 font-extrabold text-2xl">
                    <span
                      className={
                        healthReport?.status === "optimal"
                          ? "text-emerald-600"
                          : healthReport?.status === "warning"
                          ? "text-amber-600"
                          : "text-rose-600"
                      }
                    >
                      {healthReport?.score ?? 0}
                    </span>
                    <span className="text-[10px] text-gray-400 absolute bottom-1.5 font-normal">
                      /100 pts
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">
                      {healthReport?.status === "optimal"
                        ? "Conexión en Nivel de Rendimiento Máximo"
                        : healthReport?.status === "warning"
                        ? "Se detectaron alertas que requieren atención"
                        : "Conexión inoperativa o incompleta"}
                    </h4>
                    <p className="text-xs opacity-80 mt-0.5 leading-relaxed">
                      {healthReport?.status === "optimal"
                        ? "Tu token tiene permisos de publicación e inspección completos. Las publicaciones automáticas se enviarán sin interrupciones."
                        : healthReport?.status === "warning"
                        ? "Tu token es funcional pero puede vencer pronto o carecer de permisos opcionales de métricas."
                        : "Es necesario configurar el ID de la página y generar un token válido de Facebook."}
                    </p>
                  </div>
                </div>

                <button
                  onClick={fetchHealthCheck}
                  disabled={loadingHealth}
                  className="px-3.5 py-2 text-xs font-semibold bg-white rounded-xl shadow-sm border hover:bg-gray-50 transition flex items-center gap-1.5 flex-shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingHealth ? "animate-spin" : ""}`} />
                  Re-auditar
                </button>
              </div>

              {/* Diagnostic Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Token Lifecycle Box */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800 flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-indigo-600" /> Ciclo de Vida del Token
                    </span>
                    {healthReport?.tokenInfo?.isValid ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold text-[10px]">
                        Válido
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-semibold text-[10px]">
                        Inválido
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-gray-600">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tipo de Token:</span>
                      <strong className="font-mono text-gray-800">
                        {healthReport?.tokenInfo?.type || "DESCONOCIDO"}
                      </strong>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">Caducidad:</span>
                      <strong>
                        {healthReport?.tokenInfo?.isNeverExpiring || accountStatus.isNeverExpiring ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <Zap className="w-3 h-3 text-emerald-500" /> Permanente (No expira)
                          </span>
                        ) : healthReport?.tokenInfo?.daysLeft !== null && healthReport?.tokenInfo?.daysLeft !== undefined ? (
                          <span className="text-amber-700 font-medium">
                            {healthReport.tokenInfo.daysLeft} días restantes
                          </span>
                        ) : (
                          <span className="text-gray-500">Indeterminada</span>
                        )}
                      </strong>
                    </div>

                    {healthReport?.tokenInfo?.expiresAt && !healthReport.tokenInfo.isNeverExpiring && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Fecha Límite:</span>
                        <span className="font-mono text-gray-700">
                          {new Date(healthReport.tokenInfo.expiresAt).toLocaleDateString("es-CO")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Auto-renew button if temporal */}
                  {!healthReport?.tokenInfo?.isNeverExpiring && !accountStatus.isNeverExpiring && healthReport?.tokenInfo?.isValid && !healthReport.isSimulated && (
                    <div className="pt-2 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={handleRenewToken}
                        disabled={isRenewingToken}
                        className="w-full py-2 px-3 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 rounded-xl shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isRenewingToken ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Conectando con Meta...
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5" /> Convertir a Token Permanente (Sin Expiración)
                          </>
                        )}
                      </button>
                      <p className="text-[10px] text-gray-400 mt-1 text-center">
                        Requiere App ID y App Secret configurados por el Superadministrador.
                      </p>
                    </div>
                  )}
                </div>

                {/* Meta FanPage & Instagram Box */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800 flex items-center gap-1.5">
                      <Facebook className="w-4 h-4 text-blue-600" /> FanPage & Instagram
                    </span>
                    {healthReport?.pageInfo?.canPost ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold text-[10px]">
                        Listo para Publicar
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-semibold text-[10px]">
                        Acceso Limitado
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-gray-600">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Nombre de Página:</span>
                      <strong className="text-gray-900 truncate max-w-[160px]">
                        {healthReport?.pageInfo?.name || accountStatus.pageName || "Sin vincular"}
                      </strong>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">ID de Facebook:</span>
                      <strong className="font-mono text-gray-800">
                        {healthReport?.pageInfo?.id || accountStatus.pageId || "Ninguno"}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Instagram Business:</span>
                      {healthReport?.instagramInfo?.isConnected ? (
                        <span className="text-pink-600 font-semibold truncate max-w-[160px]">
                          {healthReport.instagramInfo.username || accountStatus.instagramUsername || "Vinculado"}
                        </span>
                      ) : (
                        <span className="text-gray-400">No vinculado a FanPage</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Scopes Checklist */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Permisos de Meta Graph API Verificados
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    {
                      scope: "pages_manage_posts",
                      desc: "Creación automática de publicaciones con imágenes",
                    },
                    {
                      scope: "pages_read_engagement",
                      desc: "Lectura de reacciones, comentarios y alcance orgánico",
                    },
                    {
                      scope: "pages_show_list",
                      desc: "Descubrimiento de FanPages administradas por el negocio",
                    },
                    {
                      scope: "instagram_basic",
                      desc: "Publicación sincronizada en cuenta de Instagram",
                    },
                  ].map((item) => {
                    const hasScope =
                      healthReport?.tokenInfo?.scopes?.includes(item.scope) ||
                      healthReport?.isSimulated;
                    return (
                      <div
                        key={item.scope}
                        className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                          hasScope
                            ? "bg-emerald-50/40 border-emerald-200"
                            : "bg-gray-50 border-gray-200 opacity-75"
                        }`}
                      >
                        {hasScope ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-gray-800">
                              {item.scope}
                            </span>
                            {hasScope && (
                              <span className="text-[10px] text-emerald-700 font-semibold">
                                Activo
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Issues / Recommendations */}
              {healthReport?.issues && healthReport.issues.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Alertas & Recomendaciones del Diagnóstico
                  </h4>
                  <div className="space-y-2">
                    {healthReport.issues.map((issue, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                          issue.severity === "error"
                            ? "bg-rose-50 border-rose-200 text-rose-900"
                            : issue.severity === "warning"
                            ? "bg-amber-50 border-amber-200 text-amber-900"
                            : "bg-blue-50 border-blue-200 text-blue-900"
                        }`}
                      >
                        <div>
                          <strong className="font-bold block">{issue.title}</strong>
                          <p className="opacity-90 mt-0.5">{issue.description}</p>
                        </div>
                        {issue.action && (
                          <span className="px-2 py-1 bg-white rounded-lg font-bold text-[10px] shadow-sm flex-shrink-0">
                            {issue.action}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-[11px] text-gray-400">
                  Última inspección: {healthReport?.checkedAt ? new Date(healthReport.checkedAt).toLocaleTimeString("es-CO") : "Reciente"}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowHealthModal(false);
                      setShowConfigModal(true);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                  >
                    Editar Credenciales
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowHealthModal(false)}
                    className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Grid: Left editor & product selection, Right live preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (7 cols): Product Selector & Content Editor */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Select Product or Promotion */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                    1
                  </span>
                  Selecciona el Producto o Promoción
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Elige el plato existente que deseas promocionar en Facebook.
                </p>
              </div>

              {/* Filter chips */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
                    filterType === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Todos ({products.length})
                </button>
                <button
                  onClick={() => setFilterType("promo")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                    filterType === "promo" ? "bg-white text-rose-600 shadow-sm" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <Flame className="w-3 h-3 text-rose-500" /> Promos
                </button>
                <button
                  onClick={() => setFilterType("combo")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
                    filterType === "combo" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Combos
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o ingrediente..."
                className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>

            {/* Products List */}
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-xs">
                  No se encontraron productos que coincidan con la búsqueda.
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const isSelected = selectedProduct?.id === p.id;
                  const img = p.images?.[0] || restaurant.coverImage || restaurant.logo || "";
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProduct(p)}
                      className={`group flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={img}
                          alt={p.name}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-gray-100 border border-gray-200"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs md:text-sm text-gray-900 truncate">
                              {p.name}
                            </span>
                            {(p as any).restaurantName && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 truncate max-w-[120px]">
                                {(p as any).restaurantName}
                              </span>
                            )}
                            {p.hasDiscount && p.discountPercentage && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                                {p.discountPercentage}% OFF
                              </span>
                            )}
                            {p.isPromotion && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                                Promo
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 truncate max-w-xs">
                            {p.description || p.category}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <span className="block font-bold text-xs md:text-sm text-gray-900">
                            ${p.price.toLocaleString("es-CO")}
                          </span>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition ${
                            isSelected
                              ? "bg-blue-600 text-white"
                              : "border border-gray-300 group-hover:border-gray-400"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Step 2: Custom Image Selection & Upload for the Post */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                    2
                  </span>
                  Imagen de la Publicación (Foto o Volante)
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  La imagen exacta que se publicará en Facebook junto con la promoción y el enlace inteligente.
                </p>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageFileUpload}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="px-3.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                {isUploadingImage ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" /> Subir Otra Imagen
                  </>
                )}
              </button>
            </div>

            {/* Image Preview & Alternative Source Selectors */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative w-full sm:w-44 h-32 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0 group">
                <img
                  src={postImageUrl}
                  alt="Imagen a publicar"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2 py-1 bg-white text-gray-900 rounded-lg text-xs font-medium shadow"
                  >
                    Cambiar
                  </button>
                </div>
                <div className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
                  Para Facebook
                </div>
              </div>

              <div className="flex-1 space-y-2.5 w-full">
                <span className="text-xs font-semibold text-gray-700 block">
                  Opciones rápidas de imagen:
                </span>

                <div className="flex flex-wrap gap-2">
                  {selectedProduct?.images?.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPostImageUrl(img)}
                      className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition ${
                        postImageUrl === img ? "border-blue-600 ring-2 ring-blue-300" : "border-gray-200 hover:border-gray-400"
                      }`}
                      title={`Foto ${idx + 1} del plato`}
                    >
                      <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                    </button>
                  ))}

                  {restaurant.coverImage && (
                    <button
                      onClick={() => setPostImageUrl(restaurant.coverImage!)}
                      className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition ${
                        postImageUrl === restaurant.coverImage ? "border-blue-600 ring-2 ring-blue-300" : "border-gray-200 hover:border-gray-400"
                      }`}
                      title="Portada del restaurante"
                    >
                      <img src={restaurant.coverImage} alt="Portada" className="w-full h-full object-cover" />
                    </button>
                  )}

                  {restaurant.logo && (
                    <button
                      onClick={() => setPostImageUrl(restaurant.logo!)}
                      className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition ${
                        postImageUrl === restaurant.logo ? "border-blue-600 ring-2 ring-blue-300" : "border-gray-200 hover:border-gray-400"
                      }`}
                      title="Logo del restaurante"
                    >
                      <img src={restaurant.logo} alt="Logo" className="w-full h-full object-cover" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={postImageUrl}
                    onChange={(e) => setPostImageUrl(e.target.value)}
                    placeholder="O pega una URL de imagen aquí (https://...)"
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Smart Link Display & Explainer */}
          <div className="bg-gradient-to-br from-indigo-50/80 via-blue-50/60 to-purple-50/50 rounded-2xl border border-indigo-100 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold">
                  3
                </span>
                Enlace Inteligente Generado (Smart Link)
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full">
                <Bot className="w-3 h-3" /> Conexión con Agente Gemini
              </span>
            </div>

            <p className="text-xs text-indigo-950/80 leading-relaxed">
              Cuando el cliente toque este enlace en tu publicación de Facebook, se abrirá tu restaurante y <strong>tu agente de IA Gemini se iniciará automáticamente con el plato cargado</strong>, listo para tomar su orden y responder preguntas sobre la promoción.
            </p>

            <div className="flex items-center gap-2 bg-white/90 p-2.5 rounded-xl border border-indigo-200/80">
              <LinkIcon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <input
                type="text"
                readOnly
                value={smartLink}
                className="w-full text-xs font-mono text-gray-700 bg-transparent focus:outline-none truncate"
              />
              <button
                onClick={() => copyToClipboard(smartLink, "Enlace Inteligente")}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition flex-shrink-0"
              >
                <Copy className="w-3 h-3" /> Copiar
              </button>
              <a
                href={smartLink}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                title="Abrir y probar experiencia del cliente"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Step 4: Caption Editor & Copywriting */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                    4
                  </span>
                  Redacción de la Promoción & Copywriting
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  El texto persuasivo que acompañará a la foto en tu publicación.
                </p>
              </div>

              {selectedProduct && (
                <button
                  onClick={() => generateSmartCopy(selectedProduct)}
                  className="px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Generar con IA
                </button>
              )}
            </div>

            <textarea
              rows={6}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Escribe el texto de tu publicación aquí..."
              className="w-full p-3.5 text-xs md:text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition leading-relaxed"
            />

            {/* Platform destinations */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <span className="text-xs font-semibold text-gray-700">
                Canales de publicación:
              </span>

              <div className="flex items-center gap-4 text-xs font-medium">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={publishToFacebook}
                    onChange={(e) => setPublishToFacebook(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="flex items-center gap-1 text-gray-700">
                    <Facebook className="w-3.5 h-3.5 text-blue-600" /> FanPage de Facebook
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={publishToInstagram}
                    onChange={(e) => setPublishToInstagram(e.target.checked)}
                    className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
                  />
                  <span className="flex items-center gap-1 text-gray-700">
                    <Instagram className="w-3.5 h-3.5 text-pink-600" /> Instagram Business
                  </span>
                </label>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="w-full sm:flex-1 py-3 px-5 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-600 hover:from-blue-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPublishing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Publicando en Facebook...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Publicar Ahora en Facebook
                  </>
                )}
              </button>

              <button
                onClick={copyFullPost}
                className="w-full sm:w-auto py-3 px-4 rounded-xl font-medium text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 transition flex items-center justify-center gap-1.5"
                title="Copiar texto y enlace para historias de Instagram o WhatsApp"
              >
                <Copy className="w-3.5 h-3.5" /> Copiar para Historias / WhatsApp
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Live Preview Mockup */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-6 space-y-4">
            {/* Preview switcher */}
            <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 p-2 shadow-sm">
              <span className="text-xs font-bold text-gray-600 px-3">
                Vista Previa en Vivo
              </span>
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setPreviewPlatform("facebook")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                    previewPlatform === "facebook"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Facebook className="w-3.5 h-3.5" /> Facebook
                </button>
                <button
                  onClick={() => setPreviewPlatform("instagram")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                    previewPlatform === "instagram"
                      ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Instagram className="w-3.5 h-3.5" /> Instagram
                </button>
              </div>
            </div>

            {/* Mockup Card */}
            {previewPlatform === "facebook" ? (
              /* Facebook Feed Mockup */
              <div className="bg-white rounded-2xl border border-gray-300 shadow-xl overflow-hidden text-gray-900">
                {/* FB Post Header */}
                <div className="p-4 flex items-center justify-between border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={accountStatus.pictureUrl || restaurant.logo || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100"}
                      alt={restaurant.name}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    />
                    <div>
                      <div className="font-bold text-sm text-gray-900 flex items-center gap-1">
                        {accountStatus.pageName || `${restaurant.name} (FanPage)`}
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-500 text-white" />
                      </div>
                      <div className="text-[11px] text-gray-500 flex items-center gap-1">
                        <span>Hace un momento</span>
                        <span>·</span>
                        <span>🌐 Público</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FB Post Text */}
                <div className="px-4 py-3 text-xs md:text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                  {caption || "Tu texto de publicación aparecerá aquí..."}
                </div>

                {/* FB Post Image (The exact image inserted in the creator!) */}
                <div className="relative aspect-video bg-gray-100 overflow-hidden border-y border-gray-100">
                  <img
                    src={postImageUrl}
                    alt={selectedProduct?.name || "Foto de la promoción"}
                    className="w-full h-full object-cover"
                  />
                  {selectedProduct && (
                    <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-lg">
                      ${selectedProduct.price.toLocaleString("es-CO")}
                    </div>
                  )}
                </div>

                {/* FB Link Attachment Card */}
                <a
                  href={smartLink}
                  target="_blank"
                  rel="noreferrer"
                  className="block p-3 bg-gray-50 hover:bg-gray-100 transition group border-b border-gray-100"
                >
                  <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold truncate">
                    {window.location.hostname}
                  </div>
                  <div className="font-bold text-xs md:text-sm text-gray-900 group-hover:text-blue-600 transition truncate">
                    {selectedProduct ? `Pedir ${selectedProduct.name} - ${restaurant.name}` : `Pedir en ${restaurant.name}`}
                  </div>
                  <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                    <Bot className="w-3 h-3 text-indigo-600" />
                    <span>Abre tu restaurante y asistente Gemini al instante</span>
                  </div>
                </a>

                {/* FB Post Footer Reactions */}
                <div className="px-4 py-2.5 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <span className="flex -space-x-1">
                      <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white">👍</span>
                      <span className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[10px] text-white">❤️</span>
                    </span>
                    <span>54 reacciones</span>
                  </div>
                  <span>18 comentarios</span>
                </div>
              </div>
            ) : (
              /* Instagram Feed Mockup */
              <div className="bg-white rounded-2xl border border-gray-300 shadow-xl overflow-hidden text-gray-900">
                {/* IG Post Header */}
                <div className="p-3.5 flex items-center justify-between border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-0.5 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
                      <img
                        src={accountStatus.pictureUrl || restaurant.logo || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100"}
                        alt={restaurant.name}
                        className="w-8 h-8 rounded-full object-cover border-2 border-white"
                      />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-gray-900 flex items-center gap-1">
                        {accountStatus.instagramUsername || `@${restaurant.name.toLowerCase().replace(/\s+/g, "_")}`}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {restaurant.city || "Colombia"} · Pedido Directo
                      </div>
                    </div>
                  </div>
                </div>

                {/* IG Square Photo */}
                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                  <img
                    src={postImageUrl}
                    alt={selectedProduct?.name || "Foto de la promoción"}
                    className="w-full h-full object-cover"
                  />
                  {selectedProduct && (
                    <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-pink-400" />
                      ${selectedProduct.price.toLocaleString("es-CO")}
                    </div>
                  )}
                </div>

                {/* IG Action Icons */}
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between text-gray-800">
                    <div className="flex items-center gap-3">
                      <span className="text-base cursor-pointer hover:text-red-500 transition">❤️</span>
                      <span className="text-base cursor-pointer hover:text-blue-500 transition">💬</span>
                      <span className="text-base cursor-pointer hover:text-gray-900 transition">↗️</span>
                    </div>
                    <span className="text-base cursor-pointer">🔖</span>
                  </div>

                  {/* IG Caption */}
                  <div className="text-xs text-gray-800 leading-relaxed max-h-36 overflow-y-auto pr-1">
                    <span className="font-bold mr-1">
                      {accountStatus.instagramUsername || `@${restaurant.name.toLowerCase().replace(/\s+/g, "_")}`}
                    </span>
                    <span className="whitespace-pre-line">{caption}</span>
                  </div>

                  {/* Smart Link CTA in Instagram */}
                  <a
                    href={smartLink}
                    target="_blank"
                    rel="noreferrer"
                    className="block mt-2 p-2 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-pink-200 text-center text-xs font-bold text-pink-700 hover:opacity-90 transition"
                  >
                    🔗 Enlace en Bio: Toca aquí para pedir
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Publications History & Metrics */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <h3 className="font-bold text-gray-900 text-base md:text-lg flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-indigo-600" />
              Historial de Publicaciones & Métricas en Vivo Meta
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Campañas lanzadas en Facebook e Instagram con alcance, reacciones, clics y conversiones registradas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncAllMetrics}
              disabled={isSyncingAll || postHistory.length === 0}
              className="px-3.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition flex items-center gap-1.5 border border-indigo-200 disabled:opacity-50"
              title="Sincronizar métricas de impresiones, likes y clics desde Meta"
            >
              <BarChart2 className={`w-3.5 h-3.5 ${isSyncingAll ? "animate-spin" : ""}`} />
              {isSyncingAll ? "Sincronizando..." : "Sincronizar Métricas Meta"}
            </button>

            <button
              onClick={fetchHistory}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition"
              title="Actualizar lista de publicaciones"
            >
              <RefreshCw className={`w-4 h-4 ${loadingHistory ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {postHistory.length === 0 ? (
          <div className="text-center py-12 text-gray-400 space-y-2">
            <Share2 className="w-10 h-10 mx-auto opacity-30" />
            <p className="text-xs md:text-sm">Aún no has creado publicaciones para este restaurante.</p>
            <p className="text-[11px] text-gray-400">
              Selecciona un producto arriba y pulsa "Publicar Ahora en Facebook" para comenzar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {postHistory.map((post) => {
              const trackingRedirectUrl = `${baseUrl}/api/social/track-redirect/${post.id}?to=${encodeURIComponent(post.smartLink)}`;
              const isSyncingThis = syncingMetricsId === post.id;

              return (
                <div
                  key={post.id}
                  className="p-4 rounded-2xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg transition flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2.5">
                    {/* Header: Name and social channels */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-xs md:text-sm text-gray-900 block truncate">
                          {post.productName}
                        </span>
                        <span className="text-[10px] text-gray-400 block">
                          {new Date(post.publishedAt).toLocaleString("es-CO", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {post.isSimulated && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Prueba
                          </span>
                        )}
                        {post.publishToFacebook && (
                          <div
                            className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold"
                            title="Publicado en Facebook"
                          >
                            f
                          </div>
                        )}
                        {post.publishToInstagram && (
                          <div
                            className="w-5 h-5 rounded-full bg-pink-600 text-white flex items-center justify-center text-[10px]"
                            title="Publicado en Instagram"
                          >
                            📸
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Post image */}
                    {post.imageUrl && (
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                        <img
                          src={post.imageUrl}
                          alt={post.productName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Caption snippet */}
                    <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">
                      {post.caption}
                    </p>
                  </div>

                  {/* Phase 3: Metrics Dashboard Bar */}
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <div className="grid grid-cols-4 gap-1 text-center bg-gray-50 p-2 rounded-xl border border-gray-100">
                      <div title="Vistas e Impresiones en Meta">
                        <span className="block text-[10px] text-gray-400 font-medium">Vistas</span>
                        <strong className="block text-xs font-bold text-gray-800">
                          {post.metrics?.impressions || 0}
                        </strong>
                      </div>
                      <div title="Reacciones y Me Gusta">
                        <span className="block text-[10px] text-gray-400 font-medium">Likes</span>
                        <strong className="block text-xs font-bold text-rose-600 flex items-center justify-center gap-0.5">
                          <Heart className="w-2.5 h-2.5 fill-rose-600" />
                          {post.metrics?.reactions || 0}
                        </strong>
                      </div>
                      <div title="Comentarios">
                        <span className="block text-[10px] text-gray-400 font-medium">Coments</span>
                        <strong className="block text-xs font-bold text-blue-600">
                          {post.metrics?.comments || 0}
                        </strong>
                      </div>
                      <div title="Clics en Enlace Inteligente">
                        <span className="block text-[10px] text-indigo-500 font-medium">Clics</span>
                        <strong className="block text-xs font-extrabold text-indigo-700">
                          {post.metrics?.clicks || 0}
                        </strong>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                      <button
                        onClick={() => handleSyncMetrics(post.id)}
                        disabled={isSyncingThis}
                        className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold transition disabled:opacity-50"
                        title="Consultar métricas en tiempo real de este post"
                      >
                        <RefreshCw className={`w-3 h-3 ${isSyncingThis ? "animate-spin" : ""}`} />
                        <span>{isSyncingThis ? "Actualizando..." : "Sincronizar"}</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => copyToClipboard(trackingRedirectUrl, "Enlace rastreable")}
                          className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1 text-[10px] font-bold"
                          title="Copiar enlace con contador inteligente de clics"
                        >
                          <LinkIcon className="w-3 h-3" /> Link Rastreo
                        </button>
                        <a
                          href={post.smartLink}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900 transition"
                          title="Probar enlace directo"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
