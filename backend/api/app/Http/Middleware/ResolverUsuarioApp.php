<?php

namespace App\Http\Middleware;

use App\Models\UsuarioApp;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolverUsuarioApp
{
    public function handle(Request $request, Closure $next): Response
    {
        $idUsuarioAutenticado = $request->header('X-Auth-User-Id');

        if (! is_string($idUsuarioAutenticado) || $idUsuarioAutenticado === '') {
            return new JsonResponse([
                'message' => 'No autorizado: falta la cabecera X-Auth-User-Id.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $usuarioApp = UsuarioApp::query()
            ->with('roles')
            ->where('auth_user_id', $idUsuarioAutenticado)
            ->where('is_active', true)
            ->first();

        if (! $usuarioApp) {
            // Primer acceso: crear el usuario automáticamente (p.ej. login OAuth)
            $usuarioApp = UsuarioApp::query()->create([
                'auth_user_id' => $idUsuarioAutenticado,
                'display_name' => 'Usuario',
                'is_active'    => true,
            ]);
            $usuarioApp->load('roles');
        }

        $request->attributes->set('app_user', $usuarioApp);

        return $next($request);
    }
}
