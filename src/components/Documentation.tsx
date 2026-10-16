import React, { useState } from 'react';
import { BookOpen, Shield, Store, Truck, Smartphone, Cpu, CreditCard, LayoutDashboard, Rocket, Settings, Users, Activity, Gift, Map, Menu, ChevronRight, X, Download } from 'lucide-react';
import { toast } from 'sonner';

type SubSection = {
  id: string;
  title: string;
  content: React.ReactNode;
};

type SectionRef = {
  id: string;
  title: string;
  icon: React.ElementType;
  subsections: SubSection[];
};

const superAdminSubsections: SubSection[] = [
  {
    id: 'sa-dashboard',
    title: '1. Dashboard y Métricas Principales',
    content: (
      <div className="space-y-4">
        <p className="text-neutral-700">El Dashboard es la pantalla inicial a la que accede el Súper Administrador tras iniciar sesión. Sirve como centro de comando para obtener una visión panorámica de la salud y el rendimiento operativo de la plataforma.</p>
        <h4 className="font-bold text-neutral-900 mt-4">Métricas Clave (KPIs) Visibles:</h4>
        <ul className="list-disc ml-6 space-y-2 text-neutral-600">
          <li><strong>Ingresos Totales (Revenue):</strong> Refleja el acumulado de las comisiones cobradas y suscripciones vendidas a los restaurantes.</li>
          <li><strong>Ventas Brutas Multi-Tenant (GMV):</strong> Muestra toda la cantidad de dinero procesada por la plataforma, juntando las ventas de todos los inquilinos (restaurantes).</li>
          <li><strong>Restaurantes Activos e Inactivos:</strong> Un conteo en tiempo real de cuántos perfiles comerciales están operando.</li>
          <li><strong>Usuarios (Consumidores):</strong> Cantidad total de cuentas creadas en la aplicación cliente.</li>
        </ul>
        <h4 className="font-bold text-neutral-900 mt-4">Gráficas e Históricos:</h4>
        <p className="text-neutral-600">El sistema dibuja el comportamiento transaccional utilizando el historial. Podrás ver picos de consumo (Ej. fines de semana o eventos festivos) para tomar decisiones de infraestructura y marketing.</p>
      </div>
    )
  },
  {
    id: 'sa-restaurants',
    title: '2. Gestión de Restaurantes',
    content: (
      <div className="space-y-4">
        <p className="text-neutral-700">Este módulo es el CRM centralizado de todos los inquilinos comerciales adscritos a SmartBite.</p>
        <h4 className="font-bold text-neutral-900 mt-4">Flujo de Alta:</h4>
        <ul className="list-decimal ml-6 space-y-2 text-neutral-600">
          <li>Al ingresar, verás una tabla maestra con el directorio de restaurantes.</li>
          <li>Podrás registrar de manera manual un nuevo restaurante haciendo clic en "Nuevo". El formulario exigirá datos básicos: nombre de la marca, dirección física, teléfono, email de contacto.</li>
          <li>Tras crearlo, el Súper Admin genera credenciales de acceso iniciales para el dueño del restaurante.</li>
        </ul>
        <h4 className="font-bold text-neutral-900 mt-4">Acciones de Edición:</h4>
        <p className="text-neutral-600">Dentro del perfil de un restaurante, el Super Admin tiene el poder de "Activar" o "Suspender" operaciones. Si un restaurante adeuda múltiples facturas o incumple políticas, se le puede colocar en estado inactivo. Esto bloquea instantáneamente su aparición en la app del cliente.</p>
      </div>
    )
  },
  {
    id: 'sa-plans',
    title: '3. Modelos de Suscripción (Planes)',
    content: (
      <div className="space-y-4">
        <p className="text-neutral-700">El motor económico de SmartBite funciona a partir de su módulo de Planes. Aquí creas las condiciones bajo las cuales los restaurantes pagarán por usar el software.</p>
        <h4 className="font-bold text-neutral-900 mt-4">Creación de Planes:</h4>
        <ul className="list-disc ml-6 space-y-2 text-neutral-600">
          <li><strong>Nombre y Descripción:</strong> Ej. "Plan Básico" o "Plan Pro".</li>
          <li><strong>Tipo de Cobro:</strong> Fijo (paga una mensualidad constante), Comisión (paga X% sobre ventas) o Gratis.</li>
          <li><strong>Bloqueo de Features (Toggles):</strong> Al crear un plan, habilitarás switches de sistema.
            <ul className="list-[circle] ml-6 mt-1 space-y-1">
              <li>Permitir Menú QR (Sí/No)</li>
              <li>Permitir Llamado a Mesero (Sí/No)</li>
              <li>Asistente IA Gemini (Sí/No)</li>
              <li>Programa de Fidelización (Sí/No)</li>
              <li>Flota de Repartidores Propios (Sí/No)</li>
              <li>Sistema POS (Sí/No)</li>
            </ul>
          </li>
        </ul>
      </div>
    )
  },
  {
    id: 'sa-billing',
    title: '4. Facturación, Cortes y Liquidaciones',
    content: (
      <div className="space-y-4">
        <p className="text-neutral-700">Explica cómo el Súper Administrador recauda y dispersa ingresos.</p>
        <h4 className="font-bold text-neutral-900 mt-4">Sistema de Cortes:</h4>
        <p className="text-neutral-600">El botón "Disparar Corte" aglutina las ventas de todos los locales en el periodo. Mide cuánto vendió el local y a qué plan pertenece. Si está en un plan de 10% de comisión, el sistema genera automáticamente un Inovice/Factura con esa deuda.</p>
        <h4 className="font-bold text-neutral-900 mt-4">Liquidaciones a Restaurantes:</h4>
        <p className="text-neutral-600">Si un cliente paga $100 con tarjeta de crédito desde la App (Pasarela Global), ese dinero entra a la cuenta del SaaS. El restaurante reclama después su dinero ($100 - $10 de comisión = $90). El Admin usa este módulo para consultar los saldos a favor de cada locatario y, tras ejecutar la transferencia a sus cuentas bancarias offline, marca la liquidación como "Completada/Pagada" dentro del sistema para sanear los libros de balances.</p>
      </div>
    )
  },
  {
    id: 'sa-ai',
    title: '5. AI Core (Gemini AI Assistant)',
    content: (
      <div className="space-y-4">
        <p className="text-neutral-700">El Súper Admin cuenta con un asistente inteligente nativo.</p>
        <ul className="list-disc ml-6 space-y-2 text-neutral-600">
          <li><strong>Marketing y Copys:</strong> Pídele a la IA que genere textos para notificaciones push, como "Genera un copy divertido de viernes por la noche para incentivar la venta de pizza".</li>
          <li><strong>Análisis Analítico:</strong> En el futuro, permitirá hacer cruces de datos sobre qué categorías se venden más en fechas festivas basándose en la data cruda.</li>
        </ul>
      </div>
    )
  },
  {
    id: 'sa-settings',
    title: '6. Configuraciones Globales',
    content: (
      <div className="space-y-4">
        <p className="text-neutral-700">Es la pestaña mecánica. Regula el funcionamiento y configuración global de la plataforma.</p>
        <ul className="list-disc ml-6 space-y-2 text-neutral-600">
          <li><strong>Tokens de APIs:</strong> Configuración de pasarelas Stripe, Mercado Pago o PayPal.</li>
          <li><strong>Rango de Entrega Global:</strong> Límite de Km permitidos logísticamente.</li>
          <li><strong>Manejo de Moneda:</strong> Configuración regional (USD, COP, MXN).</li>
        </ul>
      </div>
    )
  }
];

const restaurantSubsections: SubSection[] = [
  {
    id: 'rt-dashboard',
    title: '1. Tablero Operativo y Recepción de Pedidos',
    content: (
      <div className="space-y-4">
        <p className="text-neutral-700">Es la primera vista, diseñada especialmente pensada para la pantalla de una cocina o mostrador comercial.</p>
        <h4 className="font-bold text-neutral-900 mt-4">Flujo de Tarjetas (Kanban):</h4>
        <p className="text-neutral-600">Cada orden entrante aparece como una tarjeta grande con un ID único y la lista de productos.</p>
        <ul className="list-disc ml-6 space-y-2 text-neutral-600">
          <li><strong>Pendiente / Requerido:</strong> Entra con alerta sonora. El empleado debe hacer clic en "Aceptar" para notificar al cliente del inicio de cocción.</li>
          <li><strong>Preparando:</strong> Aquí esperan las órdenes que la cocina está ejecutando.</li>
          <li><strong>Esperando Repartidor / Enviado:</strong> Cuando la cocina lo termina, despacha el pedido. Se conecta automáticamente con la app del Driver.</li>
          <li><strong>Finalizado:</strong> Pedido entregado y dinero registrado.</li>
        </ul>
      </div>
    )
  },
  {
    id: 'rt-catalog',
    title: '2. Constructor del Catálogo (Menú Maker)',
    content: (
      <div className="space-y-4">
        <p className="text-neutral-700">Herramienta indispensable. Si un plato se acaba, desde aquí se apaga temporalmente. Si hay un plato nuevo, aquí se crea.</p>
        <h4 className="font-bold text-neutral-900 mt-4">Estructura del Menú:</h4>
        <ul className="list-disc ml-6 space-y-2 text-neutral-600">
          <li><strong>Categorías:</strong> Entradas, Platos Fuertes, Bebidas, Postres. Todo es reordenable.</li>
          <li><strong>Creación de Productos:</strong> Foto cuadrada, Nombre amigable, Descripción apetitosa y Precio base.</li>
          <li><strong>Modificadores Avanzados:</strong> Se pueden crear condiciones, ej. "Elige tu término de carne" (Forzoso, solo una opción: Medio, Bien Cocido) o "Adiciones" (Opcional, varias: Queso +$1, Tocineta +$2).</li>
          <li><strong>Combos (Bundles):</strong> Agrupaciones de productos existentes a preio preferencial.</li>
        </ul>
      </div>
    )
  },
  {
    id: 'rt-marketing',
    title: '3. Funciones de Crecimiento & Gamificación',
    content: (
      <div className="space-y-4">
        <p className="text-neutral-700">¿Cómo el restaurante retiene a sus clientes? Desde esta suite de lealtad (sujeta al plan activado por el Super Admin).</p>
        <h4 className="font-bold text-neutral-900 mt-4">Ruleta de Premios In-App:</h4>
        <p className="text-neutral-600">Puedes configurar la ruleta. Se definen 'Trozos' (Gajos de premio): "Coca-cola gratis", "Bono $5", "Intenta de Nuevo". Configuras las probabilidades porcentuales. Cuando los usuarios del restaurante finalicen su orden, la App los invita a jugar.</p>
        <h4 className="font-bold text-neutral-900 mt-4">Fidelización (Tarjetas de Sellos Digitales):</h4>
        <p className="text-neutral-600">Mecanismo automático de monedas de oro. Ej: Por cada $1 de compra = 1 moneda de oro. A los 50 monedas de oro = "Hamburguesa Sencilla". El usuario verá una barra de progreso que llena su cerebro de dopamina y lo obliga a volver.</p>
      </div>
    )
  },
  {
    id: 'rt-qrpos',
    title: '4. Mesa Física, QR y Llamado de Mesero',
    content: (
      <div className="space-y-4">
        <p className="text-neutral-700">Operaciones dentro del salón.</p>
        <ul className="list-disc ml-6 space-y-2 text-neutral-600">
          <li><strong>POS:</strong> Sistema de cajero. Toma el pedido manualmente al usuario presencial e impríme la factura térmica (conexión vía bluetooth o red wifi web-print).</li>
          <li><strong>Mapas de QR:</strong> Genera PDFs listos para imprimir con QRs únicos por mesa (Mesa 1, Mesa 2). Si un usuario escanea el de la Mesa 5, al restaurante le notifica cualquier pedido con ese origen.</li>
          <li><strong>Alerta Inteligente de Mesero:</strong> Desde el código QR de la mesa, el cliente tiene un botón gigante que dice "Llamar Mesero". El dashboard de la recepcionista soltará un pitido y la pantalla se coloreará en rojo avisando "Atención Requerida: Mesa 5".</li>
        </ul>
      </div>
    )
  },
  {
    id: 'rt-ai',
    title: '5. AI Sales Assistant',
    content: (
      <div className="space-y-4">
        <p className="text-neutral-700">Asistente propio del restaurante (requiere Plan VIP). La IA procesa la base de datos local y le otorga a los dueños: </p>
        <ul className="list-disc ml-6 space-y-2 text-neutral-600">
          <li>Pronósticos de ventas en base a su clima local (si la API lo permite) y horarios pico.</li>
          <li>Constructor de promociones.</li>
        </ul>
      </div>
    )
  }
];

const driverSubsections: SubSection[] = [
  {
    id: 'dv-radar',
    title: '1. Sistema de Radar / Home',
    content: (
      <div className="space-y-4">
        <p className="text-neutral-700">Cuando el Repartidor abre la aplicación móvil, ve su mapa base y su estado de conectividad.</p>
        <ul className="list-disc ml-6 space-y-2 text-neutral-600">
          <li><strong>Switch Online/Offline:</strong> Modo de disponibilidad. Si está apagado, no recibirá invitaciones push de despacho.</li>
          <li><strong>Pantalla de Alerta:</strong> Cuando un pedido salta (Ping), aparece una tarjeta cubriendo la pantalla. Le indica: <strong>Moneda de Oro A</strong> (Restaurante Pizzas Mario - 1.2Km) y <strong>Moneda de Oro B</strong> (Casa Cliente - 4Km), mostrando la tarifa a ganar. Tiene 30 segundos para Aceptar o Rechazar.</li>
        </ul>
      </div>
    )
  },
  {
    id: 'dv-lifecycle',
    title: '2. Viaje de Entrega (Ciclo Logístico)',
    content: (
      <div className="space-y-4">
        <p className="text-neutral-700">La aplicación restringe brincarse pasos (Anti-Fraude). El repartidor debe ir presionado la confirmación de estatus según avanza en la realidad.</p>
        <ol className="list-decimal ml-6 space-y-2 text-neutral-600">
          <li>Camino al restaurante.</li>
          <li>Llegada (Botón de LLegué).</li>
          <li>Confrmación de entrega en mostrador (Recibí los Alimentos). En este instante, el sistema manda Webhooks a la App del Cliente informando la partida.</li>
          <li>Camino al cliente (Con botón de navegador en Maps/Waze externo o integrado).</li>
          <li>Entregado (Y si el pago era en efectivo, la app avisa: "Cobra $45 a este cliente para soltar la comida").</li>
        </ol>
      </div>
    )
  },
  {
    id: 'dv-wallet',
    title: '3. Tartera Digital y Deudas',
    content: (
      <div className="space-y-4">
        <p className="text-neutral-700">Mantener orden en sus finanzas diarias.</p>
        <ul className="list-disc ml-6 space-y-2 text-neutral-600">
          <li>Los pedidos pagados por Tarjeta de Crédito transfieren saldo a favor (dinero virtual que el cajero le debe al repartidor).</li>
          <li>Los pedidos pagados en Efectivo aumentan una variable de "Deuda", ya que el repartidor se guardó dinero físico que pertenece a los platos cocinados del restaurante o la comisión.</li>
          <li>Balance Final: Resta saldos. Si está en verde, se le deposita los lunes. Si está en rojo, debe acercarse a "Consignar".</li>
        </ul>
      </div>
    )
  }
];

const userSubsections: SubSection[] = [
  {
    id: 'us-home',
    title: '1. Home y Descubrimiento (Discover)',
    content: (
      <div className="space-y-4">
        <p className="text-neutral-700">El feed infinito (Scrollable Feed) está meticulosamente diseñado para dispositivos móviles y se comporta como una app nativa, es allí donde todo comienza.</p>
        <ul className="list-disc ml-6 space-y-2 text-neutral-600">
          <li><strong>Geolocalización In-App:</strong> Usa navigator.geolocation nativo o base de direcciones (Libreta del usuario). Ordena locales por proximidad al moneda de oro cero del cliente.</li>
          <li><strong>Banners Hero:</strong> Puestos pagados gestionados por Admin en el carrusel superior.</li>
          <li><strong>Filtros Avanzados:</strong> Etiquetas rápidas como "Envío Gratis", "Mejor Calificados", "Abiertos Ahora".</li>
        </ul>
      </div>
    )
  },
  {
    id: 'us-shopping',
    title: '2. Proceso de Pedido (Checkout y Carrito)',
    content: (
      <div className="space-y-4">
        <p className="text-neutral-700">El carrito de SmartBite no permite errores (Error Proof).</p>
        <ul className="list-disc ml-6 space-y-2 text-neutral-600">
          <li>El usuario navega el menú, selecciona las variantes de la ficha. Si el producto requiere "Bebida Obligatoria", el botón de agregar no se enciende hasta que decida.</li>
          <li>En la pantalla de pago (Checkout) se hace la cuenta matemática final: <code>Subtotal + Tax + DeliveryFee (Dynamic by Km) + Tip</code>.</li>
          <li><strong>Multipasarela de Pagos:</strong> Selectores de tarjetas tokenizadas, pagos web (PayPal, MercadoPago), efectivo u opción del terminal presencial contra entrega.</li>
        </ul>
      </div>
    )
  },
  {
    id: 'us-profile',
    title: '3. Zona de Premios y Mi Perfil',
    content: (
      <div className="space-y-4">
        <p className="text-neutral-700">Aquí reside el engagement del negocio, que evita que el comensal desinstale.</p>
        <ul className="list-disc ml-6 space-y-2 text-neutral-600">
          <li><strong>Arcade (Ruleta y Rasca/Gana):</strong> Una pantalla ludificada con gráficos ricos. Accesible solo al tener "Pases" ganados por recientes compras en locales patrocinadores.</li>
          <li><strong>Tarjetas de Fidelidad Global:</strong> Se muestran al estilo de "Apple Wallet" organizando qué puntaje tiene el usuario con el Restaurante X y con el Restaurante Y.</li>
          <li><strong>Mi Enlace de Referido:</strong> "Comparte este código QWSX1 con tu amigo. Él recibe $5, y cuando pida, tú recibes $5." - Programación pura de Network Effect en crecimiento viral.</li>
          <li><strong>Rastreador en Tiempo Real:</strong> Seguimiento animado desde que cocina el pedido hasta cuando el motorizado está cerca de su casa en GPS interconectado.</li>
        </ul>
      </div>
    )
  },
  {
    id: 'us-qr',
    title: '4. Integración Off-line: Scanner Interno QR',
    content: (
      <div className="space-y-4">
        <p className="text-neutral-700">Cuando la persona sale de su casa a cenar a la pizzería, usará SmartBite y su scanner de cámara nativo API.</p>
        <p className="text-neutral-600">El cliente lee el QR físico en la mesa. Automáticamente se restringen los costos de delivery (porque asume Mesa "N"). Su carrito de compras mandará órdenes instantáneas al POS del restaurante de forma silenciosa e hiper-rápida. Su celular se convierte en un control táctil para exigir ser validado (Mesero!).</p>
      </div>
    )
  }
];


const SECTIONS: SectionRef[] = [
  { 
    id: 'intro', 
    title: 'Introducción del Manual', 
    icon: Rocket,
    subsections: [{
      id: "intro-main", 
      title: "Resumen y Arquitectura",
      content: (
        <div className="space-y-6">
          <p className="text-lg text-neutral-600 leading-relaxed">
            Bienvenido al manual en profundidad de <strong>SmartBite</strong>. Hemos expandido la documentación de lo general a lo específico de operaciones micro. Detallaremos en los paneles laterales las explicaciones exhaustivas sobre flujos, cajas de herramientas, paneles de cada empleado y usuario, para un entendimiento pleno antes de implementar comercialmente.
          </p>
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
            <h4 className="font-bold text-indigo-900 mb-2">Visitas Rápidas</h4>
            <p className="text-sm text-indigo-700">Navegue por el panel izquierdo para seleccionar el "Actor de Sistema" que desea estudiar. Expandiremos características de Súper Administración (Control Matrix) hasta Experiencia de Cliente (CX/UX frontend).</p>
          </div>
        </div>
      )
    }]
  },
  { id: 'superadmin', title: 'Panel del Súper Admin', icon: Shield, subsections: superAdminSubsections },
  { id: 'restaurant', title: 'Consola del Restaurante', icon: Store, subsections: restaurantSubsections },
  { id: 'driver', title: 'App para Repartidores', icon: Truck, subsections: driverSubsections },
  { id: 'user', title: 'Experiencia del Usuario Final', icon: Smartphone, subsections: userSubsections },
];

export function Documentation() {
  const [activeSection, setActiveSection] = useState<string>('intro');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const activeData = SECTIONS.find(s => s.id === activeSection);
  const IconActive = activeData?.icon || Rocket;

  const handleDownloadPDF = () => {
    toast.info("Preparando documento...", {
      description: "Abre la ventana de impresión para guardar como PDF."
    });
    setTimeout(() => {
      window.print();
    }, 800);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-neutral-100 overflow-hidden flex min-h-[85vh] relative">
      
      {/* Hidden Div for Full PDF generation */}
      <div id="smartbite-print-docs" className="hidden print:block p-8 bg-white text-neutral-900 w-[800px] max-w-none print-break-inside-avoid">
        <h1 className="text-4xl font-black mb-2 flex items-center gap-3 border-b-2 pb-4">
          <BookOpen className="w-8 h-8 text-indigo-600" />
          SmartBite - Manual Completo
        </h1>
        {SECTIONS.map((section) => (
          <div key={section.id} className="mb-12 mt-8">
            <h2 className="text-3xl font-black text-indigo-900 mb-6 pb-2 border-b">
               {section.title}
            </h2>
            <div className="space-y-8">
              {section.subsections.map(sub => (
                <div key={sub.id} className="mb-6 print-break-inside-avoid">
                  <h3 className="text-xl font-bold mb-3 text-neutral-800">{sub.title}</h3>
                  <div className="prose prose-neutral max-w-none text-sm leading-relaxed">
                    {sub.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Overlay Mobile */}
      {isMobileMenuOpen && (
        <div 
          className="absolute inset-0 bg-surface-variant/40 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar de Documentación */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-80 bg-neutral-50/50 border-r border-neutral-100 p-6 flex flex-col gap-2 shrink-0
        transition-transform duration-300 ease-in-out transform md:relative md:translate-x-0 md:flex h-full
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full hidden md:flex'}
      `}>
        <div className="mb-6 px-2 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              SmartBite Manual
            </h2>
            <p className="text-xs font-medium text-on-surface-variant mt-1 uppercase tracking-widest">Guía Detallada por Roles</p>
          </div>
          <button className="md:hidden p-2 text-on-surface-variant hover:text-neutral-700 bg-neutral-100 rounded-lg" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-2">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 text-left group ${
                  isActive 
                    ? 'bg-indigo-600 text-on-surface font-bold shadow-lg shadow-indigo-600/20' 
                    : 'text-neutral-600 hover:bg-neutral-100 font-medium border border-transparent'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-indigo-100' : 'text-on-surface-muted group-hover:text-neutral-600'}`} />
                  {section.title}
                </span>
                {isActive && <ChevronRight className="w-4 h-4 text-on-surface opacity-70" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido Principal - Scorreable */}
      <div className="flex-1 overflow-y-auto bg-[#fafafa]">
        
        {/* Header Mobile Opcional */}
        <div className="md:hidden bg-white p-4 border-b flex items-center gap-3 sticky top-0 z-20">
           <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 hover:bg-neutral-100 rounded-lg">
             <Menu className="w-5 h-5 text-neutral-600" />
           </button>
           <span className="font-bold text-neutral-900">Manual de Documentación</span>
        </div>

        <div className="p-8 lg:p-14">
          <div className="max-w-4xl mx-auto relative">
             <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
               <div className="flex items-center gap-3">
                 <div className="p-3 bg-white border border-neutral-200 rounded-xl shadow-sm text-indigo-600">
                    <IconActive className="w-6 h-6" />
                 </div>
                 <div>
                    <h1 className="text-3xl md:text-4xl font-black text-neutral-900 tracking-tight">{activeData?.title}</h1>
                    <p className="text-on-surface-variant font-medium uppercase tracking-widest text-xs mt-1">Exploración Documentada</p>
                 </div>
               </div>

               <button
                  onClick={handleDownloadPDF}
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-on-surface px-5 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-200"
               >
                  <Download className="w-5 h-5" />
                  Descargar Todo en PDF
               </button>
             </div>

             <div className="space-y-12">
                {activeData?.subsections.map((sub) => (
                   <div key={sub.id} id={sub.id} className="bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-sm">
                      <h2 className="text-2xl font-black text-neutral-900 mb-6 pb-4 border-b border-neutral-100 flex items-center gap-3">
                         {sub.title}
                      </h2>
                      <div className="prose prose-neutral prose-indigo max-w-none text-base leading-relaxed">
                         {sub.content}
                      </div>
                   </div>
                ))}
             </div>

             {/* Footer space */}
             <div className="h-20"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
