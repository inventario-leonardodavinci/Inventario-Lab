<?php

/**
 * Tests unitarios (con BD) para App\Services\MovimientoService.
 *
 * Verifica: incrementarStock, decrementarStock, establecerStock,
 * aplicarDeltaStock (dispatch por tipo) y crearMovimiento (transacción atómica).
 */

use App\Models\Articulo;
use App\Models\NivelStock;
use App\Models\Ubicacion;
use App\Models\UsuarioApp;
use App\Services\MovimientoService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->servicio = app(MovimientoService::class);
});

// ─── incrementarStock ─────────────────────────────────────────────────────────

describe('incrementarStock', function () {
    it('crea un nuevo nivel de stock si no existe', function () {
        $art = Articulo::factory()->create();
        $ubi = Ubicacion::factory()->create();
        $this->servicio->incrementarStock($art->id, $ubi->id, 25.0);
        $this->assertDatabaseHas('niveles_stock', [
            'articulo_id'  => $art->id,
            'ubicacion_id' => $ubi->id,
        ]);
        expect((float) NivelStock::where('articulo_id', $art->id)->value('cantidad'))->toBe(25.0);
    });

    it('acumula sobre un nivel existente', function () {
        $art = Articulo::factory()->create();
        $ubi = Ubicacion::factory()->create();
        NivelStock::factory()->create(['articulo_id' => $art->id, 'ubicacion_id' => $ubi->id, 'cantidad' => 10.0]);
        $this->servicio->incrementarStock($art->id, $ubi->id, 15.0);
        expect((float) NivelStock::where('articulo_id', $art->id)->value('cantidad'))->toBe(25.0);
    });

    it('mantiene sub_ubicacion_id=null separado de un sub_ubicacion_id concreto', function () {
        $art = Articulo::factory()->create();
        $ubi = Ubicacion::factory()->create();
        NivelStock::factory()->create(['articulo_id' => $art->id, 'ubicacion_id' => $ubi->id, 'sub_ubicacion_id' => null, 'cantidad' => 5.0]);
        $this->servicio->incrementarStock($art->id, $ubi->id, 3.0, null);
        expect((float) NivelStock::where('articulo_id', $art->id)->whereNull('sub_ubicacion_id')->value('cantidad'))->toBe(8.0);
        $this->assertDatabaseCount('niveles_stock', 1);
    });
});

// ─── decrementarStock ─────────────────────────────────────────────────────────

describe('decrementarStock', function () {
    it('reduce el stock correctamente', function () {
        $art = Articulo::factory()->create();
        $ubi = Ubicacion::factory()->create();
        NivelStock::factory()->create(['articulo_id' => $art->id, 'ubicacion_id' => $ubi->id, 'cantidad' => 30.0]);
        $this->servicio->decrementarStock($art->id, $ubi->id, 12.0);
        expect((float) NivelStock::where('articulo_id', $art->id)->value('cantidad'))->toBe(18.0);
    });

    it('lanza RuntimeException si el stock es insuficiente', function () {
        $art = Articulo::factory()->create();
        $ubi = Ubicacion::factory()->create();
        NivelStock::factory()->create(['articulo_id' => $art->id, 'ubicacion_id' => $ubi->id, 'cantidad' => 5.0]);
        expect(fn () => $this->servicio->decrementarStock($art->id, $ubi->id, 100.0))
            ->toThrow(RuntimeException::class, 'Stock insuficiente');
    });

    it('lanza RuntimeException si no existe nivel de stock', function () {
        $art = Articulo::factory()->create();
        $ubi = Ubicacion::factory()->create();
        expect(fn () => $this->servicio->decrementarStock($art->id, $ubi->id, 5.0))
            ->toThrow(RuntimeException::class);
    });

    it('permite decrementar hasta dejar stock en cero', function () {
        $art = Articulo::factory()->create();
        $ubi = Ubicacion::factory()->create();
        NivelStock::factory()->create(['articulo_id' => $art->id, 'ubicacion_id' => $ubi->id, 'cantidad' => 10.0]);
        $this->servicio->decrementarStock($art->id, $ubi->id, 10.0);
        expect((float) NivelStock::where('articulo_id', $art->id)->value('cantidad'))->toBe(0.0);
    });
});

// ─── establecerStock ──────────────────────────────────────────────────────────

describe('establecerStock', function () {
    it('crea nivel de stock si no existe', function () {
        $art = Articulo::factory()->create();
        $ubi = Ubicacion::factory()->create();
        $this->servicio->establecerStock($art->id, $ubi->id, 42.0);
        $this->assertDatabaseHas('niveles_stock', ['articulo_id' => $art->id, 'ubicacion_id' => $ubi->id]);
        expect((float) NivelStock::where('articulo_id', $art->id)->value('cantidad'))->toBe(42.0);
    });

    it('actualiza nivel existente sin crear duplicado', function () {
        $art = Articulo::factory()->create();
        $ubi = Ubicacion::factory()->create();
        NivelStock::factory()->create(['articulo_id' => $art->id, 'ubicacion_id' => $ubi->id, 'cantidad' => 10.0]);
        $this->servicio->establecerStock($art->id, $ubi->id, 55.0);
        $this->assertDatabaseCount('niveles_stock', 1);
        expect((float) NivelStock::where('articulo_id', $art->id)->value('cantidad'))->toBe(55.0);
    });

    it('establece stock a cero sin error', function () {
        $art = Articulo::factory()->create();
        $ubi = Ubicacion::factory()->create();
        NivelStock::factory()->create(['articulo_id' => $art->id, 'ubicacion_id' => $ubi->id, 'cantidad' => 20.0]);
        $this->servicio->establecerStock($art->id, $ubi->id, 0.0);
        expect((float) NivelStock::where('articulo_id', $art->id)->value('cantidad'))->toBe(0.0);
    });
});

// ─── aplicarDeltaStock — dispatch ─────────────────────────────────────────────

describe('aplicarDeltaStock', function () {
    it('lanza RuntimeException para tipo desconocido', function () {
        $art = Articulo::factory()->create();
        $ubi = Ubicacion::factory()->create();
        expect(fn () => $this->servicio->aplicarDeltaStock('fantasma', $art->id, 5.0, null, $ubi->id))
            ->toThrow(RuntimeException::class, 'desconocido');
    });

    it('lanza RuntimeException si entrada no tiene ubicación destino', function () {
        $art = Articulo::factory()->create();
        expect(fn () => $this->servicio->aplicarDeltaStock('entrada', $art->id, 5.0, null, null))
            ->toThrow(RuntimeException::class, 'destino');
    });

    it('lanza RuntimeException si salida no tiene ubicación origen', function () {
        $art = Articulo::factory()->create();
        expect(fn () => $this->servicio->aplicarDeltaStock('salida', $art->id, 5.0, null, null))
            ->toThrow(RuntimeException::class, 'origen');
    });

    it('lanza RuntimeException si traslado no tiene origen', function () {
        $art = Articulo::factory()->create();
        $ubi = Ubicacion::factory()->create();
        expect(fn () => $this->servicio->aplicarDeltaStock('traslado', $art->id, 5.0, null, $ubi->id))
            ->toThrow(RuntimeException::class);
    });

    it('lanza RuntimeException si traslado no tiene destino', function () {
        $art = Articulo::factory()->create();
        $ubi = Ubicacion::factory()->create();
        expect(fn () => $this->servicio->aplicarDeltaStock('traslado', $art->id, 5.0, $ubi->id, null))
            ->toThrow(RuntimeException::class);
    });

    it('lanza RuntimeException si ajuste no tiene ubicación destino', function () {
        $art = Articulo::factory()->create();
        expect(fn () => $this->servicio->aplicarDeltaStock('ajuste', $art->id, 5.0, null, null))
            ->toThrow(RuntimeException::class, 'destino');
    });

    it('ejecuta entrada correctamente', function () {
        $art = Articulo::factory()->create();
        $ubi = Ubicacion::factory()->create();
        $this->servicio->aplicarDeltaStock('entrada', $art->id, 7.0, null, $ubi->id);
        expect((float) NivelStock::where('articulo_id', $art->id)->value('cantidad'))->toBe(7.0);
    });
});

// ─── crearMovimiento — transacción atómica ────────────────────────────────────

describe('crearMovimiento', function () {
    it('crea movimiento y líneas correctamente', function () {
        $usuario = UsuarioApp::factory()->create();
        $ubi     = Ubicacion::factory()->create();
        $art     = Articulo::factory()->create();
        $mov = $this->servicio->crearMovimiento([
            'tipo'                 => 'entrada',
            'ubicacion_destino_id' => $ubi->id,
            'usuario_id'           => $usuario->id,
            'lineas'               => [['articulo_id' => $art->id, 'cantidad' => 7.0]],
        ]);
        expect($mov->tipo)->toBe('entrada');
        $this->assertDatabaseHas('movimientos', ['tipo' => 'entrada', 'usuario_id' => $usuario->id]);
        $this->assertDatabaseHas('lineas_movimiento', ['articulo_id' => $art->id, 'cantidad' => 7.0]);
    });

    it('crea múltiples líneas en un solo movimiento', function () {
        $usuario = UsuarioApp::factory()->create();
        $ubi     = Ubicacion::factory()->create();
        $art1    = Articulo::factory()->create();
        $art2    = Articulo::factory()->create();
        $this->servicio->crearMovimiento([
            'tipo'                 => 'entrada',
            'ubicacion_destino_id' => $ubi->id,
            'usuario_id'           => $usuario->id,
            'lineas'               => [
                ['articulo_id' => $art1->id, 'cantidad' => 10.0],
                ['articulo_id' => $art2->id, 'cantidad' => 5.0],
            ],
        ]);
        $this->assertDatabaseCount('lineas_movimiento', 2);
    });

    it('revierte toda la transacción si hay error de stock insuficiente', function () {
        $usuario    = UsuarioApp::factory()->create();
        $ubi        = Ubicacion::factory()->create();
        $artSinStock = Articulo::factory()->create();
        expect(fn () => $this->servicio->crearMovimiento([
            'tipo'                => 'salida',
            'ubicacion_origen_id' => $ubi->id,
            'usuario_id'          => $usuario->id,
            'lineas'              => [['articulo_id' => $artSinStock->id, 'cantidad' => 100.0]],
        ]))->toThrow(RuntimeException::class);
        $this->assertDatabaseCount('movimientos', 0);
        $this->assertDatabaseCount('lineas_movimiento', 0);
    });

    it('lanza RuntimeException si la cantidad de una línea es cero', function () {
        $usuario = UsuarioApp::factory()->create();
        $ubi     = Ubicacion::factory()->create();
        $art     = Articulo::factory()->create();
        expect(fn () => $this->servicio->crearMovimiento([
            'tipo'                 => 'entrada',
            'ubicacion_destino_id' => $ubi->id,
            'usuario_id'           => $usuario->id,
            'lineas'               => [['articulo_id' => $art->id, 'cantidad' => 0.0]],
        ]))->toThrow(RuntimeException::class, 'mayor que cero');
    });

    it('lanza RuntimeException si cantidad es negativa', function () {
        $usuario = UsuarioApp::factory()->create();
        $ubi     = Ubicacion::factory()->create();
        $art     = Articulo::factory()->create();
        expect(fn () => $this->servicio->crearMovimiento([
            'tipo'                 => 'entrada',
            'ubicacion_destino_id' => $ubi->id,
            'usuario_id'           => $usuario->id,
            'lineas'               => [['articulo_id' => $art->id, 'cantidad' => -5.0]],
        ]))->toThrow(RuntimeException::class);
    });
});
