<?php

use App\Http\Controllers\Api\ArticuloController;
use App\Http\Controllers\Api\AuditoriaController;
use App\Http\Controllers\Api\CategoriaController;
use App\Http\Controllers\Api\MantenimientoController;
use App\Http\Controllers\Api\MovimientoController;
use App\Http\Controllers\Api\NotificacionController;
use App\Http\Controllers\Api\PerfilController;
use App\Http\Controllers\Api\UbicacionController;
use App\Http\Controllers\Api\SubUbicacionController;
use App\Http\Controllers\Api\UsuarioController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware(['throttle:api', 'app.user', 'audit.write'])->group(function (): void {

    // ── Perfil ────────────────────────────────────────────────────────────────
    Route::get('/perfil', PerfilController::class);
    Route::patch('/perfil', [PerfilController::class, 'actualizar']);
    Route::get('/perfil/historial-sesiones', [PerfilController::class, 'historialSesiones']);
    Route::delete('/perfil/sesiones/{sesionId}', [PerfilController::class, 'eliminarSesion']);

    // ── Artículos ─────────────────────────────────────────────────────────────
    Route::prefix('/articulos')->group(function (): void {
        Route::get('/', [ArticuloController::class, 'index']);
        Route::get('/resumen', [ArticuloController::class, 'resumen']);
        Route::post('/', [ArticuloController::class, 'store'])->middleware('role:profesor');
        Route::get('/{articulo}', [ArticuloController::class, 'show']);
        Route::patch('/{articulo}', [ArticuloController::class, 'update'])->middleware('role:profesor');
        Route::delete('/{articulo}', [ArticuloController::class, 'destroy'])->middleware('role:profesor');
    });

    // ── Ubicaciones ───────────────────────────────────────────────────────────
    Route::get('/ubicaciones', [UbicacionController::class, 'index']);
    Route::post('/ubicaciones', [UbicacionController::class, 'store'])->middleware('role:profesor');
    Route::get('/ubicaciones/{ubicacion}', [UbicacionController::class, 'show']);
    Route::patch('/ubicaciones/{ubicacion}', [UbicacionController::class, 'update'])->middleware('role:profesor');
    Route::get('/ubicaciones/{ubicacion}/sub-ubicaciones', [SubUbicacionController::class, 'porUbicacion']);

    // ── Sub-ubicaciones ───────────────────────────────────────────────────────
    Route::get('/sub-ubicaciones', [SubUbicacionController::class, 'index']);
    Route::post('/sub-ubicaciones', [SubUbicacionController::class, 'store'])->middleware('role:profesor');
    Route::get('/sub-ubicaciones/{subUbicacion}', [SubUbicacionController::class, 'show']);
    Route::patch('/sub-ubicaciones/{subUbicacion}', [SubUbicacionController::class, 'update'])->middleware('role:profesor');
    Route::delete('/sub-ubicaciones/{subUbicacion}', [SubUbicacionController::class, 'destroy'])->middleware('role:profesor');

    // ── Categorías ────────────────────────────────────────────────────────────
    Route::get('/categorias', [CategoriaController::class, 'index']);
    Route::post('/categorias', [CategoriaController::class, 'store'])->middleware('role:profesor');
    Route::get('/categorias/{categoria}', [CategoriaController::class, 'show']);
    Route::patch('/categorias/{categoria}', [CategoriaController::class, 'update'])->middleware('role:profesor');
    Route::delete('/categorias/{categoria}', [CategoriaController::class, 'destroy'])->middleware('role:profesor');

    // ── Movimientos ───────────────────────────────────────────────────────────
    Route::get('/movimientos/resumen-hoy', [MovimientoController::class, 'resumenHoy']);
    Route::get('/movimientos/resumen-rango', [MovimientoController::class, 'resumenRango']);
    Route::get('/movimientos', [MovimientoController::class, 'index']);
    Route::post('/movimientos', [MovimientoController::class, 'store'])->middleware(['role:profesor', 'throttle:escritura']);

    // ── Mantenimiento ─────────────────────────────────────────────────────────
    Route::prefix('/mantenimiento/activos')->group(function (): void {
        Route::get('/', [MantenimientoController::class, 'index']);
        Route::get('/resumen', [MantenimientoController::class, 'resumen']);
        Route::post('/', [MantenimientoController::class, 'store'])->middleware('role:profesor');
        Route::patch('/{activo}', [MantenimientoController::class, 'update'])->middleware('role:profesor');
        Route::delete('/{activo}', [MantenimientoController::class, 'destroy'])->middleware('role:profesor');
    });

    // ── Usuarios (solo profesor) ──────────────────────────────────────────────
    Route::prefix('/usuarios')->middleware('role:profesor')->group(function (): void {
        Route::get('/', [UsuarioController::class, 'index']);
        Route::get('/resumen', [UsuarioController::class, 'resumen']);
        Route::patch('/{usuario}/rol', [UsuarioController::class, 'actualizarRol']);
        Route::patch('/{usuario}/estado', [UsuarioController::class, 'actualizarEstado']);
        Route::delete('/{usuario}', [UsuarioController::class, 'destroy']);
    });

    // ── Auditoría (solo profesor) ─────────────────────────────────────────────
    Route::get('/auditoria', [AuditoriaController::class, 'index'])->middleware('role:profesor');

    // ── Evento login (registro de acceso) ─────────────────────────────────────
    Route::post('/notificaciones/evento-login', [NotificacionController::class, 'guardarEventoLogin']);
});
