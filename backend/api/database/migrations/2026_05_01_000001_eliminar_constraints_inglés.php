<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Elimina los constraints CHECK en inglés que quedaron tras la migración de reestructuración.
 * Estos constraints duplicados bloquean la inserción de valores en español.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Eliminar constraint viejo de movimientos si existe
        DB::statement("
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM pg_constraint
                    WHERE conname = 'movements_type_chk'
                    AND conrelid = 'movimientos'::regclass
                ) THEN
                    ALTER TABLE movimientos DROP CONSTRAINT movements_type_chk;
                END IF;
            END
            $$;
        ");

        // Eliminar constraints viejos de alertas si existen
        $constraintsAlertas = ['alert_events_type_chk', 'alert_events_severity_chk', 'alert_events_status_chk'];
        foreach ($constraintsAlertas as $constraint) {
            DB::statement("
                DO \$\$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM pg_constraint
                        WHERE conname = '{$constraint}'
                        AND conrelid = 'alertas'::regclass
                    ) THEN
                        ALTER TABLE alertas DROP CONSTRAINT {$constraint};
                    END IF;
                END
                \$\$;
            ");
        }

        // Eliminar constraints viejos de activos_mantenimiento si existen
        DB::statement("
            DO \$\$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM pg_constraint
                    WHERE conname = 'maintenance_assets_status_chk'
                    AND conrelid = 'activos_mantenimiento'::regclass
                ) THEN
                    ALTER TABLE activos_mantenimiento DROP CONSTRAINT maintenance_assets_status_chk;
                END IF;
            END
            \$\$;
        ");

        // Eliminar constraints viejos de ubicaciones si existen
        DB::statement("
            DO \$\$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM pg_constraint
                    WHERE conname = 'locations_type_chk'
                    AND conrelid = 'ubicaciones'::regclass
                ) THEN
                    ALTER TABLE ubicaciones DROP CONSTRAINT locations_type_chk;
                END IF;
            END
            \$\$;
        ");
    }

    public function down(): void
    {
        // No restauramos los constraints viejos en inglés
    }
};
