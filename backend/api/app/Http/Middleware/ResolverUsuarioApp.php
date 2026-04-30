<?php

namespace App\Http\Middleware;

use App\Models\Rol;
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
            ->where('activo', true)
            ->first();

        if (! $usuarioApp) {
            // Primer acceso: crear el usuario automáticamente
            $usuarioApp = UsuarioApp::query()->create([
                'auth_user_id'   => $idUsuarioAutenticado,
                'nombre_visible' => 'Usuario',
                'activo'         => true,
            ]);

            $usuarioApp->load('roles');
        }

        // Asignar rol 'consultor' si el usuario no tiene ninguno
        if ($usuarioApp->roles->isEmpty()) {
            $rolConsultor = Rol::where('name', 'consultor')->first();
            if ($rolConsultor) {
                $usuarioApp->roles()->attach($rolConsultor->id);
                $usuarioApp->load('roles');
            }
        }

        $request->attributes->set('app_user', $usuarioApp);

        return $next($request);
    }
}
