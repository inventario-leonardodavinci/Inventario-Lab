<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Genera 50 movimientos históricos distribuidos en los últimos 30 días.
 * Incluye entradas, salidas, traslados y ajustes para que todas las vistas
 * del frontend tengan datos reales con los que trabajar.
 *
 * Es idempotente: no inserta si ya existen movimientos.
 */
class MovimientosHistoricoSeeder extends Seeder
{
    public function run(): void
    {
        if (DB::table('movimientos')->count() > 0) {
            $this->command->info('MovimientosHistoricoSeeder: ya existen movimientos, se omite.');
            return;
        }

        // Obtener IDs de artículos y ubicaciones existentes
        $articulos  = DB::table('articulos')->where('activo', true)->pluck('id')->toArray();
        $ubicaciones = DB::table('ubicaciones')->pluck('id')->toArray();
        $usuarioId  = DB::table('usuarios_app')->value('id'); // primer usuario que exista

        if (empty($articulos) || empty($ubicaciones)) {
            $this->command->warn('MovimientosHistoricoSeeder: no hay artículos o ubicaciones. Ejecuta primero InventoryCatalogSeeder.');
            return;
        }

        if (! $usuarioId) {
            $this->command->warn('MovimientosHistoricoSeeder: no hay usuarios en usuarios_app. El campo usuario_id quedará en null.');
        }

        $tipos = [
            ['tipo' => 'entrada',  'peso' => 4],
            ['tipo' => 'salida',   'peso' => 3],
            ['tipo' => 'traslado', 'peso' => 2],
            ['tipo' => 'ajuste',   'peso' => 1],
        ];

        $tiposExpandidos = [];
        foreach ($tipos as $t) {
            for ($i = 0; $i < $t['peso']; $i++) {
                $tiposExpandidos[] = $t['tipo'];
            }
        }

        $motivos = [
            'Reposición de stock',
            'Consumo de laboratorio',
            'Traslado a almacén secundario',
            'Ajuste por inventario físico',
            'Devolución de proveedor',
            'Uso en práctica docente',
            'Caducidad próxima — retirada',
            'Pedido urgente recibido',
            null,
        ];

        $movimientosInsertados = 0;

        for ($i = 0; $i < 50; $i++) {
            $tipo       = $tiposExpandidos[array_rand($tiposExpandidos)];
            $articuloId = $articulos[array_rand($articulos)];
            $cantidad   = match ($tipo) {
                'entrada'  => rand(10, 100),
                'salida'   => rand(1, 20),
                'traslado' => rand(5, 30),
                'ajuste'   => rand(0, 50),
            };

            $origenId  = null;
            $destinoId = null;

            switch ($tipo) {
                case 'entrada':
                    $destinoId = $ubicaciones[array_rand($ubicaciones)];
                    break;
                case 'salida':
                    $origenId = $ubicaciones[array_rand($ubicaciones)];
                    break;
                case 'traslado':
                    // Origen y destino distintos
                    $shuffled  = $ubicaciones;
                    shuffle($shuffled);
                    $origenId  = $shuffled[0];
                    $destinoId = count($shuffled) > 1 ? $shuffled[1] : $shuffled[0];
                    break;
                case 'ajuste':
                    $destinoId = $ubicaciones[array_rand($ubicaciones)];
                    break;
            }

            // Fecha aleatoria en los últimos 30 días
            $diasAtras  = rand(0, 30);
            $horasAtras = rand(0, 23);
            $createdAt  = now()->subDays($diasAtras)->subHours($horasAtras);

            $movimientoId = DB::table('movimientos')->insertGetId([
                'tipo'                 => $tipo,
                'motivo'               => $motivos[array_rand($motivos)],
                'ubicacion_origen_id'  => $origenId,
                'ubicacion_destino_id' => $destinoId,
                'usuario_id'           => $usuarioId,
                'created_at'           => $createdAt,
            ]);

            DB::table('lineas_movimiento')->insert([
                'movimiento_id' => $movimientoId,
                'articulo_id'   => $articuloId,
                'cantidad'      => $cantidad,
                'created_at'    => $createdAt,
            ]);

            // Para entradas: incrementar stock si el nivel ya existe
            if ($tipo === 'entrada' && $destinoId) {
                $actualizado = DB::table('niveles_stock')
                    ->where('articulo_id', $articuloId)
                    ->where('ubicacion_id', $destinoId)
                    ->increment('cantidad', $cantidad);

                if (! $actualizado) {
                    DB::table('niveles_stock')->insert([
                        'articulo_id'    => $articuloId,
                        'ubicacion_id'   => $destinoId,
                        'cantidad'       => $cantidad,
                        'cantidad_minima' => 0,
                        'created_at'     => now(),
                        'updated_at'     => now(),
                    ]);
                }
            }

            $movimientosInsertados++;
        }

        $this->command->info("MovimientosHistoricoSeeder: {$movimientosInsertados} movimientos insertados.");
    }
}
