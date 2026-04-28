# Matriz de cambios BD (enfoque hibrido)

## Alcance

Este documento define que partes del esquema actual se mantienen y que partes se redisenan para una base de datos profesional orientada a inventario, trazabilidad, mantenimiento y alertas.

## Mantener sin ruptura

- `roles`: catalogo base de permisos.
- `app_users`: perfil de aplicacion enlazado con `auth_user_id` de Insforge.
- `app_user_roles`: asignacion N:M usuario-rol.
- `categories`: catalogo de categorias.
- `locations`: catalogo de ubicaciones.
- `items`: entidad principal de inventario.
- `batches`: lotes por item.
- `stock_levels`: stock por item y ubicacion.
- `movements` y `movement_lines`: trazabilidad de operaciones.
- `audit_logs`: bitacora de auditoria.

## Redisenar / extender

- Proveedores:
  - Crear `suppliers` y referenciar desde `batches`.
  - Evitar duplicidad en texto libre `supplier`.
- Mantenimiento:
  - Crear `maintenance_assets`, `maintenance_plans`, `maintenance_events`.
  - Separar activo fisico de item abstracto cuando aplique.
- Alertas:
  - Crear `alert_rules`, `alert_events`, `alert_notifications`.
  - Soportar reglas de stock minimo, caducidad e inactividad.
- Seguridad y auditoria:
  - Extender `audit_logs` con `before_json`, `after_json`, `ip_address`, `user_agent`.
  - Incorporar funcion trigger para auditoria de cambios en tablas criticas.

## Criterios de compatibilidad

- No eliminar tablas nucleo existentes.
- Cambios destructivos evitados; usar `ALTER TABLE ... ADD COLUMN` y nuevas tablas.
- Seeders idempotentes para datos maestros.
- Convencion dual de entrega:
  - SQL versionado en `database/sql`.
  - Migraciones Laravel equivalentes en `BackEnd/api/database/migrations`.
