<?php

use App\Http\Controllers\Api\AlertaController;
use App\Http\Controllers\Api\InventarioController;
use App\Http\Controllers\Api\MantenimientoController;
use App\Http\Controllers\Api\MovimientoController;
use App\Http\Controllers\Api\NotificacionController;
use App\Http\Controllers\Api\PerfilController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware(['throttle:api', 'app.user'])->group(function (): void {
    Route::get('/perfil', PerfilController::class);
    Route::patch('/perfil', [PerfilController::class, 'actualizar']);

    Route::get('/inventario', [InventarioController::class, 'index']);
    Route::post('/inventario', [InventarioController::class, 'store'])->middleware('role:admin,tecnico');

    Route::get('/movimientos/resumen-hoy', [MovimientoController::class, 'resumenHoy']);
    Route::get('/movimientos', [MovimientoController::class, 'index']);
    Route::post('/movimientos', [MovimientoController::class, 'store'])->middleware('role:admin,tecnico');

    Route::get('/alertas', [AlertaController::class, 'index']);
    Route::post('/alertas/{eventoAlerta}/confirmar', [AlertaController::class, 'confirmar'])->middleware('role:admin,tecnico');

    Route::get('/mantenimiento/activos', [MantenimientoController::class, 'index']);
    Route::post('/mantenimiento/activos', [MantenimientoController::class, 'store'])->middleware('role:admin,tecnico');

    Route::get('/notificaciones', [NotificacionController::class, 'index']);
    Route::post('/notificaciones/evento-login', [NotificacionController::class, 'guardarEventoLogin']);
});
