-- Endurece reglas de integridad para evitar datos inconsistentes.
-- Mantiene compatibilidad con scripts anteriores usando IF NOT EXISTS donde aplica.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'stock_levels_quantity_non_negative_chk'
  ) THEN
    ALTER TABLE stock_levels
      ADD CONSTRAINT stock_levels_quantity_non_negative_chk
      CHECK (quantity >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'movement_lines_quantity_positive_chk'
  ) THEN
    ALTER TABLE movement_lines
      ADD CONSTRAINT movement_lines_quantity_positive_chk
      CHECK (quantity > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'movements_transfer_consistency_chk'
  ) THEN
    ALTER TABLE movements
      ADD CONSTRAINT movements_transfer_consistency_chk
      CHECK (
        (
          movement_type = 'transfer'
          AND source_location_id IS NOT NULL
          AND target_location_id IS NOT NULL
          AND source_location_id <> target_location_id
        )
        OR
        (
          movement_type <> 'transfer'
          AND (
            source_location_id IS NULL
            OR target_location_id IS NULL
            OR source_location_id <> target_location_id
          )
        )
      );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_roles_touch_updated_at ON roles;
CREATE TRIGGER trg_roles_touch_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW
EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_app_users_touch_updated_at ON app_users;
CREATE TRIGGER trg_app_users_touch_updated_at
BEFORE UPDATE ON app_users
FOR EACH ROW
EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_categories_touch_updated_at ON categories;
CREATE TRIGGER trg_categories_touch_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_locations_touch_updated_at ON locations;
CREATE TRIGGER trg_locations_touch_updated_at
BEFORE UPDATE ON locations
FOR EACH ROW
EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_items_touch_updated_at ON items;
CREATE TRIGGER trg_items_touch_updated_at
BEFORE UPDATE ON items
FOR EACH ROW
EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_batches_touch_updated_at ON batches;
CREATE TRIGGER trg_batches_touch_updated_at
BEFORE UPDATE ON batches
FOR EACH ROW
EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_stock_levels_touch_updated_at ON stock_levels;
CREATE TRIGGER trg_stock_levels_touch_updated_at
BEFORE UPDATE ON stock_levels
FOR EACH ROW
EXECUTE FUNCTION touch_updated_at();
