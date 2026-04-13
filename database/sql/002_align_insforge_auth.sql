-- Ajuste para usar Auth nativa de Insforge y evitar duplicar autenticacion.
-- Este script transforma una instalacion previa que usaba `users` locales.

CREATE TABLE IF NOT EXISTS app_users (
  id BIGSERIAL PRIMARY KEY,
  auth_user_id TEXT UNIQUE NOT NULL,
  display_name VARCHAR(120),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE movements DROP CONSTRAINT IF EXISTS movements_performed_by_fkey;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'movements'
      AND column_name = 'performed_by'
  ) THEN
    ALTER TABLE movements RENAME COLUMN performed_by TO app_user_id;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_mov_app_user ON movements(app_user_id);
ALTER TABLE movements
  DROP CONSTRAINT IF EXISTS movements_app_user_id_fkey;
ALTER TABLE movements
  ADD CONSTRAINT movements_app_user_id_fkey
  FOREIGN KEY (app_user_id) REFERENCES app_users(id);
DROP INDEX IF EXISTS idx_mov_performed_by;

ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_actor_user_id_fkey;
ALTER TABLE audit_logs
  ADD CONSTRAINT audit_logs_actor_user_id_fkey
  FOREIGN KEY (actor_user_id) REFERENCES app_users(id);

DROP TABLE IF EXISTS user_roles;
CREATE TABLE IF NOT EXISTS app_user_roles (
  app_user_id BIGINT NOT NULL REFERENCES app_users(id),
  role_id BIGINT NOT NULL REFERENCES roles(id),
  PRIMARY KEY (app_user_id, role_id)
);

DROP TABLE IF EXISTS users;
