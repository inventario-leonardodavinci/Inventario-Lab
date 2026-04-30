<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolesSeeder extends Seeder
{
    /**
     * Inserta los tres roles del sistema: administrador, profesor, consultor.
     * Puede ejecutarse de forma independiente con:
     *   php artisan db:seed --class=RolesSeeder
     */
    public function run(): void
    {
        $roles = ['administrador', 'profesor', 'consultor'];

        foreach ($roles as $name) {
            DB::table('roles')->updateOrInsert(
                ['name' => $name],
                ['updated_at' => now(), 'created_at' => now()]
            );
        }
    }
}
