<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EventoAlerta;
use App\Models\UsuarioApp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AlertaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $alertas = EventoAlerta::query()
            ->latest('triggered_at')
            ->paginate((int) $request->query('per_page', 20));

        return response()->json($alertas);
    }

    public function confirmar(Request $request, EventoAlerta $eventoAlerta): JsonResponse
    {
        /** @var UsuarioApp $usuarioApp */
        $usuarioApp = $request->attributes->get('app_user');

        $eventoAlerta->status = 'acknowledged';
        $eventoAlerta->acknowledged_at = now();
        $eventoAlerta->acknowledged_by_user_id = $usuarioApp->id;
        $eventoAlerta->save();

        return response()->json(['data' => $eventoAlerta]);
    }
}
