<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('historial_sesiones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->constrained('usuarios_app')->cascadeOnDelete();
            $table->ipAddress('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->string('dispositivo', 60)->nullable();   // Mobile / Desktop / Tablet
            $table->string('navegador', 60)->nullable();     // Chrome, Firefox, Safari…
            $table->string('sistema_operativo', 60)->nullable(); // Windows, macOS, Android…
            $table->string('pais', 80)->nullable();
            $table->string('ciudad', 80)->nullable();
            $table->timestamp('iniciada_en')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('historial_sesiones');
    }
};
