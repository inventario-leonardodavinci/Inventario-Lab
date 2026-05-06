<?php

namespace App\Http\Middleware;

use App\Http\Helpers\ApiResponse;
use App\Models\UsuarioApp;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware de autorización por permisos.
 *
 * ⚠️ Este middleware usa Spatie (laravel-permission) via UsuarioApp->can().
 * Verifica contra tablas: spatie_permissions, spatie_model_has_permissions
 *
 * NOTA: No usar tablas legacy (permisos, rol_permisos).
 * Ver docs/SISTEMA_ROLES.md para más información.
 *
 * Uso en rutas: ->middleware(['permiso:crear articulos,editar articulos'])
 */
class AsegurarPermiso
{
    public function handle(Request $request, Closure $next, string ...$permisos): Response
    {
        /** @var UsuarioApp|null $usuarioApp */
        $usuarioApp = $request->attributes->get('app_user');

        if (! $usuarioApp) {
            return ApiResponse::unauthorized();
        }

        foreach ($permisos as $permiso) {
            if ($usuarioApp->can($permiso)) {
                return $next($request);
            }
        }

        return ApiResponse::forbidden($permisos);
    }
}
