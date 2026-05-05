<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UsuarioApp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UsuarioController extends Controller
{
    /**
     * Lista todos los usuarios con su rol actual.
     * Solo accesible para administradores.
     */
    public function index(): JsonResponse
    {
        $usuarios = UsuarioApp::query()
            ->with('roles:id,name')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (UsuarioApp $u) => $this->serializar($u));

        return response()->json(['data' => $usuarios]);
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
            return response()->json(['message' => 'No puedes cambiar tu propio rol.'], 422);
        }

        $usuario->syncRoles([$validados['rol']]);
        $usuario->load('roles:id,name');

        return response()->json(['data' => $this->serializar($usuario)]);
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
            return response()->json(['message' => 'No puedes desactivar tu propia cuenta.'], 422);
        }

        $usuario->update(['activo' => $validados['activo']]);
        $usuario->load('roles:id,name');

        return response()->json(['data' => $this->serializar($usuario)]);
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
            return response()->json(['message' => 'No puedes eliminar tu propia cuenta.'], 422);
        }

        // Eliminar en cascada: roles, historial de sesiones, auditoría
        \Illuminate\Support\Facades\DB::transaction(function () use ($usuario): void {
            // spatie: eliminar asignaciones de roles
            $usuario->roles()->detach();

            // historial de sesiones
            \Illuminate\Support\Facades\DB::table('historial_sesiones')
                ->where('usuario_id', $usuario->id)
                ->delete();

            // registros de auditoría (poner null en usuario_id para no perder el historial)
            \Illuminate\Support\Facades\DB::table('registros_auditoria')
                ->where('usuario_id', $usuario->id)
                ->update(['usuario_id' => null]);

            $usuario->delete();
        });

        return response()->json(null, 204);
    }

    // ─── Serialización ────────────────────────────────────────────────────────

    private function serializar(UsuarioApp $usuario): array
    {
        return [
            'id'             => $usuario->id,
            'auth_user_id'   => $usuario->auth_user_id,
            'nombre_visible' => $usuario->nombre_visible,
            'activo'         => $usuario->activo,
            'roles'          => $usuario->roles->map(fn ($r) => ['id' => $r->id, 'name' => $r->name])->values(),
            'created_at'     => $usuario->created_at,
            'updated_at'     => $usuario->updated_at,
        ];
    }
}
