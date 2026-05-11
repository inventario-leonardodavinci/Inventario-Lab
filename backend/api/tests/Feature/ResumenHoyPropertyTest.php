<?php

namespace Tests\Feature;

use App\Models\Movimiento;
use App\Models\UsuarioApp;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
    use RefreshDatabase;
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

    protected function tearDown(): void
    {
        Movimiento::where('usuario_id', $this->usuario->id)->delete();
        $this->usuario->delete();
        parent::tearDown();
    }

    /**
     * Propiedad 1: filtrado correcto por tipo y fecha — 10 iteraciones aleatorias.
     * Estrategia delta: mide el baseline antes y verifica que los nuevos movimientos
     * incrementan exactamente el contador esperado, sin borrar datos de producción.
     */
    public function test_propiedad_filtrado_correcto_por_tipo_y_fecha(): void
    {
        $iteraciones = 10;
        $tiposRuido  = ['traslado', 'ajuste'];

        for ($iter = 0; $iter < $iteraciones; $iter++) {
            // Baseline antes de la iteración
            $baseline = $this->withHeader('X-Auth-User-Id', $this->usuario->auth_user_id)
                ->getJson('/api/v1/movimientos/resumen-hoy')
                ->json();

            $n = random_int(0, 5); // entradas del día a añadir
            $m = random_int(0, 5); // salidas del día a añadir
            $k = random_int(0, 3); // tipos de ruido (no deben contarse)
            $j = random_int(0, 3); // fechas pasadas (no deben contarse)

            // Crear N entradas de hoy
            for ($i = 0; $i < $n; $i++) {
                Movimiento::create(['tipo' => 'entrada', 'usuario_id' => $this->usuario->id]);
            }

            // Crear M salidas de hoy
            for ($i = 0; $i < $m; $i++) {
                Movimiento::create(['tipo' => 'salida', 'usuario_id' => $this->usuario->id]);
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
                $tipo = random_int(0, 1) === 0 ? 'entrada' : 'salida';
                $mov  = Movimiento::create(['tipo' => $tipo, 'usuario_id' => $this->usuario->id]);
                $mov->forceFill(['created_at' => now()->subDays(random_int(1, 30))->toDateTimeString()])->save();
            }

            $response = $this->withHeader('X-Auth-User-Id', $this->usuario->auth_user_id)
                ->getJson('/api/v1/movimientos/resumen-hoy');

            $response->assertStatus(200);
            $data = $response->json('data');

            $this->assertSame(
                $baseline['data']['entradas_hoy'] + $n,
                $data['entradas_hoy'],
                "Iteración {$iter}: esperaba delta +{$n} entradas"
            );

            $this->assertSame(
                $baseline['data']['salidas_hoy'] + $m,
                $data['salidas_hoy'],
                "Iteración {$iter}: esperaba delta +{$m} salidas"
            );
        }
    }
}
