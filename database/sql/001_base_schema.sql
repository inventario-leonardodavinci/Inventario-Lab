-- Esquema base compatible con Insforge (PostgreSQL)

CREATE TABLE IF NOT EXISTS roles (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insforge ya gestiona autenticacion.
-- Esta tabla solo guarda perfil de aplicacion vinculado al usuario autenticado de Insforge.
CREATE TABLE IF NOT EXISTS app_users (
  id BIGSERIAL PRIMARY KEY,
  auth_user_id TEXT UNIQUE NOT NULL,
  display_name VARCHAR(120),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_user_roles (
  app_user_id BIGINT NOT NULL REFERENCES app_users(id),
  role_id BIGINT NOT NULL REFERENCES roles(id),
  PRIMARY KEY (app_user_id, role_id)
);

CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS locations (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS items (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(100) UNIQUE,
  name VARCHAR(180) NOT NULL,
  category_id BIGINT NOT NULL REFERENCES categories(id),
  unit VARCHAR(40),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_category ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);

CREATE TABLE IF NOT EXISTS batches (
  id BIGSERIAL PRIMARY KEY,
  item_id BIGINT NOT NULL REFERENCES items(id),
  lot_number VARCHAR(100),
  expiration_date DATE,
  supplier VARCHAR(150),
  unit_cost NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_batches_item ON batches(item_id);
CREATE INDEX IF NOT EXISTS idx_batches_expiration ON batches(expiration_date);

CREATE TABLE IF NOT EXISTS stock_levels (
  id BIGSERIAL PRIMARY KEY,
  item_id BIGINT NOT NULL REFERENCES items(id),
  location_id BIGINT NOT NULL REFERENCES locations(id),
  quantity NUMERIC(12,2) NOT NULL DEFAULT 0,
  min_quantity NUMERIC(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(item_id, location_id)
);

CREATE INDEX IF NOT EXISTS idx_stock_item ON stock_levels(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_location ON stock_levels(location_id);

CREATE TABLE IF NOT EXISTS movements (
  id BIGSERIAL PRIMARY KEY,
  movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('entry', 'exit', 'transfer', 'adjustment')),
  reason VARCHAR(255),
  source_location_id BIGINT REFERENCES locations(id),
  target_location_id BIGINT REFERENCES locations(id),
  app_user_id BIGINT NOT NULL REFERENCES app_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mov_type_date ON movements(movement_type, created_at);
CREATE INDEX IF NOT EXISTS idx_mov_app_user ON movements(app_user_id);

CREATE TABLE IF NOT EXISTS movement_lines (
  id BIGSERIAL PRIMARY KEY,
  movement_id BIGINT NOT NULL REFERENCES movements(id),
  item_id BIGINT NOT NULL REFERENCES items(id),
  batch_id BIGINT REFERENCES batches(id),
  quantity NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movl_movement ON movement_lines(movement_id);
CREATE INDEX IF NOT EXISTS idx_movl_item ON movement_lines(item_id);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_user_id BIGINT REFERENCES app_users(id),
  event_type VARCHAR(80) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id BIGINT,
  payload_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_logs(created_at);

INSERT INTO roles (name) VALUES
('admin'),
('tecnico'),
('consulta')
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name) VALUES
('Medios de cultivo'),
('Fungibles'),
('Reactivos quimicos'),
('Inventariables')
ON CONFLICT (name) DO NOTHING;

INSERT INTO locations (name) VALUES
('Armario alto 1'),
('Armario alto 2'),
('Armario alto 3'),
('Armario alto 4'),
('Armario alto 5'),
('Armario alto 6'),
('Armario alto 7'),
('Armario bajo 1'),
('Armario bajo 2'),
('Armario bajo 3'),
('Armario bajo 4'),
('Armario bajo 5'),
('Armario bajo 6'),
('Armario bajo 7'),
('Nevera 1'),
('Cajonera 1'),
('Cajonera 2'),
('Almacen')
ON CONFLICT (name) DO NOTHING;
