<?php

use App\Http\Controllers\Api\AlertaController;
use App\Http\Controllers\Api\ArticuloController;
use App\Http\Controllers\Api\AuditoriaController;
use App\Http\Controllers\Api\CategoriaController;
use App\Http\Controllers\Api\InventarioController;
use App\Http\Controllers\Api\MantenimientoController;
use App\Http\Controllers\Api\MovimientoController;
use App\Http\Controllers\Api\NotificacionController;
use App\Http\Controllers\Api\PerfilController;
use App\Http\Controllers\Api\UbicacionController;
use App\Http\Controllers\Api\UsuarioController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware(['throttle:api', 'app.user', 'audit.write'])->group(function (): void {

    // ── Perfil ────────────────────────────────────────────────────────────────
    Route::get('/perfil', PerfilController::class);
    Route::patch('/perfil', [PerfilController::class, 'actualizar']);
    Route::get('/perfil/historial-sesiones', [PerfilController::class, 'historialSesiones']);
    Route::delete('/perfil/sesiones/{sesionId}', [PerfilController::class, 'eliminarSesion']);

    // ── Inventario (ruta legacy — se mantiene para compatibilidad) ────────────
    Route::get('/inventario', [InventarioController::class, 'index']);
    Route::post('/inventario', [InventarioController::class, 'store'])->middleware('role:administrador,profesor');

    // ── Artículos ─────────────────────────────────────────────────────────────
    Route::prefix('/articulos')->group(function (): void {
        Route::get('/', [ArticuloController::class, 'index']);
        Route::get('/resumen', [ArticuloController::class, 'resumen']);
        Route::post('/', [ArticuloController::class, 'store'])->middleware('role:administrador,profesor');
        Route::get('/{articulo}', [ArticuloController::class, 'show']);
        Route::patch('/{articulo}', [ArticuloController::class, 'update'])->middleware('role:administrador,profesor');
        Route::delete('/{articulo}', [ArticuloController::class, 'destroy'])->middleware('role:administrador');
    });

    // ── Ubicaciones ───────────────────────────────────────────────────────────
    Route::get('/ubicaciones', [UbicacionController::class, 'index']);
    Route::post('/ubicaciones', [UbicacionController::class, 'store'])->middleware('role:administrador');
    Route::get('/ubicaciones/{ubicacion}', [UbicacionController::class, 'show']);
    Route::patch('/ubicaciones/{ubicacion}', [UbicacionController::class, 'update'])->middleware('role:administrador');

    // ── Categorías ────────────────────────────────────────────────────────────
    Route::get('/categorias', [CategoriaController::class, 'index']);
    Route::post('/categorias', [CategoriaController::class, 'store'])->middleware('role:administrador');
    Route::get('/categorias/{categoria}', [CategoriaController::class, 'show']);
    Route::patch('/categorias/{categoria}', [CategoriaController::class, 'update'])->middleware('role:administrador');
    Route::delete('/categorias/{categoria}', [CategoriaController::class, 'destroy'])->middleware('role:administrador');

    // ── Movimientos ───────────────────────────────────────────────────────────
    Route::get('/movimientos/resumen-hoy', [MovimientoController::class, 'resumenHoy']);
    Route::get('/movimientos/resumen-rango', [MovimientoController::class, 'resumenRango']);
    Route::get('/movimientos', [MovimientoController::class, 'index']);
    Route::post('/movimientos', [MovimientoController::class, 'store'])->middleware(['role:administrador,profesor', 'throttle:escritura']);

    // ── Mantenimiento ─────────────────────────────────────────────────────────
    Route::prefix('/mantenimiento/activos')->group(function (): void {
        Route::get('/', [MantenimientoController::class, 'index']);
        Route::get('/resumen', [MantenimientoController::class, 'resumen']);
        Route::post('/', [MantenimientoController::class, 'store'])->middleware('role:administrador,profesor');
        Route::patch('/{activo}', [MantenimientoController::class, 'update'])->middleware('role:administrador,profesor');
    });

    // ── Usuarios (solo administrador) ─────────────────────────────────────────
    Route::prefix('/usuarios')->middleware('role:administrador')->group(function (): void {
        Route::get('/', [UsuarioController::class, 'index']);
        Route::get('/resumen', [UsuarioController::class, 'resumen']);
        Route::patch('/{usuario}/rol', [UsuarioController::class, 'actualizarRol']);
        Route::patch('/{usuario}/estado', [UsuarioController::class, 'actualizarEstado']);
        Route::delete('/{usuario}', [UsuarioController::class, 'destroy']);
    });

    // ── Auditoría (solo administrador) ────────────────────────────────────────
    Route::get('/auditoria', [AuditoriaController::class, 'index'])->middleware('role:administrador');

    // ── Alertas ────────────────────────────────────────────────────────────────
    Route::get('/alertas', [AlertaController::class, 'index']);
    Route::get('/alertas/resumen', [AlertaController::class, 'resumen']);
    Route::post('/alertas/{alerta}/confirmar', [AlertaController::class, 'confirmar'])->middleware('role:administrador,profesor');
    Route::post('/alertas/{alerta}/resolver', [AlertaController::class, 'resolver'])->middleware('role:administrador,profesor');

    // ── Notificaciones ────────────────────────────────────────────────────────
    Route::get('/notificaciones', [NotificacionController::class, 'index']);
    Route::post('/notificaciones/evento-login', [NotificacionController::class, 'guardarEventoLogin'])->middleware('throttle:login-evento');
});
