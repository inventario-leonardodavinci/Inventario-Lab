<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('historial_sesiones', function (Blueprint $table) {
            // Versión completa del navegador y SO
            $table->string('navegador', 80)->change();
            $table->string('sistema_operativo', 80)->change();

            // Tipo de evento y resultado
            $table->string('tipo_evento', 30)->default('login')->after('ciudad');
            $table->boolean('exitoso')->default(true)->after('tipo_evento');
        });
    }

    public function down(): void
    {
        Schema::table('historial_sesiones', function (Blueprint $table) {
            $table->dropColumn(['tipo_evento', 'exitoso']);
        });
    }
};
