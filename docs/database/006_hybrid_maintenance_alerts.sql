-- Modulos hibridos profesionales: mantenimiento y alertas.
-- Extiende esquema base sin romper tablas nucleo existentes.

CREATE TABLE IF NOT EXISTS suppliers (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(180) NOT NULL UNIQUE,
  tax_id VARCHAR(80),
  contact_name VARCHAR(120),
  contact_email VARCHAR(180),
  contact_phone VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_suppliers_tax_id
  ON suppliers(tax_id)
  WHERE tax_id IS NOT NULL;

ALTER TABLE batches
  ADD COLUMN IF NOT EXISTS supplier_id BIGINT REFERENCES suppliers(id);

CREATE INDEX IF NOT EXISTS idx_batches_supplier_id ON batches(supplier_id);

ALTER TABLE batches
  DROP COLUMN IF EXISTS supplier;

CREATE TABLE IF NOT EXISTS maintenance_assets (
  id BIGSERIAL PRIMARY KEY,
  item_id BIGINT REFERENCES items(id),
  asset_code VARCHAR(100) NOT NULL UNIQUE,
  serial_number VARCHAR(120),
  status VARCHAR(30) NOT NULL DEFAULT 'operational'
    CHECK (status IN ('operational', 'maintenance_due', 'in_maintenance', 'out_of_service', 'retired')),
  manufacturer VARCHAR(120),
  model VARCHAR(120),
  purchase_date DATE,
  warranty_end_date DATE,
  last_service_date DATE,
  next_service_due_date DATE,
  current_location_id BIGINT REFERENCES locations(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_maintenance_assets_serial_number
  ON maintenance_assets(serial_number)
  WHERE serial_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_maintenance_assets_item_id ON maintenance_assets(item_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_assets_status ON maintenance_assets(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_assets_next_due ON maintenance_assets(next_service_due_date);

CREATE TABLE IF NOT EXISTS maintenance_plans (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  asset_id BIGINT NOT NULL REFERENCES maintenance_assets(id) ON DELETE CASCADE,
  periodicity_days INTEGER NOT NULL CHECK (periodicity_days > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  checklist_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (asset_id, name)
);

CREATE INDEX IF NOT EXISTS idx_maintenance_plans_asset_id ON maintenance_plans(asset_id);

CREATE TABLE IF NOT EXISTS maintenance_events (
  id BIGSERIAL PRIMARY KEY,
  asset_id BIGINT NOT NULL REFERENCES maintenance_assets(id) ON DELETE CASCADE,
  maintenance_plan_id BIGINT REFERENCES maintenance_plans(id) ON DELETE SET NULL,
  event_type VARCHAR(30) NOT NULL
    CHECK (event_type IN ('preventive', 'corrective', 'inspection', 'calibration')),
  status VARCHAR(30) NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  performed_by_user_id BIGINT REFERENCES app_users(id),
  vendor_supplier_id BIGINT REFERENCES suppliers(id),
  findings TEXT,
  actions_taken TEXT,
  downtime_minutes INTEGER CHECK (downtime_minutes IS NULL OR downtime_minutes >= 0),
  cost_amount NUMERIC(12,2) CHECK (cost_amount IS NULL OR cost_amount >= 0),
  attachments_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at)
);

CREATE INDEX IF NOT EXISTS idx_maintenance_events_asset_id ON maintenance_events(asset_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_events_status ON maintenance_events(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_events_type ON maintenance_events(event_type);

CREATE TABLE IF NOT EXISTS alert_rules (
  id BIGSERIAL PRIMARY KEY,
  rule_code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  alert_type VARCHAR(30) NOT NULL
    CHECK (alert_type IN ('low_stock', 'expiration', 'maintenance_due', 'stock_inactivity')),
  severity VARCHAR(20) NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  scope_type VARCHAR(20) NOT NULL
    CHECK (scope_type IN ('item', 'location', 'asset', 'global')),
  item_id BIGINT REFERENCES items(id),
  location_id BIGINT REFERENCES locations(id),
  asset_id BIGINT REFERENCES maintenance_assets(id),
  threshold_numeric NUMERIC(12,2),
  threshold_days INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notification_channels_json JSONB,
  created_by_user_id BIGINT REFERENCES app_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (threshold_days IS NULL OR threshold_days >= 0)
);

CREATE INDEX IF NOT EXISTS idx_alert_rules_active ON alert_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_alert_rules_type_scope ON alert_rules(alert_type, scope_type);

CREATE TABLE IF NOT EXISTS alert_events (
  id BIGSERIAL PRIMARY KEY,
  alert_rule_id BIGINT REFERENCES alert_rules(id) ON DELETE SET NULL,
  alert_type VARCHAR(30) NOT NULL
    CHECK (alert_type IN ('low_stock', 'expiration', 'maintenance_due', 'stock_inactivity')),
  severity VARCHAR(20) NOT NULL
    CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'acknowledged', 'resolved', 'ignored')),
  item_id BIGINT REFERENCES items(id),
  location_id BIGINT REFERENCES locations(id),
  asset_id BIGINT REFERENCES maintenance_assets(id),
  trigger_payload_json JSONB,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by_user_id BIGINT REFERENCES app_users(id),
  resolved_at TIMESTAMPTZ,
  resolved_by_user_id BIGINT REFERENCES app_users(id),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (resolved_at IS NULL OR resolved_at >= triggered_at)
);

CREATE INDEX IF NOT EXISTS idx_alert_events_status ON alert_events(status);
CREATE INDEX IF NOT EXISTS idx_alert_events_triggered_at ON alert_events(triggered_at);
CREATE INDEX IF NOT EXISTS idx_alert_events_item_location ON alert_events(item_id, location_id);

CREATE TABLE IF NOT EXISTS alert_notifications (
  id BIGSERIAL PRIMARY KEY,
  alert_event_id BIGINT NOT NULL REFERENCES alert_events(id) ON DELETE CASCADE,
  channel VARCHAR(30) NOT NULL CHECK (channel IN ('in_app', 'email', 'webhook')),
  recipient VARCHAR(180),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed')),
  provider_response_json JSONB,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_notifications_event_id ON alert_notifications(alert_event_id);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_status ON alert_notifications(status);
