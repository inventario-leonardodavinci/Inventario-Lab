# Auditoría y Limpieza - Inventario Salud Ambiental

Última actualización: mayo 2026

---

## COMPLETADO

### Sistema de Alertas — eliminado por completo
- Backend: `AlertaController.php`, `AlertaService.php`, `VerificarStockBajo.php` (job), rutas `/alertas`
- Frontend: `alertasApi.ts`, hooks, query keys, tipos, constantes, formatters, tests huérfanos

### Código muerto — eliminado
- `panelUtils.ts` → lógica integrada en `usePanelData.ts`
- `useInventario` hook → reemplazado por `useArticulos()`
- `RolLegado` tipo → nunca se usó
- Páginas huérfanas: `Informes.tsx`, `Inventario.tsx`, `Movimientos.tsx` (sin ruta activa)
- `InventarioController.php` → lógica duplicada de `ArticuloController`
- Rutas legacy `/inventario` (GET/POST) eliminadas
- Rutas duplicadas de historial en `NotificacionController` (gestionadas por `PerfilController`)

### Dependencias npm — limpiadas
- Eliminadas: `next-themes`, `react-hook-form`, `@hookform/resolvers`, `@vitest/coverage-v8`
- Mantenidas (falsos positivos depcheck via CSS imports): `@fontsource-variable/geist`, `tw-animate-css`, `shadcn`, `tailwindcss`

### Historial de sesiones — restaurado y corregido
- Backend: rutas en `PerfilController` (GET `/perfil/historial-sesiones`, DELETE `/perfil/sesiones/{id}`)
- Backend: `NotificacionController` solo conserva POST `/notificaciones/evento-login`
- Frontend: hooks `useHistorialSesiones`/`useEliminarSesion`, llamados en cada login

### Relaciones Eloquent — auditadas, todas en uso
- `Categoria::articulos()` → usado en `withCount` y `exists()` en `CategoriaController`
- `UsuarioApp::movimientos()` → usado via `with('usuario')` en `MovimientoController`
- Todas las relaciones `BelongsTo`/`HasMany` tienen uso activo con eager loading correcto

---

## PENDIENTE

### Base de datos
- [ ] Tabla `alertas` — sin interfaz, decidir si se limpia con migración o se deja como histórico

---

## Notas de decisiones

- **`estado_stock`** en artículos es la única fuente de verdad para stock bajo (no alertas)
- Tablas Spatie (`spatie_roles`, etc.) existen como infraestructura inactiva, no mezclar con el flujo de `roles`/`usuario_roles`
- Tabla `alertas` queda como registro histórico hasta decisión explícita
