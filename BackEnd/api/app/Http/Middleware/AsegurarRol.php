<?php

namespace App\Http\Middleware;

use App\Models\UsuarioApp;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AsegurarRol
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        /** @var UsuarioApp|null $usuarioApp */
        $usuarioApp = $request->attributes->get('app_user');

        if (! $usuarioApp) {
            return new JsonResponse(['message' => 'No autorizado'], Response::HTTP_UNAUTHORIZED);
        }

        $tieneRol = $usuarioApp->roles->pluck('name')->intersect($roles)->isNotEmpty();
        if (! $tieneRol) {
            return new JsonResponse(['message' => 'Prohibido'], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
