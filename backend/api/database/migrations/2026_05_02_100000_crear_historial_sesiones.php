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
            $table->string('dispositivo', 60)->nullable();
            $table->string('navegador', 80)->nullable();       // Chrome 124, Firefox 125…
            $table->string('sistema_operativo', 80)->nullable(); // Windows 11, macOS 14…
            $table->string('pais', 80)->nullable();
            $table->string('ciudad', 80)->nullable();
            $table->string('tipo_evento', 30)->default('login'); // login | logout | refresh
            $table->boolean('exitoso')->default(true);
            $table->timestamp('iniciada_en')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('historial_sesiones');
    }
};
