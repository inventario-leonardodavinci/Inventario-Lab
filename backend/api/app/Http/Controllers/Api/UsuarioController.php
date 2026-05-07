<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Requests\UsuarioIndexRequest;
use App\Http\Resources\UsuarioResource;
use App\Models\UsuarioApp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UsuarioController extends Controller
{
    /**
     * Lista todos los usuarios con su rol actual.
     * Solo accesible para administradores.
     */
    public function index(UsuarioIndexRequest $request): JsonResponse
    {
        $perPage = (int) $request->validated('per_page', 25);

        $usuarios = UsuarioApp::query()
            ->with('roles:id,name')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->through(fn (UsuarioApp $u) => (new UsuarioResource($u))->toArray($request));

        return ApiResponse::paginated(
            $usuarios->items(),
            [
                'current_page' => $usuarios->currentPage(),
                'last_page'    => $usuarios->lastPage(),
                'total'        => $usuarios->total(),
            ]
        );
    }

    public function resumen(): JsonResponse
    {
        $base = UsuarioApp::query();

        return ApiResponse::success([
            'total'    => (clone $base)->count(),
            'activos'  => (clone $base)->where('activo', true)->count(),
            'inactivos'=> (clone $base)->where('activo', false)->count(),
        ]);
    }

    /**
     * Actualiza el rol de un usuario.
     * Un administrador no puede cambiar su propio rol.
     */
    public function actualizarRol(Request $request, UsuarioApp $usuario): JsonResponse
    {
        $validados = $request->validate([
            'rol' => ['required', 'string', 'in:administrador,profesor,consultor'],
        ], [
            'rol.required' => 'El rol es obligatorio.',
            'rol.in'       => 'El rol debe ser uno de: administrador, profesor, consultor.',
        ]);

        /** @var UsuarioApp $usuarioAutenticado */
        $usuarioAutenticado = $request->attributes->get('app_user');

        if ($usuarioAutenticado->id === $usuario->id) {
            return ApiResponse::error('No puedes cambiar tu propio rol.', 422);
        }

        $usuario->syncRoles([$validados['rol']]);
        $usuario->load('roles:id,name');

        return ApiResponse::success((new UsuarioResource($usuario))->toArray($request));
    }

    /**
     * Activa o desactiva un usuario.
     * Un administrador no puede desactivarse a sí mismo.
     */
    public function actualizarEstado(Request $request, UsuarioApp $usuario): JsonResponse
    {
        $validados = $request->validate([
            'activo' => ['required', 'boolean'],
        ]);

        /** @var UsuarioApp $usuarioAutenticado */
        $usuarioAutenticado = $request->attributes->get('app_user');

        if ($usuarioAutenticado->id === $usuario->id) {
            return ApiResponse::error('No puedes desactivar tu propia cuenta.', 422);
        }

        $usuario->update(['activo' => $validados['activo']]);
        $usuario->load('roles:id,name');

        return ApiResponse::success((new UsuarioResource($usuario))->toArray($request));
    }

    /**
     * Elimina un usuario y todos sus datos asociados.
     * Un administrador no puede eliminarse a sí mismo.
     */
    public function destroy(Request $request, UsuarioApp $usuario): JsonResponse
    {
        /** @var UsuarioApp $usuarioAutenticado */
        $usuarioAutenticado = $request->attributes->get('app_user');

        if ($usuarioAutenticado->id === $usuario->id) {
            return ApiResponse::error('No puedes eliminar tu propia cuenta.', 422);
        }

        DB::transaction(function () use ($usuario): void {
            $usuario->roles()->detach();

            DB::table('historial_sesiones')
                ->where('usuario_id', $usuario->id)
                ->delete();

            DB::table('registros_auditoria')
                ->where('usuario_id', $usuario->id)
                ->update(['usuario_id' => null]);

            $usuario->delete();
        });

        return ApiResponse::deleted();
    }

}
