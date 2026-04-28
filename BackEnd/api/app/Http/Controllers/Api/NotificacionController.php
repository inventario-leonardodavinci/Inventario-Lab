<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EventoAlerta;
use App\Models\UsuarioApp;
use App\Services\NovuService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificacionController extends Controller
{
    public function __construct(private readonly NovuService $novuService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        /** @var UsuarioApp $usuarioApp */
        $usuarioApp = $request->attributes->get('app_user');

        $alertas = EventoAlerta::query()
            ->whereIn('status', ['open', 'acknowledged'])
            ->latest('triggered_at')
            ->limit(20)
            ->get()
            ->map(fn (EventoAlerta $evento): array => [
                'id' => $evento->id,
                'title' => 'Alerta: '.strtoupper($evento->alert_type),
                'body' => $evento->resolution_notes ?: 'Nueva alerta pendiente de revision.',
                'status' => $evento->status,
                'created_at' => $evento->triggered_at,
                'user_id' => $usuarioApp->id,
            ]);

        return response()->json([
            'data' => $alertas,
            'unread_count' => $alertas->where('status', 'open')->count(),
        ]);
    }

    public function guardarEventoLogin(Request $request): JsonResponse
    {
        /** @var UsuarioApp $usuarioApp */
        $usuarioApp = $request->attributes->get('app_user');

        $this->novuService->triggerLoginEvent(
            $usuarioApp->auth_user_id,
            $usuarioApp->display_name ?? 'Usuario'
        );

        return response()->json([
            'message' => 'Evento de inicio de sesion recibido.',
            'user_id' => $usuarioApp->id,
            'triggered_at' => now()->toISOString(),
        ], 201);
    }
}
