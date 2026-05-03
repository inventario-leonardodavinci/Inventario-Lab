-- Permite caducidad por item y numero de serie para casos inventariables/fungibles.
-- Ambos campos son opcionales para mantener compatibilidad con stock masivo.

ALTER TABLE items
  ADD COLUMN IF NOT EXISTS serial_number VARCHAR(120),
  ADD COLUMN IF NOT EXISTS expiration_date DATE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_items_serial_number
  ON items(serial_number)
  WHERE serial_number IS NOT NULL;
