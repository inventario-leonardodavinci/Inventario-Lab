# Operacion de BD por MCP y validacion

## Conexion MCP de PostgreSQL

Se agrego servidor MCP `postgres` en `.cursor/mcp.json` usando `@modelcontextprotocol/server-postgres` via `npx`.

Variables usadas:
- `DB_HOST`
- `DB_PORT`
- `DB_DATABASE`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_SSLMODE`

## Flujo operativo estandar

1. Configurar variables de entorno de PostgreSQL.
2. Ejecutar migraciones Laravel en backend.
3. Aplicar SQL espejo versionado en `database/sql` cuando corresponda.
4. Ejecutar seeders idempotentes.
5. Validar integridad y casos funcionales.

## Orden recomendado de aplicacion SQL

1. `001_base_schema.sql`
2. `005_data_integrity_hardening.sql`
3. `006_hybrid_maintenance_alerts.sql`
4. `007_security_and_audit_pro.sql`

## Checklist tecnico post-migracion

- [ ] Todas las FKs creadas sin errores.
- [ ] Indices de consulta activos (`items`, `stock_levels`, `movements`, `alert_events`).
- [ ] Checks de no-negatividad activos en stock y cantidades.
- [ ] Triggers `touch_updated_at` activos en tablas con `updated_at`.
- [ ] Triggers de auditoria activos en tablas criticas.
- [ ] Seeder de catalogos aplicado sin duplicados.

## Checklist funcional minimo

- [ ] Alta de item con categoria y ubicacion inicial.
- [ ] Movimiento de entrada incrementa stock.
- [ ] Movimiento de salida no permite stock negativo.
- [ ] Traslado entre ubicaciones conserva cantidad total.
- [ ] Evento de mantenimiento cambia estado del activo.
- [ ] Alerta de stock minimo se genera y queda en estado `open`.
- [ ] Resolucion de alerta registra usuario y fecha.
