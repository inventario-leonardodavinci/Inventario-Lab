<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Corrige el trigger fn_auditoria() para que trate usuario_id = 0
 * como NULL (usuario desconocido / sistema / tests).
 * Sin este fix, SET app.current_user_id = 0 viola la FK con usuarios_app
 * y los tests no pueden crear usuarios.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement(<<<'SQL'
            CREATE OR REPLACE FUNCTION fn_auditoria()
            RETURNS TRIGGER
            LANGUAGE plpgsql
            AS $$
            DECLARE
                v_usuario_id BIGINT;
            BEGIN
                BEGIN
                    v_usuario_id := current_setting('app.current_user_id', true)::BIGINT;
                    -- Tratar 0 como NULL (sistema / tests sin usuario real)
                    IF v_usuario_id = 0 THEN
                        v_usuario_id := NULL;
                    END IF;
                EXCEPTION WHEN OTHERS THEN
                    v_usuario_id := NULL;
                END;

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
                    v_usuario_id,
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
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        // Restaurar la versión anterior sin el guard de 0
        DB::statement(<<<'SQL'
            CREATE OR REPLACE FUNCTION fn_auditoria()
            RETURNS TRIGGER
            LANGUAGE plpgsql
            AS $$
            DECLARE
                v_usuario_id BIGINT;
            BEGIN
                BEGIN
                    v_usuario_id := current_setting('app.current_user_id', true)::BIGINT;
                EXCEPTION WHEN OTHERS THEN
                    v_usuario_id := NULL;
                END;

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
                    v_usuario_id,
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
    }
};
