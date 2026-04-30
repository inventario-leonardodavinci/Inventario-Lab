<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rol;
use App\Models\UsuarioApp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UsuarioController extends Controller
{
    /**
     * Lista todos los usuarios con su rol actual.
     * Solo accesible para administradores (protegido por middleware en rutas).
     */
    public function index(): JsonResponse
    {
        $usuarios = UsuarioApp::query()
            ->with('roles:id,name')
            ->orderBy('created_at', 'desc')
            ->get();

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

        // Un administrador no puede cambiar su propio rol
        if ($usuarioAutenticado->id === $usuario->id) {
            return response()->json([
                'message' => 'No puedes cambiar tu propio rol.',
            ], 422);
        }

        $rol = Rol::query()->where('name', $validados['rol'])->firstOrFail();

        $usuario->roles()->sync([$rol->id]);

        $usuario->load('roles:id,name');

        return response()->json(['data' => $usuario]);
    }
}
