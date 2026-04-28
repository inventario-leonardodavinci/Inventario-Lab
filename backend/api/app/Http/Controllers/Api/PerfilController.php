<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UsuarioApp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PerfilController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        /** @var UsuarioApp $usuarioApp */
        $usuarioApp = $request->attributes->get('app_user');

        return response()->json([
            'id' => $usuarioApp->id,
            'auth_user_id' => $usuarioApp->auth_user_id,
            'display_name' => $usuarioApp->display_name,
            'roles' => $usuarioApp->roles->pluck('name')->values(),
        ]);
    }
}
