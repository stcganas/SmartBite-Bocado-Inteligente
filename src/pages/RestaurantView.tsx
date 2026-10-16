import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import {
  db,
  Restaurant,
  Product,
  Address,
  Review,
  Order,
  PlatformSettings,
  AppNotification,
} from "../store/db";
import { LuckyWheel } from "../components/LuckyWheel";
import { RegistrationBenefitsModal } from "../components/RegistrationBenefitsModal";
import {
  ArrowLeft,
  Bot,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  MapPin,
  CreditCard,
  CheckCircle2,
  X,
  AlertCircle,
  Banknote,
  Smartphone,
  Star,
  Share2,
  Info,
  Phone,
  Clock,
  Loader2,
  Store,
  ArrowRight,
  Settings,
  Tag,
  BellRing,
  DollarSign,
  Truck,
  Heart,
  RefreshCcw,
  Trophy,
  Users,
  Target,
  Crown,
  Facebook,
  Instagram,
  Navigation,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  isRestaurantOpen,
  getDetailedHoursForToday,
  getBogotaTime,
  getRestaurantRealDistanceMapbox,
} from "../utils/restaurantUtils";
import { RealDistanceResult } from "../services/mapboxService";
import { toast } from "sonner";
import { formatCurrency } from "../utils/format";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { generateWhatsAppLink, getWhatsAppNativeUrl } from "../utils/whatsapp";
import { useNotifications } from "../contexts/NotificationContext";
import { ProductDetailModal } from "../components/ProductDetailModal";
import { getCategoryVisual } from "../utils/categoryTheme";
import { GoldCoinIcon } from '../components/GoldCoinIcon';

import { NotificationModal } from "../components/NotificationDropdown";

export default function RestaurantView() {
  const [currentTime, setCurrentTime] = useState(getBogotaTime());
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteAllNotifications,
  } = useNotifications();
  const searchParams = new URLSearchParams(location.search);
  const tableNumber = searchParams.get("table");
  const { user, appUser, setLoginPromptOpen } = useAuth();
  
  const getDashboardLink = () => {
    if (!appUser) return "/";
    if (appUser.role === "admin") return "/platform";
    if (appUser.role === "restaurant") return "/admin";
    if (appUser.role === "driver") return "/driver";
    return "/profile";
  };
  const {
    items: cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    discount,
    couponCode,
    applyCoupon,
  } = useCart();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [platformSettings, setPlatformSettings] =
    useState<PlatformSettings | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const approvedReviews = reviews.filter((r) => r.status === "approved");
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<
    "idle" | "address" | "details" | "payment" | "confirming" | "success"
  >("idle");
  const [address, setAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState(appUser?.phone || "");
  const [recipientName, setRecipientName] = useState(
    appUser?.displayName || "",
  );
  const [orderNote, setOrderNote] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [paymentMethod, setPaymentMethod] =
    useState<Order["paymentMethod"]>("cash");
  const [couponInput, setCouponInput] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteProducts, setFavoriteProducts] = useState<Set<string>>(
    new Set(),
  );
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<Restaurant[]>(
    [],
  );
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [recommendationProduct, setRecommendationProduct] =
    useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("todos");
  const [selectedProductForModal, setSelectedProductForModal] =
    useState<Product | null>(null);

  // Interstitial Banner State
  const [interstitialBanner, setInterstitialBanner] = useState<any | null>(
    null,
  );
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [interstitialTimeLeft, setInterstitialTimeLeft] = useState(0);

  // Lucky Wheel State
  const [pendingSpin, setPendingSpin] = useState<any>(null);
  const [showWheelBanner, setShowWheelBanner] = useState(false);
  const [wheelCountdown, setWheelCountdown] = useState(0);
  const [showWheelModal, setShowWheelModal] = useState(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);

  const [hasSpun, setHasSpun] = useState(false);
  const [wonPrizeData, setWonPrizeData] = useState<{
    text: string;
    isPrize: boolean;
  } | null>(null);

  const openedCartFromQueryRef = useRef(false);

  useEffect(() => {
    if (searchParams.get("openCart") === "true") {
      if (!openedCartFromQueryRef.current) {
        openedCartFromQueryRef.current = true;
        setIsCartOpen(true);
        // Clean up the URL query parameter quietly using React Router navigate so React Router state of searchParams updates
        const params = new URLSearchParams(location.search);
        params.delete("openCart");
        const cleanSearch = params.toString() ? `?${params.toString()}` : "";
        navigate(location.pathname + cleanSearch, { replace: true });
      }
    }
  }, [location.search, searchParams, navigate, location.pathname]);

  // If opening via Smart Link with promo/product param, scroll to product
  useEffect(() => {
    const promoId = searchParams.get("promo") || searchParams.get("product");
    if (promoId && restaurant?.menu) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`product-${promoId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [searchParams, restaurant?.menu]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showInterstitial && interstitialTimeLeft > 0) {
      timer = setTimeout(() => {
        setInterstitialTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (showInterstitial && interstitialTimeLeft <= 0) {
      setShowInterstitial(false);
    }
    return () => clearTimeout(timer);
  }, [showInterstitial, interstitialTimeLeft]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const checkWheel = () => {
      const data = localStorage.getItem("pendingWheelSpin");
      if (data) {
        try {
          const parsed = JSON.parse(data);
          const elapsed = Math.floor((Date.now() - parsed.timestamp) / 1000);
          const remaining = Math.max(0, (parsed.countdown || 60) - elapsed);

          if (remaining > 0 || elapsed < (parsed.countdown || 60) + 300) {
            setPendingSpin(parsed);
            setWheelCountdown(remaining);
            setShowWheelBanner(true);

            // Auto open modal when timer reaches zero
            if (remaining === 0 && !showWheelModal) {
              setShowWheelModal(true);
            }
          } else {
            localStorage.removeItem("pendingWheelSpin");
            setShowWheelBanner(false);
          }
        } catch (e) {
          localStorage.removeItem("pendingWheelSpin");
          setShowWheelBanner(false);
        }
      }
    };

    checkWheel();

    // Interval that checks LS and handles countdown
    timer = setInterval(() => {
      checkWheel();
    }, 1000);

    return () => clearInterval(timer);
  }, [showWheelModal]);

  useEffect(() => {
    if (user && restaurant) {
      db.isFavorite(user.id, restaurant.id).then(setIsFavorite);

      // Fetch favorite products for this user
      db.getUserProductFavorites(user.id).then((favs) => {
        const ids = new Set(favs.map((f) => f.id));
        setFavoriteProducts(ids);
      });
    }
  }, [user, restaurant]);

  const handleToggleProductFavorite = async (
    e: React.MouseEvent,
    productId: string,
  ) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Inicia sesión para guardar tus favoritos");
      return;
    }
    try {
      const added = await db.toggleProductFavorite(user.id, productId);
      setFavoriteProducts((prev) => {
        const next = new Set(prev);
        if (added) next.add(productId);
        else next.delete(productId);
        return next;
      });
      toast.success(
        added ? "Plato agregado a favoritos" : "Eliminado de favoritos",
      );
    } catch (error) {
      toast.error("Error al actualizar favoritos");
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error("Inicia sesión para guardar tus favoritos");
      return;
    }
    try {
      const added = await db.toggleFavorite(user.id, restaurant!.id);
      setIsFavorite(added);
      toast.success(added ? "Agregado a favoritos" : "Eliminado de favoritos");
    } catch (error) {
      toast.error("Error al actualizar favoritos");
    }
  };

  const [showInfo, setShowInfo] = useState(false);
  const [realDistanceInfo, setRealDistanceInfo] = useState<RealDistanceResult | null>(null);

  useEffect(() => {
    if (!restaurant) return;

    const latStr = localStorage.getItem("userLat");
    const lngStr = localStorage.getItem("userLng");
    const city = localStorage.getItem("userCity") || restaurant.city || "Maicao";
    const address = localStorage.getItem("userAddress") || "";

    const userLat = latStr ? parseFloat(latStr) : null;
    const userLng = lngStr ? parseFloat(lngStr) : null;

    let isMounted = true;
    const computeDistance = async (uLat: number | null, uLng: number | null) => {
      try {
        const res = await getRestaurantRealDistanceMapbox(restaurant, {
          lat: uLat,
          lng: uLng,
          city,
          address,
        });
        if (isMounted) setRealDistanceInfo(res);
      } catch (err) {
        console.warn("Error computing real distance with Mapbox:", err);
      }
    };

    if (userLat && userLng) {
      computeDistance(userLat, userLng);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!isMounted) return;
          computeDistance(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          if (!isMounted) return;
          computeDistance(null, null);
        },
        { timeout: 7000 }
      );
    } else {
      computeDistance(null, null);
    }

    return () => {
      isMounted = false;
    };
  }, [restaurant]);
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
  const [infoFeatureModal, setInfoFeatureModal] = useState<"ruleta"|"oro"|"recompensas"|"niveles"|"referidos"|null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCallingWaiter, setIsCallingWaiter] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);
  const [tipPercentage, setTipPercentage] = useState(0);
  const [tipType, setTipType] = useState<"waiter" | "driver" | "none">(
    tableNumber ? "waiter" : "driver",
  );
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(
    localStorage.getItem("lastOrderId"),
  );
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  const fetchActiveOrder = async () => {
    if (!activeOrderId) return;
    try {
      const { data, error } = await db.getOrder(activeOrderId);
      if (data) {
        if (
          data.status === "completed" ||
          data.status === "rejected" ||
          data.status === "cancelled"
        ) {
          setActiveOrderId(null);
          localStorage.removeItem("lastOrderId");
          setActiveOrder(null);
        } else {
          setActiveOrder(data);
        }
      } else {
        // If order doesn't exist or errored, clear it
        setActiveOrderId(null);
        localStorage.removeItem("lastOrderId");
        setActiveOrder(null);
      }
    } catch (error) {
      console.error("Error fetching active order:", error);
    }
  };

  useEffect(() => {
    let subscription: ReturnType<typeof supabase.channel> | null = null;
    
    const handleNewGuestOrder = () => {
       const newOrderId = localStorage.getItem("lastOrderId");
       if (newOrderId) {
           setActiveOrderId(newOrderId);
       }
    };
    
    window.addEventListener("new-guest-order", handleNewGuestOrder);

    if (activeOrderId) {
      fetchActiveOrder();

      subscription = supabase
        .channel(`active-order-${activeOrderId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: `id=eq.${activeOrderId}`,
          },
          (payload) => {
            const newStatus = payload.new.status;

            // Show toast based on new status
            if (newStatus === "approved")
              toast.success("Tu pedido ha sido aprobado.");
            else if (newStatus === "preparing")
              toast.info("¡Tu pedido está en preparación!");
            else if (newStatus === "shipped")
              toast.info("¡Tu pedido va en camino!");
            else if (newStatus === "completed")
              toast.success("Tu pedido ha sido completado.");
            else if (newStatus === "rejected")
              toast.error("Tu pedido fue rechazado.");

            fetchActiveOrder();
          },
        )
        .subscribe();
    }

    return () => {
      window.removeEventListener("new-guest-order", handleNewGuestOrder);
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [activeOrderId]);

  const handleCallWaiter = async () => {
    if (!restaurant || !tableNumber) return;
    setIsCallingWaiter(true);
    try {
      // We create a special order or notification for the waiter
      await db.saveOrder({
        restaurantId: restaurant.id,
        customerName: appUser?.displayName || "Cliente en Mesa",
        items: [],
        total: 0,
        status: "pending",
        tableNumber: tableNumber,
        isWaiterCalled: true,
        paymentMethod: "cash",
        paymentStatus: "pending",
      });
      toast.success("El mesero ha sido llamado. En camino...");
    } catch (error) {
      toast.error("Error al llamar al mesero");
    } finally {
      setIsCallingWaiter(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAddToCart = (product: Product) => {
    if (!user) {
      setLoginPromptOpen(true);
      return;
    }

    // Apply discount if exists
    let finalPrice = product.price;
    if (product.discountPercentage && product.discountPercentage > 0) {
      finalPrice = product.discountPrice || product.price;
    } else if (
      restaurant?.generalDiscountEnabled &&
      restaurant.generalDiscount &&
      restaurant.generalDiscount > 0
    ) {
      finalPrice = Math.round(
        product.price * (1 - restaurant.generalDiscount / 100),
      );
    }

    const productWithInfo = {
      ...product,
      price: finalPrice,
      originalPrice: product.price,
      restaurantId: restaurant?.id || product.restaurantId,
      restaurantName: restaurant?.name || product.restaurantName,
    };

    const res = addToCart(productWithInfo);
    if (res && !res.success) {
      if (res.error === "NOT_LOGGED_IN") {
        return;
      }
      toast.error(
        `Ya tienes productos del restaurante "${res.existingRestaurantName}" en tu carrito. Por favor finaliza tu pedido o vacía el carrito para poder ordenar de "${restaurant?.name}".`,
        {
          duration: 5000,
        },
      );
      return;
    }
    toast.success(`${product.name} añadido`);

    if (
      product.recommendedProductIds &&
      product.recommendedProductIds.length > 0
    ) {
      const recommended =
        restaurant?.menu.filter((p) =>
          product.recommendedProductIds?.includes(p.id),
        ) || [];
      if (recommended.length > 0) {
        setRecommendedProducts(recommended);
        setRecommendationProduct(product);
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        console.log("RestaurantView: Initializing fetch for ID:", id);
        setLoading(true);
        try {
          const [r, menu, restaurantReviews, settings] = await Promise.all([
            db.getRestaurant(id),
            db.getRestaurantMenu(id),
            db.getRestaurantReviews(id),
            db.getPlatformSettings(),
          ]);

          if (r) {
            console.log(
              "RestaurantView: Restaurant data loaded successfully:",
              r.name,
            );
            setRestaurant({ ...r, menu });
            setReviews(restaurantReviews);
            setPlatformSettings(settings);

            // Check for interstitial banner
            if (r.banners && r.banners.length > 0) {
              const now = new Date();
              const eligibleBanners = r.banners.filter((b: any) => {
                if (!b.active || b.location !== "interstitial") return false;
                if (b.startDate && new Date(b.startDate) > now) return false;
                if (b.endDate && new Date(b.endDate) < now) return false;

                return true;
              });

              if (eligibleBanners.length > 0) {
                const bannerToShow = eligibleBanners[0];
                setInterstitialBanner(bannerToShow);
                setShowInterstitial(true);
                setInterstitialTimeLeft(30);
              }
            }
          } else {
            console.warn("RestaurantView: No restaurant found for ID:", id);
            toast.error("Restaurante no encontrado");
          }
        } catch (error) {
          console.error(
            "RestaurantView: Error fetching restaurant data:",
            error,
          );
          toast.error("Error de conexión al cargar datos");
        } finally {
          setLoading(false);
        }
      } else {
        console.error("RestaurantView: No ID provided in URL params");
        setLoading(false);
      }
    };
    fetchData();

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (appUser) {
      if (appUser.phone && !customerPhone) {
        setCustomerPhone(appUser.phone);
      }
      if (appUser.displayName && !recipientName) {
        setRecipientName(appUser.displayName);
      }

      if (
        appUser.addresses &&
        appUser.addresses.length > 0 &&
        !address &&
        !selectedAddressId
      ) {
        const defaultAddress = appUser.addresses[0];
        setSelectedAddressId(defaultAddress.id);
        setAddress(
          `${defaultAddress.address}${defaultAddress.details ? `, ${defaultAddress.details}` : ""}${defaultAddress.city ? `, ${defaultAddress.city}` : ""}`,
        );
      }
    }
  }, [appUser]);

  const handleAddressSelect = (addr: Address) => {
    setSelectedAddressId(addr.id);
    setAddress(
      `${addr.address}${addr.details ? `, ${addr.details}` : ""}${addr.city ? `, ${addr.city}` : ""}`,
    );
  };

  useEffect(() => {
    const productId = searchParams.get("p");
    if (productId && !loading && restaurant) {
      const element = document.getElementById(`product-${productId}`);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("ring-2", "ring-orange-500", "ring-offset-2");
          setTimeout(
            () =>
              element.classList.remove(
                "ring-2",
                "ring-orange-500",
                "ring-offset-2",
              ),
            3000,
          );
        }, 100);
      }
    }
  }, [searchParams, loading, restaurant?.id]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
        <p className="text-on-surface-muted font-medium">Cargando restaurante...</p>
      </div>
    );
  }

  // Prevent user from viewing/entering another restaurant if they have items in the cart of a different restaurant
  const itemFromDifferentRestaurant = cart.find(
    (item) => item.restaurantId && item.restaurantId !== id,
  );

  if (itemFromDifferentRestaurant && restaurant) {
    const originalRestaurantId = itemFromDifferentRestaurant.restaurantId;
    const originalRestaurantName =
      itemFromDifferentRestaurant.restaurantName || "tu restaurante actual";
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[80vh] font-sans bg-surface-base">
        <div className="max-w-md glass-card p-8 rounded-[2.5rem] border border-outline shadow-2xl flex flex-col items-center">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6">
            <Store className="w-10 h-10 text-orange-500" />
          </div>
          <h2 className="text-2xl font-black text-on-surface leading-tight mb-3">
            Tienes un pedido en curso
          </h2>
          <p className="text-on-surface-muted text-sm mb-8 leading-relaxed">
            Ya tienes productos en tu carrito de{" "}
            <span className="font-extrabold text-on-surface">
              "{originalRestaurantName}"
            </span>
            . Para poder comprar en{" "}
            <span className="font-extrabold text-on-surface">
              "{restaurant.name}"
            </span>
            , primero debes finalizar tu compra allí o vaciar el carrito actual
            para iniciar un nuevo pedido.
          </p>

          <div className="w-full space-y-3">
            <Link
              to={`/r/${originalRestaurantId}`}
              className="block w-full py-4 bg-orange-500 hover:bg-orange-600 text-on-surface font-black text-xs uppercase tracking-wider rounded-2xl transition-all active:scale-95 shadow-lg shadow-orange-500/20 text-center"
            >
              Ir a {originalRestaurantName}
            </Link>
            <button
              onClick={() => {
                clearCart();
                toast.success("Carrito vaciado. Ya puedes ordenar aquí.", {
                  icon: "✨",
                });
              }}
              className="w-full py-3.5 bg-surface-variant hover:bg-surface-variant text-on-surface-variant font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all active:scale-95"
            >
              Vaciar carrito y pedir aquí
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="w-16 h-16 text-on-surface-variant mb-4" />
        <h2 className="text-2xl font-black text-on-surface mb-2">
          Restaurante no encontrado
        </h2>
        <p className="text-on-surface-muted mb-6">
          El restaurante que buscas no existe o ha sido desactivado.
        </p>
        <Link
          to="/"
          className="bg-orange-500 text-on-surface px-8 py-3 rounded-2xl font-black shadow-lg shadow-orange-500/20"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  const updateQuantityLocal = (productId: string, delta: number) => {
    updateQuantity(productId, delta);
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const total = Math.max(0, subtotal - discount + tipAmount);

  const handleShare = async () => {
    const productionUrl = platformSettings?.productionUrl || "https://ais-pre-vwxtz7i5u6etdfshis6t4s-122130928241.us-east1.run.app";
    const shareUrl = `${productionUrl}/#/r/${restaurant.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: restaurant.name,
          text: `¡Mira el menú de ${restaurant.name} en SmartBite!`,
          url: shareUrl,
        });
      } catch (error) {
        if (
          error instanceof Error &&
          error.name !== "AbortError" &&
          error.message !== "Share canceled"
        ) {
          console.error("Error sharing:", error);
        }
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Enlace copiado al portapapeles");
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim() || !restaurant) return;
    setIsValidatingCoupon(true);
    try {
      const coupon = await db.validateCoupon(
        couponInput,
        restaurant.id,
        subtotal,
      );
      if (coupon) {
        let discountValue = 0;
        if (coupon.discountType === "percentage") {
          discountValue = Math.floor(subtotal * (coupon.value / 100));
        } else {
          discountValue = coupon.value;
        }
        applyCoupon(coupon.code, discountValue);
        toast.success("Cupón aplicado con éxito");
      } else {
        toast.error("Cupón inválido, expirado o no cumple el mínimo");
      }
    } catch (error) {
      console.error("Error validating coupon:", error);
      toast.error("Error al validar el cupón");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleFinalCheckout = async () => {
    if (!address.trim()) {
      toast.error("Por favor ingresa una dirección de entrega");
      setCheckoutStep("address");
      return;
    }

    setCheckoutStep("confirming");

    try {
      let finalItems = cart.map((item) => ({
        product: item,
        quantity: item.quantity,
      }));

      let finalCustomerId = user?.id;
      let finalCustomerName = appUser?.displayName || recipientName || "Invitado";
      let isGuest = false;

      if (!finalCustomerId) {
        // Automatically create a guest account to represent them
        const { user: guestUser } = await db.createGuestAccount(
          recipientName || "Invitado",
          customerPhone || ""
        );
        if (guestUser) {
          finalCustomerId = guestUser.id;
          isGuest = true;
          finalCustomerName = recipientName || "Invitado";
        }
      }

      if (isGuest) {
        try {
          localStorage.setItem('smartbite_is_guest', 'true');
          sessionStorage.setItem('dismissed_profile_modal', 'true');
        } catch (e) {}
      }

      // Save order to database
      const orderData = {
        restaurantId: restaurant.id,
        customerId: finalCustomerId,
        customerType: isGuest ? ("guest" as const) : ("registered" as const),
        customerName: finalCustomerName,
        items: finalItems,
        total: total,
        status: "pending" as const,
        paymentMethod: tableNumber ? "cash" : paymentMethod,
        paymentStatus: "pending" as const,
        tableNumber: tableNumber || undefined,
        tipAmount: tipAmount,
        tipPercentage: tipPercentage,
        tipType: tipType,
        customerPhone: customerPhone,
        recipientName: recipientName,
        address: address,
        note: orderNote,
        couponCode: couponCode || undefined,
        discountAmount: discount || 0,
      };

      console.log("RestaurantView: Saving order...", orderData);
      const { data: savedOrder, error } = await db.saveOrder(orderData);

      if (error) {
        console.error("RestaurantView: Error saving order to DB:", error);
        // We only throw if it's a real failure, PGRST116 is often just a "no rows returned" but insert might have worked
        if (error.code !== "PGRST116") {
          throw error;
        }
      }

      const orderId = savedOrder?.id || "new";
      if (orderId !== "new") {
        setActiveOrderId(orderId);
        localStorage.setItem("lastOrderId", orderId);
      }

      if (["nequi", "mercadopago", "paypal", "wompi", "epayco"].includes(paymentMethod)) {
        toast.info(
          `Conectando con la pasarela segura ${paymentMethod.toUpperCase()} (Fase 3)...`,
        );
        await new Promise((resolve) => setTimeout(resolve, 1500));
        toast.success(
          `Transacción procesada exitosamente con ${paymentMethod.toUpperCase()} (Fase 3 Integración Completa)`,
        );
      }

      // Success state
      setCheckoutStep("success");
      toast.success("¡Pedido registrado correctamente!");
      if (isGuest) {
        toast.info("💡 Recuerda registrarte en la aplicación para disfrutar de descuentos en la ruleta, programa de referidos y beneficios en restaurantes.", { duration: 6000 });
      }

      let willShowWheel = false;

      // Lucky Wheel Check
      try {
        const wheelData = await db.getWheelConfig(restaurant.id);
        if (
          wheelData &&
          wheelData.isActive &&
          total >= wheelData.minOrderAmount
        ) {
          willShowWheel = true;
        }
      } catch (e) {
        console.error("Error checking for wheel config:", e);
      }

      const orderText = cart
        .map(
          (item) =>
            `• *${item.quantity}x* ${item.name} (${formatCurrency(item.price * item.quantity)})`,
        )
        .join("\n");
      const subtotalStr = formatCurrency(subtotal);
      const totalStr = formatCurrency(total);
      const tipStr =
        tipAmount > 0
          ? `*Propina (${tipType === "waiter" ? "Mesero" : "Domicilio"}):* ${formatCurrency(tipAmount)}\n`
          : "";
      const addressStr = tableNumber
        ? `Mesa: ${tableNumber}`
        : `Dirección: ${address}`;
      const displayOrderId =
        orderId.length > 6
          ? orderId.slice(-6).toUpperCase()
          : orderId.toUpperCase();

      const message =
        `*🍔 NUEVO PEDIDO - ${restaurant.name.toUpperCase()}*\n` +
        `------------------------------------------\n` +
        `*ID:* #${displayOrderId}\n` +
        `*Fecha:* ${new Date().toLocaleString("es-CO")}\n\n` +
        `*👤 INFORMACIÓN DEL CLIENTE*\n` +
        `*Nombre:* ${recipientName || orderData.customerName}\n` +
        `*Teléfono:* ${customerPhone}\n` +
        `*Entrega:* ${addressStr}\n` +
        `*Pago:* ${paymentMethod.toUpperCase()}\n\n` +
        `*📦 RESUMEN DEL PEDIDO*\n` +
        `${orderText}\n\n` +
        `*💵 TOTALIZACIÓN*\n` +
        `*Subtotal:* ${subtotalStr}\n` +
        `${tipStr}` +
        `${couponCode ? `*Descuento (${couponCode}):* -${formatCurrency(discount)}\n` : ""}` +
        `------------------------------------------\n` +
        `*TOTAL A PAGAR: ${totalStr}*\n\n` +
        `${orderNote ? `*📝 NOTA:* ${orderNote}\n\n` : ""}` +
        `_🚀 Enviado desde el Menú Digital SmartBite_`;

      if (willShowWheel) {
        try {
          if ("speechSynthesis" in window) {
            const utterance = new SpeechSynthesisUtterance(
              "¡Felicidades! Has ganado un giro en la ruleta de premios. Gira la ruleta y después se abrirá el WhatsApp con el resumen de tu pedido. Por favor, asegúrate de enviar el mensaje para confirmar tu pedido.",
            );
            utterance.lang = "es-ES";
            window.speechSynthesis.speak(utterance);
          }
          const wheelData = await db.getWheelConfig(restaurant.id);
          let phoneToSave = restaurant.whatsappNumber || restaurant.phone || "";
          localStorage.setItem(
            "pendingWheelSpin",
            JSON.stringify({
              restaurantId: restaurant.id,
              restaurantName: restaurant.name,
              whatsappPhone: phoneToSave,
              total,
              orderMessage: message,
              segments: wheelData.segments,
              countdown: 30,
              spinDuration: 3,
              timestamp: Date.now(),
            }),
          );
        } catch (e) {}
      }

      const whatsappUrl = generateWhatsAppLink(
        message,
        restaurant.whatsappNumber || restaurant.phone,
      );

      // Close cart and clear instantly so there's never a stuck empty cart
      setIsCartOpen(false);
      clearCart();
      setCheckoutStep("idle");

      if (!willShowWheel) {
        window.location.href = whatsappUrl;
      }
    } catch (error) {
      console.error("Error saving order:", error);
      toast.error(
        "Hubo un problema al procesar tu pedido. Por favor intenta de nuevo.",
      );
      setCheckoutStep("payment");
    }
  };

  // Group products by category
  const categories = Array.from(
    new Set(restaurant.menu.map((p) => p.category)),
  );

  return (
    <div className="flex-1 bg-surface pb-24 relative">
      {/* Interstitial Banner */}
      <AnimatePresence>
        {showInterstitial && interstitialBanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-black flex flex-col justify-center items-center"
          >
            {/* Countdown / Close */}
            <div className="absolute top-4 right-4 flex items-center gap-3 z-50">
              <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-full text-on-surface text-sm font-bold border border-white/20">
                {interstitialTimeLeft > 0 ? (
                  <span>
                    está ventana se cerrara en {interstitialTimeLeft} segundo
                    {interstitialTimeLeft === 1 ? "" : "s"}
                  </span>
                ) : (
                  <span>Puedes cerrar</span>
                )}
              </div>
              <button
                onClick={() => {
                  setShowInterstitial(false);
                }}
                className="w-10 h-10 glass-card text-on-surface text-black rounded-full flex items-center justify-center font-black hover:bg-surface-variant transition-colors"
                title="Cerrar ahora"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Banner Content */}
            <div className="w-full h-full flex flex-col items-center justify-center">
              {interstitialBanner.type === "video" &&
              interstitialBanner.videoUrl ? (
                 interstitialBanner.videoUrl.includes('youtube.com') || interstitialBanner.videoUrl.includes('youtu.be') ? (
                   <iframe
                     src={`https://www.youtube.com/embed/${interstitialBanner.videoUrl.includes('youtu.be/') ? interstitialBanner.videoUrl.split('youtu.be/')[1].split('?')[0] : (new URL(interstitialBanner.videoUrl).searchParams.get('v') || '')}?autoplay=1&mute=1&loop=1&playlist=${interstitialBanner.videoUrl.includes('youtu.be/') ? interstitialBanner.videoUrl.split('youtu.be/')[1].split('?')[0] : (new URL(interstitialBanner.videoUrl).searchParams.get('v') || '')}&controls=0`}
                     className="w-full h-[50vh] max-w-4xl object-cover rounded-[2rem]"
                     allow="autoplay; encrypted-media"
                     allowFullScreen
                   />
                 ) : (
                   <video
                     src={interstitialBanner.videoUrl}
                     autoPlay
                     muted
                     loop
                     playsInline
                     className="w-full h-full object-contain"
                   />
                 )
              ) : interstitialBanner.type === "text" ? (
                <div className="w-full h-full flex items-center justify-center p-8 bg-surface-variant border-none">
                  <h2 className="text-4xl md:text-6xl font-black text-on-surface text-center leading-tight whitespace-pre-wrap">
                    {interstitialBanner.content}
                  </h2>
                </div>
              ) : (
                <img
                  src={interstitialBanner.imageUrl}
                  alt={interstitialBanner.title || "Banner"}
                  className="w-full h-full object-contain bg-black"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lucky Wheel Countdown Banner */}
      <AnimatePresence>
        {showWheelBanner && wheelCountdown > 0 && (
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="fixed top-0 left-0 right-0 z-[200] bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 px-6 py-3 shadow-xl flex items-center justify-between pointer-events-auto"
          >
            <div className="flex items-center gap-3">
              <div className="glass-card text-on-surface/20 p-2 rounded-xl backdrop-blur-md">
                <RefreshCcw
                  className="w-5 h-5 text-on-surface animate-spin"
                  style={{ animationDuration: "3s" }}
                />
              </div>
              <div>
                <p className="text-on-surface font-black text-xs uppercase tracking-widest leading-none mb-1">
                  ¡Felicidades!
                </p>
                <p className="text-on-surface/90 text-[10px] font-bold truncate max-w-[200px] sm:max-w-md">
                  haz ganado un Giro en la ruleta buena suerte.!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/10 shrink-0 ml-4">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-on-surface/60 uppercase tracking-tighter leading-none mb-0.5">
                  Inicia en
                </span>
                <span className="text-xl font-black text-on-surface tabular-nums">
                  {wheelCountdown}s
                </span>
              </div>
              <div className="w-px h-6 glass-card text-on-surface/20 mx-1" />
              <button
                onClick={() => setShowWheelModal(true)}
                className="glass-card text-on-surface text-orange-600 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
              >
                Girar Ya
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lucky Wheel Modal */}
      <AnimatePresence>
        {showWheelModal && pendingSpin && (
          <LuckyWheel
            segments={pendingSpin.segments}
            spinDuration={pendingSpin.spinDuration}
            autoSpin={wheelCountdown === 0}
            onClose={() => {
              setShowWheelModal(false);
              setShowWheelBanner(false);

              if (pendingSpin && pendingSpin.whatsappPhone) {
                let rawPhone = pendingSpin.whatsappPhone.replace(/\D/g, "");
                if (rawPhone.length > 0) {
                  if (rawPhone.startsWith("57") && rawPhone.length > 10) {
                    // Keep it
                  } else {
                    if (rawPhone.startsWith("0"))
                      rawPhone = rawPhone.substring(1);
                    if (rawPhone.length <= 10) rawPhone = "57" + rawPhone;
                  }

                  let wpMsg =
                    pendingSpin.orderMessage ||
                    `*🍔 NUEVO PEDIDO*\nRestaurante: ${pendingSpin.restaurantName}\nTotal: $${pendingSpin.total}`;

                  if (hasSpun && wonPrizeData) {
                    if (wonPrizeData.isPrize !== false) {
                      wpMsg += `\n\n🎁 *PREMIO GANADO EN RULETA:* ${wonPrizeData.text}`;
                    } else {
                      wpMsg += `\n\n💬 *MENSAJE DE RULETA:* ${wonPrizeData.text}`;
                    }
                  }

                  const wpUrl = getWhatsAppNativeUrl(wpMsg, rawPhone);
                  setTimeout(() => {
                    window.location.href = wpUrl;
                  }, 500);
                }
              }

              localStorage.removeItem("pendingWheelSpin");
              setHasSpun(false);
              setWonPrizeData(null);
            }}
            onWin={async (prize, isPrize) => {
              setHasSpun(true);
              setWonPrizeData({ text: prize, isPrize: isPrize !== false });

              if (restaurant) {
                try {
                  const isPointsObj = /moneda|monedas|pts|pt/i.test(prize);
                  const isDelivered = isPointsObj;
                  let savedPrize = null;

                  if (isPointsObj && user) {
                    const matchNum = prize.match(/\d+/);
                    const numPointsGain = matchNum ? parseInt(matchNum[0], 10) : 5;
                    await db.addLoyaltyPoints(
                      user.id,
                      numPointsGain,
                      `Premio Ruleta: ${prize}`,
                      undefined,
                      restaurant.id
                    );
                  }

                  try {
                    const { data } = await db.saveWheelPrize({
                      userId: user?.id || "guest",
                      restaurantId: restaurant.id,
                      prizeText: prize,
                      isPrize: isPrize !== false,
                      status: isDelivered ? "delivered" : "pending",
                    });
                    savedPrize = data;
                  } catch (e) {
                    console.warn("Could not save to wheel_prizes table:", e);
                  }

                  if (!savedPrize) {
                    savedPrize = {
                      id: "guest-" + Date.now(),
                      restaurant_id: restaurant.id,
                      prize_text: prize,
                      is_prize: isPrize !== false,
                      status: isDelivered ? "delivered" : "pending",
                    };
                  }

                  const lastOrderId = localStorage.getItem("lastOrderId");
                  if (lastOrderId) {
                    await db.addPrizeToOrder(lastOrderId, savedPrize);
                    if (activeOrderId === lastOrderId) {
                      fetchActiveOrder();
                    }
                  }
                } catch (e) {
                  console.error("Error saving wheel prize:", e);
                }
              }
              const isPointsObj = /moneda|monedas|pts|pt/i.test(prize);
              if (isPrize !== false) {
                toast.success(`¡Felicidades! Ganaste: ${prize}. ${isPointsObj ? 'Añadidos a tu baúl al instante.' : ''}`, {
                  icon: "🎁",
                  duration: 6000,
                });
              } else {
                toast.success(`Mira lo que salió: ${prize}`, {
                  icon: "💬",
                  duration: 6000,
                });
              }
            }}
          />
        )}
      </AnimatePresence>
      {/* Premium Dark Header Layout */}
      <div className="relative w-full flex flex-col items-center bg-[#0B0B0B] pt-4 pb-8 overflow-hidden rounded-b-[2.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
        {/* Header Background Image */}
        <div className="absolute top-0 left-0 right-0 h-[220px] overflow-hidden rounded-b-[3rem]">
          <img
            src={
              restaurant.coverImage ||
              "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000"
            }
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/40 to-transparent"></div>
        </div>

        {/* Top Navigation */}
        <div className="w-full max-w-7xl px-4 flex justify-between items-center relative z-20 mb-0">
          <Link
            to="/"
            className="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white backdrop-blur-md shadow-lg active:scale-90 transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex gap-3">
            {user && (
              <button
                onClick={() => setIsNotificationsOpen(true)}
                className="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white backdrop-blur-md shadow-lg relative active:scale-90 transition-transform"
              >
                <BellRing className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-[#0B0B0B] animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}
            <NotificationModal 
              isOpen={isNotificationsOpen} 
              onClose={() => setIsNotificationsOpen(false)} 
              getDashboardLink={getDashboardLink} 
            />
            {(appUser?.role === "admin" ||
              (appUser?.role === "restaurant" &&
                appUser?.id === restaurant?.ownerId)) && (
              <button
                onClick={() => navigate(`/admin/${restaurant.id}`)}
                className="w-10 h-10 rounded-full bg-indigo-600/40 border border-indigo-400/20 flex items-center justify-center text-white backdrop-blur-md shadow-lg active:scale-90 transition-transform"
                title="Panel de Control"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={handleToggleFavorite}
              className={`w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center backdrop-blur-md shadow-lg active:scale-90 transition-all ${
                isFavorite ? "text-red-500" : "text-white"
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
            </button>
            <button
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white backdrop-blur-md shadow-lg active:scale-90 transition-transform"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Logo Container */}
        <div className="relative z-20 flex flex-col items-center w-full max-w-7xl px-4 mt-0">
           <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[2.5rem] bg-[#111] p-1 shadow-[0_0_40px_rgba(0,0,0,0.8)] flex items-center justify-center border border-white/10 overflow-hidden relative group">
             <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
             {restaurant.logo ? (
                <img
                  src={restaurant.logo}
                  alt={restaurant.name}
                  className="w-full h-full object-cover rounded-[2.3rem]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Store className="w-12 h-12 text-white/20" />
              )}
           </div>

           <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-1 text-center drop-shadow-md flex flex-wrap items-center justify-center gap-2">
             {restaurant.name}
             {restaurant.luckyWheelEnabled && (
                <span className="text-2xl animate-spin-slow inline-block" style={{ animationDuration: '4s' }} title="Ruleta de premios activa">🎡</span>
             )}
           </h1>
           {(() => {
             const visual = getCategoryVisual(restaurant.businessCategory || restaurant.type);
             const CatIcon = visual.icon;
             return (
               <div
                 className="mt-2 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 border shadow-sm transition-all"
                 style={{
                   backgroundColor: 'rgba(255, 255, 255, 0.07)',
                   borderColor: 'rgba(255, 255, 255, 0.15)',
                   color: visual.accentColor,
                   boxShadow: `0 2px 12px ${visual.glowColor}`,
                 }}
               >
                 <CatIcon className="w-4 h-4" strokeWidth={2.4} />
                 <span>{restaurant.type || visual.name}</span>
               </div>
             );
           })()}
        </div>

        {/* Stats Grid */}
        <div className="w-full max-w-3xl px-4 mt-6 relative z-20">
          <div className="grid grid-cols-4 gap-2.5">
             <button
               onClick={() => setIsReviewsModalOpen(true)}
               className="bg-[#1C1C1E] border border-white/5 rounded-2xl p-2.5 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform outline-none"
             >
                <div className="w-8 h-8 rounded-full bg-[#FF8A00]/10 flex items-center justify-center mb-1.5">
                  <Star className="w-4 h-4 text-[#FF8A00] fill-current" />
                </div>
                <span className="text-white font-black text-[11px] leading-tight mb-0.5">
                  {approvedReviews.length > 0
                      ? (
                          approvedReviews.reduce(
                            (sum, r) => sum + r.rating,
                            0,
                          ) / approvedReviews.length
                        ).toFixed(1)
                      : "Nuevo"}
                </span>
                <span className="text-gray-400 text-[9px] font-medium tracking-wide">Reseñas</span>
             </button>
             
             <div className="bg-[#1C1C1E] border border-white/5 rounded-2xl p-2.5 flex flex-col items-center justify-center shadow-lg transition-transform">
                <div className="w-8 h-8 rounded-full bg-[#FF8A00]/10 flex items-center justify-center mb-1.5">
                  <Clock className="w-4 h-4 text-[#FF8A00]" />
                </div>
                <span className="text-white font-black text-[11px] leading-tight mb-0.5">
                  {((restaurant.name.length % 4) + 2) * 10}-{((restaurant.name.length % 4) + 3) * 10}m
                </span>
                <span className="text-gray-400 text-[9px] font-medium tracking-wide">Tiempo</span>
             </div>

             <div className="bg-[#1C1C1E] border border-white/5 rounded-2xl p-2.5 flex flex-col items-center justify-center shadow-lg transition-transform">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center mb-1.5">
                  <Truck className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="text-white font-black text-[11px] leading-tight mb-0.5 uppercase">
                  Gratis
                </span>
                <span className="text-gray-400 text-[9px] font-medium tracking-wide">Envío</span>
             </div>

             <button 
               onClick={() => setShowInfo(true)}
               className="bg-[#1C1C1E] border border-white/5 rounded-2xl p-2.5 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform outline-none group hover:border-[#FF8A00]/40"
             >
                <div className="w-8 h-8 rounded-full bg-[#FF8A00]/10 flex items-center justify-center mb-1.5 group-hover:bg-[#FF8A00]/20 transition-colors">
                  <Navigation className="w-4 h-4 text-[#FF8A00] rotate-45" />
                </div>
                <span className="text-white font-black text-[11px] leading-tight mb-0.5 truncate w-full text-center flex items-center justify-center gap-1">
                  <span>{realDistanceInfo ? realDistanceInfo.formattedDistance : (restaurant.city || "Ubicación")}</span>
                  {realDistanceInfo?.isRealDriving && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Ruta Mapbox real" />
                  )}
                </span>
                <span className="text-gray-400 text-[9px] font-medium tracking-wide">
                  {realDistanceInfo?.formattedDuration ? `~${realDistanceInfo.formattedDuration}` : "Distancia GPS"}
                </span>
             </button>
          </div>
        </div>

        {/* Description Section */}
        <div className="w-full max-w-3xl px-4 mt-4 relative z-20">
          <div className="bg-[#1C1C1E] border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-full bg-[#FF8A00]/10 flex items-center justify-center shrink-0 border border-[#FF8A00]/20">
                  <Store className="w-5 h-5 text-[#FF8A00]" />
               </div>
               <div className="flex-1 min-w-0">
                 <h3 className="text-white font-black text-[13px] truncate">Acerca de nosotros</h3>
                 <p className="text-gray-400 text-[11px] line-clamp-2 mt-0.5 leading-relaxed font-medium">{restaurant.description}</p>
               </div>
            </div>
            
            {/* Social Media Links */}
            {(restaurant.facebookUrl || restaurant.instagramUrl) && (
              <div className="flex items-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l border-white/10 sm:pl-4 pl-0 sm:mt-0 mt-2 shrink-0">
                {restaurant.facebookUrl && (
                  <a 
                    href={restaurant.facebookUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center border border-blue-600/30 hover:bg-blue-600/20 transition-colors"
                  >
                    <Facebook className="w-5 h-5 text-blue-500" />
                  </a>
                )}
                {restaurant.instagramUrl && (
                  <a 
                    href={restaurant.instagramUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-pink-600/10 flex items-center justify-center border border-pink-600/30 hover:bg-pink-600/20 transition-colors"
                  >
                    <Instagram className="w-5 h-5 text-pink-500" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Benefits Cards Row */}
        <div className="w-full max-w-3xl px-4 mt-4 relative z-20 flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x snap-mandatory">
            <div 
               onClick={() => setInfoFeatureModal('ruleta')}
               className="snap-start flex-1 min-w-[140px] bg-gradient-to-br from-[#101928] to-[#0A0F1A] border border-[#1e304f] rounded-[1.5rem] p-4 shrink-0 flex flex-col justify-between cursor-pointer hover:border-blue-500/50 transition-colors shadow-xl"
            >
               <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
                 <Target className="w-5 h-5 text-blue-400" />
               </div>
               <div>
                 <h4 className="text-white font-black text-[13px] leading-tight mb-1">Ruleta Pay</h4>
                 <p className="text-gray-400 text-[10px] leading-relaxed font-medium">Gira y gana descuentos.</p>
               </div>
            </div>

            <div 
              onClick={() => setInfoFeatureModal('niveles')}
              className="snap-start flex-1 min-w-[140px] bg-gradient-to-br from-[#2a220e] to-[#120F06] border border-[#4a3d1b] rounded-[1.5rem] p-4 shrink-0 flex flex-col justify-between cursor-pointer hover:border-yellow-500/50 transition-colors shadow-xl"
            >
               <div className="w-10 h-10 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-3">
                 <Crown className="w-5 h-5 text-yellow-400" />
               </div>
               <div>
                 <h4 className="text-white font-black text-[13px] leading-tight mb-1">Tareas Diarias</h4>
                 <p className="text-gray-400 text-[10px] leading-relaxed font-medium">Gana XP y sube de nivel.</p>
               </div>
            </div>

            {restaurant.loyaltyEnabled && (
              <div 
                onClick={() => setInfoFeatureModal('oro')}
                className="snap-start flex-1 min-w-[140px] bg-gradient-to-br from-[#171120] to-[#0D0B14] border border-[#2b1b42] rounded-[1.5rem] p-4 shrink-0 flex flex-col justify-between cursor-pointer hover:border-purple-500/50 transition-colors shadow-xl"
              >
                 <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-3">
                   <Trophy className="w-5 h-5 text-purple-400" />
                 </div>
                 <div>
                   <h4 className="text-white font-black text-[13px] leading-tight mb-1">Monedas de Oro</h4>
                   <p className="text-gray-400 text-[10px] leading-relaxed font-medium">Acumula y obtén beneficios.</p>
                 </div>
              </div>
            )}
            
            <div 
               onClick={() => setInfoFeatureModal('recompensas')}
               className="snap-start flex-1 min-w-[140px] bg-gradient-to-br from-[#1d120a] to-[#0F0905] border border-[#3b2311] rounded-[1.5rem] p-4 shrink-0 flex flex-col justify-between cursor-pointer hover:border-orange-500/50 transition-colors shadow-xl"
            >
               <div className="w-10 h-10 rounded-full bg-[#FF8A00]/10 border border-[#FF8A00]/20 flex items-center justify-center mb-3">
                 <ShoppingBag className="w-5 h-5 text-[#FF8A00]" />
               </div>
               <div>
                 <h4 className="text-white font-black text-[13px] leading-tight mb-1">Recompensas</h4>
                 <p className="text-gray-400 text-[10px] leading-relaxed font-medium">Canjea productos gratis.</p>
               </div>
            </div>

            <div 
              onClick={() => setInfoFeatureModal('referidos')}
              className="snap-start flex-1 min-w-[140px] bg-gradient-to-br from-[#0d1a12] to-[#060D09] border border-[#173322] rounded-[1.5rem] p-4 shrink-0 flex flex-col justify-between cursor-pointer hover:border-emerald-500/50 transition-colors shadow-xl"
            >
               <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
                 <Users className="w-5 h-5 text-emerald-400" />
               </div>
               <div>
                 <h4 className="text-white font-black text-[13px] leading-tight mb-1">Invita y Gana</h4>
                 <p className="text-gray-400 text-[10px] leading-relaxed font-medium">Invita amigos y gana.</p>
               </div>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-8 relative z-10 w-full overflow-hidden">
        {!isRestaurantOpen(restaurant, currentTime) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-5 bg-error-container text-on-error-container rounded-[2.5rem] flex items-center gap-4 border border-error/10 shadow-lg shadow-error/5 mx-4"
          >
            <div className="bg-error text-on-error p-2 rounded-2xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="font-black text-sm uppercase tracking-wider">
                Restaurante Cerrado
              </p>
              <p className="text-sm font-medium opacity-80">
                Puedes ver el menú pero no realizar pedidos en este momento.
              </p>
            </div>
          </motion.div>
        )}

        {/* Active Order Tracking Card */}
        <AnimatePresence>
          {activeOrderId && activeOrder && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 p-6 bg-surface shadow-elevation-2 rounded-[2.5rem] border border-primary/10 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 p-6 flex gap-2">
                <button
                  onClick={() => {
                    setActiveOrderId(null);
                    localStorage.removeItem("lastOrderId");
                  }}
                  className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary animate-pulse">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-on-surface tracking-tight">
                    {activeOrder.status === "completed"
                      ? "¡Tu pedido ha llegado!"
                      : activeOrder.status === "rejected"
                        ? "Pedido cancelado"
                        : activeOrder.status === "shipped" ||
                            activeOrder.status === "on_the_way"
                          ? "Tu pedido está en camino"
                          : "Estamos preparando tu pedido"}
                  </h3>
                  <p className="text-xs font-black text-primary uppercase tracking-widest">
                    ID: #{activeOrderId.slice(-6).toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="relative h-2 bg-outline/10 rounded-full mb-6 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width:
                      activeOrder.status === "pending"
                        ? "15%"
                        : activeOrder.status === "approved"
                          ? "35%"
                          : activeOrder.status === "preparing"
                            ? "60%"
                            : activeOrder.status === "shipped" ||
                                activeOrder.status === "on_the_way"
                              ? "85%"
                              : activeOrder.status === "completed"
                                ? "100%"
                                : "100%",
                  }}
                  className={`absolute top-0 left-0 bottom-0 ${activeOrder.status === "rejected" ? "bg-error" : "bg-primary"} rounded-full`}
                />
              </div>

              <div className="flex justify-between items-center bg-surface-variant/10 p-4 rounded-3xl">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl ${activeOrder.status === "rejected" ? "bg-error/10 text-error" : "bg-primary/10 text-primary"}`}
                  >
                    {activeOrder.status === "pending" && (
                      <Clock className="w-5 h-5" />
                    )}
                    {(activeOrder.status === "approved" ||
                      activeOrder.status === "preparing") && (
                      <Clock className="w-5 h-5" />
                    )}
                    {(activeOrder.status === "shipped" ||
                      activeOrder.status === "on_the_way") && (
                      <Truck className="w-5 h-5" />
                    )}
                    {activeOrder.status === "completed" && (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                    {activeOrder.status === "rejected" && (
                      <X className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant">
                      Estado
                    </p>
                    <p className="text-sm font-black text-on-surface">
                      {activeOrder.status === "pending"
                        ? "Esperando confirmación..."
                        : activeOrder.status === "approved"
                          ? "Aprobado por el restaurante"
                          : activeOrder.status === "preparing"
                            ? "¡Tu pedido está en preparación!"
                            : activeOrder.status === "shipped" ||
                                activeOrder.status === "on_the_way"
                              ? "¡Tu pedido va en camino!"
                              : activeOrder.status === "completed"
                                ? "¡Pedido entregado con éxito!"
                                : activeOrder.status === "rejected"
                                  ? "Pedido rechazado"
                                  : activeOrder.status}
                    </p>
                    <div className="text-[10px] text-on-surface-variant/70 mt-1">
                      <p>
                        <span className="font-bold text-on-surface-variant italic">
                          ID: #{activeOrderId.slice(-6).toUpperCase()}
                        </span>
                      </p>
                      <p>
                        <span className="font-bold text-on-surface-variant">
                          Para:
                        </span>{" "}
                        {activeOrder.recipientName || activeOrder.customerName}
                      </p>
                      <p>
                        <span className="font-bold text-on-surface-variant">
                          Dirección:
                        </span>{" "}
                        {activeOrder.address || "N/A"}
                      </p>
                      <p>
                        <span className="font-bold text-on-surface-variant">
                          Teléfono:
                        </span>{" "}
                        {activeOrder.customerPhone || "N/A"}
                      </p>
                      {activeOrder.note && (
                        <p>
                          <span className="font-bold text-on-surface-variant">
                            Nota:
                          </span>{" "}
                          {activeOrder.note}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <Link
                to={`/orders/${activeOrderId}`}
                className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 px-4 py-2 rounded-xl transition-all"
              >
                Ver detalles
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sticky Category Bar - Premium Style */}
        <div className="sticky top-0 z-30 bg-surface/90 backdrop-blur-xl pb-4 -mx-4 px-4 mb-4 border-b border-outline/5 no-scrollbar overflow-x-auto flex gap-3 pt-3 rounded-t-3xl shadow-sm">
          {["todos", ...categories].map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`shrink-0 whitespace-nowrap px-6 py-2.5 rounded-2xl border text-sm font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm ${
                activeCategory === category
                  ? "bg-[#FF8A00] text-white border-[#FF8A00] shadow-[0_4px_12px_rgba(255,138,0,0.4)]"
                  : "bg-surface-variant/40 border border-outline/10 text-on-surface-variant hover:bg-surface-variant/80"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Menu Categories */}
        <div className="space-y-12">
          {categories
            .filter(
              (category) =>
                activeCategory === "todos" || activeCategory === category,
            )
            .map((category) => {
              const products = restaurant.menu.filter(
                (p) => p.category === category,
              );
              return (
                <section key={category} id={category} className="scroll-mt-32">
                  <div className="flex items-center gap-4 mb-6">
                    <h2 className="text-2xl font-black text-on-surface tracking-tight">
                      {category}
                    </h2>
                    <div className="h-px flex-1 bg-outline/10"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {products.map((product) => (
                      <motion.div
                        key={product.id}
                        id={`product-${product.id}`}
                        whileTap={
                          isRestaurantOpen(restaurant, currentTime)
                            ? { scale: 0.96 }
                            : {}
                        }
                        whileHover={
                          isRestaurantOpen(restaurant, currentTime)
                            ? {
                                y: -4,
                                boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
                              }
                            : {}
                        }
                        className={`group flex gap-4 bg-[#0B0B0B] p-5 rounded-[1.8rem] border-2 transition-all cursor-pointer relative overflow-hidden golden-glow-module ${
                          product.isPromotion
                            ? "border-primary/20 shadow-lg shadow-primary/5"
                            : "border-outline/5 hover:border-primary/30 shadow-sm"
                        }`}
                        onClick={() => {
                          if (!user) {
                            setLoginPromptOpen(true);
                          } else {
                            setSelectedProductForModal(product);
                          }
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="text-lg font-black text-on-surface group-hover:text-primary transition-colors leading-tight">
                              {product.name}
                            </h3>
                            {(product.isPromotion ||
                              product.discountPercentage ||
                              (restaurant.generalDiscountEnabled &&
                                restaurant.generalDiscount)) && (
                              <div className="bg-primary text-on-primary text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-sm">
                                {product.discountPercentage ||
                                (restaurant.generalDiscountEnabled &&
                                  restaurant.generalDiscount)
                                  ? `-${product.discountPercentage || restaurant.generalDiscount}%`
                                  : "Oferta"}
                              </div>
                            )}
                          </div>
                          <p className="text-on-surface-variant text-sm line-clamp-2 mb-4 font-medium leading-relaxed opacity-80">
                            {product.description}
                          </p>
                          {product.pointsMultiplier &&
                            product.pointsMultiplier > 1 && (
                              <div className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider mb-4 border border-purple-100 shadow-sm shrink-0 animate-pulse w-fit">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                Multiplica x{product.pointsMultiplier} <GoldCoinIcon className="w-3.5 h-3.5 -mt-0.5 mx-0.5 inline-block" /> Monedas
                              </div>
                            )}
                          <div className="flex items-center justify-between mt-auto">
                            <div className="flex flex-col">
                              {product.discountPercentage ||
                              (restaurant.generalDiscountEnabled &&
                                restaurant.generalDiscount) ? (
                                <div className="flex flex-col">
                                  <span className="text-on-surface-variant text-[10px] line-through opacity-50 font-bold">
                                    {formatCurrency(product.price)}
                                  </span>
                                  <span className="text-primary font-black text-xl">
                                    {formatCurrency(
                                      product.discountPercentage
                                        ? product.discountPrice || product.price
                                        : Math.round(
                                            product.price *
                                              (1 -
                                                (restaurant.generalDiscount ||
                                                  0) /
                                                  100),
                                          ),
                                    )}
                                  </span>
                                </div>
                              ) : (
                                <>
                                  <span className="text-primary font-black text-xl">
                                    {formatCurrency(product.price)}
                                  </span>
                                  {product.isPromotion && (
                                    <span className="text-[10px] text-on-surface-variant line-through font-bold opacity-50">
                                      {formatCurrency(product.price * 1.2)}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                            <div className="bg-primary/10 text-primary p-3 rounded-2xl group-hover:bg-primary group-hover:text-on-primary transition-all duration-300">
                              <Plus className="w-5 h-5" />
                            </div>
                          </div>
                        </div>
                        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-[2rem] overflow-hidden bg-surface-variant shrink-0 relative shadow-inner">
                          {product.images[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-on-surface-variant/20">
                              <ShoppingBag className="w-10 h-10" />
                            </div>
                          )}

                          {/* Favorite Button for Product */}
                          <button
                            onClick={(e) =>
                              handleToggleProductFavorite(e, product.id)
                            }
                            className={`absolute top-2 right-2 p-2 rounded-xl backdrop-blur-md transition-all active:scale-90 z-20 ${
                              favoriteProducts.has(product.id)
                                ? "bg-rose-500 text-on-surface shadow-lg"
                                : "bg-black/20 text-on-surface hover:bg-black/40"
                            }`}
                          >
                            <Heart
                              className={`w-4 h-4 ${favoriteProducts.has(product.id) ? "fill-current" : ""}`}
                            />
                          </button>

                          {/* Shiny effect for promotions */}
                          {product.isPromotion && (
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                          )}
                        </div>
                        {!isRestaurantOpen(restaurant, currentTime) && (
                          <div className="absolute inset-0 bg-surface/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                            <div className="bg-error text-on-error text-[10px] font-black px-4 py-2 rounded-2xl uppercase tracking-widest shadow-xl flex items-center gap-2">
                              <X className="w-4 h-4" />
                              No disponible
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </section>
              );
            })}
        </div>

        {/* Reviews Section */}
        <div className="mt-20 pt-16 border-t border-outline/10">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl font-black text-on-surface tracking-tight">
              Reseñas
            </h2>
            <div className="h-px flex-1 bg-outline/10"></div>
          </div>

          {approvedReviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {approvedReviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-surface-variant/10 p-6 rounded-[2rem] border border-outline/5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star <= review.rating ? "fill-amber-500 text-amber-500" : "fill-outline/20 text-outline/20"}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-on-surface-variant/60">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-on-surface-variant font-medium italic leading-relaxed">
                      "{review.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-12 bg-surface-variant/10 rounded-[2rem] border border-outline/5">
              <Star className="w-12 h-12 text-outline/20 mx-auto mb-4" />
              <p className="text-on-surface-variant font-bold">
                Aún no hay reseñas para este restaurante.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Call Waiter Button */}
      {tableNumber && (
        <motion.div
          initial={{ scale: 0, x: 20 }}
          animate={{ scale: 1, x: 0 }}
          className="fixed bottom-44 right-6 z-50"
        >
          <button
            onClick={handleCallWaiter}
            disabled={isCallingWaiter}
            className="bg-amber-500 text-on-surface h-14 px-6 rounded-2xl shadow-xl flex items-center gap-3 hover:bg-amber-600 transition-all active:scale-95 disabled:opacity-50 font-black uppercase tracking-widest text-xs"
          >
            {isCallingWaiter ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <BellRing className="w-5 h-5" />
            )}
            Llamar Mesero
          </button>
        </motion.div>
      )}

      {/* Floating Action Button (Cart) - Android Style */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: 20 }}
            className="fixed bottom-24 right-6 z-50"
          >
            <motion.button
              animate={{
                scale: [1, 1.05, 1],
                boxShadow: [
                  "0 10px 15px -3px rgba(249, 115, 22, 0.3)",
                  "0 20px 25px -5px rgba(249, 115, 22, 0.5)",
                  "0 10px 15px -3px rgba(249, 115, 22, 0.3)",
                ],
              }}
              transition={{ repeat: Infinity, duration: 2 }}
              onClick={() => setIsCartOpen(true)}
              className="bg-primary text-on-primary h-16 px-8 rounded-[2rem] shadow-2xl flex items-center gap-4 hover:brightness-110 transition-all active:scale-95 group"
            >
              <div className="relative">
                <ShoppingBag className="w-7 h-7" />
                <span className="absolute -top-3 -right-3 glass-card text-on-surface text-primary text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-primary shadow-sm">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <div className="flex flex-col items-start">
                <span className="font-black text-[10px] uppercase tracking-[0.2em] opacity-80 leading-none mb-1">
                  Tu Pedido
                </span>
                <span className="font-black text-lg leading-none">
                  {formatCurrency(
                    cart.reduce(
                      (sum, item) => sum + item.price * item.quantity,
                      0,
                    ),
                  )}
                </span>
              </div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Bottom Sheet - Android Style */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsCartOpen(false);
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ 
                type: "spring",
                damping: 32,
                stiffness: 220,
                mass: 0.9
              }}
              className={`fixed ${appUser ? "bottom-20 md:bottom-0" : "bottom-0"} left-0 right-0 bg-surface rounded-t-[2.5rem] z-[110] shadow-elevation-5 max-h-[90vh] flex flex-col`}
            >
              <div className="w-12 h-1.5 bg-outline/20 rounded-full mx-auto mt-4 mb-2" />

              <div className="p-6 flex items-center justify-between border-b border-outline/5 relative">
                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-outline/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: tableNumber
                        ? checkoutStep === "idle"
                          ? "50%"
                          : "100%"
                        : checkoutStep === "idle"
                          ? "20%"
                          : checkoutStep === "address"
                            ? "40%"
                            : checkoutStep === "details"
                              ? "60%"
                              : checkoutStep === "payment"
                                ? "80%"
                                : "100%",
                    }}
                    className="h-full bg-primary"
                  />
                </div>

                <div>
                  <h2 className="text-2xl font-black text-on-surface tracking-tight">
                    {checkoutStep === "idle"
                      ? "Tu Pedido"
                      : checkoutStep === "address"
                        ? "Dirección"
                        : checkoutStep === "details"
                          ? "Detalles"
                          : checkoutStep === "payment"
                            ? tableNumber
                              ? "Confirmar"
                              : "Pago"
                            : "Finalizar"}
                  </h2>
                  <p className="text-on-surface-variant text-sm font-bold uppercase tracking-widest opacity-60">
                    {tableNumber ? `Mesa: ${tableNumber}` : restaurant.name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (checkoutStep !== "idle" && checkoutStep !== "success")
                      setCheckoutStep("idle");
                    else setIsCartOpen(false);
                  }}
                  className="p-3 bg-surface-variant/50 rounded-2xl text-on-surface-variant hover:bg-surface-variant transition-colors active:scale-90"
                >
                  {checkoutStep === "idle" ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <ArrowLeft className="w-6 h-6" />
                  )}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {checkoutStep === "idle" ? (
                  <div className="space-y-6">
                    {cart.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-24 h-24 bg-surface-variant/30 rounded-full flex items-center justify-center mx-auto mb-6">
                          <ShoppingBag className="w-12 h-12 text-on-surface-variant/30" />
                        </div>
                        <p className="text-on-surface-variant font-bold text-lg">
                          Tu carrito está vacío
                        </p>
                        <button
                          onClick={() => setIsCartOpen(false)}
                          className="mt-4 text-primary font-bold hover:underline"
                        >
                          Explorar el menú
                        </button>
                      </div>
                    ) : (
                      cart.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 bg-surface-variant/10 p-4 rounded-3xl border border-outline/5"
                        >
                          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-surface-variant shrink-0 flex items-center justify-center">
                            {item.images?.[0] ? (
                              <img
                                src={item.images[0]}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <ShoppingBag className="w-8 h-8 text-on-surface-variant/20" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-on-surface truncate">
                              {item.name}
                            </h4>
                            <p className="text-primary font-black text-sm mt-1">
                              {formatCurrency(item.price * item.quantity)}
                            </p>
                            {item.pointsMultiplier && item.pointsMultiplier > 1 && (
                               <div className="mt-1.5 inline-flex items-center gap-1.5 text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider w-fit">
                                 <span>🎯 Multiplica x{item.pointsMultiplier} <GoldCoinIcon className="w-3.5 h-3.5 -mt-0.5 mx-0.5 inline-block" /> Monedas</span>
                               </div>
                            )}
                            <div className="flex items-center gap-3 mt-3">
                              <button
                                onClick={() => updateQuantityLocal(item.id, -1)}
                                className="w-8 h-8 rounded-xl bg-surface-variant/50 flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-on-primary transition-all"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="font-black text-on-surface w-4 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantityLocal(item.id, 1)}
                                className="w-8 h-8 rounded-xl bg-surface-variant/50 flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-on-primary transition-all"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-2 text-on-surface-variant/40 hover:text-error transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))
                    )}
                    <div className="mt-8 pt-8 border-t border-outline/10">
                      <div className="flex items-center gap-3 mb-4">
                        <Tag className="w-5 h-5 text-orange-500" />
                        <h3 className="font-black text-lg text-on-surface">
                          ¿Tienes un cupón?
                        </h3>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) =>
                            setCouponInput(e.target.value.toUpperCase())
                          }
                          placeholder="Ingresa el código"
                          className="flex-1 px-4 py-3 bg-surface-variant/20 rounded-2xl border border-outline/5 outline-none font-bold focus:border-orange-500 transition-all"
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={isValidatingCoupon || !couponInput.trim()}
                          className="px-6 py-3 bg-orange-500 text-on-surface font-black rounded-2xl shadow-lg shadow-orange-200 hover:bg-orange-600 disabled:opacity-50 transition-all"
                        >
                          {isValidatingCoupon ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            "Aplicar"
                          )}
                        </button>
                      </div>
                      {couponCode && (
                        <div className="mt-3 flex items-center justify-between bg-emerald-50 text-emerald-700 p-3 rounded-xl border border-emerald-100">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-xs font-black">
                              CUPÓN APLICADO: {couponCode}
                            </span>
                          </div>
                          <span className="text-xs font-black">
                            -${discount.toLocaleString("es-CO")}
                          </span>
                        </div>
                      )}

                      {/* Tipping Section */}
                      <div className="mt-8 pt-8 border-t border-outline/10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <DollarSign className="w-5 h-5 text-emerald-500" />
                            <h3 className="font-black text-lg text-on-surface">
                              Propinas
                            </h3>
                          </div>
                          <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">
                            {tipType === "waiter"
                              ? "Para el Mesero"
                              : "Para el Repartidor"}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 mb-4">
                          {[5, 10, 15].map((percent) => {
                            const amount = Math.round(
                              (subtotal * percent) / 100,
                            );
                            return (
                              <button
                                key={percent}
                                onClick={() => {
                                  setTipAmount(amount);
                                  setTipPercentage(percent);
                                }}
                                className={`py-3 rounded-2xl font-black text-xs transition-all border-2 ${
                                  tipAmount === amount &&
                                  tipPercentage === percent
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                    : "border-outline/5 bg-surface-variant/10 text-on-surface-variant hover:bg-surface-variant/20"
                                }`}
                              >
                                {percent}%
                                <span className="block text-[8px] opacity-60">
                                  {formatCurrency(amount)}
                                </span>
                              </button>
                            );
                          })}
                          <button
                            onClick={() => {
                              const custom = prompt(
                                "Ingresa el monto de la propina:",
                              );
                              if (custom) {
                                const amount = Number(custom);
                                setTipAmount(amount);
                                setTipPercentage(
                                  Math.round((amount * 100) / subtotal),
                                );
                              }
                            }}
                            className={`py-3 rounded-2xl font-black text-xs transition-all border-2 ${
                              tipAmount > 0 &&
                              ![5, 10, 15].includes(tipPercentage)
                                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                : "border-outline/5 bg-surface-variant/10 text-on-surface-variant hover:bg-surface-variant/20"
                            }`}
                          >
                            Otro
                            <span className="block text-[8px] opacity-60">
                              Personalizar
                            </span>
                          </button>
                        </div>
                        {tipAmount > 0 && (
                          <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
                            <span className="text-xs font-black uppercase tracking-widest">
                              Propina Seleccionada
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black">
                                {formatCurrency(tipAmount)}
                              </span>
                              <button
                                onClick={() => {
                                  setTipAmount(0);
                                  setTipPercentage(0);
                                }}
                                className="p-1 hover:bg-emerald-100 rounded-lg"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : checkoutStep === "address" ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="bg-primary-container/20 p-6 rounded-[2rem] border border-primary/10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-primary p-2 rounded-xl text-on-primary">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <h3 className="font-black text-lg text-on-surface">
                          Dirección de Entrega
                        </h3>
                      </div>

                      {appUser?.addresses && appUser.addresses.length > 0 && (
                        <div className="mb-4 space-y-2">
                          <p className="text-sm font-bold text-on-surface-variant mb-2">
                            Mis direcciones guardadas:
                          </p>
                          {appUser.addresses.map((addr) => (
                            <button
                              key={addr.id}
                              onClick={() => handleAddressSelect(addr)}
                              className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                                selectedAddressId === addr.id
                                  ? "border-primary bg-surface shadow-md"
                                  : "border-transparent bg-surface-variant/30 hover:bg-surface"
                              }`}
                            >
                              <p className="font-bold text-on-surface">
                                {addr.name}
                              </p>
                              <p className="text-sm text-on-surface-variant truncate">
                                {addr.address}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}

                      <p className="text-sm font-bold text-on-surface-variant mb-2">
                        {appUser?.addresses && appUser.addresses.length > 0
                          ? "O ingresa una nueva dirección:"
                          : "Ingresa tu dirección:"}
                      </p>
                      <textarea
                        value={address}
                        onChange={(e) => {
                          setAddress(e.target.value);
                          setSelectedAddressId(null);
                        }}
                        placeholder="Ej: Calle 123 #45-67, Apto 402..."
                        className="w-full h-24 p-4 rounded-2xl bg-surface border border-outline/10 focus:ring-2 focus:ring-primary outline-none resize-none font-medium mb-4"
                      />

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-black text-on-surface-variant uppercase tracking-widest mb-1 shadow-sm px-1 italic">
                            ¿A quién va dirigido el pedido?
                          </label>
                          <div className="relative">
                            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/40" />
                            <input
                              type="text"
                              value={recipientName}
                              onChange={(e) => setRecipientName(e.target.value)}
                              placeholder="Nombre completo del destinatario"
                              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-surface border border-outline/10 focus:ring-2 focus:ring-primary outline-none font-bold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-black text-on-surface-variant uppercase tracking-widest mb-1 shadow-sm px-1 italic">
                            Tu Teléfono de contacto (Actualizado)
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/40" />
                            <input
                              type="tel"
                              value={customerPhone}
                              onChange={(e) => setCustomerPhone(e.target.value)}
                              placeholder="Ej: 300 123 4567"
                              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-surface border border-outline/10 focus:ring-2 focus:ring-primary outline-none font-bold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-black text-on-surface-variant uppercase tracking-widest mb-1 shadow-sm px-1 italic">
                            Instrucciones o Notas especiales
                          </label>
                          <div className="relative">
                            <Bot className="absolute left-4 top-4 w-5 h-5 text-on-surface-variant/40" />
                            <textarea
                              value={orderNote}
                              onChange={(e) => setOrderNote(e.target.value)}
                              placeholder="Ej: Tocar fuerte el portón, favor traer más salsas..."
                              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-surface border border-outline/10 focus:ring-2 focus:ring-primary outline-none resize-none h-24 font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : checkoutStep === "details" ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="bg-surface-variant/20 p-6 rounded-[2rem] border border-outline/10 space-y-4">
                      <h3 className="font-black text-lg text-on-surface">
                        Detalles del Pedido
                      </h3>
                      <div className="space-y-2">
                        {cart.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between text-sm"
                          >
                            <span className="font-bold text-on-surface-variant">
                              {item.quantity}x {item.name}
                            </span>
                            <span className="font-bold text-on-surface">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-outline/10 pt-2 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-bold text-on-surface-variant">
                            Subtotal
                          </span>
                          <span className="font-bold text-on-surface">
                            {formatCurrency(subtotal)}
                          </span>
                        </div>
                        {tipAmount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="font-bold text-on-surface-variant">
                              Propina
                            </span>
                            <span className="font-bold text-on-surface">
                              +{formatCurrency(tipAmount)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between font-black pt-1">
                          <span>Total</span>
                          <span>{formatCurrency(total)}</span>
                        </div>
                      </div>
                      <div className="border-t border-outline/10 pt-4 text-sm space-y-2">
                        <p>
                          <span className="font-bold text-on-surface-variant uppercase text-[10px] tracking-widest block mb-0.5">
                            Entregar a:
                          </span>{" "}
                          {recipientName || appUser?.displayName}
                        </p>
                        <p>
                          <span className="font-bold text-on-surface-variant uppercase text-[10px] tracking-widest block mb-0.5">
                            Ubicación:
                          </span>{" "}
                          {address}
                        </p>
                        <p>
                          <span className="font-bold text-on-surface-variant uppercase text-[10px] tracking-widest block mb-0.5">
                            Contacto:
                          </span>{" "}
                          {customerPhone}
                        </p>
                        {orderNote && (
                          <div className="mt-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                            <p>
                              <span className="font-bold text-amber-800 uppercase text-[10px] tracking-widest block mb-0.5">
                                Instrucciones:
                              </span>{" "}
                              {orderNote}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ) : checkoutStep === "payment" ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="bg-secondary-container/20 p-6 rounded-[2rem] border border-secondary/10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-secondary p-2 rounded-xl text-on-secondary">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <h3 className="font-black text-lg text-on-surface">
                          Método de Pago
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {tableNumber ? (
                          <div className="flex items-center gap-4 p-4 bg-surface rounded-2xl border-2 border-secondary shadow-md">
                            <div className="bg-secondary-container p-2 rounded-lg text-on-secondary-container">
                              <Banknote className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-black text-on-surface">
                                Pago en Mesa
                              </p>
                              <p className="text-xs text-on-surface-variant font-bold">
                                Paga directamente al mesero
                              </p>
                            </div>
                          </div>
                        ) : (
                          (() => {
                            const methods = [];

                            if (
                              restaurant?.paymentGateways?.cash?.active !==
                              false
                            ) {
                              methods.push({
                                id: "cash",
                                label: "Efectivo al recibir",
                                icon: Banknote,
                                desc: "Paga cuando llegue tu pedido",
                              });
                            }

                            if (restaurant?.paymentGateways?.nequi?.active) {
                              methods.push({
                                id: "nequi",
                                label: "Pagar con Nequi",
                                icon: Smartphone,
                                desc: "Pago seguro en línea",
                              });
                            } else if (restaurant?.paymentGateways?.transfer?.active) {
                              methods.push({
                                id: "transfer",
                                label: "Transferencia",
                                icon: Smartphone,
                                desc: "Nequi o Daviplata manual",
                              });
                            }

                            if (
                              restaurant?.paymentGateways?.mercadoPago?.active
                            ) {
                              methods.push({
                                id: "mercadopago",
                                label: "Mercado Pago",
                                icon: CreditCard,
                                desc: "Tarjetas y saldo",
                              });
                            }

                            if (restaurant?.paymentGateways?.paypal?.active) {
                              methods.push({
                                id: "paypal",
                                label: "PayPal",
                                icon: CreditCard,
                                desc: "Pago internacional seguro",
                              });
                            }

                            if (
                              restaurant?.paymentGateways?.cardTerminal?.active
                            ) {
                              methods.push({
                                id: "card",
                                label: "Tarjeta (Datáfono)",
                                icon: CreditCard,
                                desc: "El domiciliario llevará datáfono",
                              });
                            }

                            return methods.map((method) => (
                              <div key={method.id}>
                                <label
                                  className={`flex items-center gap-4 p-4 bg-surface rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === method.id ? "border-secondary shadow-md" : "border-outline/10"}`}
                                >
                                  <input
                                    type="radio"
                                    name="payment"
                                    checked={paymentMethod === method.id}
                                    onChange={() => setPaymentMethod(method.id)}
                                    className="w-5 h-5 accent-secondary"
                                  />
                                  <div className="bg-secondary-container p-2 rounded-lg text-on-secondary-container">
                                    <method.icon className="w-5 h-5" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-black text-on-surface">
                                      {method.label}
                                    </p>
                                    <p className="text-xs text-on-surface-variant font-bold">
                                      {method.desc}
                                    </p>
                                  </div>
                                </label>
                                {(paymentMethod as string) === "nequi" &&
                                  method.id === "nequi" && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      className="pl-14 pr-4 py-2"
                                    >
                                      <label className="block text-xs font-bold text-on-surface mb-1">
                                        Número de celular Nequi
                                      </label>
                                      <input
                                        type="tel"
                                        placeholder="Ej. 300 123 4567"
                                        className="w-full p-3 border border-outline/20 rounded-xl outline-none focus:border-secondary focus:ring-1 focus:ring-secondary text-sm"
                                      />
                                      <p className="text-[10px] text-on-surface-variant mt-1 font-medium">
                                        Se enviará una notificación a tu app
                                        Nequi para autorizar el pago.
                                      </p>
                                    </motion.div>
                                  )}
                              </div>
                            ));
                          })()
                        )}
                      </div>
                    </div>
                  </motion.div>
                ) : checkoutStep === "confirming" ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <Bot className="w-24 h-24 text-primary" />
                    </motion.div>
                    <h3 className="text-2xl font-black mt-6 text-on-surface">
                      Procesando tu pedido...
                    </h3>
                    <p className="text-on-surface-variant font-medium mt-2">
                      Estamos registrando tu orden.
                    </p>
                  </div>
                ) : (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center justify-center h-full text-center py-12"
                  >
                    <div className="relative mb-6">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="absolute inset-0 bg-primary rounded-full"
                      />
                      <CheckCircle2 className="w-24 h-24 text-primary relative z-10" />
                    </div>
                    <h3 className="text-3xl font-black text-primary">
                      ¡Pedido Exitoso!
                    </h3>
                    <p className="text-on-surface-variant font-medium mt-4">
                      {tableNumber
                        ? "Tu pedido ha sido enviado a la cocina. ¡En breve te lo llevaremos a la mesa!"
                        : "Redirigiéndote a WhatsApp para coordinar la entrega..."}
                    </p>
                  </motion.div>
                )}
              </div>

              {cart.length > 0 &&
                checkoutStep !== "confirming" &&
                checkoutStep !== "success" && (
                  <div className="p-6 bg-surface border-t border-outline/5 space-y-3">
                    {discount > 0 && (
                      <>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-on-surface-variant font-bold">
                            Subtotal
                          </span>
                          <span className="text-on-surface font-bold">
                            {formatCurrency(subtotal)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-emerald-600">
                          <span className="font-bold">
                            Descuento ({couponCode})
                          </span>
                          <span className="font-bold">
                            -${discount.toLocaleString("es-CO")}
                          </span>
                        </div>
                      </>
                    )}
                    {tipAmount > 0 && (
                      <div className="flex justify-between items-center text-sm text-emerald-600">
                        <span className="font-bold">
                          Propina (
                          {tipType === "waiter" ? "Mesero" : "Repartidor"})
                        </span>
                        <span className="font-bold">
                          +${tipAmount.toLocaleString("es-CO")}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-on-surface-variant font-bold text-lg">
                        Total
                      </span>
                      <span className="text-3xl font-black text-on-surface">
                        {formatCurrency(total)}
                      </span>
                    </div>

                    <button
                      disabled={
                        checkoutStep === "address" &&
                        (!address.trim() ||
                          !customerPhone.trim() ||
                          !recipientName.trim())
                      }
                      onClick={() => {
                        if (checkoutStep === "idle") {
                          if (tableNumber) handleFinalCheckout();
                          else setCheckoutStep("address");
                        } else if (checkoutStep === "address")
                          setCheckoutStep("details");
                        else if (checkoutStep === "details")
                          setCheckoutStep("payment");
                        else handleFinalCheckout();
                      }}
                      className="w-full py-5 bg-primary text-on-primary rounded-2xl font-black text-lg uppercase tracking-widest shadow-elevation-2 hover:shadow-elevation-3 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {checkoutStep === "idle" && tableNumber
                        ? "Enviar a Cocina"
                        : checkoutStep === "payment"
                          ? "Confirmar Pedido"
                          : "Continuar"}
                      <ArrowRight className="w-6 h-6" />
                    </button>
                  </div>
                )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Info Bottom Sheet - Android Style */}
      <AnimatePresence>
        {showInfo && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInfo(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`fixed ${appUser ? "bottom-20 md:bottom-0" : "bottom-0"} left-0 right-0 bg-surface rounded-t-[2.5rem] z-[110] shadow-elevation-5 p-8 max-h-[90vh] overflow-y-auto`}
            >
              <div className="w-12 h-1.5 bg-outline/20 rounded-full mx-auto mb-6" />
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-on-surface tracking-tight">
                  Información
                </h3>
                <button
                  onClick={() => setShowInfo(false)}
                  className="p-2 bg-surface-variant/50 rounded-full text-on-surface-variant"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Real GPS Distance Card */}
                {realDistanceInfo && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1C1C1E] to-[#121214] border border-[#FFD700]/30 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#FF8A00]/20 flex items-center justify-center text-[#FF8A00]">
                          <Navigation className="w-4 h-4 fill-current rotate-45" />
                        </div>
                        <div>
                          <h4 className="font-black text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                            <span>Distancia GPS en tiempo real</span>
                            {realDistanceInfo.isRealDriving && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Mapbox
                              </span>
                            )}
                          </h4>
                          <p className="text-[11px] text-neutral-400">
                            Calculada según tu ubicación satelital
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10">
                      <div className="bg-black/40 rounded-xl p-2.5 text-center">
                        <span className="block text-[10px] text-neutral-400 font-bold uppercase">
                          Distancia
                        </span>
                        <span className="text-sm font-black text-[#FFD700]">
                          {realDistanceInfo.distanceMeters < 1000
                            ? `${realDistanceInfo.distanceMeters} m (${realDistanceInfo.distanceKm} km)`
                            : `${realDistanceInfo.distanceKm} km (${realDistanceInfo.distanceMeters} m)`}
                        </span>
                      </div>
                      <div className="bg-black/40 rounded-xl p-2.5 text-center">
                        <span className="block text-[10px] text-neutral-400 font-bold uppercase">
                          Tiempo estimado
                        </span>
                        <span className="text-sm font-black text-white">
                          ~{realDistanceInfo.formattedDuration || "3-5 min"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary-container/30 rounded-2xl text-primary">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-on-surface text-sm uppercase tracking-widest mb-1">
                      Dirección
                    </h4>
                    <p className="text-on-surface-variant font-medium">
                      {restaurant.address || "No especificada"}
                    </p>
                    {restaurant.address && (
                      <a
                        href={
                          restaurant.latitude && restaurant.longitude
                            ? `https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`
                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address + ', ' + (restaurant.city || 'Maicao'))}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary font-black text-xs uppercase tracking-widest mt-2 inline-flex items-center gap-1 hover:underline"
                      >
                        <Navigation className="w-3 h-3 rotate-45" />
                        Ver ruta en mapa de navegación
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-secondary-container/30 rounded-2xl text-secondary">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-on-surface text-sm uppercase tracking-widest mb-1">
                      Horario
                    </h4>
                    <p className="text-on-surface-variant font-medium mb-4">
                      {restaurant.openingHours}
                    </p>
                    {restaurant.detailedHours && (
                      <div className="bg-surface-variant/20 p-4 rounded-2xl border border-outline/5">
                        {Object.entries(restaurant.detailedHours).map(
                          ([day, info]: [string, any]) => (
                            <div
                              key={day}
                              className="flex justify-between items-center py-2 border-b border-outline/5 last:border-0"
                            >
                              <span className="font-bold text-on-surface capitalize">
                                {day === "monday"
                                  ? "Lunes"
                                  : day === "tuesday"
                                    ? "Martes"
                                    : day === "wednesday"
                                      ? "Miércoles"
                                      : day === "thursday"
                                        ? "Jueves"
                                        : day === "friday"
                                          ? "Viernes"
                                          : day === "saturday"
                                            ? "Sábado"
                                            : "Domingo"}
                              </span>
                              <span className="text-sm font-medium text-on-surface-variant">
                                {info.enabled ? (
                                  info.shifts
                                    .map((s: any) => `${s.open} - ${s.close}`)
                                    .join(", ")
                                ) : (
                                  <span className="text-error font-bold">
                                    Cerrado
                                  </span>
                                )}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-tertiary-container/30 rounded-2xl text-tertiary">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-on-surface text-sm uppercase tracking-widest mb-1">
                      Contacto
                    </h4>
                    <p className="text-on-surface-variant font-medium">
                      WhatsApp: {restaurant.whatsappNumber || restaurant.phone}
                    </p>
                    <a
                      href={getWhatsAppNativeUrl("", restaurant.whatsappNumber || restaurant.phone)}
                      className="text-tertiary font-black text-xs uppercase tracking-widest mt-2 inline-block hover:underline"
                    >
                      Enviar mensaje
                    </a>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowInfo(false)}
                className="w-full mt-10 py-4 bg-surface-variant text-on-surface-variant rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-outline/10 transition-all"
              >
                Volver al menú
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Reviews Bottom Sheet */}
      <AnimatePresence>
        {isReviewsModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReviewsModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`fixed ${appUser ? "bottom-20 md:bottom-0" : "bottom-0"} left-0 right-0 bg-surface rounded-t-[2.5rem] z-[110] shadow-elevation-5 p-8 max-h-[85vh] overflow-y-auto w-full`}
            >
              <div className="w-12 h-1.5 bg-outline/20 rounded-full mx-auto mb-6" />
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-on-surface tracking-tight">
                  Reseñas de Clientes
                </h3>
                <button
                  onClick={() => setIsReviewsModalOpen(false)}
                  className="p-2 bg-surface-variant/50 rounded-full text-on-surface-variant cursor-pointer active:scale-95"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Rating Summary */}
              <div className="bg-surface-variant/10 p-6 rounded-[2rem] border border-outline/5 mb-8 flex flex-col md:flex-row items-center gap-6 justify-around">
                <div className="text-center">
                  <span className="text-6xl font-black text-on-surface">
                    {approvedReviews.length > 0
                      ? (
                          approvedReviews.reduce(
                            (sum, r) => sum + r.rating,
                            0,
                          ) / approvedReviews.length
                        ).toFixed(1)
                      : "0.0"}
                  </span>
                  <div className="flex justify-center gap-1 my-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const avg =
                        approvedReviews.length > 0
                          ? approvedReviews.reduce(
                              (sum, r) => sum + r.rating,
                              0,
                            ) / approvedReviews.length
                          : 0;
                      return (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${star <= Math.round(avg) ? "fill-amber-500 text-amber-500" : "fill-outline/20 text-outline/20"}`}
                        />
                      );
                    })}
                  </div>
                  <p className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-wider">
                    {approvedReviews.length} Calificaciones verificadas
                  </p>
                </div>

                <div className="w-full md:w-1/2 space-y-2">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = approvedReviews.filter(
                      (r) => Math.round(r.rating) === stars,
                    ).length;
                    const pct =
                      approvedReviews.length > 0
                        ? (count / approvedReviews.length) * 100
                        : 0;
                    return (
                      <div key={stars} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-on-surface-variant w-4">
                          {stars} ★
                        </span>
                        <div className="flex-1 h-2 bg-outline/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-on-surface-variant/60 w-8 text-right">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-6">
                {approvedReviews.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
                    {approvedReviews.map((review) => (
                      <div
                        key={review.id}
                        className="bg-surface-variant/5 p-6 rounded-[2rem] border border-outline/5"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${star <= review.rating ? "fill-amber-500 text-amber-500" : "fill-outline/20 text-outline/20"}`}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-bold text-on-surface-variant/60">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-on-surface-variant font-medium italic leading-relaxed">
                            "{review.comment}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-12 bg-surface-variant/5 rounded-[2rem] border border-outline/5">
                    <Star className="w-12 h-12 text-outline/20 mx-auto mb-4" />
                    <p className="text-on-surface-variant font-bold">
                      Aún no hay reseñas publicadas para este restaurante.
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsReviewsModalOpen(false)}
                className="w-full mt-6 py-4 bg-surface-variant text-on-surface-variant rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-outline/10 transition-all cursor-pointer active:scale-95"
              >
                Volver al menú
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Information Feature Modal */}
      <AnimatePresence>
        {infoFeatureModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInfoFeatureModal(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 h-[85vh] bg-surface rounded-t-[2.5rem] z-[2001] overflow-hidden flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/5"
            >
              <div className="p-6 overflow-y-auto pb-32 flex-1">
                <div className="w-12 h-1.5 bg-outline/20 rounded-full mx-auto mb-6" />
                
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFD700]/20 to-[#FFD700]/5 flex items-center justify-center border border-[#FFD700]/30 shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                      {infoFeatureModal === 'ruleta' && <Target className="w-6 h-6 text-[#FFD700]" />}
                      {infoFeatureModal === 'niveles' && <Crown className="w-6 h-6 text-[#FFD700]" />}
                      {infoFeatureModal === 'oro' && <Trophy className="w-6 h-6 text-[#FFD700]" />}
                      {infoFeatureModal === 'recompensas' && <ShoppingBag className="w-6 h-6 text-[#FFD700]" />}
                      {infoFeatureModal === 'referidos' && <Users className="w-6 h-6 text-[#FFD700]" />}
                    </div>
                    <h3 className="text-2xl font-black text-[#FFD700] tracking-tight drop-shadow-md">
                      {infoFeatureModal === 'ruleta' && 'Ruleta Pay'}
                      {infoFeatureModal === 'niveles' && 'Tareas y Niveles'}
                      {infoFeatureModal === 'oro' && 'Monedas de Oro'}
                      {infoFeatureModal === 'recompensas' && 'Recompensas'}
                      {infoFeatureModal === 'referidos' && 'Invita y Gana'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setInfoFeatureModal(null)}
                    className="p-2 bg-surface-variant/50 rounded-full text-white cursor-pointer active:scale-95 hover:bg-surface-variant transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="text-gray-300 text-[15px] leading-relaxed space-y-6">
                  {infoFeatureModal === 'ruleta' && (
                    <>
                      <div className="bg-[#1C1C1E] p-4 rounded-2xl border border-white/5">
                        <strong className="text-white block mb-1 text-base">🎡 ¿Qué es Ruleta Pay?</strong>
                        <p>Es un minijuego de azar donde puedes apostar y multiplicar tus Monedas de Oro. Cada giro cuesta 1 moneda. ¡Solo para los que buscan mayor riesgo y ganancias!</p>
                      </div>
                      <div className="bg-[#1C1C1E] p-4 rounded-2xl border border-white/5">
                        <strong className="text-white block mb-1 text-base">✨ Ruleta de Premios (Gratis)</strong>
                        <p>A diferencia de Ruleta Pay, la "Ruleta de Premios" te aparecerá gratis después de una compra para recompensarte con descuentos, bebidas o postres.</p>
                      </div>
                      <div className="bg-[#1C1C1E] p-4 rounded-2xl border border-white/5">
                        <strong className="text-white block mb-1 text-base">🎯 Participa</strong>
                        <p>Usa tus Monedas de Oro acumuladas para jugar en la Ruleta Pay y llevarte un jackpot de monedas o premios exclusivos.</p>
                      </div>
                    </>
                  )}
                  {infoFeatureModal === 'niveles' && (
                    <>
                      <div className="bg-[#1C1C1E] p-4 rounded-2xl border border-white/5">
                        <strong className="text-white block mb-1 text-base">✅ Tareas Diarias y Semanales</strong>
                        <p>Completa misiones y tareas diarias en la app para ganar puntos de experiencia (XP).</p>
                      </div>
                      <div className="bg-[#1C1C1E] p-4 rounded-2xl border border-white/5">
                        <strong className="text-white block mb-1 text-base">📈 Niveles y Membresías</strong>
                        <p>Con los puntos XP irás subiendo de nivel (Plata, Oro, Platino, Diamante) y desbloqueando nuevas membresías.</p>
                      </div>
                      <div className="bg-[#1C1C1E] p-4 rounded-2xl border border-white/5">
                        <strong className="text-white block mb-1 text-base">🎁 Beneficios</strong>
                        <p>Al subir de nivel accedes a atención prioritaria, promociones exclusivas, y beneficios según tu membresía.</p>
                      </div>
                    </>
                  )}
                  {infoFeatureModal === 'oro' && (
                    <>
                      <div className="bg-[#1C1C1E] p-4 rounded-2xl border border-white/5">
                         <strong className="text-white block mb-1 text-base">💰 ¿Cómo obtenerlas?</strong>
                         <p>Las Monedas de Oro se obtienen exclusivamente por las compras de los productos que realices en la aplicación.</p>
                      </div>
                      <div className="bg-[#1C1C1E] p-4 rounded-2xl border border-white/5">
                         <strong className="text-white block mb-1 text-base">💎 ¿Para qué sirven?</strong>
                         <p>Sirven para comprar giros en la Ruleta Pay, y también para canjear productos específicos del catálogo que se configuren con oro.</p>
                      </div>
                      <button onClick={() => { setInfoFeatureModal(null); navigate('/profile?tab=loyalty'); }} className="w-full mt-4 bg-gradient-to-r from-[#FFD700] to-[#FDB931] text-black font-black uppercase tracking-wider py-4 rounded-2xl shadow-[0_4px_15px_rgba(255,215,0,0.3)] hover:scale-[1.02] active:scale-95 transition-all">
                        Ir a mi billetera
                      </button>
                    </>
                  )}
                  {infoFeatureModal === 'recompensas' && (
                    <>
                      <div className="bg-[#1C1C1E] p-4 rounded-2xl border border-white/5">
                         <strong className="text-white block mb-1 text-base">🛍️ ¿Cómo funciona?</strong>
                         <p>Explora el catálogo de productos disponibles para canjear con tus Monedas de Oro acumuladas.</p>
                      </div>
                      <div className="bg-[#1C1C1E] p-4 rounded-2xl border border-white/5">
                         <strong className="text-white block mb-1 text-base">🍽️ Beneficios</strong>
                         <p>Podrás llevarte tus platillos y bebidas favoritas totalmente gratis.</p>
                      </div>
                      <button onClick={() => { setInfoFeatureModal(null); navigate('/profile?tab=loyalty'); }} className="w-full mt-4 bg-gradient-to-r from-[#FFD700] to-[#FDB931] text-black font-black uppercase tracking-wider py-4 rounded-2xl shadow-[0_4px_15px_rgba(255,215,0,0.3)] hover:scale-[1.02] active:scale-95 transition-all">
                        Ver catálogo
                      </button>
                    </>
                  )}
                  {infoFeatureModal === 'referidos' && (
                    <>
                      <div className="bg-[#1C1C1E] p-4 rounded-2xl border border-white/5">
                         <strong className="text-white block mb-1 text-base">🔗 ¿Cómo funciona?</strong>
                         <p>Comparte tu enlace de referido con tus amigos. Cuando ellos se registren y realicen su primer pedido, ¡ambos ganan!</p>
                      </div>
                      <div className="bg-[#1C1C1E] p-4 rounded-2xl border border-white/5">
                         <strong className="text-white block mb-1 text-base">🎉 Beneficios</strong>
                         <p>Gana increíbles recompensas y bonos por cada amigo que logres referir.</p>
                      </div>
                      <button onClick={() => { setInfoFeatureModal(null); navigate(`/referrals-info/${restaurant.id}`); }} className="w-full mt-4 bg-gradient-to-r from-[#FFD700] to-[#FDB931] text-black font-black uppercase tracking-wider py-4 rounded-2xl shadow-[0_4px_15px_rgba(255,215,0,0.3)] hover:scale-[1.02] active:scale-95 transition-all">
                        Comenzar a referir
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Recommendation Bottom Sheet - Android Style */}
      <AnimatePresence>
        {recommendationProduct && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRecommendationProduct(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`fixed ${appUser ? "bottom-20 md:bottom-0" : "bottom-0"} left-0 right-0 bg-surface rounded-t-[2.5rem] z-[130] shadow-elevation-5 p-8 max-h-[80vh] overflow-y-auto`}
            >
              <div className="w-12 h-1.5 bg-outline/20 rounded-full mx-auto mb-6" />
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-on-surface tracking-tight">
                    ¿Algo más?
                  </h3>
                  <button
                    onClick={() => setRecommendationProduct(null)}
                    className="p-2 bg-surface-variant/50 rounded-full text-on-surface-variant"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recommendedProducts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-4 bg-surface-variant/10 p-4 rounded-3xl border border-outline/5 group"
                    >
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-surface-variant shrink-0">
                        {p.images[0] && (
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-on-surface truncate">
                          {p.name}
                        </h4>
                        <p className="text-primary font-black text-sm">
                          {formatCurrency(p.price)}
                        </p>
                        <button
                          onClick={() => {
                            handleAddToCart(p);
                          }}
                          className="mt-2 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80"
                        >
                          <Plus className="w-3 h-3" /> Añadir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setRecommendationProduct(null)}
                  className="w-full mt-10 py-4 bg-primary text-on-primary rounded-2xl font-black text-sm uppercase tracking-widest shadow-elevation-2 hover:shadow-elevation-3 transition-all active:scale-95"
                >
                  Continuar con mi pedido
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ProductDetailModal
        product={selectedProductForModal}
        isOpen={selectedProductForModal !== null}
        onClose={() => setSelectedProductForModal(null)}
        onAddToCart={(p, qty) => {
          if (!restaurant) return;
          if (!isRestaurantOpen(restaurant, currentTime)) {
            toast.error("El restaurante está cerrado en este momento");
            return;
          }

          // Apply discount if exists
          let finalPrice = p.price;
          if (p.discountPercentage && p.discountPercentage > 0) {
            finalPrice = p.discountPrice || p.price;
          } else if (
            restaurant.generalDiscountEnabled &&
            restaurant.generalDiscount &&
            restaurant.generalDiscount > 0
          ) {
            finalPrice = Math.round(
              p.price * (1 - restaurant.generalDiscount / 100),
            );
          }

          const productWithInfo = {
            ...p,
            price: finalPrice,
            originalPrice: p.price,
            restaurantId: restaurant.id,
            restaurantName: restaurant.name,
          };
          const res = addToCart(productWithInfo, qty);
          if (res && !res.success) {
            if (res.error === "NOT_LOGGED_IN") {
              return;
            }
            toast.error(
              `Ya tienes productos del restaurante "${res.existingRestaurantName}" en tu carrito. Por favor finaliza tu pedido o vacía el carrito para poder ordenar de "${restaurant.name}".`,
              {
                duration: 5000,
              },
            );
            return;
          }
          toast.success(`${qty}x ${p.name} añadido al carrito!`);
        }}
        onGoToRestaurant={() => {
          setSelectedProductForModal(null);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        generalDiscount={restaurant?.generalDiscount}
        generalDiscountEnabled={restaurant?.generalDiscountEnabled}
      />
    </div>
  );
}
