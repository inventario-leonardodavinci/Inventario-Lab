# Inventario de archivos para españolización

## Criterio de exclusión

Se excluyen por política:
- Código de terceros o base framework (`vendor`, plantillas base Laravel/Vite/shadcn).
- Contratos técnicos externos (endpoints, claves de payload, tablas/columnas SQL, variables de entorno, claves de configuración).
- Carpetas internas de herramienta (`.cursor`, `.agents`, `.claude`, `.kiro`, `.trae`, `.insforge`).

## Riesgo bajo (traducir primero)

- Documentación en `docs/` y `README.md`.
- Textos visibles de interfaz en `FrontEnd/app/src/pages/`.
- Textos de layout en `FrontEnd/app/src/components/layout/`.
- Scripts operativos y textos de checklist:
  - `setup-dev.ps1`
  - `docs/09-release-hardening-checklist.md`
  - `docs/10-novu-integration.md`
  - `docs/11-matriz-endpoints-pantallas.md`
  - `docs/12-convencion-idioma-es.md`

## Riesgo medio (traducir por módulos)

- Código propio backend:
  - `BackEnd/api/app/Http/`
  - `BackEnd/api/app/Services/`
  - `BackEnd/api/app/Models/` (solo los modelos propios añadidos)
- Código propio frontend:
  - `FrontEnd/app/src/services/`
  - `FrontEnd/app/src/context/`
  - `FrontEnd/app/src/components/auth/`

## Riesgo alto (renombrado con imports)

- Renombrado de archivos propios en inglés (sin tocar terceros), por ejemplo:
  - `FrontEnd/app/src/pages/Login.tsx`
  - `FrontEnd/app/src/pages/Maintenance.tsx`
  - `FrontEnd/app/src/components/layout/NotificationCenter.tsx`
  - `FrontEnd/app/src/components/auth/ProtectedRoute.tsx`
  - `FrontEnd/app/src/services/movementApi.ts`
  - `FrontEnd/app/src/services/inventoryApi.ts`
  - `FrontEnd/app/src/services/notificationApi.ts`
  - `FrontEnd/app/src/services/apiClient.ts`

## Archivos excluidos explícitamente (base/terceros)

- `BackEnd/api/resources/views/welcome.blade.php`
- `BackEnd/api/README.md`
- `FrontEnd/app/README.md`
- Componentes UI base en `FrontEnd/app/src/components/ui/`
- Plantilla `BackEnd/api/app/Models/User.php` y `database/factories/UserFactory.php`
