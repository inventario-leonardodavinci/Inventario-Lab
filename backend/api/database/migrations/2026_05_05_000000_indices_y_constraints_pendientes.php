<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Migración que cubre 4 ítems de deuda técnica identificados en auditoría:
 *
 * 1. Índice en registros_auditoria(created_at DESC)  — evita full-scan en filtros por fecha
 * 2. Índices en alertas(generada_en DESC, estado)    — evita full-scan en listados paginados
 * 3. CHECK constraint en historial_sesiones.tipo_evento — evita valores arbitrarios
 * 4. Roles base (administrador, profesor, consultor)  — garantizados aunque no se ejecute el seeder
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── 1. Índice de auditoría ────────────────────────────────────────────
        DB::statement(<<<'SQL'
            CREATE INDEX IF NOT EXISTS idx_registros_auditoria_created_at
            ON registros_auditoria (created_at DESC)
        SQL);

        // Índice compuesto para filtro entidad_tipo + created_at (el más frecuente)
        DB::statement(<<<'SQL'
            CREATE INDEX IF NOT EXISTS idx_registros_auditoria_entidad_fecha
            ON registros_auditoria (entidad_tipo, created_at DESC)
        SQL);

        // ── 2. Índices de alertas ─────────────────────────────────────────────
        DB::statement(<<<'SQL'
            CREATE INDEX IF NOT EXISTS idx_alertas_generada_en
            ON alertas (generada_en DESC)
        SQL);

        DB::statement(<<<'SQL'
            CREATE INDEX IF NOT EXISTS idx_alertas_estado
            ON alertas (estado)
        SQL);

        // Índice compuesto para el filtro más habitual: alertas abiertas ordenadas
        DB::statement(<<<'SQL'
            CREATE INDEX IF NOT EXISTS idx_alertas_estado_generada_en
            ON alertas (estado, generada_en DESC)
        SQL);

        // ── 3. CHECK constraint en historial_sesiones.tipo_evento ─────────────
        // Eliminar el constraint anterior si existe (por si se re-ejecuta)
        DB::statement(<<<'SQL'
            ALTER TABLE historial_sesiones
            DROP CONSTRAINT IF EXISTS chk_historial_tipo_evento
        SQL);

        DB::statement(<<<'SQL'
            ALTER TABLE historial_sesiones
            ADD CONSTRAINT chk_historial_tipo_evento
            CHECK (tipo_evento IN ('login', 'logout', 'refresh', 'oauth'))
        SQL);

        // ── 4. Roles base garantizados ────────────────────────────────────────
        // INSERT OR IGNORE equivalente en PostgreSQL: ON CONFLICT DO NOTHING
        DB::statement(<<<'SQL'
            INSERT INTO roles (name, created_at, updated_at)
            VALUES
                ('administrador', NOW(), NOW()),
                ('profesor',      NOW(), NOW()),
                ('consultor',     NOW(), NOW())
            ON CONFLICT (name) DO NOTHING
        SQL);
    }

    public function down(): void
    {
        // Eliminar índices
        DB::statement('DROP INDEX IF EXISTS idx_registros_auditoria_created_at');
        DB::statement('DROP INDEX IF EXISTS idx_registros_auditoria_entidad_fecha');
        DB::statement('DROP INDEX IF EXISTS idx_alertas_generada_en');
        DB::statement('DROP INDEX IF EXISTS idx_alertas_estado');
        DB::statement('DROP INDEX IF EXISTS idx_alertas_estado_generada_en');

        // Eliminar constraint CHECK
        DB::statement(<<<'SQL'
            ALTER TABLE historial_sesiones
            DROP CONSTRAINT IF EXISTS chk_historial_tipo_evento
        SQL);

        // No eliminamos los roles: el rollback de datos es peligroso
    }
};
