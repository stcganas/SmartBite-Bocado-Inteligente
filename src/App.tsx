/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { VisitTracker } from "./components/VisitTracker";

import React from "react";
import { CustomSplashScreen } from "./components/CustomSplashScreen";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  Store,
  Utensils,
  Settings,
  LogOut,
  Sparkles,
  Home as HomeIcon,
  User,
  ShoppingBag,
  Truck,
  Bell,
  Download,
  AlertCircle,
  Briefcase,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "./lib/supabase";
import { Toaster } from "sonner";

// Lazy load pages for better performance
const Home = React.lazy(() => import("./pages/Home"));
const AllRestaurants = React.lazy(() => import("./pages/AllRestaurants"));
const RestaurantView = React.lazy(() => import("./pages/RestaurantView"));
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const PlatformAdmin = React.lazy(() => import("./pages/PlatformAdmin"));
const UserDashboard = React.lazy(() => import("./pages/UserDashboard"));
const DriverDashboard = React.lazy(() => import("./pages/DriverDashboard"));
const SupportTickets = React.lazy(() => import("./pages/SupportTickets"));
const SupportTicketDetail = React.lazy(() => import("./pages/SupportTicketDetail"));
const OrderDetail = React.lazy(() => import("./pages/OrderDetail"));
const Auth = React.lazy(() => import("./pages/Auth"));
const ReferralProgramInfo = React.lazy(() => import("./pages/ReferralProgramInfo"));
const RepresentativeLanding = React.lazy(() => import("./pages/RepresentativeLanding"));
const RepresentativeDashboard = React.lazy(() => import("./pages/RepresentativeDashboard"));

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import {
  NotificationProvider,
  useNotifications,
} from "./contexts/NotificationContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationDropdown } from "./components/NotificationDropdown";
import { ChatAssistant } from "./components/ChatAssistant";
import { ProfileCompletionModal } from "./components/ProfileCompletionModal";
import { db, PlatformSettings, defaultSettings } from "./store/db";
import { useOneSignal } from "./hooks/useOneSignal";
import { PushNotificationBanner } from "./components/PushNotificationBanner";
import { GlobalCart } from "./components/GlobalCart";
import { Onboarding } from "./components/Onboarding";
import { LoginRequiredModal } from "./components/LoginRequiredModal";
import { SafeBoundary } from "./SafeBoundary";
import PwaPrompt from "./components/PwaPrompt";
import { BackgroundMusic } from "./components/BackgroundMusic";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto'
    });
  }, [pathname]);
  return null;
};

const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) => {
  const { user, appUser, loading } = useAuth();

  if (loading) return <div className="p-8 text-center">Cargando...</div>;

  if (!user) return <Navigate to={`/${window.location.search}`} />;

  if (appUser?.status === "paused") {
    return (
      <div className="p-8 text-center text-red-600 font-bold">
        Tu cuenta ha sido pausada. Contacta al administrador.
      </div>
    );
  }

  if (allowedRoles && (!appUser || !allowedRoles.includes(appUser.role))) {
    return <Navigate to={`/${window.location.search}`} />;
  }

  return <>{children}</>;
};

const BottomNav = () => {
  const { user, appUser } = useAuth();
  const location = useLocation();

  const isDashboardPage = ["/admin", "/platform", "/profile", "/driver", "/representative"].some(
    (p) => location.pathname.startsWith(p),
  );

  if (!user || isDashboardPage) return null;

  const getDashboardLink = () => {
    if (!appUser) return "/";
    if (appUser.role === "admin") return "/platform";
    if (appUser.role === "restaurant") return "/admin";
    if (appUser.role === "driver") return "/driver";
    if (appUser.role === "representative") return "/representative";
    return "/profile";
  };

  let navItems = [{ icon: HomeIcon, label: "Inicio", path: "/" }];

  if (!appUser || appUser.role === "user") {
    navItems.push({ icon: User, label: "Perfil", path: "/profile" });
    navItems.push({
      icon: ShoppingBag,
      label: "Pedidos",
      path: "/profile?tab=orders",
    });
  } else if (appUser.role === "driver") {
    navItems.push({ icon: Truck, label: "Entregas", path: "/driver" });
  } else if (appUser.role === "restaurant") {
    navItems.push({ icon: Utensils, label: "Gestión", path: "/admin" });
    navItems.push({
      icon: ShoppingBag,
      label: "Pedidos",
      path: "/admin?tab=orders",
    });
  } else if (appUser.role === "representative") {
    navItems.push({ icon: Sparkles, label: "Panel", path: "/representative" });
  } else if (appUser.role === "admin") {
    navItems.push({ icon: Settings, label: "Admin", path: "/platform" });
  }

  return (
    <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-[#0B0B0B] shadow-2xl rounded-3xl py-2 z-[200] flex justify-around items-center h-[72px] golden-glow-module">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path || (item.path.includes('?tab') && location.search.includes(item.path.split('?')[1]));
        return (
          <Link
            key={item.label}
            to={item.path}
            className="flex flex-col items-center justify-center w-full relative group h-full"
          >
            <div className="relative flex flex-col items-center justify-center w-full h-full">
              {isActive && (
                <div className="absolute top-0 w-10 h-1 bg-[#FF8A00] rounded-b-full shadow-[0_0_10px_rgba(255,138,0,0.5)]"></div>
              )}
              <motion.div
                animate={{
                  scale: isActive ? 1.05 : 1,
                  y: isActive ? -2 : 0,
                }}
                className="flex items-center justify-center transition-all duration-300 mt-1"
              >
                <item.icon
                  className={`w-6 h-6 transition-colors duration-300 ${isActive ? "text-[#FF8A00]" : "text-[#A0A0A0]"}`}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
              </motion.div>
              <span
                className={`text-[10px] mt-1 transition-colors duration-300 ${isActive ? "text-[#FF8A00] font-bold" : "text-[#A0A0A0] font-medium"}`}
              >
                {item.label}
              </span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
};

const Header = () => {
  const { user, appUser, signOut, loading } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [platformSettings, setPlatformSettings] =
    React.useState<PlatformSettings | null>(null);

  React.useEffect(() => {
    db.getPlatformSettings().then((v) => {
      setPlatformSettings(v);
      if (v?.appName) {
        document.title = v.appName;
        // Update manifest link to include version/name breaker
        const manifestLink = document.querySelector('link[rel="manifest"]');
        if (manifestLink) {
          const currentHref = manifestLink.getAttribute('href') || '/manifest.webmanifest';
          if (!currentHref.includes('v=')) {
            manifestLink.setAttribute('href', `${currentHref}?v=${encodeURIComponent(v.appName)}`);
          }
        }
        
        // Update apple-mobile-web-app-title
        const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
        if (appleTitle) appleTitle.setAttribute('content', v.appName);
        
        // Update meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && v.heroSubtitle) metaDesc.setAttribute('content', v.heroSubtitle);
      }
    });
  }, []);

  const isDashboardPage = ["/admin", "/platform", "/profile", "/driver"].some(
    (p) => location.pathname.startsWith(p),
  );

  if (location.pathname.startsWith("/r/") || isDashboardPage) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error during sign out:", error);
      navigate("/");
    }
  };

  const getDashboardLink = () => {
    if (!appUser) return "/";
    if (appUser.role === "admin") return "/platform";
    if (appUser.role === "restaurant") return "/admin";
    if (appUser.role === "driver") return "/driver";
    return "/profile";
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[120] pointer-events-none px-3 sm:px-4 flex flex-col items-center w-full max-w-[100vw]">
        <div className="w-full h-3 sm:h-4 lg:h-5"></div>
        {/* Main Floating Header */}
        <header className="rounded-[1.5rem] w-full max-w-7xl h-16 sm:h-20 md:h-24 flex items-center header-glow-module pointer-events-auto border border-white/10 shadow-2xl relative overflow-hidden">
          {/* Background Food Image with left fade and transparency */}
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none"
            style={{
              backgroundImage: 'url("https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000&auto=format&fit=crop")',
              opacity: 0.35,
              maskImage: 'linear-gradient(to right, transparent 5%, rgba(0, 0, 0, 0.4) 35%, rgba(0, 0, 0, 0.9) 85%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 5%, rgba(0, 0, 0, 0.4) 35%, rgba(0, 0, 0, 0.9) 85%)',
            }}
          />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          <div className="px-0 w-full flex items-center justify-between gap-1 sm:gap-2 h-full relative z-10 overflow-hidden rounded-[1.5rem] bg-transparent">
            {/* Extremely tight left alignment for logo */}
            <Link
              to="/"
              className="flex items-center group shrink-0 py-2 ml-2 sm:ml-4 max-w-[35%] sm:max-w-[40%] md:max-w-[45%] w-auto"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center justify-start w-full pl-0"
              >
                {platformSettings?.appLogo ? (
                  <img
                    src={platformSettings.appLogo}
                    alt={`${platformSettings?.appName || 'App'} Logo`}
                    style={{
                      transform: `scale(${(platformSettings.logoScale !== undefined ? platformSettings.logoScale : 100) / 100}) translate(${(platformSettings.logoOffsetX !== undefined ? platformSettings.logoOffsetX : 0)}px, ${(platformSettings.logoOffsetY !== undefined ? platformSettings.logoOffsetY : 0)}px)`,
                      transformOrigin: 'left center',
                      maxHeight: platformSettings.logoHeight !== undefined ? `${Math.min(platformSettings.logoHeight, 56)}px` : '44px',
                      maxWidth: platformSettings.logoWidth !== undefined ? `${Math.min(platformSettings.logoWidth, 180)}px` : '140px',
                      borderTopRightRadius: platformSettings.logoBorderRadius !== undefined ? `${platformSettings.logoBorderRadius}px` : '12px',
                      borderBottomRightRadius: platformSettings.logoBorderRadius !== undefined ? `${platformSettings.logoBorderRadius}px` : '12px',
                    }}
                    className="h-8 sm:h-11 md:h-12 max-w-full w-auto object-contain object-left drop-shadow-glow"
                  />
                ) : (
                  <div className="w-full flex items-center justify-start">
                    <span className="text-3xl sm:text-5xl font-black italic tracking-tighter bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent transform origin-left glow-text">
                      {platformSettings?.appName || ""}
                    </span>
                  </div>
                )}
              </motion.div>
            </Link>

        <nav className="flex items-center gap-1 sm:gap-2 pr-1 sm:pr-2">
          {loading ? (
            <div className="w-20 h-8 bg-surface-variant animate-pulse rounded-full" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <NotificationDropdown
                getDashboardLink={() => getDashboardLink()}
              />
              <button
                onClick={handleSignOut}
                type="button"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-variant hover:bg-surface-light active:scale-95 text-red-500 transition-all duration-300 border border-white/5 shadow-sm relative group"
                title="Cerrar sesión"
                id="header_logout_btn"
              >
                <LogOut className="w-4 h-4 transition-transform group-hover:scale-110" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <motion.div
                animate={{
                  scale: [1, 1.02, 1],
                  boxShadow: [
                    "0 10px 15px -3px rgba(255, 138, 0, 0.2)",
                    "0 10px 25px -3px rgba(255, 138, 0, 0.4)",
                    "0 10px 15px -3px rgba(255, 138, 0, 0.2)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="shrink-0 rounded-full"
              >
                <Link
                  to="/auth?mode=register"
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full glass-button text-on-surface text-[11px] sm:text-xs font-black shadow-lg transition-all hover:-translate-y-0.5 relative group overflow-hidden"
                >
                  <span>Afiliarme</span>
                </Link>
              </motion.div>

              <Link
                to="/auth"
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-surface-variant border border-outline-variant text-primary text-[11px] sm:text-xs font-bold transition-all hover:bg-surface-light active:scale-95 shrink-0"
              >
                <span>Entrar</span>
              </Link>
            </div>
          )}
        </nav>
          </div>
        </header>

        {/* Top Floating Mini-Bar For "Trabaja con SmartBite" */}
        {platformSettings?.showWorkWithUsBanner !== false && (
          <div className="w-full max-w-7xl mx-auto flex items-center justify-start pointer-events-auto mt-3 mb-1 pl-2 sm:pl-3 md:pl-4">
            <Link to="/representante">
              <motion.div
                animate={{ 
                  y: [0, -3, 0],
                  boxShadow: [
                    "0px 4px 12px rgba(212, 175, 55, 0.2)",
                    "0px 8px 24px rgba(212, 175, 55, 0.6)",
                    "0px 4px 12px rgba(212, 175, 55, 0.2)"
                  ]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-[#0B0B0B] border border-[#D4AF37]/50 rounded-full text-white text-[10px] sm:text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-transform overflow-hidden group shadow-lg"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4AF37] relative z-10" />
                <span className="relative z-10 bg-gradient-to-r from-white to-[#D4AF37] bg-clip-text text-transparent drop-shadow-md">
                  Trabaja con {platformSettings?.appName || "SmartBite"} <span className="hidden sm:inline">- Genera Ingresos</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4AF37] group-hover:translate-x-0.5 transition-transform relative z-10" />
                
                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/0 via-[#D4AF37]/10 to-[#D4AF37]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </motion.div>
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

const OneSignalNotificationsManager = () => {
  useOneSignal();
  return null;
};

function App() {
  const location = useLocation();

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname, location.search]);

  return (
    <SafeBoundary>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <NotificationProvider>
              <OneSignalNotificationsManager />
              <VisitTracker />
              <AppLayout />
            </NotificationProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeBoundary>
  );
}

const SystemSplashScreen = ({ onComplete, appLogo, appName }: { onComplete: () => void, appLogo?: string, appName?: string }) => {
  const [phraseIndex, setPhraseIndex] = React.useState(0);
  const name = appName || "";
  const phrases = [
    `Bienvenido a ${name}`,
    "Haz tus pedidos con tu voz",
    `${name} Inteligente`,
    "La magia de ordenar fácil",
    "Conectando sabores",
  ];

  React.useEffect(() => {
    const minLoadTime = 300;
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    }, 800);

    const timer = setTimeout(() => {
      clearInterval(interval);
      onComplete();
    }, minLoadTime);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onComplete, phrases.length]);

  return (
    <div className="fixed inset-0 bg-neutral-950 flex flex-col items-center justify-center z-[99999] overflow-hidden text-on-surface font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-600/20 via-transparent to-transparent opacity-60 animate-pulse pointer-events-none" />
      <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[-20%] left-[-10%] w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl animate-pulse" />

      <div className="relative flex flex-col items-center max-w-sm px-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, rotate: -8 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="w-28 h-28 bg-white p-3 rounded-[2rem] shadow-2xl shadow-orange-500/10 border-4 border-white/20 mb-8 flex items-center justify-center relative overflow-hidden"
        >
          {appLogo ? (
            <img
              src={appLogo}
              alt={name}
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const parent = target.parentElement;
                if (parent) {
                  const fallback = parent.querySelector(".fallback-text");
                  if (fallback) fallback.classList.remove("hidden");
                }
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-500 to-red-600 rounded-[1.5rem] flex items-center justify-center font-black text-on-surface text-5xl">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="fallback-text hidden w-full h-full bg-gradient-to-br from-orange-500 to-red-600 rounded-[1.5rem] flex items-center justify-center font-black text-on-surface text-5xl">
            {name.charAt(0).toUpperCase()}
          </div>
        </motion.div>

        {!appLogo && (
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-orange-100 to-orange-400 bg-clip-text text-transparent mb-1"
          >
            {name}
          </motion.h1>
        )}

        <div className="h-16 mb-10 relative w-full flex justify-center items-center px-4 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={phraseIndex}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-orange-400 text-xs sm:text-sm font-black uppercase tracking-[0.1em] absolute w-full text-center"
            >
              {phrases[phraseIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="w-48 h-1 bg-surface-base rounded-full overflow-hidden mb-4 relative mt-2">
          <motion.div
            initial={{ left: "-100%" }}
            animate={{ left: "100%" }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="absolute w-2/3 h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
          />
        </div>
        <p className="text-[10px] font-black tracking-wider text-orange-500 uppercase animate-pulse">
          Iniciando experiencia...
        </p>
      </div>
    </div>
  );
};

const SplashScreen = ({
  onComplete,
  platformSettings,
}: {
  onComplete: () => void;
  platformSettings: PlatformSettings | null;
}) => {
  if (platformSettings?.isCustomSplashActive) {
    return <CustomSplashScreen onComplete={onComplete} platformSettings={platformSettings} />;
  }
  return <SystemSplashScreen onComplete={onComplete} appLogo={platformSettings?.systemSplashLogo || platformSettings?.appLogo} appName={platformSettings?.appName || ""} />;
};

const AppLayout = () => {
  const { user, loading, isLoginPromptOpen, setLoginPromptOpen } = useAuth();
  const location = useLocation();
  const [platformSettings, setPlatformSettings] =
    React.useState<PlatformSettings | null>(null);
  const [settingsLoaded, setSettingsLoaded] = React.useState(false);
  const isStandaloneOnboarding = location.pathname.startsWith('/onboarding/');
  const [showSplash, setShowSplash] = React.useState(() => {
    if (isStandaloneOnboarding) return false;
    return window.location.pathname === "/" || window.location.hash === "#/" || window.location.hash === "";
  });
  const [showOnboarding, setShowOnboarding] = React.useState(() => {
    if (isStandaloneOnboarding) return false;
    return localStorage.getItem("smartbite_onboarding_completed") !== "true";
  });

  React.useEffect(() => {
    let active = true;
    
    // Force sync the latest gamification settings once per device for this task
    if (!localStorage.getItem("gamification_day8_synced")) {
        db.updatePlatformSettings({ gamificationSettings: defaultSettings.gamificationSettings }).then(() => {
            localStorage.setItem("gamification_day8_synced", "true");
        });
    }
    
    const timeoutId = setTimeout(() => {
      if (active) {
        console.warn('Carga de configuraciones retrasada. Forzando inicio con datos predeterminados.');
        setPlatformSettings(prev => prev || defaultSettings);
        setSettingsLoaded(true);
      }
    }, 3000); // Timeout rápido para evitar pantalla en blanco prolongada

    db.getPlatformSettings()
      .then((v) => {
        clearTimeout(timeoutId);
        if (active) {
          setPlatformSettings(v);
          setSettingsLoaded(true);
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        console.error('Error al cargar configuraciones base de la base de datos:', err);
        if (active) {
          setPlatformSettings(prev => prev || defaultSettings);
          setSettingsLoaded(true);
        }
      });

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const handleSplashComplete = React.useCallback(
    () => setShowSplash(false),
    [],
  );

  if (!settingsLoaded) {
    return (
      <div className="fixed inset-0 bg-neutral-950 flex flex-col items-center justify-center z-[99999] overflow-hidden">
        <div className="absolute inset-0 bg-radial-gradient from-orange-600/20 via-transparent to-transparent opacity-60 animate-pulse pointer-events-none" />
        <div className="relative flex flex-col items-center gap-4">
           {/* Spinner visible para que el usuario sepa que está cargando */}
           <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
           <p className="text-orange-100/40 text-[10px] font-medium tracking-widest uppercase animate-pulse">Iniciando SmartBite...</p>
        </div>
      </div>
    );
  }

  const isDashboardPage = ["/admin", "/platform", "/profile", "/driver"].some(
    (p) => location.pathname.startsWith(p),
  );

  return (
    <div
      className={`min-h-screen bg-surface flex flex-col font-sans text-on-surface w-full relative`}
    >
      <ScrollToTop />
      <AnimatePresence>
        {(loading || showSplash) && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            className="fixed inset-0 z-[99999]"
          >
            <SplashScreen
              onComplete={handleSplashComplete}
              platformSettings={platformSettings}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && !showSplash && showOnboarding ? (
        <Onboarding
          platformSettings={platformSettings}
          onComplete={() => {
            localStorage.setItem("smartbite_onboarding_completed", "true");
            setShowOnboarding(false);
          }}
        />
      ) : (
        <div
          className={`flex-1 flex flex-col ${
            isDashboardPage || location.pathname.startsWith("/r/") 
              ? "" 
              : platformSettings?.showWorkWithUsBanner !== false
                ? "pt-32 sm:pt-40 md:pt-44" 
                : "pt-24 sm:pt-28 md:pt-32"
          } ${user ? "pb-20 md:pb-0" : ""}`}
        >
          <Toaster position="top-center" expand={true} richColors />
          <ProfileCompletionModal />
          {!isDashboardPage && <Header />}
          {/* Notification Banner with 24 hours cooldown once dismissed */}
          <PushNotificationBanner />
          <main className="flex-1 w-full flex flex-col relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ 
                  duration: 0.2, 
                  ease: "easeOut" 
                }}
                className="flex-1 flex flex-col"
              >
                <React.Suspense fallback={
                  <div className="flex-1 flex items-center justify-center bg-black min-h-[400px]">
                    <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                }>
                  <Routes location={location}>
                  <Route path="/" element={<Home />} />
                  <Route path="/restaurantes" element={<AllRestaurants />} />
                  <Route path="/r/:id" element={<RestaurantView />} />
                  <Route
                    path="/representante"
                    element={<RepresentativeLanding />}
                  />
                  <Route
                    path="/representative"
                    element={
                      <ProtectedRoute allowedRoles={["representative", "admin"]}>
                        <RepresentativeDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/referrals-info"
                    element={<ReferralProgramInfo />}
                  />
                  <Route
                    path="/referrals-info/:restaurantId"
                    element={<ReferralProgramInfo />}
                  />
                  <Route path="/auth" element={<Auth />} />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute allowedRoles={["restaurant", "admin", "representative"]}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/:id"
                    element={
                      <ProtectedRoute allowedRoles={["restaurant", "admin", "representative"]}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/platform"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <PlatformAdmin />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/onboarding/:flowId"
                    element={<Onboarding platformSettings={platformSettings} standaloneFlowId={location.pathname.replace('/onboarding/', '')} />}
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute allowedRoles={["user", "admin"]}>
                        <UserDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/driver"
                    element={
                      <ProtectedRoute allowedRoles={["driver", "admin"]}>
                        <DriverDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/support"
                    element={
                      <ProtectedRoute>
                        <SupportTickets />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/support/ticket/:id"
                    element={
                      <ProtectedRoute>
                        <SupportTicketDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/orders/:id"
                    element={
                      <ProtectedRoute>
                        <OrderDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                </React.Suspense>
              </motion.div>
            </AnimatePresence>
          </main>
          <BottomNav />
          {!["/admin", "/platform", "/profile", "/driver", "/representative", "/support"].some(p => location.pathname.startsWith(p)) && (
            <ChatAssistant platformSettings={platformSettings} />
          )}
          <GlobalCart />
          <PwaPrompt />
          <BackgroundMusic />
          <LoginRequiredModal 
            isOpen={isLoginPromptOpen} 
            onClose={() => setLoginPromptOpen(false)} 
          />
        </div>
      )}
    </div>
  );
};

const AppWrapper = () => (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

export default AppWrapper;
