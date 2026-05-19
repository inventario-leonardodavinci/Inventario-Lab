<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tablas huérfanas del antiguo sistema de alertas (esquema inglés)
        Schema::dropIfExists('alert_rules');

        // Tabla huérfana del esquema inglés original (nunca migrada a español).
        // PostgreSQL necesita CASCADE por FKs heredadas; SQLite de tests no soporta esa sintaxis.
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP TABLE IF EXISTS suppliers CASCADE');

            return;
        }

        Schema::dropIfExists('suppliers');
    }

    public function down(): void
    {
        // No se restauran: limpieza definitiva de tablas sin uso
    }
};
