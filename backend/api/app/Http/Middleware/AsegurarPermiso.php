<?php

namespace App\Http\Middleware;

use App\Models\UsuarioApp;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Verifica permisos granulares usando spatie/laravel-permission.
 */
class AsegurarPermiso
{
    public function handle(Request $request, Closure $next, string ...$permisos): Response
    {
        /** @var UsuarioApp|null $usuarioApp */
        $usuarioApp = $request->attributes->get('app_user');

        if (! $usuarioApp) {
            return new JsonResponse(
                ['message' => 'No autorizado. Inicia sesión primero.'],
                Response::HTTP_UNAUTHORIZED
            );
        }

        foreach ($permisos as $permiso) {
            if ($usuarioApp->can($permiso)) {
                return $next($request);
            }
        }

        return new JsonResponse(
            [
                'message'              => 'No tienes permiso para realizar esta acción.',
                'permisos_requeridos'  => $permisos,
            ],
            Response::HTTP_FORBIDDEN
        );
    }
}
