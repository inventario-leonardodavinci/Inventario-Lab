<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('movimientos', function (Blueprint $table) {
            // Sub-ubicación origen (para traslados y salidas)
            $table->foreignId('sub_ubicacion_origen_id')
                ->nullable()
                ->after('ubicacion_destino_id')
                ->constrained('sub_ubicaciones')
                ->onDelete('set null');

            // Sub-ubicación destino (para entradas y traslados)
            $table->foreignId('sub_ubicacion_destino_id')
                ->nullable()
                ->after('sub_ubicacion_origen_id')
                ->constrained('sub_ubicaciones')
                ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('movimientos', function (Blueprint $table) {
            $table->dropForeign(['sub_ubicacion_origen_id']);
            $table->dropForeign(['sub_ubicacion_destino_id']);
            $table->dropColumn(['sub_ubicacion_origen_id', 'sub_ubicacion_destino_id']);
        });
    }
};
