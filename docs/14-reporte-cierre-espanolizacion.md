# Reporte de cierre de españolización

## Resumen

Se ejecutó la españolización por fases con inventario inicial, traducción de bajo riesgo, traducción de código propio y renombrado de archivos clave en frontend.

## Archivos renombrados principales (frontend propio)

- `src/pages/Dashboard.tsx` -> `src/pages/PanelPrincipal.tsx`
- `src/pages/Inventory.tsx` -> `src/pages/Inventario.tsx`
- `src/pages/Movements.tsx` -> `src/pages/Movimientos.tsx`
- `src/pages/Reports.tsx` -> `src/pages/Informes.tsx`
- `src/pages/Login.tsx` -> `src/pages/InicioSesion.tsx`
- `src/pages/Maintenance.tsx` -> `src/pages/Mantenimiento.tsx`
- `src/components/layout/NotificationCenter.tsx` -> `src/components/layout/CentroNotificaciones.tsx`
- `src/components/auth/ProtectedRoute.tsx` -> `src/components/auth/RutaProtegida.tsx`
- `src/services/apiClient.ts` -> `src/services/clienteApi.ts`
- `src/services/inventoryApi.ts` -> `src/services/inventarioApi.ts`
- `src/services/movementApi.ts` -> `src/services/movimientosApi.ts`
- `src/services/notificationApi.ts` -> `src/services/notificacionesApi.ts`
- `src/context/AuthContext.tsx` -> `src/context/ContextoAutenticacion.tsx`
- `src/components/layout/AppShell.tsx` -> `src/components/layout/ContenedorAplicacion.tsx`
- `src/components/layout/app-sidebar.tsx` -> `src/components/layout/BarraLateralAplicacion.tsx`

## Documentación actualizada

- `docs/08-openapi-v1.yaml`
- `docs/09-release-hardening-checklist.md`
- `docs/10-novu-integration.md`
- `docs/11-matriz-endpoints-pantallas.md`
- `docs/12-convencion-idioma-es.md`
- `docs/13-inventario-espanolizacion.md`
- `README.md`

## Exclusiones aplicadas

- Código de terceros/base framework:
  - `FrontEnd/app/src/components/ui/*`
  - `BackEnd/api/resources/views/welcome.blade.php`
  - plantillas base Laravel/Vite.
- Contratos técnicos preservados:
  - rutas API,
  - claves de payload,
  - nombres de tablas/columnas SQL,
  - variables de entorno y claves de configuración.

## Validaciones ejecutadas

- `npm run lint` en frontend: correcto.
- `npm run build` en frontend: correcto.
- `php -l` en backend modificado: correcto.
- Revisión de linter: sin errores nuevos reportados.

## Incidencias y decisiones

- Se detectó coexistencia de rutas con diferente capitalización (`FrontEnd`/`Frontend`, `BackEnd`/`Backend`) en el árbol de trabajo.
- Para no bloquear el avance, se priorizó mantener imports funcionales en el código actual y validar compilación.
- Se recomienda unificar definitivamente mayúsculas/minúsculas de directorios en una tarea específica posterior.
