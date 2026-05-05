<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware para verificar permisos granulares usando spatie/laravel-permission.
 * Reemplaza AsegurarRol con un sistema más flexible de permisos.
 *
 * Ejemplo de uso en rutas:
 * Route::post('/articulos', [ArticuloController::class, 'store'])
 *     ->middleware('permiso:articulos.crear');
 *
 * Route::patch('/usuarios/{usuario}/rol', [UsuarioController::class, 'actualizarRol'])
 *     ->middleware('permiso:usuarios.editar_roles');
 */
class AsegurarPermiso
{
    public function handle(Request $request, Closure $next, string ...$permisos): Response
    {
        $usuarioApp = $request->attributes->get('app_user');

        if (! $usuarioApp) {
            return new JsonResponse(
                ['message' => 'No autorizado. Inicia sesión primero.'],
                Response::HTTP_UNAUTHORIZED
            );
        }

        // Verificar que el usuario tenga al menos uno de los permisos requeridos
        $tienePermiso = false;
        foreach ($permisos as $permiso) {
            if ($usuarioApp->hasPermissionTo($permiso)) {
                $tienePermiso = true;
                break;
            }
        }

        if (! $tienePermiso) {
            return new JsonResponse(
                [
                    'message' => 'No tienes permiso para realizar esta acción.',
                    'permisos_requeridos' => $permisos,
                ],
                Response::HTTP_FORBIDDEN
            );
        }

        return $next($request);
    }
}
