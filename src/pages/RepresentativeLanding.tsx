import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../store/db";
import { supabase } from "../lib/supabase";
import { 
  Rocket, Search, Award, BookOpen, Briefcase, Clock, TrendingUp, Check, 
  CheckCircle, MessageSquare, MapPin, User, Mail, Phone, Shield, Star, 
  Crown, DollarSign, Gift, Globe, Users, ArrowRight, ChevronRight, Info,
  Calendar, ChevronDown, ChevronUp, Sparkles, Building, BarChart2, ShieldAlert,
  AlertTriangle
} from "lucide-react";

export default function RepresentativeLanding() {
  const { user, appUser } = useAuth();
  const formRef = useRef<HTMLDivElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    nombreCompleto: (appUser as any)?.display_name || appUser?.displayName || "",
    ciudad: "",
    departamento: "",
    whatsapp: (appUser as any)?.whatsapp || "",
    correo: appUser?.email || user?.email || "",
    edad: "",
    profesion: "",
    experienciaVentas: "No",
    experienciaPlataformas: "No",
    nivelTecnologico: "Intermedio",
    trabajadoRestaurantes: "No",
    disponeComputador: "No",
    motivo: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formError, setFormError] = useState("");
  const [emailWarning, setEmailWarning] = useState("");
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleScrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleEmailBlur = async () => {
    if (!formData.correo || !formData.correo.includes("@")) {
      setEmailWarning("");
      return;
    }
    
    setIsCheckingEmail(true);
    setEmailWarning("");
    
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('role')
        .eq('email', formData.correo.trim())
        .maybeSingle();

      if (!error && data && (data.role === 'user' || data.role === 'restaurant' || data.role === 'driver')) {
        setEmailWarning("Este correo ya se encuentra registrado en nuestra plataforma (rol cliente/asociado). Te recomendamos registrar tu solicitud de embajador con un correo distinto para no perder historial, premios o progreso de gamificación de tu cuenta actual.");
      }
    } catch (err) {
      console.warn("Error checking email uniqueness", err);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    
    // Simple client-side validation
    if (!formData.nombreCompleto || !formData.ciudad || !formData.whatsapp || !formData.correo || !formData.edad) {
      setFormError("Por favor completa todos los campos requeridos (*)");
      return;
    }

    if (emailWarning) {
      setFormError("Debes usar un correo electrónico diferente para tu cuenta comercial.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formattedDescription = `
====== POSTULACIÓN REPRESENTANTE COMERCIAL ======
- Nombre completo: ${formData.nombreCompleto}
- Correo: ${formData.correo}
- WhatsApp/Tel: ${formData.whatsapp}
- Edad: ${formData.edad} años
- Ubicación: ${formData.ciudad}, ${formData.departamento}
- Profesión/Ocupación: ${formData.profesion}

====== DEBIDA DILIGENCIA COMERCIAL ======
- ¿Tiene experiencia en ventas?: ${formData.experienciaVentas}
- ¿Tiene experiencia en plataformas digitales?: ${formData.experienciaPlataformas}
- Nivel de manejo tecnológico: ${formData.nivelTecnologico}
- ¿Ha trabajado con restaurantes?: ${formData.trabajadoRestaurantes}
- ¿Dispone de computador e internet?: ${formData.disponeComputador}

====== MOTIVACIÓN ======
${formData.motivo || "No especificado"}
`;

      const ticketUserId = user?.id || "00000000-0000-0000-0000-000000000000";

      const { error } = await db.createSupportTicket({
        userId: ticketUserId,
        subject: `Postulación Representante: ${formData.nombreCompleto} (${formData.ciudad})`,
        description: formattedDescription,
        priority: "high"
      });

      if (error) {
        throw new Error(error.message || "Error al crear el ticket");
      }

      // Success! Optional: create a push notification in-app for confirmation if logged in
      if (user?.id) {
        db.saveNotification({
          userId: user.id,
          title: "¡Postulación Recibida con Éxito! 🚀✨",
          body: "¡Excelente perfil! Tu solicitud oficial para ser Representante de SmartBite ha sido registrada en nuestro panel. Nuestro equipo de selección la estará evaluando con prioridad máxima. ¡Mucho éxito! 🍀🤝",
          type: "support_reply"
        }).catch(err => console.warn("Failed saving notification for rep application:", err));
      }

      setSubmitSuccess(true);
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error("[RepresentativeLanding] Submission error:", err);
      setFormError("Hubo un inconveniente enviando tu solicitud. Por favor intenta de nuevo en unos momentos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pre-fill user data if available
  useEffect(() => {
    if (appUser || user) {
      setFormData(prev => ({
        ...prev,
        nombreCompleto: prev.nombreCompleto || (appUser as any)?.display_name || appUser?.displayName || "",
        correo: prev.correo || appUser?.email || user?.email || "",
        whatsapp: prev.whatsapp || (appUser as any)?.whatsapp || "",
      }));
    }
  }, [appUser, user]);

  return (
    <div id="representative_page" className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden relative selection:bg-[#FFE066] selection:text-black">
      
      {/* Decorative gradients for futuristic/metallic glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[35%] right-0 w-[400px] h-[400px] bg-gradient-to-bl from-amber-500/5 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-[450px] h-[450px] bg-gradient-to-tr from-[#D4AF37]/5 to-transparent rounded-full blur-[130px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 px-4 max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-[#D4AF37]/30 rounded-full text-[#D4AF37] text-xs md:text-sm font-semibold tracking-wider uppercase mb-6 shadow-[0_0_15px_rgba(212,175,55,0.1)]"
        >
          <Sparkles className="w-4 h-4 text-[#D4AF37] animate-pulse" />
          Convocatoria Abierta Representantes Comerciales
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6"
        >
          🚀 Conviértete en <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffe485] via-[#D4AF37] to-[#e4b825] drop-shadow-[0_2px_15px_rgba(212,175,55,0.2)]">Representante Oficial</span> SmartBite
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="text-lg md:text-xl text-gray-300 max-w-3xl font-medium leading-relaxed mb-4"
        >
          Ayuda a restaurantes a digitalizar sus ventas y administra una de las plataformas gastronómicas más innovadoras del mercado.
        </motion.p>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="text-sm md:text-md text-gray-400 max-w-2xl leading-relaxed mb-10"
        >
          SmartBite busca personas con perfil comercial y habilidades tecnológicas para afiliar restaurantes, capacitarlos y acompañarlos en el uso de nuestro Menú Digital Inteligente con Asistente de Ventas IA.
        </motion.p>

        {/* Benefits Grid in Hero */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 max-w-4xl w-full mb-12"
        >
          {[
            { label: "Comisiones por afiliación", icon: "💰" },
            { label: "Bonificaciones por desempeño", icon: "📈" },
            { label: "Capacitación gratuita", icon: "📚" },
            { label: "Trabajo flexible", icon: "🕒" },
            { label: "Crecimiento profesional", icon: "🚀" }
          ].map((benefit, i) => (
            <div 
              key={i} 
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-[#D4AF37]/50 transition-all group hover:scale-[1.02]"
            >
              <span className="text-2xl mb-2 group-hover:animate-bounce">{benefit.icon}</span>
              <span className="text-xs md:text-sm font-semibold text-gray-200 text-center leading-tight">{benefit.label}</span>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 items-center"
        >
          <button 
            type="button"
            onClick={handleScrollToForm}
            className="px-8 py-4 bg-gradient-to-r from-[#ffe485] via-[#D4AF37] to-[#e4b825] text-black font-black text-sm md:text-base rounded-2xl shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:shadow-[0_0_35px_rgba(212,175,55,0.6)] transform hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            🔥 QUIERO SER REPRESENTANTE
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </section>

      {/* Brand Identity / What is SmartBite */}
      <section className="py-20 bg-[#08080a] border-y border-zinc-900 relative">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-6 leading-tight">
              ¿Qué es <span className="text-[#D4AF37]">SmartBite</span>?
            </h2>
            <p className="text-gray-300 text-base md:text-lg mb-6 leading-relaxed">
              SmartBite es un ecosistema tecnológico gastronómico diseñado para transformar la manera en que los restaurantes interactúan con sus clientes y digitalizan su operación. Nuestra solución maximiza los ingresos a través de herramientas inteligentes únicas en el mercado.
            </p>
            <div className="space-y-4">
              {[
                { title: "🍽 Menú Digital Inteligente", desc: "Interactiva navegación visual de platos con categorización intuitiva." },
                { title: "🤖 Asistente de Ventas con IA", desc: "Recomendaciones personalizadas basadas en IA que aumentan el ticket promedio." },
                { title: "📦 Gestión de Pedidos en Tiempo Real", desc: "Monitoreo completo del pedido para clientes, conductores y locales." },
                { title: "📊 Panel Administrativo Completo", desc: "Métricas claras, reportes de ventas, ingresos, y control de stock." },
                { title: "👥 Programas de Fidelización Avanzados", desc: "Premios, Ruleta de Oro, misiones y cupones que enamoran clientes." }
              ].map((item, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="bg-amber-500/10 p-1.5 rounded-lg border border-[#D4AF37]/20 mt-1 flex-shrink-0">
                    <Check className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-100 text-sm md:text-base">{item.title}</h3>
                    <p className="text-zinc-400 text-xs md:text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="order-1 md:order-2 flex justify-center relative">
            <div className="absolute inset-0 bg-[#D4AF37]/10 rounded-3xl blur-3xl pointer-events-none transform rotate-12 scale-90" />
            <div className="relative glass-card bg-zinc-950/80 border border-zinc-800 rounded-3xl p-6 shadow-2xl max-w-md w-full border-t-[#D4AF37]/30 hover:border-[#D4AF37]/30 transition-all">
              <div className="flex justify-between items-center mb-6">
                <div className="flex gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full" />
                  <span className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <span className="w-3 h-3 bg-green-500 rounded-full" />
                </div>
                <span className="text-[10px] font-mono tracking-widest text-[#D4AF37] bg-amber-500/10 px-2 py-0.5 rounded-full uppercase border border-[#D4AF37]/20">SmartBite Core</span>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-zinc-900/80 rounded-2xl border border-zinc-800">
                  <div className="flex justify-between text-xs text-zinc-400 mb-1">
                    <span>Ventas Digitales</span>
                    <span className="text-[#D4AF37] font-black">+342%</span>
                  </div>
                  <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#D4AF37] to-amber-400 rounded-full w-[84%]" />
                  </div>
                </div>
                <div className="p-4 bg-zinc-900/80 rounded-2xl border border-zinc-800 flex gap-3 items-center">
                  <div className="bg-[#D4AF37]/10 p-2.5 rounded-xl text-[#D4AF37]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 leading-none mb-1">Asistente IA Sugerencia</p>
                    <p className="text-sm font-semibold text-gray-200">"¿Qué tal acompañar con bebida?"</p>
                  </div>
                </div>
                <div className="p-4 bg-zinc-900/80 rounded-2xl border border-zinc-800 flex justify-between items-center">
                  <div className="flex gap-2.5 items-center">
                    <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-500">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400 leading-none mb-0.5">Comisión Recibida</p>
                      <p className="text-sm font-black text-gray-200">+$120.000 COP</p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">Aprobado</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Your Mission / Tu rol within SmartBite */}
      <section className="py-20 max-w-7xl mx-auto px-4 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            ¿Cuál será tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-[#D4AF37]">Misión</span>?
          </h2>
          <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto">
            Tu rol es fundamental para crear un puente tecnológico entre la innovación de SmartBite y la sazón de los restaurantes locales.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: "🎯 Prospectar restaurantes",
              desc: "Identifica establecimientos gastronómicos en tu zona interesados en modernizar sus ventas, digitalizar menús y agilizar sus despachos operando al siguiente nivel.",
              icon: Search
            },
            {
              title: "🤝 Afiliar nuevos locales",
              desc: "Presenta las ventajas del Menú Digital Inteligente y del Asistente IA. Acompaña a los propietarios a elegir el plan óptimo y cierra el proceso de afiliación.",
              icon: Building
            },
            {
              title: "⚙ Configurar la plataforma",
              desc: "Ayuda a los dueños a plasmar su menú en la nube, estructurar productos de forma impecable y dejar el portal del restaurante a punto para comenzar a recibir ingresos.",
              icon: Rocket
            },
            {
              title: "📚 Capacitar usuarios",
              desc: "Asegura la adopción enseñando al personal de cocina y meseros el flujo correcto para recibir notificaciones, procesar cuentas y monitorear comisiones de forma intuitiva.",
              icon: BookOpen
            },
            {
              title: "📲 Soporte y Administración",
              desc: "Brinda un acompañamiento cercano para resolver dudas básicas operativas de nuestros aliados y guíalos a sacarle todo el partido a los tableros gráficos de estadísticas.",
              icon: MessageSquare
            },
            {
              title: "📈 Impulsar el crecimiento",
              desc: "Sé su estratega comercial de confianza. Sugiéreles emplear cupones avanzados, campañas de notificaciones, y dinámicas de fidelización que aumenten sus ventas habituales.",
              icon: BarChart2
            }
          ].map((item, index) => {
            const IconComponent = item.icon;
            return (
              <motion.div 
                key={index}
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
                className="p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 hover:border-[#D4AF37]/35 flex flex-col justify-between hover:shadow-[0_4px_25px_rgba(212,175,55,0.05)] transition-all group"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-[#D4AF37]/25 flex items-center justify-center text-[#D4AF37] mb-6 group-hover:bg-[#D4AF37] group-hover:text-black transition-all duration-300">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-100 mb-3">{item.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Ideal Profile SECTION */}
      <section className="py-20 bg-zinc-950/80 border-t border-zinc-900 relative">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-6 leading-tight">
              ¿A quién <span className="text-[#D4AF37]">buscamos</span>?
            </h2>
            <p className="text-zinc-400 text-base md:text-lg mb-8 leading-relaxed">
              Buscamos personas dinámicas y proactivas que conjuguen el gusto de conectar con las personas y la habilidad de comprender la tecnología básica.
            </p>
            <div className="space-y-4">
              {[
                "Habilidades de comunicación empática y de negociación directa.",
                "Facilidad para entablar relaciones comerciales con propietarios de negocios.",
                "Conocimientos básicos o intermedios en uso de sistemas digitales y SaaS.",
                "Manejo fluido de plataformas web y aplicaciones móviles modernos.",
                "Capacidad autónoma de comprender y aprender herramientas tecnológicas.",
                "Organización rigurosa para dar seguimiento periódico a su cartera de clientes."
              ].map((char, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  <CheckCircle className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />
                  <span className="text-zinc-300 text-sm md:text-base">{char}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 p-5 bg-amber-500/5 rounded-2xl border border-[#D4AF37]/20 flex gap-4">
              <Info className="w-6 h-6 text-[#D4AF37] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-gray-200">Ideal para:</p>
                <p className="text-zinc-400 text-xs md:text-sm mt-1 leading-relaxed">
                  Vendedores independientes, técnicos en sistemas, community managers, emprendedores digitales, consultores, estudiantes universitarios o personas con antecedentes y experiencia en el sector restaurantero.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/30 p-8 rounded-3xl border border-zinc-800/80 hover:border-[#D4AF37]/20 transition-all relative">
            <div className="absolute top-0 right-0 p-4">
              <ShieldAlert className="w-8 h-8 text-[#D4AF37]/25" />
            </div>
            <h3 className="text-2xl font-extrabold text-white mb-4">
              ⚠️ Sección Importante
            </h3>
            <h4 className="text-lg font-bold text-[#D4AF37] mb-4">
              No buscamos únicamente vendedores
            </h4>
            <p className="text-zinc-300 text-sm md:text-base leading-relaxed mb-6">
              Los representantes SmartBite son auténticos <strong className="text-white">aliados tecnológicos</strong> de nuestra comunidad gastronómica.
            </p>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Además de comercializar y captar afiliaciones, tu misión involucra orientar a los negocios, estructurar sus cartas iniciales de manera estratégica, configurar cuentas básicas y velar por el aprovechamiento óptimo de todos los beneficios promocionales y analíticos que ofrece SmartBite. Tu soporte y calidez definen su éxito.
            </p>
          </div>
        </div>
      </section>

      {/* Main Benefits List */}
      <section className="py-20 max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            ¿Cuáles son tus <span className="text-[#D4AF37]">Beneficios</span>?
          </h2>
          <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto">
            Valoramos tu trabajo, esfuerzo y compromiso de conectar y expandir a SmartBite. Ofrecemos herramientas ideales para tu sustento y crecimiento.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Comisiones Recurrentes",
              desc: "Gana comisiones por cada afiliación de local y retornos continuos de venta de sus referidos en la plataforma de manera escalable.",
              icon: DollarSign,
            },
            {
              title: "Bonificaciones Especiales",
              desc: "Premios adicionales en efectivo y reconocimientos al alcanzar hitos de afiliaciones mensuales y misiones comerciales.",
              icon: Gift,
            },
            {
              title: "Capacitación Continua",
              desc: "Formación especializada paso a paso totalmente gratuita en marketing gastronómico, ventas consultivas y tecnología web.",
              icon: BookOpen,
            },
            {
              title: "Desarrollo Profesional",
              desc: "Oportunidad de liderar grupos comerciales dentro de tu región y ascender a directores territoriales oficiales de SmartBite.",
              icon: TrendingUp,
            },
            {
              title: "Herramientas Exclusivas",
              desc: "Acceso gratuito a tableros comerciales de seguimiento de ventas generadas, saldo, comisiones generadas, y material gráfico.",
              icon: Shield,
            },
            {
              title: "Soporte Permanente",
              desc: "Un equipo especializado de ingenieros y administradores respaldándote 24/7 en soporte técnico remoto inmediato.",
              icon: Users,
            },
            {
              title: "Estricta Flexibilidad",
              desc: "Labora a tu propio ritmo organizando las horas que desees. El límite de tus ingresos lo marcas únicamente tú.",
              icon: Clock,
            },
            {
              title: "Cobertura Multiciudad",
              desc: "Afiliar restaurantes independientes, cadenas locales o franquicias desde cualquier ciudad o municipio con tu mismo código.",
              icon: Globe,
            }
          ].map((benefit, idx) => {
            const Icon = benefit.icon;
            return (
              <div 
                key={idx} 
                className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800 hover:border-[#D4AF37]/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-[#D4AF37] mb-5">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-gray-200 text-lg mb-2">{benefit.title}</h3>
                  <p className="text-zinc-400 text-xs md:text-sm leading-relaxed">{benefit.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recruitment steps flow */}
      <section className="py-20 bg-[#08080a] border-y border-zinc-900 relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Proceso de <span className="text-[#D4AF37]">Selección</span>
            </h2>
            <p className="text-zinc-400 text-sm md:text-base">
              Rápido, ordenado y 100% digital. Únete en solo 5 pasos.
            </p>
          </div>

          <div className="relative">
            {/* Timeline line desktop */}
            <div className="hidden lg:block absolute top-10 left-4 right-4 h-0.5 bg-gradient-to-r from-zinc-800 via-[#D4AF37]/40 to-zinc-800 pointer-events-none" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
              {[
                { step: "Paso 1", title: "Envía tu Solicitud", desc: "Diligencia el formulario de postulación al final de esta página detallando tu perfil.", icon: "📝" },
                { step: "Paso 2", title: "Evaluación de Perfil", desc: "El equipo comercial analiza tu portafolio, experiencia e idoneidad básica.", icon: "🔍" },
                { step: "Paso 3", title: "Entrevista Virtual", desc: "Sostenemos un encuentro amigable para conocernos y aclarar expectativas mutuas.", icon: "🗣️" },
                { step: "Paso 4", title: "Capacitación Oficial", desc: "Aprende gratis a usar la consola SmartBite, crear menús y técnicas de cierre.", icon: "🎓" },
                { step: "Paso 5", title: "Activación y Despegue", desc: "Habilitamos tu código de afiliador oficial de SmartBite y ¡empieza a generar ingresos!", icon: "🚀" }
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center relative px-2">
                  <div className="w-16 h-16 rounded-full bg-zinc-900 border-2 border-zinc-800 group-hover:border-[#D4AF37]/50 flex items-center justify-center text-2xl mb-4 shadow-xl z-10 relative bg-gradient-to-t from-black to-zinc-900">
                    <span className="absolute -top-1 -right-1 text-[10px] bg-gradient-to-r from-[#ffe485] to-[#D4AF37] text-black font-black px-1.5 py-0.5 rounded-full leading-none">{step.step}</span>
                    {step.icon}
                  </div>
                  <h3 className="font-bold text-gray-100 text-base mb-2">{step.title}</h3>
                  <p className="text-zinc-400 text-xs md:text-sm leading-relaxed max-w-xs">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Registration Form Formulario de Registro */}
      <section ref={formRef} className="py-20 max-w-4xl mx-auto px-4 relative scroll-mt-10">
        <div className="absolute inset-0 bg-[#D4AF37]/5 rounded-[40px] blur-[80px] pointer-events-none" />
        
        <div className="glass-card bg-zinc-950/90 border border-zinc-800 rounded-[32px] p-8 md:p-12 shadow-2xl relative overflow-hidden border-t-[#D4AF37]/45">
          <div className="text-center mb-10">
            <Crown className="w-8 h-8 text-[#D4AF37] mx-auto mb-4 animate-spin-slow" />
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Postúlate ahora</h2>
            <p className="text-zinc-400 text-sm md:text-base max-w-md mx-auto">
              Ingresa tus datos a continuación. Nuestro equipo de contratación responderá en un plazo máximo de 48 horas laborales.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!submitSuccess ? (
              <motion.form 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit} 
                className="space-y-6"
              >
                {formError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl flex items-center gap-3 text-sm">
                    <Shield className="w-5 h-5 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Nombre */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Nombre Completo *</label>
                    <input 
                      type="text" 
                      name="nombreCompleto"
                      value={formData.nombreCompleto}
                      onChange={handleInputChange}
                      placeholder="Ej. Manuel González"
                      required
                      className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-white placeholder-zinc-600 transition-all text-sm"
                    />
                  </div>

                  {/* Correo */}
                  <div className="flex flex-col gap-1.5 lg:col-span-2">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
                      <span>Correo Electrónico *</span>
                      {isCheckingEmail && <span className="text-neutral-500 text-[10px] normal-case animate-pulse">Verificando...</span>}
                    </label>
                    <input 
                      type="email" 
                      name="correo"
                      value={formData.correo}
                      onChange={handleInputChange}
                      onBlur={handleEmailBlur}
                      placeholder="Ej. manuel@email.com"
                      required
                      className={`px-4 py-3 bg-zinc-900 border ${emailWarning ? 'border-red-500/50' : 'border-zinc-800'} rounded-xl focus:outline-none focus:ring-2 ${emailWarning ? 'focus:ring-red-500/50' : 'focus:ring-[#D4AF37]'} focus:border-transparent text-white placeholder-zinc-600 transition-all text-sm`}
                    />
                    <AnimatePresence>
                      {emailWarning && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          className="p-3 bg-red-900/20 border border-red-500/30 rounded-xl overflow-hidden"
                        >
                          <p className="text-xs text-red-400 font-medium leading-relaxed flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                            {emailWarning}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* WhatsApp */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Celular / WhatsApp *</label>
                    <input 
                      type="tel" 
                      name="whatsapp"
                      value={formData.whatsapp}
                      onChange={handleInputChange}
                      placeholder="Ej. +57 321 456 7890"
                      required
                      className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-white placeholder-zinc-600 transition-all text-sm"
                    />
                  </div>

                  {/* Edad */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Edad *</label>
                    <input 
                      type="number" 
                      name="edad"
                      value={formData.edad}
                      onChange={handleInputChange}
                      placeholder="Ej. 28"
                      required
                      min="18"
                      max="100"
                      className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-white placeholder-zinc-600 transition-all text-sm"
                    />
                  </div>

                  {/* Ciudad */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Ciudad de residencia *</label>
                    <input 
                      type="text" 
                      name="ciudad"
                      value={formData.ciudad}
                      onChange={handleInputChange}
                      placeholder="Ej. Bogotá"
                      required
                      className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-white placeholder-zinc-600 transition-all text-sm"
                    />
                  </div>

                  {/* Departamento */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Departamento / Provincia</label>
                    <input 
                      type="text" 
                      name="departamento"
                      value={formData.departamento}
                      onChange={handleInputChange}
                      placeholder="Ej. Cundinamarca"
                      className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-white placeholder-zinc-600 transition-all text-sm"
                    />
                  </div>

                  {/* Profesion */}
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Profesión u Ocupación Actual</label>
                    <input 
                      type="text" 
                      name="profesion"
                      value={formData.profesion}
                      onChange={handleInputChange}
                      placeholder="Ej. Consultor Independiente, Estudiante, etc."
                      className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-white placeholder-zinc-600 transition-all text-sm"
                    />
                  </div>
                </div>

                {/* Yes/No/Select Questions */}
                <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-zinc-900">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">¿Tienes experiencia en ventas comerciales?</label>
                    <div className="flex gap-4">
                      {["Sí", "No"].map(opt => (
                        <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                          <input 
                            type="radio" 
                            name="experienciaVentas" 
                            value={opt}
                            checked={formData.experienciaVentas === opt}
                            onChange={handleInputChange}
                            className="w-4 h-4 accent-[#D4AF37]"
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">¿Experiencia usando plataformas digitales / SaaS?</label>
                    <div className="flex gap-4">
                      {["Sí", "No"].map(opt => (
                        <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                          <input 
                            type="radio" 
                            name="experienciaPlataformas" 
                            value={opt}
                            checked={formData.experienciaPlataformas === opt}
                            onChange={handleInputChange}
                            className="w-4 h-4 accent-[#D4AF37]"
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Nivel de manejo tecnológico autorreconocido</label>
                    <select 
                      name="nivelTecnologico"
                      value={formData.nivelTecnologico}
                      onChange={handleInputChange}
                      className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-[#D4AF37] text-sm"
                    >
                      <option value="Básico">Básico</option>
                      <option value="Intermedio">Intermedio</option>
                      <option value="Avanzado">Avanzado</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">¿Has trabajado formal/informal con restaurantes anteriormente?</label>
                    <div className="flex gap-4">
                      {["Sí", "No"].map(opt => (
                        <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                          <input 
                            type="radio" 
                            name="trabajadoRestaurantes" 
                            value={opt}
                            checked={formData.trabajadoRestaurantes === opt}
                            onChange={handleInputChange}
                            className="w-4 h-4 accent-[#D4AF37]"
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">¿Dispones de computador propio con acceso estable a internet?</label>
                    <div className="flex gap-4">
                      {["Sí", "No"].map(opt => (
                        <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                          <input 
                            type="radio" 
                            name="disponeComputador" 
                            value={opt}
                            checked={formData.disponeComputador === opt}
                            onChange={handleInputChange}
                            className="w-4 h-4 accent-[#D4AF37]"
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Motivos */}
                <div className="flex flex-col gap-1.5 pt-4 border-t border-zinc-900">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">¿Por qué deseas formar parte del equipo de representantes de SmartBite? *</label>
                  <textarea 
                    name="motivo"
                    value={formData.motivo}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Cuéntanos un poco sobre tus ambiciones, experiencia adicional y por qué te entusiasma formar parte de SmartBite..."
                    required
                    className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-white placeholder-zinc-650 transition-all text-sm resize-none"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-6">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full py-4 bg-gradient-to-r from-[#ffe485] via-[#D4AF37] to-[#e4b825] text-black font-black text-sm md:text-base rounded-2xl shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] transform hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        Enviando postulación...
                      </>
                    ) : (
                      <>
                        🚀 ENVIAR SOLICITUD
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10 space-y-6"
              >
                <div className="w-20 h-20 bg-gradient-to-tr from-amber-500/20 to-[#D4AF37]/30 border border-[#D4AF37]/50 rounded-full flex items-center justify-center mx-auto text-[#D4AF37] shadow-[0_0_25px_rgba(212,175,55,0.2)]">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white mb-2">¡Solicitud Enviada con Éxito!</h3>
                  <p className="text-zinc-400 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
                    Muchas gracias <strong className="text-white">{formData.nombreCompleto}</strong> por postularte como Representante Comercial SmartBite. Hemos registrado tu postulación de forma exitosa.
                  </p>
                </div>
                <div className="p-6 bg-zinc-900/60 rounded-3xl border border-zinc-800/80 inline-block text-left text-xs md:text-sm max-w-md w-full gap-2 space-y-2">
                  <p className="font-bold text-[#D4AF37] flex items-center gap-2 mb-1">
                    <Info className="w-4 h-4" /> ¿Qué pasos siguen?
                  </p>
                  <p className="text-zinc-300">1. Uno de nuestros coordinadores locales revisará tus respuestas.</p>
                  <p className="text-zinc-300">2. Se te enviará una notificación con instrucciones para agendar tu entrevista virtual por Teams/Meet.</p>
                  <p className="text-zinc-300">3. Si la llamada es exitosa, se activará tu acceso a los portales de capacitación de SmartBite.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-20 max-w-4xl mx-auto px-4 border-t border-zinc-900 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight">Preguntas Frecuentes</h2>
          <p className="text-zinc-450 text-xs md:text-sm mt-2">Dudas habituales resueltas de antemano.</p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "¿Debo invertir dinero para comenzar?",
              a: "Absolutamente no. SmartBite es una oportunidad legítima y transparente. La postulación, la entrevista, el acceso a la plataforma de representante y toda la capacitación sobre ventas con IA y fidelización son 100% gratuitos."
            },
            {
              q: "¿Necesito experiencia previa formal en ventas?",
              a: "Es aconsejable o recomendable, pero de ninguna manera obligatoria. Valoramos profundamente la actitud, el carisma, el hambre de aprender cosas nuevas, el profesionalismo humano y la calidad de tus relaciones con la comunidad local por encima de un currículum robusto."
            },
            {
              q: "¿Necesito tener amplios conocimientos tecnológicos?",
              a: "Sí. Buscamos personas que se auto-reconozcan con familiaridad para navegar por portales web, configurar perfiles en aplicaciones móviles y que posean rapidez mental para aprender a administrar módulos de SmartBite y explicarlo fácilmente a propietarios de restaurantes."
            },
            {
              q: "¿Recibiré capacitación y acompañamiento?",
              a: "¡Por supuesto que sí! SmartBite provee materiales de capacitación interactivos, videos explicativos, acompañamiento virtual y soporte de soporte telefónico inmediato para que resuelvas cualquier duda en tus primeras afiliaciones."
            }
          ].map((faq, idx) => (
            <div 
              key={idx}
              className="glass-card bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden transition-all duration-300"
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full p-6 text-left flex justify-between items-center gap-4 hover:bg-zinc-900/60 transition-all font-bold text-gray-200 text-sm md:text-base outline-none"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? (
                  <ChevronUp className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-zinc-500 flex-shrink-0" />
                )}
              </button>
              
              <AnimatePresence>
                {openFaq === idx && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="p-6 pt-0 border-t border-zinc-900/50 text-zinc-400 text-xs md:text-sm leading-relaxed">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Cierre / Giant CTA Section */}
      <section className="py-24 bg-gradient-to-b from-[#08080a] to-[#040405] text-center px-4 relative overflow-hidden border-t border-zinc-900">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-[#D4AF37]/5 rounded-full blur-[90px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto space-y-8 relative">
          <Crown className="w-12 h-12 text-[#D4AF37] mx-auto text-5xl mb-2 animate-bounce" />
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight">
            Sé parte de la <span className="text-[#D4AF37]">transformación digital</span> gastronómica.
          </h2>
          <p className="text-zinc-300 text-sm md:text-lg max-w-2xl mx-auto leading-relaxed">
            Miles de restaurantes están migrando hacia soluciones inteligentes de alto valor. Con SmartBite podrás ayudarlos de manera real a crecer, mientras desarrollas una oportunidad profesional magnífica con alto potencial de ingresos.
          </p>

          <div className="pt-6">
            <button 
              type="button"
              onClick={handleScrollToForm}
              className="px-10 py-5 bg-gradient-to-r from-amber-400 via-[#D4AF37] to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-sm md:text-lg rounded-2xl shadow-[0_0_35px_rgba(212,175,55,0.4)] hover:shadow-[0_0_50px_rgba(212,175,55,0.7)] transform hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-3"
            >
              🔥 QUIERO UNIRME A SMARTBITE
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-8 text-center text-zinc-600 text-xs border-t border-zinc-950 bg-black max-w-full">
        <p>© {new Date().getFullYear()} SmartBite App. Todos los derechos reservados. Diseñado bajo estándares de máxima excelencia gastronómica comercial.</p>
      </footer>

      {/* Corporate Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSuccessModal(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="relative w-full max-w-xl bg-zinc-950/95 border border-zinc-800 rounded-[32px] p-6 md:p-8 shadow-[0_0_50px_rgba(212,175,55,0.15)] overflow-hidden border-t-[#D4AF37] text-center z-10 flex flex-col max-h-[90vh]"
            >
              {/* Decorative top gold ambient glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none shrink-0" />

              <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
                <div className="w-20 h-20 bg-gradient-to-tr from-[#D4AF37]/20 to-amber-500/15 border border-[#D4AF37]/45 rounded-full flex items-center justify-center mx-auto text-[#D4AF37] mb-6 shadow-[0_0_30px_rgba(212,175,55,0.25)] shrink-0 mt-4">
                  <CheckCircle className="w-11 h-11" />
                </div>

                <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2 shrink-0">
                  ¡Solicitud Registrada! 🎉💼
                </h3>
                
                <p className="text-[#D4AF37] font-black text-[11px] uppercase tracking-widest mb-6 shrink-0">
                  SmartBite Corporate Recruitment
                </p>

                {/* Generous copy detailing company protocols */}
                <div className="space-y-4 text-left bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-2xl mb-8 shrink-0">
                  <p className="text-zinc-200 text-sm font-medium leading-relaxed">
                    Estimado/a <span className="text-white font-bold">{formData.nombreCompleto}</span>,
                  </p>
                  <p className="text-zinc-300 text-xs md:text-sm leading-relaxed">
                    Queremos extenderte un saludo muy cálido y especial. Hemos recibido exitosamente tus datos de postulación para representarnos y promover las afiliaciones de restaurantes. 
                  </p>
                  <p className="text-zinc-300 text-xs md:text-sm leading-relaxed">
                    En <strong className="text-white">SmartBite</strong> valoramos profundamente la iniciativa, el dinamismo y tu interés en formar parte de nuestro crecimiento tecnológico y comercial. 
                  </p>

                  <div className="pt-4 border-t border-zinc-800/70 space-y-3.5">
                    <h4 className="text-xs font-black text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
                      <Info className="w-4 h-4 text-[#D4AF37]" />
                      ¿Qué pasos siguen en el proceso?
                    </h4>
                    <ul className="space-y-3 text-xs md:text-sm text-zinc-400">
                      <li className="flex items-start gap-2.5">
                        <span className="text-[#D4AF37] font-black shrink-0 mt-0.5">1.</span>
                        <span>
                          <strong className="text-white">Revisión de Perfil:</strong> Nuestro comité de Talento Humano evaluará con lupa tu perfil comercial y tecnológico en las próximas <strong className="text-white">24 a 48 horas laborables</strong>.
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="text-[#D4AF37] font-black shrink-0 mt-0.5">2.</span>
                        <span>
                          <strong className="text-white">Contacto Directo:</strong> Un coordinador regional se pondrá en contacto contigo a través de <strong className="text-white">WhatsApp o llamada telefónica</strong> para coordinar una breve entrevista virtual por Teams/Meet.
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="text-[#D4AF37] font-black shrink-0 mt-0.5">3.</span>
                        <span>
                          <strong className="text-white">Capacitación y Activación:</strong> Te guiaremos paso a paso, dándote acceso gratuito a nuestro material oficial y habilitándote tu panel de comisiones desde el primer día.
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                <p className="text-zinc-500 text-xs italic mb-4 shrink-0">
                  “Tu éxito promoviendo la digitalización es el motor de los restaurantes de nuestro país.”
                </p>
              </div>

              <div className="shrink-0 pt-4 mt-2 border-t border-zinc-800/50">
                <button
                  type="button"
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full py-4 bg-gradient-to-r from-amber-300 via-[#D4AF37] to-amber-500 text-black font-black text-sm md:text-base rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  ENTENDIDO, VOLVER AL PORTAL
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
