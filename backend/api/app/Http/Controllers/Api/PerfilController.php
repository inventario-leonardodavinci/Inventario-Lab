<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Models\HistorialSesion;
use App\Models\UsuarioApp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PerfilController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        /** @var UsuarioApp $usuarioApp */
        $usuarioApp = $request->attributes->get('app_user');

        return ApiResponse::success([
            'id'             => $usuarioApp->id,
            'auth_user_id'   => $usuarioApp->auth_user_id,
            'nombre_visible' => $usuarioApp->nombre_visible,
            'roles'          => $usuarioApp->roles->map(fn ($r) => ['id' => $r->id, 'name' => $r->name])->values()->toArray(),
            'created_at'     => $usuarioApp->created_at,
        ]);
    }

    public function actualizar(Request $request): JsonResponse
    {
        /** @var UsuarioApp $usuarioApp */
        $usuarioApp = $request->attributes->get('app_user');

        $validados = $request->validate([
            'nombre_visible' => ['sometimes', 'string', 'max:180'],
        ], [
            'nombre_visible.string' => 'El nombre visible debe ser una cadena de texto.',
            'nombre_visible.max'    => 'El nombre visible no puede superar los 180 caracteres.',
        ]);

        if (! empty($validados)) {
            $usuarioApp->update($validados);
        }

        $usuarioApp->load('roles');

        return ApiResponse::success([
            'id'             => $usuarioApp->id,
            'nombre_visible' => $usuarioApp->nombre_visible,
            'roles'          => $usuarioApp->roles->map(fn ($r) => ['id' => $r->id, 'name' => $r->name])->values()->toArray(),
        ]);
    }

    public function historialSesiones(Request $request): JsonResponse
    {
        /** @var UsuarioApp $usuarioApp */
        $usuarioApp = $request->attributes->get('app_user');

        $historial = HistorialSesion::query()
            ->where('usuario_id', $usuarioApp->id)
            ->orderByDesc('iniciada_en')
            ->limit(50)
            ->get()
            ->map(fn (HistorialSesion $s): array => [
                'id'                => $s->id,
                'ip_address'        => $s->ip_address,
                'dispositivo'       => $s->dispositivo,
                'navegador'         => $s->navegador,
                'sistema_operativo' => $s->sistema_operativo,
                'pais'              => $s->pais,
                'ciudad'            => $s->ciudad,
                'tipo_evento'       => $s->tipo_evento ?? 'login',
                'exitoso'           => $s->exitoso ?? true,
                'iniciada_en'       => $s->iniciada_en?->toISOString(),
                'user_agent'        => $s->user_agent,
            ]);

        return ApiResponse::success($historial->toArray());
    }

    public function eliminarSesion(Request $request, int $sesionId): JsonResponse
    {
        /** @var UsuarioApp $usuarioApp */
        $usuarioApp = $request->attributes->get('app_user');

        $sesion = HistorialSesion::query()
            ->where('id', $sesionId)
            ->where('usuario_id', $usuarioApp->id)
            ->first();

        if (! $sesion) {
            return ApiResponse::notFound('Sesión', $sesionId);
        }

        $sesion->delete();

        return ApiResponse::success([], 'Sesión eliminada correctamente.');
    }
}
