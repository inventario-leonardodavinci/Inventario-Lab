-- Ajuste de estructura para alinearse con el Excel de fungibles.
-- Columnas origen: Item, Material, Capacidad (ml), Numero, Armario, Observaciones.

ALTER TABLE items
  ADD COLUMN IF NOT EXISTS material_type VARCHAR(60),
  ADD COLUMN IF NOT EXISTS capacity_ml NUMERIC(10,2);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'items_name_material_capacity_category_key'
  ) THEN
    ALTER TABLE items
      ADD CONSTRAINT items_name_material_capacity_category_key
      UNIQUE (name, material_type, capacity_ml, category_id);
  END IF;
END $$;
