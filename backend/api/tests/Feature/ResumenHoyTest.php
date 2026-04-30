<?php

namespace Tests\Feature;

use App\Models\Movimiento;
use App\Models\UsuarioApp;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

/**
 * Tests de ejemplo para GET /api/v1/movimientos/resumen-hoy
 * Feature: panel-principal-datos-reales — Requisitos 1.1, 1.2, 1.3, 1.4, 1.5
 */
class ResumenHoyTest extends TestCase
{
    use DatabaseTransactions;

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

    /** Requisito 1.2: sin movimientos del día devuelve ceros */
    public function test_sin_movimientos_devuelve_ceros(): void
    {
        $response = $this->withHeader('X-Auth-User-Id', $this->usuario->auth_user_id)
            ->getJson('/api/v1/movimientos/resumen-hoy');

        $response->assertStatus(200)
            ->assertExactJson([
                'entradas_hoy' => 0,
                'salidas_hoy'  => 0,
            ]);
    }

    /** Requisito 1.5: sin cabecera de autenticación devuelve 401 */
    public function test_sin_cabecera_autenticacion_devuelve_401(): void
    {
        $response = $this->getJson('/api/v1/movimientos/resumen-hoy');

        $response->assertStatus(401);
    }

    /** Requisitos 1.3, 1.4: cuenta solo entradas y salidas del día actual */
    public function test_cuenta_entradas_y_salidas_del_dia_actual(): void
    {
        // 3 entradas de hoy
        for ($i = 0; $i < 3; $i++) {
            Movimiento::create([
                'tipo'       => 'entrada',
                'usuario_id' => $this->usuario->id,
            ]);
        }

        // 2 salidas de hoy
        for ($i = 0; $i < 2; $i++) {
            Movimiento::create([
                'tipo'       => 'salida',
                'usuario_id' => $this->usuario->id,
            ]);
        }

        // 1 traslado de hoy (no debe contarse)
        Movimiento::create([
            'tipo'       => 'traslado',
            'usuario_id' => $this->usuario->id,
        ]);

        // 1 entrada de ayer (no debe contarse)
        $ayer = now()->subDay()->toDateTimeString();
        $movimientoAyer = Movimiento::create([
            'tipo'       => 'entrada',
            'usuario_id' => $this->usuario->id,
        ]);
        $movimientoAyer->forceFill(['created_at' => $ayer])->save();

        $response = $this->withHeader('X-Auth-User-Id', $this->usuario->auth_user_id)
            ->getJson('/api/v1/movimientos/resumen-hoy');

        $response->assertStatus(200)
            ->assertExactJson([
                'entradas_hoy' => 3,
                'salidas_hoy'  => 2,
            ]);
    }

    /** Requisito 1.1: la ruta existe y devuelve la estructura correcta */
    public function test_estructura_de_respuesta_correcta(): void
    {
        $response = $this->withHeader('X-Auth-User-Id', $this->usuario->auth_user_id)
            ->getJson('/api/v1/movimientos/resumen-hoy');

        $response->assertStatus(200)
            ->assertJsonStructure(['entradas_hoy', 'salidas_hoy'])
            ->assertJsonPath('entradas_hoy', fn ($v) => is_int($v) && $v >= 0)
            ->assertJsonPath('salidas_hoy', fn ($v) => is_int($v) && $v >= 0);
    }
}
