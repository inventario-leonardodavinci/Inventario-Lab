<?php

namespace Tests\Feature;

use App\Models\Movimiento;
use App\Models\UsuarioApp;
use Tests\TestCase;

/**
 * Tests de ejemplo para GET /api/v1/movimientos/resumen-hoy
 * Feature: panel-principal-datos-reales — Requisitos 1.1, 1.2, 1.3, 1.4, 1.5
 */
class ResumenHoyTest extends TestCase
{
    private UsuarioApp $usuario;

    protected function setUp(): void
    {
        parent::setUp();

        $this->usuario = UsuarioApp::create([
            'auth_user_id'   => 'test-resumen-hoy-' . uniqid(),
            'nombre_visible' => 'Tester ResumenHoy',
            'activo'         => true,
        ]);
    }

    protected function tearDown(): void
    {
        Movimiento::where('usuario_id', $this->usuario->id)->delete();
        $this->usuario->delete();
        parent::tearDown();
    }

    /** Requisito 1.2: el endpoint responde 200 con los 4 campos y valores no negativos */
    public function test_sin_movimientos_propios_responde_estructura_correcta(): void
    {
        $response = $this->withHeader('X-Auth-User-Id', $this->usuario->auth_user_id)
            ->getJson('/api/v1/movimientos/resumen-hoy');

        $response->assertStatus(200)
            ->assertJsonStructure(['entradas_hoy', 'salidas_hoy', 'ajustes_hoy', 'traslados_hoy'])
            ->assertJsonPath('entradas_hoy',  fn ($v) => is_int($v) && $v >= 0)
            ->assertJsonPath('salidas_hoy',   fn ($v) => is_int($v) && $v >= 0)
            ->assertJsonPath('ajustes_hoy',   fn ($v) => is_int($v) && $v >= 0)
            ->assertJsonPath('traslados_hoy', fn ($v) => is_int($v) && $v >= 0);
    }

    /** Requisito 1.5: sin cabecera de autenticación devuelve 401 */
    public function test_sin_cabecera_autenticacion_devuelve_401(): void
    {
        $response = $this->getJson('/api/v1/movimientos/resumen-hoy');

        $response->assertStatus(401);
    }

    /** Requisitos 1.3, 1.4: las nuevas entradas y salidas de hoy incrementan el contador exactamente */
    public function test_nuevas_entradas_y_salidas_incrementan_contadores(): void
    {
        // Baseline antes de crear movimientos del test
        $baseline = $this->withHeader('X-Auth-User-Id', $this->usuario->auth_user_id)
            ->getJson('/api/v1/movimientos/resumen-hoy')
            ->json();

        // 3 entradas de hoy
        for ($i = 0; $i < 3; $i++) {
            Movimiento::create(['tipo' => 'entrada', 'usuario_id' => $this->usuario->id]);
        }

        // 2 salidas de hoy
        for ($i = 0; $i < 2; $i++) {
            Movimiento::create(['tipo' => 'salida', 'usuario_id' => $this->usuario->id]);
        }

        // 1 traslado de hoy (no cuenta en entradas/salidas, sí en traslados)
        Movimiento::create(['tipo' => 'traslado', 'usuario_id' => $this->usuario->id]);

        // 1 ajuste de hoy
        Movimiento::create(['tipo' => 'ajuste', 'usuario_id' => $this->usuario->id]);

        // 1 entrada de ayer (no debe contarse en ningún campo de hoy)
        $movAyer = Movimiento::create(['tipo' => 'entrada', 'usuario_id' => $this->usuario->id]);
        $movAyer->forceFill(['created_at' => now()->subDay()->toDateTimeString()])->save();

        $response = $this->withHeader('X-Auth-User-Id', $this->usuario->auth_user_id)
            ->getJson('/api/v1/movimientos/resumen-hoy');

        $response->assertStatus(200);
        $data = $response->json();

        $this->assertSame($baseline['entradas_hoy']  + 3, $data['entradas_hoy'],  'Entradas deben incrementar en 3');
        $this->assertSame($baseline['salidas_hoy']   + 2, $data['salidas_hoy'],   'Salidas deben incrementar en 2');
        $this->assertSame($baseline['traslados_hoy'] + 1, $data['traslados_hoy'], 'Traslados deben incrementar en 1');
        $this->assertSame($baseline['ajustes_hoy']   + 1, $data['ajustes_hoy'],   'Ajustes deben incrementar en 1');
    }

    /** Requisito 1.1: la ruta existe, devuelve 200 y los 4 campos del resumen */
    public function test_estructura_de_respuesta_correcta(): void
    {
        $response = $this->withHeader('X-Auth-User-Id', $this->usuario->auth_user_id)
            ->getJson('/api/v1/movimientos/resumen-hoy');

        $response->assertStatus(200)
            ->assertJsonStructure(['entradas_hoy', 'salidas_hoy', 'ajustes_hoy', 'traslados_hoy'])
            ->assertJsonPath('entradas_hoy',  fn ($v) => is_int($v) && $v >= 0)
            ->assertJsonPath('salidas_hoy',   fn ($v) => is_int($v) && $v >= 0)
            ->assertJsonPath('ajustes_hoy',   fn ($v) => is_int($v) && $v >= 0)
            ->assertJsonPath('traslados_hoy', fn ($v) => is_int($v) && $v >= 0);
    }
}
