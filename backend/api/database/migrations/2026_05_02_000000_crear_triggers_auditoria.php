<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Tablas sobre las que se crean los triggers de auditoría.
     */
    private array $tablas = [
        'articulos',
        'ubicaciones',
        'categorias',
        'movimientos',
        'alertas',
        'usuarios_app',
    ];

    public function up(): void
    {
        // Crear la función PL/pgSQL que inserta en registros_auditoria
        DB::statement(<<<'SQL'
            CREATE OR REPLACE FUNCTION fn_auditoria()
            RETURNS TRIGGER
            LANGUAGE plpgsql
            AS $$
            BEGIN
                INSERT INTO registros_auditoria (
                    usuario_id,
                    tipo_evento,
                    entidad_tipo,
                    entidad_id,
                    antes_json,
                    despues_json,
                    created_at
                )
                VALUES (
                    NULL,
                    TG_OP,
                    TG_TABLE_NAME,
                    CASE
                        WHEN TG_OP = 'DELETE' THEN OLD.id
                        ELSE NEW.id
                    END,
                    CASE
                        WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)
                        ELSE NULL
                    END,
                    CASE
                        WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)
                        ELSE NULL
                    END,
                    NOW()
                );
                RETURN NULL;
            END;
            $$;
        SQL);

        // Crear un trigger AFTER INSERT OR UPDATE OR DELETE en cada tabla principal
        foreach ($this->tablas as $tabla) {
            DB::statement(<<<SQL
                CREATE TRIGGER trg_auditoria_{$tabla}
                AFTER INSERT OR UPDATE OR DELETE
                ON {$tabla}
                FOR EACH ROW
                EXECUTE FUNCTION fn_auditoria();
            SQL);
        }
    }

    public function down(): void
    {
        // Eliminar los triggers en orden inverso
        foreach (array_reverse($this->tablas) as $tabla) {
            DB::statement("DROP TRIGGER IF EXISTS trg_auditoria_{$tabla} ON {$tabla};");
        }

        // Eliminar la función
        DB::statement('DROP FUNCTION IF EXISTS fn_auditoria();');
    }
};
