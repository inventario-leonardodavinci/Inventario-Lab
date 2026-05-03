-- Seguridad y auditoria profesional para modulos hibridos.

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS before_json JSONB,
  ADD COLUMN IF NOT EXISTS after_json JSONB,
  ADD COLUMN IF NOT EXISTS ip_address INET,
  ADD COLUMN IF NOT EXISTS user_agent TEXT;

CREATE INDEX IF NOT EXISTS idx_audit_actor_date ON audit_logs(actor_user_id, created_at);

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_suppliers_touch_updated_at ON suppliers;
CREATE TRIGGER trg_suppliers_touch_updated_at
BEFORE UPDATE ON suppliers
FOR EACH ROW
EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_maintenance_assets_touch_updated_at ON maintenance_assets;
CREATE TRIGGER trg_maintenance_assets_touch_updated_at
BEFORE UPDATE ON maintenance_assets
FOR EACH ROW
EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_maintenance_plans_touch_updated_at ON maintenance_plans;
CREATE TRIGGER trg_maintenance_plans_touch_updated_at
BEFORE UPDATE ON maintenance_plans
FOR EACH ROW
EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_maintenance_events_touch_updated_at ON maintenance_events;
CREATE TRIGGER trg_maintenance_events_touch_updated_at
BEFORE UPDATE ON maintenance_events
FOR EACH ROW
EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_alert_rules_touch_updated_at ON alert_rules;
CREATE TRIGGER trg_alert_rules_touch_updated_at
BEFORE UPDATE ON alert_rules
FOR EACH ROW
EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_alert_events_touch_updated_at ON alert_events;
CREATE TRIGGER trg_alert_events_touch_updated_at
BEFORE UPDATE ON alert_events
FOR EACH ROW
EXECUTE FUNCTION touch_updated_at();

CREATE OR REPLACE FUNCTION fn_audit_row_change()
RETURNS TRIGGER AS $$
DECLARE
  action_type TEXT;
  row_id BIGINT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_type := TG_TABLE_NAME || '.insert';
    row_id := NEW.id;
    INSERT INTO audit_logs (
      event_type,
      entity_type,
      entity_id,
      after_json,
      payload_json
    )
    VALUES (
      action_type,
      TG_TABLE_NAME,
      row_id,
      to_jsonb(NEW),
      jsonb_build_object('source', 'trigger')
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := TG_TABLE_NAME || '.update';
    row_id := NEW.id;
    INSERT INTO audit_logs (
      event_type,
      entity_type,
      entity_id,
      before_json,
      after_json,
      payload_json
    )
    VALUES (
      action_type,
      TG_TABLE_NAME,
      row_id,
      to_jsonb(OLD),
      to_jsonb(NEW),
      jsonb_build_object('source', 'trigger')
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    action_type := TG_TABLE_NAME || '.delete';
    row_id := OLD.id;
    INSERT INTO audit_logs (
      event_type,
      entity_type,
      entity_id,
      before_json,
      payload_json
    )
    VALUES (
      action_type,
      TG_TABLE_NAME,
      row_id,
      to_jsonb(OLD),
      jsonb_build_object('source', 'trigger')
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stock_levels_audit_change ON stock_levels;
CREATE TRIGGER trg_stock_levels_audit_change
AFTER INSERT OR UPDATE OR DELETE ON stock_levels
FOR EACH ROW EXECUTE FUNCTION fn_audit_row_change();

DROP TRIGGER IF EXISTS trg_movements_audit_change ON movements;
CREATE TRIGGER trg_movements_audit_change
AFTER INSERT OR UPDATE OR DELETE ON movements
FOR EACH ROW EXECUTE FUNCTION fn_audit_row_change();

DROP TRIGGER IF EXISTS trg_movement_lines_audit_change ON movement_lines;
CREATE TRIGGER trg_movement_lines_audit_change
AFTER INSERT OR UPDATE OR DELETE ON movement_lines
FOR EACH ROW EXECUTE FUNCTION fn_audit_row_change();

DROP TRIGGER IF EXISTS trg_maintenance_events_audit_change ON maintenance_events;
CREATE TRIGGER trg_maintenance_events_audit_change
AFTER INSERT OR UPDATE OR DELETE ON maintenance_events
FOR EACH ROW EXECUTE FUNCTION fn_audit_row_change();

DROP TRIGGER IF EXISTS trg_alert_events_audit_change ON alert_events;
CREATE TRIGGER trg_alert_events_audit_change
AFTER INSERT OR UPDATE OR DELETE ON alert_events
FOR EACH ROW EXECUTE FUNCTION fn_audit_row_change();
