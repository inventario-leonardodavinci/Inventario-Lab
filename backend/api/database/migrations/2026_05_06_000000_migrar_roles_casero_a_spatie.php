<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Migra el sistema de roles casero (roles + usuario_roles) a spatie/laravel-permission
 * (spatie_roles + spatie_model_has_roles) y elimina las tablas caseras.
 *
 * También renombra la tabla 'batches' → 'lotes' para consistencia con el esquema en español.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── 1. Asegurar que los roles existen en spatie_roles ─────────────────
        // guard_name = 'api' porque UsuarioApp no extiende Authenticatable con guard 'web'
        DB::statement(<<<'SQL'
            INSERT INTO spatie_roles (name, guard_name, created_at, updated_at)
            VALUES
                ('administrador', 'api', NOW(), NOW()),
                ('profesor',      'api', NOW(), NOW()),
                ('consultor',     'api', NOW(), NOW())
            ON CONFLICT (name, guard_name) DO NOTHING
        SQL);

        // ── 2. Migrar asignaciones de roles ───────────────────────────────────
        // usuario_roles.usuario_id → spatie_model_has_roles.model_id
        // El model_type es el FQCN de UsuarioApp
        DB::statement(<<<'SQL'
            INSERT INTO spatie_model_has_roles (role_id, model_type, model_id)
            SELECT
                sr.id,
                'App\Models\UsuarioApp',
                ur.usuario_id
            FROM usuario_roles ur
            JOIN roles r ON r.id = ur.rol_id
            JOIN spatie_roles sr ON sr.name = r.name AND sr.guard_name = 'api'
            ON CONFLICT DO NOTHING
        SQL);

        // ── 3. Eliminar FK y tabla pivote casera ──────────────────────────────
        Schema::dropIfExists('usuario_roles');

        // ── 4. Eliminar tabla de roles casera ─────────────────────────────────
        Schema::dropIfExists('roles');

        // ── 5. Renombrar batches → lotes ──────────────────────────────────────
        if (Schema::hasTable('batches') && ! Schema::hasTable('lotes')) {
            Schema::rename('batches', 'lotes');
        }
    }

    public function down(): void
    {
        // Recrear tabla roles casera
        Schema::create('roles', function ($table) {
            $table->id();
            $table->string('name', 50)->unique();
            $table->timestamps();
        });

        DB::statement(<<<'SQL'
            INSERT INTO roles (name, created_at, updated_at)
            SELECT DISTINCT name, NOW(), NOW()
            FROM spatie_roles
            WHERE guard_name = 'api'
              AND name IN ('administrador', 'profesor', 'consultor')
            ON CONFLICT (name) DO NOTHING
        SQL);

        // Recrear tabla pivote casera
        Schema::create('usuario_roles', function ($table) {
            $table->foreignId('usuario_id')->constrained('usuarios_app')->cascadeOnDelete();
            $table->foreignId('rol_id')->constrained('roles')->cascadeOnDelete();
            $table->primary(['usuario_id', 'rol_id']);
        });

        DB::statement(<<<'SQL'
            INSERT INTO usuario_roles (usuario_id, rol_id)
            SELECT
                smr.model_id,
                r.id
            FROM spatie_model_has_roles smr
            JOIN spatie_roles sr ON sr.id = smr.role_id AND sr.guard_name = 'api'
            JOIN roles r ON r.name = sr.name
            WHERE smr.model_type = 'App\Models\UsuarioApp'
            ON CONFLICT DO NOTHING
        SQL);

        // Revertir lotes → batches
        if (Schema::hasTable('lotes') && ! Schema::hasTable('batches')) {
            Schema::rename('lotes', 'batches');
        }
    }
};
