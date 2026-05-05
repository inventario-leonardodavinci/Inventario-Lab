# Tareas semana — Inventario Salud Ambiental

> Periodo: 29 abril – 5 mayo 2026 ✅ · **Semana activa: 6 – 12 mayo 2026**
> Estado de partida: infraestructura lista, backend funcional, frontend con datos hardcodeados y formularios incompletos.

---

## Día 1 — Lunes 29 abr · Panel principal real

- [x] Añadir endpoint `GET /v1/movimientos/resumen-hoy` que devuelva entradas y salidas del día actual
- [x] Conectar los KPIs "Entradas hoy" y "Salidas hoy" del `PanelPrincipal` a ese endpoint
- [x] Reemplazar el feed de actividad hardcodeado por los últimos 5 movimientos reales (`GET /v1/movimientos?per_page=5`)
- [x] Verificar que los KPIs de stock total y críticos ya usan datos reales (están parcialmente conectados)

---

## Día 2 — Martes 30 abr · Formularios con selectores reales

- [x] Añadir endpoint `GET /v1/ubicaciones` que devuelva todas las ubicaciones
- [x] Añadir endpoint `GET /v1/categorias` que devuelva todas las categorías
- [x] En `Movimientos`: reemplazar los campos de texto por `<Select>` con datos de la API
- [x] En `Artículos` (alta): categoría obligatoria con `<Select>`, unidad con desplegable de medidas
- [x] Mostrar la columna "Ubicación" en la tabla de artículos

---

## Día 3 — Miércoles 1 may · Página de Alertas

- [x] Crear página `Alertas.tsx` con tabla que consuma `GET /v1/alertas`
- [x] Añadir filtros por tipo, severidad y estado
- [x] Implementar botones "Confirmar" y "Resolver" con sus endpoints
- [x] Añadir la ruta `/alertas` en `App.tsx` y el enlace en `BarraLateralAplicacion`

---

## Día 4 — Jueves 2 may · Auditoría real

- [x] Crear página `Auditoria.tsx` con filtros por entidad, operación y rango de fechas
- [x] Triggers PostgreSQL `fn_auditoria()` que registran INSERT/UPDATE/DELETE en `registros_auditoria`
- [x] Middleware establece `SET app.current_user_id` para que los triggers guarden el usuario real
- [x] Detalle de cambio expandible: muestra valores antes/después con campos traducidos al español
- [x] Filtro de entidad cambiado de input libre a select con las tablas reales del sistema
- [x] Conectar las 3 tarjetas de estadísticas de `Informes.tsx` a datos reales (siguen hardcodeadas)

---

## Día 5 — Viernes 3 may · Artículos y categorías completos

- [x] CRUD completo de artículos: crear con stock inicial + ubicación, editar, desactivar con confirmación
- [x] Eliminar página `Inventario.tsx` duplicada — `/inventario` redirige a `/articulos`
- [x] Eliminar entrada "Inventario" del sidebar (era duplicado de "Artículos")
- [x] Eliminar categoría con confirmación (bloqueado si tiene artículos asociados)
- [x] Endpoint `DELETE /v1/categorias/{id}` con validación de artículos asociados

---

## Día 6 — Sábado 4 may · UI/UX y skeletons

- [x] Skeletons de carga específicos por página (`PageSkeleton.tsx`) — 10 variantes
- [x] Cada página muestra su skeleton propio en `isLoading` en lugar del genérico del `Suspense`
- [x] Página de perfil rediseñada: banner con gradiente, tabs con iconos, cards con iconos de color
- [x] Sidebar: logo SVG real, footer con bordes redondeados (`rounded-lg` en lugar de `rounded-none`)
- [x] Avatar editable: badge de cámara siempre visible, click abre editor de recorte con foto actual
- [x] Editor de recorte con botones "Cambiar foto" y "Eliminar" dentro del propio editor
- [x] Imagen original guardada en `avatar_url_original` para re-editar sin pérdida de calidad
- [x] Login: al cerrar sesión muestra el último usuario con foto/nombre para reentrar rápido
- [x] Formularios de login/registro: validación por campo sin burbujas nativas del navegador
- [x] `Input` de shadcn actualizado con `forwardRef` para eliminar warning de React

---

## Día 7 — Domingo 5 may · Backend y trazabilidad

- [x] Reestructurar esquema BD completo al español (tablas, columnas, enums, constraints)
- [x] Roles: seeder `RolesSeeder`, middleware `ResolverUsuarioApp` auto-crea usuario con rol `consultor`
- [x] Fix crítico: rol leído desde backend Laravel (fuente de verdad) en lugar de metadatos de Insforge
- [x] Historial de sesiones mejorado: IP real (Cloudflare/Nginx/proxy), geolocalización via `ip-api.com`, navegador con versión, SO con versión, tipo de evento, campo `exitoso`
- [x] Migración `2026_05_03_000000_mejorar_historial_sesiones` aplicada en BD
- [x] Ejecutar `npm run build` sin errores en el frontend
- [x] Ejecutar `php artisan test` y corregir los tests que fallen — **9/9 PASS** (52 assertions)
- [ ] Probar el flujo completo de extremo a extremo: login → inventario → movimiento → alerta → notificación Novu

---

## 🗓️ Semana 6–12 mayo 2026 — Librerías, seguridad y calidad

> Stack base: React 18 + Vite 8 + TailwindCSS 4 + shadcn/ui · Laravel 13 + PHP 8.3 · PostgreSQL · Insforge Auth

---

### Día 1 — Lunes 6 may · Estado global robusto y caché de datos

- [x] ~~**Instalar `zustand` (^5)**~~ — **HECHO**: `useSesionStore` con `persist` middleware. Se sincroniza desde `ContextoAutenticacion`. Permite acceso fuera de componentes via `getSesionActual()`. Logout llama `limpiar()` para vaciar el store.
- [x] ~~**`@tanstack/react-query` ya está**~~ — **HECHO**: `QueryClient` ahora tiene `staleTime: 60s`, `gcTime: 5min`, `refetchOnWindowFocus: false` y toast global de errores de red/403 en `onError`.
- [x] ~~**Instalar `axios` (^1.7)**~~ — **HECHO**: `clienteApi.ts` migrado a axios. `httpClient` instancia con `baseURL`, `timeout: 10s`. Interceptor de response normaliza errores a `ApiError`/`ApiValidationError`. API pública `apiClient<T>` idéntica — todos los consumidores sin cambios.

---

### Día 2 — Martes 7 may · Formularios con validación profesional

- [x] ~~**Instalar `react-hook-form` + `zod` + `@hookform/resolvers`**~~ — **HECHO**: esquemas en `src/schemas/index.ts` (`esquemaMovimiento`, `esquemaArticulo`, `esquemaPerfil`). `Movimientos.tsx` migrado: `Controller` para `Select`, errores inline, `handleSubmit` elimina validación manual. Build limpio.
- [ ] Backend: instalar **`spatie/laravel-data`** — DTOs tipados para validación de requests en lugar de `FormRequest` manual
  ```
  composer require spatie/laravel-data
  ```

---

### Día 3 — Miércoles 8 may · Seguridad backend

- [x] ~~**Instalar `spatie/laravel-permission`**~~ — **HECHO**: `UsuarioApp` usa `HasRoles` con `guard_name = 'api'`. Migración `2026_05_06_000000` migra datos de `roles`/`usuario_roles` → `spatie_roles`/`spatie_model_has_roles` y elimina tablas caseras. `batches` renombrada a `lotes`. `AsegurarRol` y `AsegurarPermiso` usan `hasAnyRole`/`can`. `RolesYPermisosSeeder` crea 24 permisos granulares. Residuos eliminados: `Rol.php`, `Usuario.php`, `UserFactory.php`, `RolesSeeder.php`.
- [ ] **Instalar `laravel/sanctum`** — añadir tokens de API con expiración (actualmente se usa solo `X-Auth-User-Id` sin firma); middleware `auth:sanctum` en rutas protegidas
  ```
  composer require laravel/sanctum
  ```
- [ ] **Instalar `spatie/laravel-activitylog`** — complementar los triggers PostgreSQL con log de nivel aplicación (quién hizo qué desde PHP, con contexto de request)
  ```
  composer require spatie/laravel-activitylog
  ```
- [x] ~~**Rate limiting**~~ — **HECHO**: 60/min general ya existía. Añadidos `login-evento` (10/min) y `escritura` (30/min) aplicados en `POST /notificaciones/evento-login` y `POST /movimientos`.

---

### Día 4 — Jueves 9 may · Tablas interactivas y UX de datos

- [ ] **Instalar `@tanstack/react-table` (^8)** — reemplazar las tablas `<table>` manuales de Artículos, Movimientos, Alertas y Auditoría por columnas configurables con sorting, paginación server-side y selección múltiple
  ```
  npm install @tanstack/react-table
  ```
- [ ] **Instalar `react-virtual` / `@tanstack/react-virtual`** — virtualización de filas para Auditoría y Movimientos (evitar lag con +500 registros)
  ```
  npm install @tanstack/react-virtual
  ```
- [x] ~~**Instalar `date-fns` (^3)**~~ — **HECHO**: `formatearFecha`, `formatearFechaHora`, `formatearFechaRelativa` en `formatters.ts` usan `format`, `parseISO`, `formatDistanceToNow` con locale `es`.
- [ ] Backend: paginación real en `GET /v1/auditoria` (actualmente carga los primeros 20 sin cursor)

---

### Día 5 — Viernes 10 may · Login fluido y persistencia de sesión

- [ ] **Instalar `jwt-decode` (^4)** — leer la expiración del token Insforge en el cliente sin llamadas extra; redirigir a login si el token expiró antes de hacer la petición
  ```
  npm install jwt-decode
  ```
- [ ] **Mejorar flujo de login**: detectar sesión activa en `App.tsx` con spinner centrado y sin flash de pantalla de login; guardar último usuario (`lastUser`) en `localStorage` para el componente de reentrada rápida ya implementado
- [ ] **Instalar `@insforge/sdk` refresh silencioso** — llamar `insforge.auth.refreshSession()` en el interceptor Axios cuando el token expire (actualmente no hay refresh automático)
- [ ] **Instalar `react-hot-toast`** ya se usa `sonner` — revisar y unificar todos los toasts del proyecto en una sola librería (`sonner` ya instalado, eliminar cualquier `alert()` o `console.error` visible al usuario)

---

### Día 6 — Sábado 11 may · Rendimiento frontend y PWA base

- [ ] **Code splitting por ruta**: envolver cada `import` de página en `React.lazy()` + `<Suspense>` en `App.tsx` para reducir el bundle inicial (actualmente todo en un chunk)
- [ ] **Instalar `vite-plugin-pwa` (^0.21)** — configurar service worker con estrategia `networkFirst` para que la app sea instalable en móvil y funcione offline en modo lectura
  ```
  npm install -D vite-plugin-pwa
  ```
- [ ] **Instalar `workbox-precaching`** (incluido en vite-plugin-pwa) — pre-cachear assets estáticos y shell de la app
- [ ] Configurar el `manifest.json` con nombre, iconos y `theme_color` del proyecto
- [ ] Activar **compresión Brotli** en Vite build: `vite-plugin-compression2`
  ```
  npm install -D vite-plugin-compression2
  ```

---

### Día 7 — Domingo 12 may · Tests, CI y datos reales

- [ ] **Instalar `msw` (^2) — Mock Service Worker** para tests unitarios de hooks y componentes sin backend real
  ```
  npm install -D msw
  ```
- [ ] Escribir tests de integración para el flujo login → dashboard con Vitest + Testing Library usando MSW
- [ ] **Backend**: instalar **`pestphp/pest`** como runner de tests moderno (más legible que PHPUnit puro)
  ```
  composer require pestphp/pest pestphp/pest-plugin-laravel --dev
  ```
- [x] ~~**Seeder completo con datos realistas**~~ — **HECHO**: `MovimientosHistoricoSeeder` genera 50 movimientos distribuidos en 30 días (entradas/salidas/traslados/ajustes), idempotente.
- [x] ~~**Conectar KPIs de `Informes.tsx`**~~ — **HECHO**: endpoint `resumenHoy` ahora devuelve `entradas_hoy`, `salidas_hoy`, `ajustes_hoy` y `traslados_hoy`. Informes muestra 4 KPIs reales en grid 2×2.
- [x] `npm run build` limpio sin errores TypeScript · `php artisan test` **9/9 PASS (62 assertions)**
- [x] ~~**Modo oscuro**~~ — **HECHO**: `ProveedorTema` con `localStorage`, toggle Sol/Luna en header, `sonner` adaptado. `.dark` aplica variables CSS del `:root`.

---

### Resumen de librerías nuevas a instalar

#### Frontend (`npm install`)
| Librería | Versión | Para qué |
|---|---|---|
| `zustand` | ^5 | Estado global + persistencia sesión |
| `axios` | ^1.7 | Cliente HTTP con interceptores |
| `react-hook-form` | ^7 | Formularios performantes |
| `zod` | ^3 | Validación de esquemas tipada |
| `@hookform/resolvers` | ^3 | Integra zod con react-hook-form |
| `@tanstack/react-table` | ^8 | Tablas con sort/pagina/filtro |
| `@tanstack/react-virtual` | ^3 | Virtualización de listas largas |
| `date-fns` | ^3 | Formateo de fechas consistente |
| `jwt-decode` | ^4 | Leer expiración del token JWT |
| `vite-plugin-pwa` | ^0.21 | PWA + service worker |
| `vite-plugin-compression2` | ^1 | Build con Brotli/gzip |
| `msw` | ^2 | Mocks para tests |

#### Backend (`composer require`)
| Paquete | Para qué |
|---|---|
| `spatie/laravel-permission` | Roles y permisos granulares |
| `laravel/sanctum` | Tokens API firmados con expiración |
| `spatie/laravel-activitylog` | Log de actividad en nivel app |
| `spatie/laravel-data` | DTOs tipados / validación requests |
| `pestphp/pest` | Runner de tests moderno |

---

## Pendiente — Próxima semana

### Alta prioridad

- [ ] **Informes**: conectar las 3 tarjetas de estadísticas a datos reales (endpoint `GET /v1/informes/resumen`)
- [ ] **Mantenimiento**: planes de mantenimiento (`GET/POST /v1/mantenimiento/planes`) y eventos por activo
- [ ] **Movimientos**: reemplazar campo "Artículo (ID)" por selector con búsqueda de artículos reales
- [ ] **Novu**: workflow `stock-critico` que se dispare cuando stock < mínimo tras un movimiento
- [ ] **Datos de prueba**: seeder con categorías, ubicaciones, artículos y stock inicial realistas
- [ ] **Build**: `npm run build` limpio + `php artisan test` en verde

### Media prioridad

- [ ] **Ubicaciones**: añadir editar y eliminar (igual que categorías)
- [ ] **Artículos**: página de detalle con niveles de stock por ubicación y botón para ajustar stock
- [ ] **Alertas**: badge con conteo de alertas abiertas en el menú lateral
- [ ] **Perfil**: sección de sesiones activas con botón "Cerrar esta sesión" por dispositivo
- [ ] **Auditoría**: paginación (actualmente carga los primeros 20 sin poder ver más)
- [ ] **Informes**: exportar a CSV/PDF

### Baja prioridad / mejoras futuras

- [ ] Modo oscuro (variables CSS ya preparadas en `index.css`)
- [ ] Internacionalización (i18n) — base en español, preparar para inglés
- [ ] PWA / instalable en móvil
- [ ] Tests E2E con Playwright para el flujo login → movimiento → alerta
- [ ] Rate limiting más granular por endpoint
- [ ] Caché Redis para endpoints de solo lectura frecuentes (`/categorias`, `/ubicaciones`)
- [ ] Webhook de Novu para notificaciones push en tiempo real

---

## Resumen de endpoints implementados

| Endpoint | Método | Estado |
|---|---|---|
| `/v1/movimientos/resumen-hoy` | GET | ✅ |
| `/v1/ubicaciones` | GET / POST / PATCH | ✅ |
| `/v1/categorias` | GET / POST / PATCH / DELETE | ✅ |
| `/v1/articulos` | GET / POST / PATCH / DELETE | ✅ |
| `/v1/alertas` | GET | ✅ |
| `/v1/alertas/{id}/confirmar` | POST | ✅ |
| `/v1/alertas/{id}/resolver` | POST | ✅ |
| `/v1/auditoria` | GET | ✅ |
| `/v1/perfil` | GET / PATCH | ✅ |
| `/v1/perfil/historial-sesiones` | GET | ✅ |
| `/v1/notificaciones/evento-login` | POST | ✅ |
| `/v1/informes/resumen` | GET | ❌ pendiente |
| `/v1/mantenimiento/planes` | GET / POST | ❌ pendiente |
| `/v1/mantenimiento/activos/{id}/eventos` | POST | ❌ pendiente |

---

---

## 🐛 Bugs corregidos — Auditoría profunda 5 mayo 2026

> Todos corregidos en esta sesión. Registrados aquí para historial y para no regresionar.

### Críticos (datos corruptos / comportamiento incorrecto silencioso)

| # | Archivo | Bug | Fix aplicado |
|---|---------|-----|--------------|
| 1 | `ResolverUsuarioApp.php` | SQL injection por interpolación de string en `DB::statement` → audit trail con `usuario_id = NULL` en todos los registros | Consulta parametrizada `SET app.current_user_id = ?` |
| 2 | `ArticuloController.php` | `estado_stock = 'critico'` cuando stock=0 y mínimo=0 (`0 <= 0`) — artículos sin stock mínimo aparecen en rojo | Añadida guarda `cantidadMinima > 0` |
| 3 | `InventarioController.php` | Mismo bug `0 <= 0` en ruta legacy `/inventario` | Mismo fix |
| A | `ResolverUsuarioApp.php` | Usuario desactivado recibía un **usuario nuevo** en vez de 403 — el filtro `where('activo', true)` descartaba el registro y entraba en la rama "crear" | Búsqueda sin filtro activo, luego `elseif !activo → 403` |
| D | `MovimientoService.php` | `incrementarStock` usaba `firstOrCreate` sin `lockForUpdate` → race condition en entradas concurrentes → UNIQUE violation → HTTP 500 sin mensaje amigable | `lockForUpdate + select → update o create` |
| F | `authApi.ts` | `obtenerRolDesdeBackend` leía `data.roles` pero la API devuelve `{ data: { roles } }` → **el rol nunca se cargaba desde el backend**, todos los usuarios con rol `null` | Cambio a `json.data?.roles?.[0]?.name` |
| G | `AuditoriaController.php` | Frontend envía `entidad_tipo` y `tipo_evento`, backend filtraba por `tabla` y `operacion` → **los filtros de auditoría nunca aplicaban**, siempre se mostraban todos los registros | Renombrar parámetros a `entidad_tipo` y `tipo_evento` |
| H | `AlertaService.php` | `evaluarStockBajo` usaba `<` (estricto) pero `ArticuloController` usa `<=` para marcar crítico → artículo con stock exacto al mínimo aparece en rojo pero **no genera alerta** | Alinear a `<= cantidad_minima` con guarda `> 0` |

### Altos (rompen funcionalidad visible)

| # | Archivo | Bug | Fix aplicado |
|---|---------|-----|--------------|
| 4 | `clienteApi.ts` | `response.json()` en respuestas `204 No Content` lanzaba `SyntaxError` no capturado → eliminar categoría rompía el frontend | Early return `undefined` cuando `status === 204` |
| 7 | `Perfil.tsx` | `restablecerContrasena(nuevaPass, tokenReset!)` con token potencialmente `null` → crash si el flujo llega al paso "nueva" sin token | Guarda explícita antes de llamar, redirige al paso inicial |
| 8 | `mejorar_historial_sesiones.php` | `down()` eliminaba columnas `tipo_evento` y `exitoso` que pertenecen a la migración base → rollback cascada roto | `down()` vacío — esta migración no crea esas columnas |
| C | `NotificacionController.php` | Llamada HTTP síncrona a `ip-api.com` con timeout=2s bloqueaba cada login; en local siempre IP privada pero el código no lo cortocircuitaba | Short-circuit en `local/testing` + timeout a 1s |
| E | `PerfilController.php` | `actualizar()` usaba `required` en PATCH (viola REST); respuesta sin envoltura `data`; sin `roles` en respuesta — frontend no podía leer el perfil actualizado | `sometimes`, guarda `if (!empty)`, `load('roles')`, envoltura `{ data }` en GET y PATCH |

### Medios (datos incorrectos, UX rota)

| # | Archivo | Bug | Fix aplicado |
|---|---------|-----|--------------|
| 5 | `NotificacionController.php` | `user_id` del usuario autenticado inyectado en cada alerta global del sistema — campo semánticamente incorrecto | Eliminado el campo `user_id` del payload de alertas |
| 6 | `Movimientos.tsx` | `articuloId` inicializado a `'1'` hardcoded → movimientos silenciosos sobre artículo 1 si el usuario no cambia el campo | Inicializar a `''` + validación antes de enviar |
| 9 | `Usuarios.tsx` | Race condition: mientras `perfilData` carga, `esPropioUsuario = false` → admin puede intentar cambiar su propio rol antes de que se confirme su identidad | Deshabilitar todos los selectores mientras `cargandoPerfil` |
| B | `ArticuloController.php` | `destroy()` llamaba `serializar()` sin cargar la relación `categoria` → campo `categoria: null` en respuesta de soft-delete | `$articulo->load('categoria:id,nombre')` antes de serializar |

---

## 🔧 Mejoras pendientes identificadas — No son bugs críticos pero deberían hacerse

> Estas tareas NO estaban en el plan original. Añadidas tras la auditoría profunda del 5 mayo.

### Alta prioridad (corregir antes de siguiente release)

- [x] ~~**`Movimientos.tsx` — selector de artículo real**~~ — **CORREGIDO**: reemplazado por `<Select>` con `useArticulos({ activo: true })`, muestra nombre y código.

- [x] ~~**`NovuService.php` — no lanza excepción en fallo**~~ — **CORREGIDO**: respuesta HTTP fallida y excepciones se capturan y se registran con `Log::warning`; el login no se bloquea.

- [x] ~~**`AlertaService::generarAlerta` — race condition en deduplicación**~~ — **CORREGIDO**: `DB::transaction` + `lockForUpdate` en el SELECT, igual que `MovimientoService`.

- [x] ~~**`AuditoriaController` — paginación en frontend**~~ — **CORREGIDO**: `Auditoria.tsx` ahora incluye botones prev/next, estado de página y descripción con total real desde `meta`.

- [x] ~~**`PerfilController::__invoke` — respuesta sin `created_at`**~~ — **CORREGIDO**: `created_at` incluido en la respuesta de `GET /perfil`.

### Media prioridad (deuda técnica)

- [x] ~~**`ResolverUsuarioApp.php` — `nombre_visible` siempre es `'Usuario'`**~~ — **CORREGIDO**: middleware lee `X-Auth-User-Name` en el alta; `sincronizarPerfil` migrado a `apiClient` para enviarlo automáticamente; `ContextoAutenticacion` llama `sincronizarPerfil` en el `useEffect` de recuperación de sesión, cubriendo el retorno OAuth Google/Apple.

- [x] ~~**`clienteApi.ts` — no hay manejo de errores de red/timeout**~~ — **CORREGIDO**: `TypeError` y `AbortError` se capturan y se relanza como `ApiError` con mensajes en español.

- [x] ~~**`queries.ts` — `useArticulos` no pasa el filtro `activo`**~~ — **CORREGIDO** en esta sesión: `getArticulos` ahora acepta `activo?: boolean` y lo incluye en el QueryString; `queryKey` actualizada para incluir `activo`.

- [x] ~~**`usuariosApi.ts` — falta `getHistorialSesiones` para el hook**~~ — **CORREGIDO**: creada función `getHistorialSesiones` con tipo `RegistroSesion`; hook `useHistorialSesiones` ahora importa y usa correctamente la función en lugar de llamar `apiClient` directamente.

- [x] ~~**`AlertaService::resolverAlerta` — usa campos de confirmación**~~ — **CORREGIDO**: la función usaba `confirmada_por_id` y `confirmada_en` en lugar de los campos de resolución; ahora usa correctamente `resuelta_por_id` y `resuelta_en`.

- [x] ~~**Tabla `alertas` — faltan campos de resolución**~~ — **CORREGIDO**: migración `2026_05_05_020000_add_resolved_fields_to_alertas` crea `resuelta_por_id` (FK a `usuarios_app`) y `resuelta_en` (timestamp); modelo `Alerta` actualizado con fillable, casts y relación `resueltaPor()`.

- [x] ~~**Tipo `Alerta` en frontend — sin campos de resolución**~~ — **CORREGIDO**: interfaz `Alerta` en `types/index.ts` ahora incluye `resuelta_por_id` y `resuelta_en`.

- [x] ~~**`MovimientoService` — `ajustarStock` no valida stock negativo**~~ — **CORREGIDO**: `manejarAjuste()` lanza `RuntimeException` si `$cantidad < 0`.

- [x] ~~**`AuditoriaController` — sin índice en `created_at`**~~ — **CORREGIDO**: migración `2026_05_05_000000` crea `idx_registros_auditoria_created_at` e `idx_registros_auditoria_entidad_fecha` (compuesto).

- [x] ~~**`NotificacionController` — sin índices en `alertas`**~~ — **CORREGIDO**: misma migración crea `idx_alertas_generada_en`, `idx_alertas_estado` e `idx_alertas_estado_generada_en` (compuesto).

### Baja prioridad / Deuda menor

- [x] ~~**`formatearFecha` / `formatearFechaHora` en `formatters.ts`**~~ — **CORREGIDO**: los 3 formateadores de fecha aceptan `string | null | undefined` y devuelven `'—'` si el valor falta o es inválido.

- [ ] **`Auditoria.tsx` — doble verificación de rol**: el check `esAdmin` en el componente es redundante con el middleware del backend. Mover a un `<GuardRol>` reutilizable. *Bajo impacto, posponer.*

- [x] ~~**`HistorialSesion` — `tipo_evento` como string libre**~~ — **CORREGIDO**: migración `2026_05_05_000000` añade `CHECK (tipo_evento IN ('login','logout','refresh','oauth'))`; modelo expone `TIPOS_EVENTO` como constante.

- [x] ~~**Seeders de roles**~~ — **CORREGIDO**: migración `2026_05_05_000000` inserta los 3 roles con `ON CONFLICT (name) DO NOTHING` — idempotente, no falla si ya existen.

---

## Lo que ya funciona y no hay que tocar

- Autenticación completa: login, registro, verificación email OTP, recuperación contraseña, OAuth Google/Apple
- Roles: administrador, profesor, consultor — asignación automática y cambio desde UI
- Artículos: CRUD completo con stock inicial, edición, desactivación
- Categorías: CRUD completo con eliminación protegida
- Ubicaciones: crear y listar
- Movimientos: crear con control de stock negativo, historial con filtros
- Alertas: listar, confirmar, resolver con filtros por tipo/severidad/estado
- Auditoría: triggers PostgreSQL con usuario real, detalle expandible de cambios
- Perfil: editar nombre, cambiar contraseña, historial de sesiones con geolocalización (IP, navegador, SO, ciudad/país)
- Skeletons de carga en todas las páginas
- Validación de formularios sin burbujas nativas del navegador
- Apache + PHP 8.3 sirviendo la API en puerto 8080
- BD PostgreSQL remota conectada
