<?php

namespace App\Http\Middleware;

use App\Http\Helpers\ApiResponse;
use App\Models\UsuarioApp;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware de autorización por roles.
 *
 * ⚠️ Este middleware usa Spatie (laravel-permission) via UsuarioApp->hasAnyRole().
 * Verifica contra tablas: spatie_roles, spatie_model_has_roles
 *
 * NOTA: No usar tablas legacy (roles, usuario_roles).
 * Ver docs/SISTEMA_ROLES.md para más información.
 *
 * Roles válidos: 'profesor', 'consultor'
 * Uso en rutas: ->middleware(['role:profesor'])
 */
class AsegurarRol
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        /** @var UsuarioApp|null $usuarioApp */
        $usuarioApp = $request->attributes->get('app_user');

        if (! $usuarioApp) {
            return ApiResponse::unauthorized();
        }

        if (! $usuarioApp->hasAnyRole($roles)) {
            return ApiResponse::forbidden();
        }

        return $next($request);
    }
}
