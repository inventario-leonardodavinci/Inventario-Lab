-- Saneamiento no destructivo del esquema canónico en español.
-- No elimina tablas ni datos. Refuerza mínimos esperados por la aplicación actual.

BEGIN;

INSERT INTO roles (name, created_at, updated_at)
VALUES
  ('administrador', NOW(), NOW()),
  ('profesor', NOW(), NOW()),
  ('consultor', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_usuario_roles_rol_id
  ON usuario_roles (rol_id);

CREATE INDEX IF NOT EXISTS idx_registros_auditoria_created_at
  ON registros_auditoria (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_registros_auditoria_entidad_fecha
  ON registros_auditoria (entidad_tipo, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alertas_estado_generada_en
  ON alertas (estado, generada_en DESC);

ALTER TABLE movimientos
  DROP CONSTRAINT IF EXISTS movimientos_tipo_check;

ALTER TABLE movimientos
  ADD CONSTRAINT movimientos_tipo_check
  CHECK (tipo IN ('entrada', 'salida', 'traslado', 'ajuste'));

ALTER TABLE ubicaciones
  DROP CONSTRAINT IF EXISTS ubicaciones_tipo_check;

ALTER TABLE ubicaciones
  ADD CONSTRAINT ubicaciones_tipo_check
  CHECK (tipo IN ('armario', 'nevera', 'estanteria', 'cajon', 'vitrina', 'otro'));

ALTER TABLE historial_sesiones
  DROP CONSTRAINT IF EXISTS chk_historial_tipo_evento;

ALTER TABLE historial_sesiones
  ADD CONSTRAINT chk_historial_tipo_evento
  CHECK (tipo_evento IN ('login', 'logout', 'refresh', 'oauth'));

COMMIT;
