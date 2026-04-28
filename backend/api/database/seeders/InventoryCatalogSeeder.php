<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class InventoryCatalogSeeder extends Seeder
{
    public function run(): void
    {
        $roles = ['admin', 'tecnico', 'consulta'];
        foreach ($roles as $name) {
            DB::table('roles')->updateOrInsert(['name' => $name], ['updated_at' => now(), 'created_at' => now()]);
        }

        $categories = [
            'Medios de cultivo',
            'Fungibles',
            'Reactivos quimicos',
            'Inventariables',
        ];
        foreach ($categories as $name) {
            DB::table('categories')->updateOrInsert(['name' => $name], ['updated_at' => now(), 'created_at' => now()]);
        }

        $locations = [
            'Armario alto 1',
            'Armario alto 2',
            'Armario alto 3',
            'Armario alto 4',
            'Armario alto 5',
            'Armario alto 6',
            'Armario alto 7',
            'Armario bajo 1',
            'Armario bajo 2',
            'Armario bajo 3',
            'Armario bajo 4',
            'Armario bajo 5',
            'Armario bajo 6',
            'Armario bajo 7',
            'Nevera 1',
            'Cajonera 1',
            'Cajonera 2',
            'Almacen',
        ];

        foreach ($locations as $name) {
            DB::table('locations')->updateOrInsert(['name' => $name], ['updated_at' => now(), 'created_at' => now()]);
        }
    }
}
