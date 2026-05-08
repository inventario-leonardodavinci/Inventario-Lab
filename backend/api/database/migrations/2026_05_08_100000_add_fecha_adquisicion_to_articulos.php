<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Añade fecha_adquisicion para productos inventariables (máquinas, equipos, etc.)
     */
    public function up(): void
    {
        Schema::table('articulos', function (Blueprint $table) {
            $table->date('fecha_adquisicion')->nullable()->after('expiration_date')->comment('Fecha de compra/adquisición para equipos y máquinas');
            $table->decimal('precio_compra', 10, 2)->nullable()->after('fecha_adquisicion')->comment('Precio de compra en euros');
            $table->string('proveedor', 150)->nullable()->after('precio_compra')->comment('Proveedor o fabricante');
            $table->string('numero_factura', 50)->nullable()->after('proveedor')->comment('Número de factura de compra');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('articulos', function (Blueprint $table) {
            $table->dropColumn(['fecha_adquisicion', 'precio_compra', 'proveedor', 'numero_factura']);
        });
    }
};
