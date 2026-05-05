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

Route::prefix('v1')->middleware(['throttle:api', 'app.user'])->group(function (): void {

    // ── Perfil ────────────────────────────────────────────────────────────────
    Route::get('/perfil', PerfilController::class);
    Route::patch('/perfil', [PerfilController::class, 'actualizar']);
    Route::get('/perfil/historial-sesiones', [PerfilController::class, 'historialSesiones']);

    // ── Inventario (ruta legacy — se mantiene para compatibilidad) ────────────
    Route::get('/inventario', [InventarioController::class, 'index']);
    Route::post('/inventario', [InventarioController::class, 'store'])->middleware('role:administrador,profesor');

    // ── Artículos ─────────────────────────────────────────────────────────────
    Route::get('/articulos', [ArticuloController::class, 'index']);
    Route::post('/articulos', [ArticuloController::class, 'store'])->middleware('role:administrador,profesor');
    Route::get('/articulos/{articulo}', [ArticuloController::class, 'show']);
    Route::patch('/articulos/{articulo}', [ArticuloController::class, 'update'])->middleware('role:administrador,profesor');
    Route::delete('/articulos/{articulo}', [ArticuloController::class, 'destroy'])->middleware('role:administrador');

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
    Route::get('/movimientos', [MovimientoController::class, 'index']);
    Route::post('/movimientos', [MovimientoController::class, 'store'])->middleware(['role:administrador,profesor', 'throttle:escritura']);

    // ── Alertas ───────────────────────────────────────────────────────────────
    Route::get('/alertas', [AlertaController::class, 'index']);
    Route::post('/alertas/{alerta}/confirmar', [AlertaController::class, 'confirmar'])->middleware('role:administrador,profesor');
    Route::post('/alertas/{alerta}/resolver', [AlertaController::class, 'resolver'])->middleware('role:administrador,profesor');

    // ── Mantenimiento ─────────────────────────────────────────────────────────
    Route::get('/mantenimiento/activos', [MantenimientoController::class, 'index']);
    Route::post('/mantenimiento/activos', [MantenimientoController::class, 'store'])->middleware('role:administrador,profesor');
    Route::patch('/mantenimiento/activos/{activo}', [MantenimientoController::class, 'update'])->middleware('role:administrador,profesor');

    // ── Usuarios (solo administrador) ─────────────────────────────────────────
    Route::get('/usuarios', [UsuarioController::class, 'index'])->middleware('role:administrador');
    Route::patch('/usuarios/{usuario}/rol', [UsuarioController::class, 'actualizarRol'])->middleware('role:administrador');

    // ── Auditoría (solo administrador) ────────────────────────────────────────
    Route::get('/auditoria', [AuditoriaController::class, 'index'])->middleware('role:administrador');

    // ── Notificaciones ────────────────────────────────────────────────────────
    Route::get('/notificaciones', [NotificacionController::class, 'index']);
    Route::post('/notificaciones/evento-login', [NotificacionController::class, 'guardarEventoLogin'])->middleware('throttle:login-evento');
});
