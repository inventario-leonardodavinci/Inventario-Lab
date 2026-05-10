<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Eliminar trigger de auditoría sobre alertas (si existe)
        DB::statement("DROP TRIGGER IF EXISTS trg_audit_alertas ON alertas");

        // Eliminar índices
        DB::statement('DROP INDEX IF EXISTS idx_alertas_generada_en');
        DB::statement('DROP INDEX IF EXISTS idx_alertas_estado');
        DB::statement('DROP INDEX IF EXISTS idx_alertas_estado_generada_en');

        // Eliminar tabla (CASCADE elimina FKs dependientes automáticamente)
        Schema::dropIfExists('alertas');
    }

    public function down(): void
    {
        // No se restaura: eliminación definitiva por decisión de diseño
    }
};
