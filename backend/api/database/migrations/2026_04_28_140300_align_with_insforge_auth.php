<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('users');

        DB::statement('DROP TABLE IF EXISTS user_roles');
    }

    public function down(): void
    {
        // No-op: la autenticacion la gestiona Insforge.
    }
};
