<?php

/**
 * Tests para /api/v1/movimientos.
 * Cubre: resumen-hoy, resumen-rango, index, store (entrada/salida/traslado/ajuste).
 */

use App\Models\Articulo;
use App\Models\NivelStock;
use App\Models\Ubicacion;
use App\Models\UsuarioApp;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

function movHeaders(string $rol = 'profesor'): array
{
    Role::firstOrCreate(['name' => $rol, 'guard_name' => 'api']);
    $u = UsuarioApp::factory()->create(['activo' => true]);
    $u->assignRole($rol);
    return ['X-Auth-User-Id' => $u->auth_user_id];
}

function crearArticuloConStock(Ubicacion $ubi, float $cantidad = 50.0): Articulo
{
    $art = Articulo::factory()->create();
    NivelStock::factory()->create(['articulo_id' => $art->id, 'ubicacion_id' => $ubi->id, 'cantidad' => $cantidad]);
    return $art;
}

// ─── RESUMEN HOY ──────────────────────────────────────────────────────────────

describe('GET /movimientos/resumen-hoy', function () {
    it('devuelve estructura correcta con todos los tipos en cero', function () {
        $this->getJson('/api/v1/movimientos/resumen-hoy', movHeaders())
            ->assertStatus(200)
            ->assertJsonStructure(['data' => ['entradas_hoy', 'salidas_hoy', 'ajustes_hoy', 'traslados_hoy']])
            ->assertJsonPath('data.entradas_hoy', 0)
            ->assertJsonPath('data.salidas_hoy', 0);
    });
});

// ─── RESUMEN RANGO ────────────────────────────────────────────────────────────

describe('GET /movimientos/resumen-rango', function () {
    it('devuelve estructura completa para rango válido', function () {
        $this->getJson('/api/v1/movimientos/resumen-rango?desde=2024-01-01&hasta=2024-01-31', movHeaders())
            ->assertStatus(200)
            ->assertJsonStructure(['data' => ['desde', 'hasta', 'total_movimientos', 'entradas', 'salidas', 'ajustes', 'traslados']]);
    });

    it('devuelve 422 si falta desde', function () {
        $this->getJson('/api/v1/movimientos/resumen-rango?hasta=2024-01-31', movHeaders())
            ->assertStatus(422);
    });

    it('devuelve 422 si falta hasta', function () {
        $this->getJson('/api/v1/movimientos/resumen-rango?desde=2024-01-01', movHeaders())
            ->assertStatus(422);
    });

    it('devuelve 422 si hasta es anterior a desde', function () {
        $this->getJson('/api/v1/movimientos/resumen-rango?desde=2024-06-30&hasta=2024-01-01', movHeaders())
            ->assertStatus(422);
    });

    it('acepta desde igual a hasta', function () {
        $this->getJson('/api/v1/movimientos/resumen-rango?desde=2024-01-15&hasta=2024-01-15', movHeaders())
            ->assertStatus(200);
    });
});

// ─── INDEX ────────────────────────────────────────────────────────────────────

describe('GET /movimientos — listado paginado', function () {
    it('devuelve estructura paginada correcta', function () {
        $this->getJson('/api/v1/movimientos', movHeaders())
            ->assertStatus(200)
            ->assertJsonStructure(['data', 'meta' => ['current_page', 'last_page', 'total']])
            ->assertJsonPath('meta.total', 0);
    });

    it('consultor puede ver el listado', function () {
        $this->getJson('/api/v1/movimientos', movHeaders('consultor'))
            ->assertStatus(200);
    });
});

// ─── STORE — ENTRADA ──────────────────────────────────────────────────────────

describe('POST /movimientos — entrada', function () {
    it('crea entrada y genera nivel de stock', function () {
        $ubi = Ubicacion::factory()->create();
        $art = Articulo::factory()->create();
        $this->postJson('/api/v1/movimientos', [
            'tipo'                 => 'entrada',
            'ubicacion_destino_id' => $ubi->id,
            'lineas'               => [['articulo_id' => $art->id, 'cantidad' => 15]],
        ], movHeaders())->assertStatus(201);
        $nivel = NivelStock::where('articulo_id', $art->id)->where('ubicacion_id', $ubi->id)->first();
        expect((float) $nivel->cantidad)->toBe(15.0);
    });

    it('acumula stock en nivel existente', function () {
        $ubi = Ubicacion::factory()->create();
        $art = crearArticuloConStock($ubi, 10.0);
        $this->postJson('/api/v1/movimientos', [
            'tipo'                 => 'entrada',
            'ubicacion_destino_id' => $ubi->id,
            'lineas'               => [['articulo_id' => $art->id, 'cantidad' => 5]],
        ], movHeaders())->assertStatus(201);
        expect((float) NivelStock::where('articulo_id', $art->id)->value('cantidad'))->toBe(15.0);
    });

    it('guarda el motivo en BD', function () {
        $ubi = Ubicacion::factory()->create();
        $art = Articulo::factory()->create();
        $this->postJson('/api/v1/movimientos', [
            'tipo'                 => 'entrada',
            'motivo'               => 'Reposición mensual',
            'ubicacion_destino_id' => $ubi->id,
            'lineas'               => [['articulo_id' => $art->id, 'cantidad' => 5]],
        ], movHeaders());
        $this->assertDatabaseHas('movimientos', ['tipo' => 'entrada', 'motivo' => 'Reposición mensual']);
    });

    it('crea las líneas de movimiento', function () {
        $ubi = Ubicacion::factory()->create();
        $art1 = Articulo::factory()->create();
        $art2 = Articulo::factory()->create();
        $this->postJson('/api/v1/movimientos', [
            'tipo'                 => 'entrada',
            'ubicacion_destino_id' => $ubi->id,
            'lineas'               => [
                ['articulo_id' => $art1->id, 'cantidad' => 10],
                ['articulo_id' => $art2->id, 'cantidad' => 20],
            ],
        ], movHeaders())->assertStatus(201);
        $this->assertDatabaseCount('lineas_movimiento', 2);
    });
});

// ─── STORE — SALIDA ───────────────────────────────────────────────────────────

describe('POST /movimientos — salida', function () {
    it('reduce el stock correctamente', function () {
        $ubi = Ubicacion::factory()->create();
        $art = crearArticuloConStock($ubi, 30.0);
        $this->postJson('/api/v1/movimientos', [
            'tipo'                => 'salida',
            'ubicacion_origen_id' => $ubi->id,
            'lineas'              => [['articulo_id' => $art->id, 'cantidad' => 12]],
        ], movHeaders())->assertStatus(201);
        expect((float) NivelStock::where('articulo_id', $art->id)->value('cantidad'))->toBe(18.0);
    });

    it('devuelve 422 si stock insuficiente', function () {
        $ubi = Ubicacion::factory()->create();
        $art = crearArticuloConStock($ubi, 5.0);
        $this->postJson('/api/v1/movimientos', [
            'tipo'                => 'salida',
            'ubicacion_origen_id' => $ubi->id,
            'lineas'              => [['articulo_id' => $art->id, 'cantidad' => 100]],
        ], movHeaders())->assertStatus(422);
    });

    it('la transacción revierte si hay error de stock en una de las líneas', function () {
        $ubi = Ubicacion::factory()->create();
        $artOk   = crearArticuloConStock($ubi, 20.0);
        $artNone = Articulo::factory()->create();
        $this->postJson('/api/v1/movimientos', [
            'tipo'                => 'salida',
            'ubicacion_origen_id' => $ubi->id,
            'lineas'              => [
                ['articulo_id' => $artOk->id,   'cantidad' => 5],
                ['articulo_id' => $artNone->id,  'cantidad' => 999],
            ],
        ], movHeaders())->assertStatus(422);
        $this->assertDatabaseCount('movimientos', 0);
        expect((float) NivelStock::where('articulo_id', $artOk->id)->value('cantidad'))->toBe(20.0);
    });
});

// ─── STORE — TRASLADO ─────────────────────────────────────────────────────────

describe('POST /movimientos — traslado', function () {
    it('reduce stock en origen y aumenta en destino', function () {
        $origen  = Ubicacion::factory()->create();
        $destino = Ubicacion::factory()->create();
        $art = crearArticuloConStock($origen, 20.0);
        $this->postJson('/api/v1/movimientos', [
            'tipo'                  => 'traslado',
            'ubicacion_origen_id'   => $origen->id,
            'ubicacion_destino_id'  => $destino->id,
            'lineas'                => [['articulo_id' => $art->id, 'cantidad' => 8]],
        ], movHeaders())->assertStatus(201);
        expect((float) NivelStock::where('articulo_id', $art->id)->where('ubicacion_id', $origen->id)->value('cantidad'))->toBe(12.0);
        expect((float) NivelStock::where('articulo_id', $art->id)->where('ubicacion_id', $destino->id)->value('cantidad'))->toBe(8.0);
    });
});

// ─── STORE — AJUSTE ───────────────────────────────────────────────────────────

describe('POST /movimientos — ajuste', function () {
    it('establece el stock exactamente al valor indicado', function () {
        $ubi = Ubicacion::factory()->create();
        $art = crearArticuloConStock($ubi, 10.0);
        $this->postJson('/api/v1/movimientos', [
            'tipo'                  => 'ajuste',
            'ubicacion_destino_id'  => $ubi->id,
            'lineas'                => [['articulo_id' => $art->id, 'cantidad' => 99]],
        ], movHeaders())->assertStatus(201);
        expect((float) NivelStock::where('articulo_id', $art->id)->value('cantidad'))->toBe(99.0);
    });
});

// ─── VALIDACIÓN ───────────────────────────────────────────────────────────────

describe('POST /movimientos — validación de entrada', function () {
    it('devuelve 422 si falta tipo', function () {
        $ubi = Ubicacion::factory()->create();
        $art = Articulo::factory()->create();
        $this->postJson('/api/v1/movimientos', [
            'ubicacion_destino_id' => $ubi->id,
            'lineas'               => [['articulo_id' => $art->id, 'cantidad' => 5]],
        ], movHeaders())->assertStatus(422);
    });

    it('devuelve 422 si tipo no es válido', function () {
        $ubi = Ubicacion::factory()->create();
        $art = Articulo::factory()->create();
        $this->postJson('/api/v1/movimientos', [
            'tipo'                 => 'transferencia',
            'ubicacion_destino_id' => $ubi->id,
            'lineas'               => [['articulo_id' => $art->id, 'cantidad' => 5]],
        ], movHeaders())->assertStatus(422);
    });

    it('devuelve 422 si lineas está vacío', function () {
        $ubi = Ubicacion::factory()->create();
        $this->postJson('/api/v1/movimientos', [
            'tipo'                 => 'entrada',
            'ubicacion_destino_id' => $ubi->id,
            'lineas'               => [],
        ], movHeaders())->assertStatus(422);
    });

    it('devuelve 422 si cantidad es cero', function () {
        $ubi = Ubicacion::factory()->create();
        $art = Articulo::factory()->create();
        $this->postJson('/api/v1/movimientos', [
            'tipo'                 => 'entrada',
            'ubicacion_destino_id' => $ubi->id,
            'lineas'               => [['articulo_id' => $art->id, 'cantidad' => 0]],
        ], movHeaders())->assertStatus(422);
    });

    it('devuelve 422 si articulo_id no existe', function () {
        $ubi = Ubicacion::factory()->create();
        $this->postJson('/api/v1/movimientos', [
            'tipo'                 => 'entrada',
            'ubicacion_destino_id' => $ubi->id,
            'lineas'               => [['articulo_id' => 99999, 'cantidad' => 5]],
        ], movHeaders())->assertStatus(422);
    });

    it('consultor recibe 403 al intentar crear movimiento', function () {
        $ubi = Ubicacion::factory()->create();
        $art = Articulo::factory()->create();
        $this->postJson('/api/v1/movimientos', [
            'tipo'                 => 'entrada',
            'ubicacion_destino_id' => $ubi->id,
            'lineas'               => [['articulo_id' => $art->id, 'cantidad' => 5]],
        ], movHeaders('consultor'))->assertStatus(403);
    });
});
