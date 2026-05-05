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
            ->first();

        if (! $usuarioApp) {
            // Primer acceso: crear el usuario automáticamente.
            // Usamos X-Auth-User-Name si el cliente lo envía (flujo OAuth/Google/Apple).
            $nombreCabecera = $request->header('X-Auth-User-Name');
            $nombreInicial  = (is_string($nombreCabecera) && $nombreCabecera !== '')
                ? mb_substr(trim($nombreCabecera), 0, 180)
                : 'Usuario';

            $usuarioApp = UsuarioApp::query()->create([
                'auth_user_id'   => $idUsuarioAutenticado,
                'nombre_visible' => $nombreInicial,
                'activo'         => true,
            ]);

            $usuarioApp->load('roles');
        } elseif (! $usuarioApp->activo) {
            return new JsonResponse([
                'message' => 'Cuenta desactivada. Contacta con un administrador.',
            ], Response::HTTP_FORBIDDEN);
        }

        // Asignar rol 'consultor' si el usuario no tiene ninguno
        if ($usuarioApp->roles->isEmpty()) {
            $rolConsultor = Rol::where('name', 'consultor')->first();
            if ($rolConsultor) {
                $usuarioApp->roles()->attach($rolConsultor->id);
                $usuarioApp->load('roles');
            }
        }

        // Establecer variable de sesión PostgreSQL para los triggers de auditoría.
        // Usamos SET (sin LOCAL) para que persista en toda la conexión,
        // ya que SET LOCAL solo funciona dentro de una transacción explícita.
        try {
            \Illuminate\Support\Facades\DB::statement(
                'SET app.current_user_id = ?',
                [(int) $usuarioApp->id]
            );
        } catch (\Throwable) {
            // Silencioso: no bloquear la petición si falla
        }

        $request->attributes->set('app_user', $usuarioApp);

        return $next($request);
    }
}
