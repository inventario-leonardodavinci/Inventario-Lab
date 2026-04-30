<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class InventoryCatalogSeeder extends Seeder
{
    public function run(): void
    {
        // ── Categorías ────────────────────────────────────────────────────────
        $categorias = [
            'Medios de cultivo',
            'Fungibles',
            'Reactivos quimicos',
            'Inventariables',
        ];
        foreach ($categorias as $nombre) {
            DB::table('categorias')->updateOrInsert(
                ['nombre' => $nombre],
                ['updated_at' => now(), 'created_at' => now()]
            );
        }

        // ── Ubicaciones ───────────────────────────────────────────────────────
        $ubicaciones = [
            ['nombre' => 'Armario alto 1',  'tipo' => 'armario'],
            ['nombre' => 'Armario alto 2',  'tipo' => 'armario'],
            ['nombre' => 'Armario alto 3',  'tipo' => 'armario'],
            ['nombre' => 'Armario alto 4',  'tipo' => 'armario'],
            ['nombre' => 'Armario alto 5',  'tipo' => 'armario'],
            ['nombre' => 'Armario alto 6',  'tipo' => 'armario'],
            ['nombre' => 'Armario alto 7',  'tipo' => 'armario'],
            ['nombre' => 'Armario bajo 1',  'tipo' => 'armario'],
            ['nombre' => 'Armario bajo 2',  'tipo' => 'armario'],
            ['nombre' => 'Armario bajo 3',  'tipo' => 'armario'],
            ['nombre' => 'Armario bajo 4',  'tipo' => 'armario'],
            ['nombre' => 'Armario bajo 5',  'tipo' => 'armario'],
            ['nombre' => 'Armario bajo 6',  'tipo' => 'armario'],
            ['nombre' => 'Armario bajo 7',  'tipo' => 'armario'],
            ['nombre' => 'Nevera 1',        'tipo' => 'nevera'],
            ['nombre' => 'Cajonera 1',      'tipo' => 'cajon'],
            ['nombre' => 'Cajonera 2',      'tipo' => 'cajon'],
            ['nombre' => 'Almacen',         'tipo' => 'otro'],
        ];

        foreach ($ubicaciones as $ubicacion) {
            DB::table('ubicaciones')->updateOrInsert(
                ['nombre' => $ubicacion['nombre']],
                ['tipo' => $ubicacion['tipo'], 'updated_at' => now(), 'created_at' => now()]
            );
        }

        // ── Artículos de ejemplo ──────────────────────────────────────────────
        $catFungibles   = DB::table('categorias')->where('nombre', 'Fungibles')->value('id');
        $catReactivos   = DB::table('categorias')->where('nombre', 'Reactivos quimicos')->value('id');
        $catMedios      = DB::table('categorias')->where('nombre', 'Medios de cultivo')->value('id');
        $catInventar    = DB::table('categorias')->where('nombre', 'Inventariables')->value('id');

        $articulos = [
            [
                'codigo'       => 'FUN-001',
                'nombre'       => 'Tubos de ensayo 15 mL',
                'descripcion'  => 'Tubos de ensayo de vidrio borosilicato de 15 mL con tapón de rosca.',
                'categoria_id' => $catFungibles,
                'unidad'       => 'unidades',
                'activo'       => true,
            ],
            [
                'codigo'       => 'FUN-002',
                'nombre'       => 'Pipetas Pasteur desechables',
                'descripcion'  => 'Pipetas Pasteur de plástico desechables, 3 mL.',
                'categoria_id' => $catFungibles,
                'unidad'       => 'unidades',
                'activo'       => true,
            ],
            [
                'codigo'       => 'FUN-003',
                'nombre'       => 'Guantes de nitrilo talla M',
                'descripcion'  => 'Guantes de nitrilo sin polvo, talla M, caja de 100 unidades.',
                'categoria_id' => $catFungibles,
                'unidad'       => 'cajas',
                'activo'       => true,
            ],
            [
                'codigo'       => 'FUN-004',
                'nombre'       => 'Mascarillas FFP2',
                'descripcion'  => 'Mascarillas de protección respiratoria FFP2 sin válvula.',
                'categoria_id' => $catFungibles,
                'unidad'       => 'unidades',
                'activo'       => true,
            ],
            [
                'codigo'       => 'FUN-005',
                'nombre'       => 'Placas Petri 90 mm',
                'descripcion'  => 'Placas Petri de poliestireno desechables, diámetro 90 mm.',
                'categoria_id' => $catFungibles,
                'unidad'       => 'unidades',
                'activo'       => true,
            ],
            [
                'codigo'       => 'REA-001',
                'nombre'       => 'Etanol 96%',
                'descripcion'  => 'Etanol de grado analítico al 96%, botella de 1 L.',
                'categoria_id' => $catReactivos,
                'unidad'       => 'litros',
                'activo'       => true,
            ],
            [
                'codigo'       => 'REA-002',
                'nombre'       => 'Ácido clorhídrico 37%',
                'descripcion'  => 'Ácido clorhídrico concentrado al 37%, frasco de 500 mL.',
                'categoria_id' => $catReactivos,
                'unidad'       => 'mL',
                'activo'       => true,
            ],
            [
                'codigo'       => 'MED-001',
                'nombre'       => 'Agar nutritivo',
                'descripcion'  => 'Agar nutritivo deshidratado para cultivo bacteriano, bote de 500 g.',
                'categoria_id' => $catMedios,
                'unidad'       => 'gramos',
                'activo'       => true,
            ],
            [
                'codigo'       => 'MED-002',
                'nombre'       => 'Caldo LB (Luria-Bertani)',
                'descripcion'  => 'Caldo LB deshidratado para cultivo de E. coli, bote de 250 g.',
                'categoria_id' => $catMedios,
                'unidad'       => 'gramos',
                'activo'       => true,
            ],
            [
                'codigo'       => 'INV-001',
                'nombre'       => 'Micropipeta 100-1000 µL',
                'descripcion'  => 'Micropipeta monocanal de volumen variable 100-1000 µL.',
                'categoria_id' => $catInventar,
                'unidad'       => 'unidades',
                'activo'       => true,
            ],
        ];

        foreach ($articulos as $articulo) {
            DB::table('articulos')->updateOrInsert(
                ['codigo' => $articulo['codigo']],
                array_merge($articulo, ['updated_at' => now(), 'created_at' => now()])
            );
        }

        // ── Niveles de stock iniciales ────────────────────────────────────────
        $idArmarioAlto1 = DB::table('ubicaciones')->where('nombre', 'Armario alto 1')->value('id');
        $idArmarioAlto2 = DB::table('ubicaciones')->where('nombre', 'Armario alto 2')->value('id');
        $idArmarioBajo1 = DB::table('ubicaciones')->where('nombre', 'Armario bajo 1')->value('id');
        $idNevera1      = DB::table('ubicaciones')->where('nombre', 'Nevera 1')->value('id');
        $idAlmacen      = DB::table('ubicaciones')->where('nombre', 'Almacen')->value('id');

        $idTubos      = DB::table('articulos')->where('codigo', 'FUN-001')->value('id');
        $idPipetas    = DB::table('articulos')->where('codigo', 'FUN-002')->value('id');
        $idGuantes    = DB::table('articulos')->where('codigo', 'FUN-003')->value('id');
        $idMascarilla = DB::table('articulos')->where('codigo', 'FUN-004')->value('id');
        $idEtanol     = DB::table('articulos')->where('codigo', 'REA-001')->value('id');
        $idAgar       = DB::table('articulos')->where('codigo', 'MED-001')->value('id');

        $nivelesStock = [
            [
                'articulo_id'    => $idTubos,
                'ubicacion_id'   => $idArmarioAlto1,
                'cantidad'       => 200,
                'cantidad_minima' => 50,
            ],
            [
                'articulo_id'    => $idPipetas,
                'ubicacion_id'   => $idArmarioAlto1,
                'cantidad'       => 500,
                'cantidad_minima' => 100,
            ],
            [
                'articulo_id'    => $idGuantes,
                'ubicacion_id'   => $idArmarioBajo1,
                'cantidad'       => 10,
                'cantidad_minima' => 3,
            ],
            [
                'articulo_id'    => $idMascarilla,
                'ubicacion_id'   => $idArmarioBajo1,
                'cantidad'       => 30,
                'cantidad_minima' => 10,
            ],
            [
                'articulo_id'    => $idEtanol,
                'ubicacion_id'   => $idArmarioAlto2,
                'cantidad'       => 5,
                'cantidad_minima' => 2,
            ],
            [
                'articulo_id'    => $idAgar,
                'ubicacion_id'   => $idNevera1,
                'cantidad'       => 1000,
                'cantidad_minima' => 200,
            ],
            [
                'articulo_id'    => $idTubos,
                'ubicacion_id'   => $idAlmacen,
                'cantidad'       => 800,
                'cantidad_minima' => 100,
            ],
        ];

        foreach ($nivelesStock as $nivel) {
            DB::table('niveles_stock')->updateOrInsert(
                [
                    'articulo_id'  => $nivel['articulo_id'],
                    'ubicacion_id' => $nivel['ubicacion_id'],
                ],
                array_merge($nivel, ['updated_at' => now(), 'created_at' => now()])
            );
        }
    }
}
