<?php

namespace Tests\Feature;

use App\Models\Movimiento;
use App\Models\UsuarioApp;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

/**
 * Test de propiedad para GET /api/v1/movimientos/resumen-hoy
 * Feature: panel-principal-datos-reales
 *
 * Propiedad 1: Para cualquier N entradas y M salidas del día actual,
 * más K movimientos de otros tipos/días, el endpoint devuelve
 * exactamente entradas_hoy === N y salidas_hoy === M.
 *
 * Valida: Requisitos 1.1, 1.3, 1.4
 */
class ResumenHoyPropertyTest extends TestCase
{
    use DatabaseTransactions;

    private UsuarioApp $usuario;

    protected function setUp(): void
    {
        parent::setUp();

        $this->usuario = UsuarioApp::create([
            'auth_user_id'   => 'test-prop-' . uniqid(),
            'nombre_visible' => 'Tester Propiedad',
            'activo'         => true,
        ]);
    }

    /**
     * Propiedad 1: filtrado correcto por tipo y fecha — 50 iteraciones aleatorias.
     */
    public function test_propiedad_filtrado_correcto_por_tipo_y_fecha(): void
    {
        $iteraciones = 50;
        $tiposRuido  = ['traslado', 'ajuste'];

        for ($iter = 0; $iter < $iteraciones; $iter++) {
            // Limpiar movimientos de iteraciones anteriores
            Movimiento::query()->delete();

            $n = random_int(0, 10); // entradas del día
            $m = random_int(0, 10); // salidas del día
            $k = random_int(0, 5);  // otros tipos del día (ruido)
            $j = random_int(0, 5);  // entradas/salidas de días anteriores (ruido)

            // Crear N entradas de hoy
            for ($i = 0; $i < $n; $i++) {
                Movimiento::create([
                    'tipo'       => 'entrada',
                    'usuario_id' => $this->usuario->id,
                ]);
            }

            // Crear M salidas de hoy
            for ($i = 0; $i < $m; $i++) {
                Movimiento::create([
                    'tipo'       => 'salida',
                    'usuario_id' => $this->usuario->id,
                ]);
            }

            // Crear K movimientos de otros tipos hoy (no deben contarse)
            for ($i = 0; $i < $k; $i++) {
                Movimiento::create([
                    'tipo'       => $tiposRuido[array_rand($tiposRuido)],
                    'usuario_id' => $this->usuario->id,
                ]);
            }

            // Crear J movimientos de días anteriores (no deben contarse)
            for ($i = 0; $i < $j; $i++) {
                $diasAtras = random_int(1, 30);
                $fechaAnterior = now()->subDays($diasAtras)->toDateTimeString();
                $tipo = random_int(0, 1) === 0 ? 'entrada' : 'salida';

                $mov = Movimiento::create([
                    'tipo'       => $tipo,
                    'usuario_id' => $this->usuario->id,
                ]);
                $mov->forceFill(['created_at' => $fechaAnterior])->save();
            }

            $response = $this->withHeader('X-Auth-User-Id', $this->usuario->auth_user_id)
                ->getJson('/api/v1/movimientos/resumen-hoy');

            $response->assertStatus(200);

            $data = $response->json();

            $this->assertSame(
                $n,
                $data['entradas_hoy'],
                "Iteración {$iter}: esperaba entradas_hoy={$n}, obtuvo {$data['entradas_hoy']} (salidas={$m}, ruido_tipos={$k}, ruido_dias={$j})"
            );

            $this->assertSame(
                $m,
                $data['salidas_hoy'],
                "Iteración {$iter}: esperaba salidas_hoy={$m}, obtuvo {$data['salidas_hoy']} (entradas={$n}, ruido_tipos={$k}, ruido_dias={$j})"
            );
        }
    }
}
