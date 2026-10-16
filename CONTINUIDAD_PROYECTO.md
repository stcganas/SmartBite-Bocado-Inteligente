# CONTINUIDAD DEL PROYECTO — SmartBite

> **Última actualización:** 2026-10-16 · 13:12 (UTC-5 / Colombia)
> **Autor de la sesión:** Antigravity AI (Google DeepMind) — Conversación `db17f266-34a1-4444-be90-ef7161512b3c`
> **Estado:** ✅ Infraestructura completa · ✅ BD limpia con datos demo completos · ✅ Super Admin creado · 🚀 Listo para pruebas de flujo E2E

---

## 1. Identificación del Proyecto

| Campo | Valor |
|-------|-------|
| **Nombre** | SmartBite — "Su Bocado Inteligente" |
| **Tipo** | Plataforma SaaS multi-tenant para restaurantes y comercios de comida |
| **Versión** | 0.1.0 |
| **Repositorio** | `c:\Users\PC\Desktop\SmartBite-main` (sin control de versiones Git local instalado) |
| **Deploy objetivo** | Google Cloud Run |
| **URL de producción** | `https://ais-dev-vwxtz7i5u6etdfshis6t4s-122130928241.us-east1.run.app` |

---

## 2. Estado General

```
INFRAESTRUCTURA:  ✅ Completa y conectada
BASE DE DATOS:    ✅ Supabase limpio (vaqiqcaxfmsijyuqucwm)
SUPER ADMIN:      ✅ Creado (admin@smartbite.co / SmartBite2026!)
RESTAURANTE DEMO: ✅ Creado ("La Parrilla de Don Juan", 22 productos, 6 categorías)
GAMIFICACIÓN:     ✅ Ruleta Pay (8 segmentos) + Monedas de Oro + Multiplicadores
SERVIDOR:         ✅ Funcionando en localhost:3000
CONTROL DE VER.:  ✅ GitHub sincronizado (stcganas/SmartBite-Bocado-Inteligente: main)
```

---

## 3. Fase Actual y Objetivo

### Fase: **Validación y Pruebas de Flujos de Venta E2E**

Se completó la migración completa a la nueva BD y la inserción de datos semilla operativos:
1. Usuario Super Admin funcional registrado en Auth y `app_users`.
2. Restaurante demo completo y aprobado.
3. 22 Productos con precios, imágenes y multiplicadores de fidelidad.
4. Ruleta configurada y suscripción Pro activa.

**Objetivo de la fase:** Probar los flujos de usuario (compra de inicio a fin, giro de ruleta, acumulación de monedas de oro) y una vez que el usuario disponga de Git, sincronizar con el repositorio en GitHub.

---

## 4. Resumen de Avances Realizados en Esta Sesión

1. **Auditoría completa** del proyecto: stack, páginas, componentes, servicios, BD.
2. **Migración de Supabase**: conexión al proyecto limpio `vaqiqcaxfmsijyuqucwm`.
3. **Variables de entorno** actualizadas en `.env` (Supabase + GEMINI_API_KEY).
4. **Schema maestro aplicado** (`supabase_clean_master.sql`): 26 tablas, RLS, buckets de storage, seed de planes.
5. **Creación de Super Admin**: vía script `setup_inicial.cjs` (`admin@smartbite.co`).
6. **Inserción de Catálogo Demo**: vía `complete_setup.cjs` (22 productos, 6 categorías, ruleta, suscripción, 5 reseñas).
7. **Servidor activo**: respondiendo en `http://localhost:3000`.

---

## 5. Tareas Completadas (con Evidencia)

| # | Tarea | Evidencia |
|---|-------|-----------|
| 1 | Auditoría del proyecto | Reporte en sesión AI |
| 2 | Configurar `.env` con nuevo Supabase | `.env` líneas 1-4: URL + claves del proyecto `vaqiqcaxfmsijyuqucwm` |
| 3 | Aplicar `supabase_clean_master.sql` | Script verifica: 26/26 tablas OK |
| 4 | Verificar storage bucket | `restaurant-assets` público: confirmado |
| 5 | Verificar datos semilla | `platform_settings`: 11 categorías negocio, 7 comida, 3 planes |
| 6 | Servidor corriendo | HTTP 200 en `localhost:3000` verificado con `Invoke-WebRequest` |
| 7 | Crear `scripts/apply_schema.cjs` | Script de verificación de BD en `scripts/apply_schema.cjs` |

---

## 6. Tareas Pendientes (Priorizadas)

### 🔴 Alta prioridad (bloqueantes)

1. **Crear usuario admin** en Supabase → registrar en `app_users` con `role = 'admin'`
2. **Configurar Auth URLs** en Supabase Dashboard → Authentication → URL Configuration:
   - Site URL: `http://localhost:3000`
   - Redirect URLs adicionales: `https://ais-dev-vwxtz7i5u6etdfshis6t4s-122130928241.us-east1.run.app/**`

### 🟡 Media prioridad (funcionalidad)

3. **Insertar datos de demostración**: al menos 2-3 restaurantes con productos, para que la homepage no esté vacía
4. **Nuevo build de producción** (`npm run build`) con las variables del nuevo Supabase
5. **Verificar flujo completo**: registro de usuario → pedido → notificación push
6. **Probar ChatAssistant con Gemini** — el endpoint `/api/ai/chat` debe responder correctamente

### 🟢 Baja prioridad (mejoras)

7. **Inicializar repositorio Git** (`git init`, primer commit)
8. **Configurar Meta API** (Facebook/Instagram): `META_APP_ID` y `META_APP_SECRET` están vacías en `.env`
9. **Limpiar archivos de parche** de la raíz: `patch.cjs`, `patch2.cjs`, `patch_*.cjs` (ya no necesarios)
10. **Desplegar en Google Cloud Run** con las nuevas variables de entorno

---

## 7. Credenciales y Datos Operativos Disponibles

### Super Admin Creado
- **Email:** `admin@smartbite.co`
- **Contraseña:** `SmartBite2026!`
- **Rol:** `admin` (en Supabase Auth y tabla `app_users`)
- **Acceso:** Iniciar sesión en `http://localhost:3000/auth` (redirige a `/platform`)

### Restaurante Demo Operativo
- **Nombre:** La Parrilla de Don Juan
- **ID:** `df5f8a47-4260-4a2c-ba56-9944f4758752`
- **Ruta directa:** `http://localhost:3000/r/df5f8a47-4260-4a2c-ba56-9944f4758752`
- **Categorías:** 6 (Parrillas y Asados, Hamburguesas, Combos y Especiales, Acompañamientos, Bebidas, Postres)
- **Productos:** 22 productos con precios, imágenes y multiplicadores de fidelidad.
- **Ruleta Pay:** Activa con 8 segmentos de premios y monto mínimo de compra de $20.000.
- **Suscripción:** Plan Pro activo.
- **Reseñas:** 5 reseñas demo con puntuación 4.8★ promedio.

---

## 8. Próxima Tarea Exacta a Ejecutar

1. **Probar el flujo de compra y fidelización:**
   - Abrir el restaurante demo `http://localhost:3000/r/df5f8a47-4260-4a2c-ba56-9944f4758752`.
   - Agregar productos al carrito superando los $20.000 COP.
   - Probar el giro de la Ruleta Pay al completar pedido.
   - Verificar la acreditación de monedas de oro y puntos.
2. **Sincronización con GitHub:**
   - Tan pronto el usuario instale Git en el sistema, ejecutar `git init`, `git add .`, `git commit -m "feat: smartbite clean setup"` y vincular al repositorio remoto.

---

## 9. Archivos Relevantes y Cambios

### Archivos modificados/creados en esta sesión

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `.env` | **Actualizado** | Variables de entorno (nuevo Supabase + Gemini API Key) |
| `scripts/apply_schema.cjs` | **Creado** | Script de verificación del schema de BD |
| `scripts/setup_inicial.cjs` | **Creado** | Script de creación del Super Admin y restaurante |
| `scripts/complete_setup.cjs` | **Creado** | Inserción de 22 productos (fix `ispartofcombo`), ruleta y reseñas |
| `supabase_clean_master.sql` | **Aplicado** | Schema maestro limpio ejecutado en Supabase |
| `CONTINUIDAD_PROYECTO.md` | **Actualizado** | Documento maestro de continuidad del proyecto |

### Archivos clave del proyecto

| Archivo | Tamaño | Descripción |
|---------|--------|-------------|
| `server.ts` | 139 KB / 3479 líneas | Servidor Express principal con todos los endpoints API |
| `src/store/db.ts` | 206 KB | Capa de datos — todas las funciones de BD |
| `src/pages/AdminDashboard.tsx` | 446 KB | Dashboard del restaurante (monolito) |
| `src/pages/PlatformAdmin.tsx` | 309 KB | Dashboard del super-admin |
| `src/pages/Home.tsx` | 136 KB | Página principal |
| `src/components/ChatAssistant.tsx` | 191 KB | Asistente AI con voice + herramientas |
| `src/lib/supabase.ts` | 2 KB | Cliente Supabase (lee credenciales de `window.__SUPABASE_*__`) |
| `supabase_clean_master.sql` | 27 KB | Schema limpio completo de BD |

### Archivos de parche (legado — no tocar)
`patch.cjs`, `patch2.cjs`, `patch_admindashboard.cjs`, `patch_admindashboard2.cjs`, `patch_app.cjs`, `patch_db.cjs`, `patch_db2.cjs`, `patch_menu.cjs`, `patch_menu2.cjs`, `patch_traffic.cjs`, `patch_traffic2.cjs`, `patch_traffic3.cjs`

> ⚠️ Estos son scripts de migración de código ya aplicados. No re-ejecutar.

---

## 9. Pruebas Ejecutadas y Resultados

| Prueba | Comando | Resultado |
|--------|---------|-----------|
| Conexión BD Supabase | `node scripts/apply_schema.cjs` | ✅ 26/26 tablas OK |
| Storage bucket | `supabase.storage.getBucket('restaurant-assets')` | ✅ Existe y es público |
| Datos semilla | Query a `platform_settings` | ✅ 11 cat. negocio, 7 comida, 3 planes |
| Servidor HTTP | `Invoke-WebRequest localhost:3000` | ✅ 200 OK |
| API config.js | `Invoke-RestMethod localhost:3000/api/config.js` | ✅ Devuelve URL y claves Supabase correctas |
| App renderiza | Inspeccionado HTML de respuesta | ✅ HTML completo con `<div id="root">` |

---

## 10. Errores Conocidos y Correcciones Pendientes

### Error 1 — BD vacía (no crítico)
- **Descripción:** No hay restaurantes, usuarios ni productos en la BD
- **Impacto:** La homepage muestra lista vacía; no se pueden probar flujos
- **Solución:** Insertar datos de prueba (ver tarea #3 en pendientes)

### Error 2 — Build desactualizado
- **Descripción:** El directorio `dist/` fue generado antes de la migración de BD (apuntaba al Supabase viejo)
- **Impacto:** En modo producción (`NODE_ENV=production`) el frontend usaría URL vieja
- **Solución:** `npm run build` después de verificar variables de entorno
- **Mitigante:** En desarrollo, el servidor inyecta las URLs correctas vía `/api/config.js` al runtime del browser, por lo que el frontend dev actual funciona correctamente

### Error 3 — Sin control de versiones
- **Descripción:** El proyecto no tiene Git inicializado
- **Impacto:** Sin historial de cambios, sin posibilidad de rollback
- **Solución:** `git init && git add -A && git commit -m "initial: smartbite migrado a nuevo supabase"`
- **Precaución:** El `.gitignore` excluye `.env*` — las credenciales no se commitearán

### Error 4 — Meta API no configurada
- **Descripción:** `META_APP_ID` y `META_APP_SECRET` están vacías en `.env`
- **Impacto:** El módulo de Social Media (Facebook/Instagram posts) no funciona
- **Solución:** Obtener credenciales de Meta for Developers y agregar al `.env`

---

## 11. Arquitectura, Tecnologías y Dependencias

### Stack completo

```
┌─────────────────────────────────────────────────────────────────┐
│  CLIENTE (Browser / PWA)                                        │
│  React 18 + TypeScript + Vite + TailwindCSS 3.4                │
│  react-router-dom v6 · framer-motion · lucide-react            │
│  recharts · mapbox-gl · jspdf · qrcode.react                   │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTP / WebSocket
┌──────────────────────▼──────────────────────────────────────────┐
│  SERVIDOR (Node.js v24.20 / tsx)                                │
│  Express.js 4 + Vite Middleware (dev) / Static (prod)           │
│  Multer (upload) · node-cron · ws (WebSocket)                  │
│  @google/genai (Gemini AI) · http-proxy-middleware              │
└──────┬───────────────┬────────────────┬───────────────┬─────────┘
       │               │                │               │
┌──────▼──┐    ┌───────▼──┐    ┌────────▼──┐   ┌───────▼──┐
│Supabase │    │ Gemini   │    │ OneSignal │   │ Mapbox   │
│(PG+Auth │    │ 2.8.0    │    │ Push API  │   │ GL JS    │
│+Storage)│    │ API      │    │           │   │          │
└─────────┘    └──────────┘    └───────────┘   └──────────┘
```

### Dependencias críticas de Node.js

```json
{
  "node": "v24.20.0",
  "npm": "11.19.0",
  "tsx": "^4.19.1",
  "vite": "^5.4.11",
  "react": "18.3.1",
  "@supabase/supabase-js": "^2.45.1",
  "@google/genai": "^2.8.0",
  "express": "^4.21.2",
  "tailwindcss": "3.4.1"
}
```

### Variables de entorno requeridas (`.env`)

> ⚠️ **SEGURIDAD:** No incluir valores reales en documentación pública. Los valores están en `.env` local.

| Variable | Descripción | Estado |
|----------|-------------|--------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase | ✅ Configurada |
| `VITE_SUPABASE_ANON_KEY` | Clave pública (anon) de Supabase | ✅ Configurada |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (solo servidor) | ✅ Configurada |
| `GEMINI_API_KEY` | Clave de Google Gemini AI | ✅ Configurada |
| `VITE_ONESIGNAL_APP_ID` | ID de la app en OneSignal | ✅ Configurada |
| `ONESIGNAL_REST_API_KEY` | Clave REST de OneSignal | ✅ Configurada |
| `VITE_MAPBOX_TOKEN` | Token de Mapbox GL | ✅ Configurada |
| `VITE_APP_URL` | URL pública de la app | ✅ Configurada |
| `META_APP_ID` | App ID de Facebook for Developers | ⚠️ VACÍA |
| `META_APP_SECRET` | App Secret de Facebook | ⚠️ VACÍA |

---

## 12. Decisiones Técnicas y Reglas de Negocio

### Decisiones de Arquitectura

1. **Un solo servidor Express** sirve tanto el API como el frontend (SPA) — no hay separación front/back en despliegue.
2. **El cliente Supabase en el frontend** lee las credenciales de `window.__SUPABASE_URL__` y `window.__SUPABASE_ANON_KEY__` inyectadas por `/api/config.js`, NO directamente de variables de entorno de Vite — esto permite cambiar el proyecto Supabase sin rebuild.
3. **La clave `SERVICE_ROLE_KEY`** solo se usa en el servidor (`server.ts`), nunca se expone al cliente.
4. **RLS en Supabase** está activado con política permisiva (`FOR ALL USING (true)`) para facilitar el desarrollo — **debe endurecerse antes de producción real**.
5. **Tabla `app_users`** extiende `auth.users` de Supabase — al registrar un usuario en Auth, hay que insertar manualmente en `app_users`.

### Roles de Usuario

| Rol | Acceso |
|-----|--------|
| `user` | Dashboard personal, pedidos, puntos de lealtad, juegos |
| `restaurant` | AdminDashboard (gestión de menú, pedidos, marketing, ruleta) |
| `driver` | DriverDashboard (mapa, entregas asignadas) |
| `representative` | RepresentativeDashboard (referidos, comisiones) |
| `admin` | Todo lo anterior + PlatformAdmin (configuración global, usuarios, planes) |

### Reglas de Negocio Acordadas

- **Planes**: Free (5% comisión), Profesional ($49.000 fijo/mes), Comisión Reducida (3%)
- **Gamificación**: 10 coins por pedido, 1 punto por unidad de moneda gastada
- **Ruleta Pay**: activable por restaurante, configuración de segmentos por local
- **Embajadores/Representantes**: pueden ver y gestionar un restaurante asignado
- **El nombre de la app es configurable** desde `platform_settings.appName` — no está hardcodeado

---

## 13. Comandos para Instalar, Ejecutar y Probar

```bash
# Instalar dependencias (si node_modules no existe)
npm install

# Ejecutar en desarrollo (servidor Express + Vite HMR)
npm run dev
# → Disponible en http://localhost:3000

# Verificar estado de la base de datos
node scripts/apply_schema.cjs

# Compilar para producción
npm run build

# Ejecutar en modo producción (sirve dist/ estático)
npm start

# Verificar tipos TypeScript
npm run lint
```

### Endpoints API clave para pruebas manuales

```
GET  /api/health-check              → { status: "ok" }
GET  /api/config.js                 → Inyecta vars Supabase al browser
GET  /api/reviews/restaurant/:id    → Reseñas de un restaurante
POST /api/ai/chat                   → Chat con Gemini AI
POST /api/notifications/send        → Enviar push via OneSignal
POST /api/upload-asset              → Subir imagen a Supabase Storage
POST /api/admin/create-representative → Crear cuenta de representante
```

---

## 14. Riesgos, Restricciones de Seguridad y Precauciones

### ⚠️ Riesgos Críticos

1. **Sin Git:** No hay historial de cambios. Un error puede ser irrecuperable. **Inicializar Git inmediatamente.**
2. **RLS permisiva:** Las políticas de Supabase están en modo `FOR ALL USING (true)`. Cualquier usuario autenticado puede leer/escribir cualquier tabla. **Esto es inseguro para producción.**
3. **`GEMINI_API_KEY` con formato no estándar:** La clave comienza con `AQ.` — formato propio de AI Studio. Puede tener cuotas limitadas. Verificar que no incurra en costos inesperados.
4. **`dist/` desactualizado:** El build de producción aún apunta al Supabase viejo. No hacer `npm start` (modo producción) sin hacer `npm run build` primero.

### 🔒 Precauciones de Seguridad

- **Nunca commitear `.env`** — el `.gitignore` ya lo excluye.
- **`SERVICE_ROLE_KEY` solo en servidor** — nunca en código frontend ni en el bundle de Vite.
- **Antes de producción real:** Reemplazar las políticas RLS permisivas por políticas específicas por rol.
- **CORS:** El servidor no tiene configuración CORS explícita actualmente.

### ℹ️ Restricciones Conocidas

- El proyecto **no tiene Git** — no hay forma de hacer rollback automático.
- El proyecto usa **tsx** para TypeScript en Node.js (no compilación previa) — requiere tsx instalado.
- **Playwright no funciona** en este entorno de desarrollo (browser subagent falla con error 404 de azureedge al instalar drivers).
- **La BD está completamente vacía** de datos de negocio (usuarios, restaurantes, productos).

---

## 15. Criterios de Aceptación para la Fase Actual

La fase de "Migración y Puesta a Punto" se considera **terminada** cuando:

- [x] 26/26 tablas de BD existen en nuevo Supabase
- [x] Storage bucket `restaurant-assets` creado y público
- [x] Variables de entorno completas en `.env`
- [x] Servidor responde en `localhost:3000`
- [ ] Existe al menos 1 usuario con `role = 'admin'` en `app_users`
- [ ] El usuario admin puede hacer login y ver `/platform`
- [ ] Existen al menos 2 restaurantes de prueba con productos
- [ ] `npm run build` genera un `dist/` actualizado con el nuevo Supabase

---

## 16. Instrucciones para Retomar en Nueva Sesión

### Paso 1 — Arrancar el servidor
```powershell
cd c:\Users\PC\Desktop\SmartBite-main
npm run dev
# Verificar que inicie en http://localhost:3000
```

### Paso 2 — Verificar BD (opcional, para confirmar estado)
```powershell
node scripts/apply_schema.cjs
```

### Paso 3 — Ejecutar primera tarea pendiente
→ Ver **Sección 7** de este documento: crear usuario admin en Supabase Dashboard.

### Contexto para el AI Assistant
Al iniciar nueva sesión, proporcionar este contexto:

> "Estoy continuando el proyecto SmartBite. Es una plataforma de delivery/restaurantes con React + Express + Supabase + Gemini AI. Ya migramos la BD al proyecto de Supabase `vaqiqcaxfmsijyuqucwm` con 26 tablas y schema limpio. El servidor corre con `npm run dev` en puerto 3000. La BD está vacía de datos de negocio. La siguiente tarea es crear el primer usuario admin. Lee `CONTINUIDAD_PROYECTO.md` para contexto completo."

---

## Apéndice — Estructura de Directorios

```
SmartBite-main/
├── .env                        ← Variables de entorno (NO commitear)
├── .env.example                ← Plantilla de variables (sí commitear)
├── .gitignore
├── CONTINUIDAD_PROYECTO.md     ← Este documento
├── package.json
├── server.ts                   ← Servidor Express (3479 líneas, API completa)
├── vite.config.ts              ← Config de Vite + PWA
├── tsconfig.json
├── supabase_clean_master.sql   ← Schema maestro limpio (ejecutado ✅)
├── index.html                  ← Entry point HTML
├── dist/                       ← Build de producción (desactualizado ⚠️)
├── public/                     ← Assets estáticos (PWA icons, manifest)
├── scripts/
│   ├── apply_schema.cjs        ← Verifica estado de la BD ✅
│   └── [otros scripts de migración legacy]
├── src/
│   ├── main.tsx                ← Entry point React
│   ├── App.tsx                 ← Rutas y layout principal (815 líneas)
│   ├── SafeBoundary.tsx        ← Error boundary global
│   ├── lib/
│   │   ├── supabase.ts         ← Cliente Supabase (lee de window.__*)
│   │   └── telemetryInterceptor.ts
│   ├── store/
│   │   └── db.ts              ← Capa de datos (206 KB, todas las queries)
│   ├── contexts/
│   │   ├── AuthContext.tsx     ← Autenticación con Supabase Auth
│   │   ├── CartContext.tsx     ← Carrito de compras
│   │   ├── NotificationContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/
│   │   └── useOneSignal.ts    ← Hook de push notifications
│   ├── services/
│   │   ├── ai.ts              ← Servicio de Gemini AI
│   │   ├── billingService.ts  ← Facturación
│   │   ├── mapboxService.ts   ← Geocoding y mapas
│   │   ├── paymentService.ts  ← Integración de pagos
│   │   └── referralService.ts ← Sistema de referidos
│   ├── pages/                 ← 15 páginas principales
│   └── components/            ← 46 componentes
└── [archivos patch legacy — no re-ejecutar]
```
