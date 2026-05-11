<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement(<<<'SQL'
                INSERT INTO roles (name, created_at, updated_at)
                VALUES
                    ('profesor',  NOW(), NOW()),
                    ('consultor', NOW(), NOW())
                ON CONFLICT (name) DO NOTHING
            SQL);
        }

        DB::statement(<<<'SQL'
            CREATE INDEX IF NOT EXISTS idx_usuario_roles_rol_id
            ON usuario_roles (rol_id)
        SQL);

        if (DB::getDriverName() === 'pgsql') {
            DB::statement(<<<'SQL'
                DO $$
                BEGIN
                    IF to_regclass('public.suppliers') IS NOT NULL THEN
                        COMMENT ON TABLE suppliers IS 'Tabla futura heredada: proveedores. Sin uso por API actual; no borrar sin diagnóstico de datos.';
                    END IF;

                    IF to_regclass('public.batches') IS NOT NULL THEN
                        COMMENT ON TABLE batches IS 'Tabla futura heredada: lotes. Sin uso por flujo actual de movimientos; no borrar sin diagnóstico de datos.';
                    END IF;

                    IF to_regclass('public.maintenance_plans') IS NOT NULL THEN
                        COMMENT ON TABLE maintenance_plans IS 'Tabla futura heredada: planes de mantenimiento. Sin modelo/controlador actual.';
                    END IF;

                    IF to_regclass('public.maintenance_events') IS NOT NULL THEN
                        COMMENT ON TABLE maintenance_events IS 'Tabla futura heredada: eventos de mantenimiento. Sin modelo/controlador actual.';
                    END IF;

                    IF to_regclass('public.alert_rules') IS NOT NULL THEN
                        COMMENT ON TABLE alert_rules IS 'Tabla futura heredada: reglas de alerta. El servicio actual genera alertas directamente.';
                    END IF;

                    IF to_regclass('public.alert_notifications') IS NOT NULL THEN
                        COMMENT ON TABLE alert_notifications IS 'Tabla futura heredada: notificaciones de alerta. Sin flujo persistente actual.';
                    END IF;
                END $$;
            SQL);
        }
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS idx_usuario_roles_rol_id');
    }
};
