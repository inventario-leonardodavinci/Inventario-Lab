-- Diagnóstico seguro de tablas duplicadas, históricas y futuras.
-- Este script no modifica datos.

DROP TABLE IF EXISTS tmp_diagnostico_tablas;

CREATE TEMP TABLE tmp_diagnostico_tablas (
  nombre TEXT PRIMARY KEY,
  categoria TEXT NOT NULL,
  reemplazo TEXT,
  estado TEXT NOT NULL DEFAULT 'no_existe',
  registros BIGINT
) ON COMMIT DROP;

INSERT INTO tmp_diagnostico_tablas (nombre, categoria, reemplazo)
VALUES
  ('app_users', 'historica', 'usuarios_app'),
  ('app_user_roles', 'historica', 'usuario_roles'),
  ('categories', 'historica', 'categorias'),
  ('locations', 'historica', 'ubicaciones'),
  ('items', 'historica', 'articulos'),
  ('stock_levels', 'historica', 'niveles_stock'),
  ('movements', 'historica', 'movimientos'),
  ('movement_lines', 'historica', 'lineas_movimiento'),
  ('maintenance_assets', 'historica', 'activos_mantenimiento'),
  ('alert_events', 'historica', 'alertas'),
  ('audit_logs', 'historica', 'registros_auditoria'),
  ('suppliers', 'futura_no_usada', NULL),
  ('batches', 'futura_no_usada', NULL),
  ('maintenance_plans', 'futura_no_usada', NULL),
  ('maintenance_events', 'futura_no_usada', NULL),
  ('alert_rules', 'futura_no_usada', NULL),
  ('alert_notifications', 'futura_no_usada', NULL),
  ('spatie_roles', 'spatie_no_activo', 'roles'),
  ('spatie_permissions', 'spatie_no_activo', NULL),
  ('spatie_model_has_roles', 'spatie_no_activo', 'usuario_roles'),
  ('spatie_model_has_permissions', 'spatie_no_activo', NULL),
  ('spatie_role_has_permissions', 'spatie_no_activo', NULL);

DO $$
DECLARE
  fila RECORD;
  total BIGINT;
BEGIN
  FOR fila IN SELECT nombre FROM tmp_diagnostico_tablas LOOP
    IF to_regclass(format('public.%I', fila.nombre)) IS NOT NULL THEN
      EXECUTE format('SELECT COUNT(*) FROM public.%I', fila.nombre) INTO total;
      UPDATE tmp_diagnostico_tablas
      SET estado = 'existe',
          registros = total
      WHERE nombre = fila.nombre;
    END IF;
  END LOOP;
END $$;

SELECT
  nombre,
  categoria,
  reemplazo,
  estado,
  registros,
  CASE
    WHEN estado = 'no_existe' THEN 'correcto_si_ya_se_migro_o_no_aplica'
    WHEN categoria = 'historica' AND COALESCE(registros, 0) = 0 THEN 'candidata_a_retirar_con_backup'
    WHEN categoria = 'historica' AND COALESCE(registros, 0) > 0 THEN 'requiere_migracion_de_datos'
    WHEN categoria = 'futura_no_usada' AND COALESCE(registros, 0) = 0 THEN 'posible_retirada_de_instalaciones_nuevas'
    WHEN categoria = 'futura_no_usada' AND COALESCE(registros, 0) > 0 THEN 'conservar_hasta_decision_funcional'
    WHEN categoria = 'spatie_no_activo' THEN 'no_usar_como_fuente_de_verdad_actual'
    ELSE 'revisar'
  END AS recomendacion
FROM tmp_diagnostico_tablas
ORDER BY categoria, nombre;
