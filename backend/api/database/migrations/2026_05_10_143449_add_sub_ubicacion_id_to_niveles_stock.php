<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('niveles_stock', function (Blueprint $table) {
            $table->foreignId('sub_ubicacion_id')
                ->nullable()
                ->constrained('sub_ubicaciones')
                ->onDelete('set null')
                ->after('ubicacion_id');

            $table->index(['articulo_id', 'sub_ubicacion_id']);
            $table->index(['ubicacion_id', 'sub_ubicacion_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('niveles_stock', function (Blueprint $table) {
            $table->dropForeign(['sub_ubicacion_id']);
            $table->dropColumn('sub_ubicacion_id');
        });
    }
};
