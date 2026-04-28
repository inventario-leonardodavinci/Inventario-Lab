# Plan tecnico de implementacion

## Arquitectura

- Frontend SPA con React + TypeScript.
- Backend API REST con Laravel.
- Base de datos PostgreSQL en Insforge.
- Autenticacion gestionada por Insforge (Auth nativa).

## Modulos MVP

- Autenticacion y roles.
- Catalogo de items.
- Ubicaciones.
- Movimientos (entrada, salida, traslado).
- Historial y auditoria.

## Catalogos cerrados iniciales

### Categorias

- Medios de cultivo
- Fungibles
- Reactivos quimicos
- Inventariables

### Ubicaciones

- Armario alto 1..7
- Armario bajo 1..7
- Nevera 1
- Cajonera 1
- Cajonera 2
- Almacen

## Fases de trabajo

1. Modelo de datos y migraciones.
2. Endpoints base de API.
3. Importacion de Excel.
4. Pantallas frontend.
5. Pruebas y despliegue.

## Criterios tecnicos

- Cada movimiento debe generar trazabilidad.
- Validaciones de stock en backend.
- No se permite stock negativo por defecto.
- Todo cambio sensible se registra en auditoria.
- No duplicar autenticacion: usar `auth_user_id` de Insforge y perfiles en `app_users`.
- Soportar `expiration_date` en items que caduquen.
- Soportar `serial_number` para equipos/aparatos (incluyendo fungibles cuando aplique).

## Decisiones de arquitectura BD profesional (hibrido)

- Se conserva el nucleo transaccional de inventario (`items`, `stock_levels`, `movements`, `movement_lines`) para evitar ruptura del MVP.
- Se redisenan modulos criticos:
  - Mantenimiento: `maintenance_assets`, `maintenance_plans`, `maintenance_events`.
  - Alertas: `alert_rules`, `alert_events`, `alert_notifications`.
- Se normaliza proveedores con `suppliers` y referencia en `batches`.
- Se expande auditoria con `before_json` y `after_json` para trazabilidad de cambios.
- Entrega dual obligatoria:
  - Migraciones Laravel en backend.
  - SQL espejo versionado en `database/sql`.
