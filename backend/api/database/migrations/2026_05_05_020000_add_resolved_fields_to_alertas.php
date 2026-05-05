<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('alertas', function (Blueprint $table) {
            // Agregar campos faltantes para resolución de alertas
            // (estos campos existían en inglés como resolved_by_user_id y resolved_at)
            if (!Schema::hasColumn('alertas', 'resuelta_por_id')) {
                $table->foreignId('resuelta_por_id')
                    ->nullable()
                    ->after('confirmada_en')
                    ->constrained('usuarios_app', 'id')
                    ->nullOnDelete();
            }
            if (!Schema::hasColumn('alertas', 'resuelta_en')) {
                $table->timestamp('resuelta_en')->nullable()->after('resuelta_por_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('alertas', function (Blueprint $table) {
            if (Schema::hasColumn('alertas', 'resuelta_por_id')) {
                $table->dropForeign(['resuelta_por_id']);
                $table->dropColumn('resuelta_por_id');
            }
            if (Schema::hasColumn('alertas', 'resuelta_en')) {
                $table->dropColumn('resuelta_en');
            }
        });
    }
};
