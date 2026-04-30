# Tareas semana — Inventario Salud Ambiental

> Periodo: 29 abril – 5 mayo 2026
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
- [ ] Conectar las 3 tarjetas de estadísticas de `Informes.tsx` a datos reales (siguen hardcodeadas)

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
- [ ] Ejecutar `npm run build` sin errores en el frontend
- [ ] Ejecutar `php artisan test` y corregir los tests que fallen
- [ ] Probar el flujo completo de extremo a extremo: login → inventario → movimiento → alerta → notificación Novu

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

## Lo que ya funciona y no hay que tocar

- Autenticación completa: login, registro, verificación email OTP, recuperación contraseña, OAuth Google/Apple
- Roles: administrador, profesor, consultor — asignación automática y cambio desde UI
- Artículos: CRUD completo con stock inicial, edición, desactivación
- Categorías: CRUD completo con eliminación protegida
- Ubicaciones: crear y listar
- Movimientos: crear con control de stock negativo, historial con filtros
- Alertas: listar, confirmar, resolver con filtros por tipo/severidad/estado
- Auditoría: triggers PostgreSQL con usuario real, detalle expandible de cambios
- Perfil: editar nombre, cambiar contraseña, historial de sesiones con geolocalización
- Skeletons de carga en todas las páginas
- Validación de formularios sin burbujas nativas del navegador
- Apache + PHP 8.3 sirviendo la API en puerto 8080
- BD PostgreSQL remota conectada
