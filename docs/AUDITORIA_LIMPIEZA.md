# Auditoría y Limpieza - Inventario Salud Ambiental

Última actualización: mayo 2026

---

## COMPLETADO

### Sistema de Alertas — eliminado por completo
- Backend: `AlertaController.php`, `AlertaService.php`, `VerificarStockBajo.php` (job), rutas `/alertas`
- Frontend: `alertasApi.ts`, hooks `useAlertas/useResolverAlerta/useConfirmarAlerta`, query key `alertas`
- Tipos: `TipoAlerta`, `Severidad`, `EstadoAlerta`, `Alerta`, `FiltrosAlerta`
- Constantes: `ESTADOS_ALERTA`, `TIPOS_ALERTA`, `SEVERIDADES_ALERTA`
- Formatters: `formatearTipoAlerta`, `formatearSeveridad`, `formatearEstadoAlerta`
- Tests huérfanos: `queries.test.tsx`
- Tabla `alertas` en BD queda como registro histórico sin interfaz

### Hooks deprecados — eliminados
- `useInventario` → reemplazado por `useArticulos()`
- `queryKeys.alertas`, `queryKeys.notificaciones` → eliminados

### panelUtils.ts — eliminado
- Funciones integradas directamente en `usePanelData.ts`

### Tipos TypeScript — limpiados
- `RolLegado` → eliminado (nunca se usó)

### Historial de sesiones — restaurado y corregido
- Backend: `NotificacionController.php` con rutas `/perfil/historial-sesiones`
- Frontend: `notificacionesApi.ts` con `enviarEventoLogin`, hooks `useHistorialSesiones`/`useEliminarSesion`
- Se llama en login, registro, verificarEmail y OAuth en `ContextoAutenticacion.tsx`

---

## PENDIENTE

### Frontend
- [ ] Auditar componentes huérfanos en `src/components` (archivos que no se importan en ningún lugar)
- [ ] Auditar páginas sin ruta en `App.tsx`
- [ ] Dependencias npm no usadas — ejecutar `depcheck`

### Backend
- [ ] Verificar si rutas `/api/v1/informes` tienen uso real en el frontend
- [ ] Revisar relaciones Eloquent no usadas en modelos (posibles N+1 silenciosos)

### Base de datos
- [ ] Tabla `alertas` — sin interfaz, considerar si se mantiene o se limpia con migración

---

## Notas de decisiones

- **`notificacionesApi.ts`** mantenido: el historial de sesiones es útil para admins
- **`estado_stock`** en artículos es la única fuente de verdad para stock bajo (no alertas)
- Tablas Spatie (`spatie_roles`, etc.) existen como infraestructura inactiva, no mezclar con el flujo de `roles`/`usuario_roles`
