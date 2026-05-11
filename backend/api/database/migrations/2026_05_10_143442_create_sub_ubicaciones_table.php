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
        Schema::create('sub_ubicaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ubicacion_id')->constrained('ubicaciones')->onDelete('cascade');
            $table->string('nombre', 100); // Ej: "Balda 1A", "Estante superior"
            $table->text('descripcion')->nullable();
            $table->integer('orden')->default(0); // Para ordenar visualmente
            $table->boolean('activo')->default(true);
            $table->timestamps();

            // Índices
            $table->unique(['ubicacion_id', 'nombre']);
            $table->index(['ubicacion_id', 'activo']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sub_ubicaciones');
    }
};
