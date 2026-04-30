<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alerta;
use App\Models\HistorialSesion;
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

        $alertas = Alerta::query()
            ->whereIn('estado', ['abierta', 'confirmada'])
            ->latest('generada_en')
            ->limit(20)
            ->get()
            ->map(fn (Alerta $a): array => [
                'id' => $a->id,
                'title' => 'Alerta: '.strtoupper($a->tipo),
                'body' => $a->notas_resolucion ?: 'Nueva alerta pendiente de revision.',
                'status' => $a->estado,
                'created_at' => $a->generada_en,
                'user_id' => $usuarioApp->id,
            ]);

        return response()->json([
            'data' => $alertas,
            'unread_count' => $alertas->where('status', 'abierta')->count(),
        ]);
    }

    public function guardarEventoLogin(Request $request): JsonResponse
    {
        /** @var UsuarioApp $usuarioApp */
        $usuarioApp = $request->attributes->get('app_user');

        $this->novuService->triggerLoginEvent(
            $usuarioApp->auth_user_id,
            $usuarioApp->nombre_visible ?? 'Usuario'
        );

        // Registrar en historial de sesiones
        $ua = $request->userAgent() ?? '';
        HistorialSesion::create([
            'usuario_id'       => $usuarioApp->id,
            'ip_address'       => $request->ip(),
            'user_agent'       => $ua,
            'dispositivo'      => $this->detectarDispositivo($ua),
            'navegador'        => $this->detectarNavegador($ua),
            'sistema_operativo' => $this->detectarSO($ua),
            'iniciada_en'      => now(),
        ]);

        return response()->json([
            'message' => 'Evento de inicio de sesion recibido.',
            'user_id' => $usuarioApp->id,
            'triggered_at' => now()->toISOString(),
        ], 201);
    }

    // ─── Helpers de detección de user-agent ──────────────────────────────────

    private function detectarDispositivo(string $ua): string
    {
        $ua = strtolower($ua);
        if (str_contains($ua, 'mobile') || str_contains($ua, 'android') || str_contains($ua, 'iphone')) {
            return 'Móvil';
        }
        if (str_contains($ua, 'tablet') || str_contains($ua, 'ipad')) {
            return 'Tablet';
        }
        return 'Escritorio';
    }

    private function detectarNavegador(string $ua): string
    {
        if (str_contains($ua, 'Edg/') || str_contains($ua, 'Edge/')) return 'Edge';
        if (str_contains($ua, 'OPR/') || str_contains($ua, 'Opera/')) return 'Opera';
        if (str_contains($ua, 'Chrome/') && !str_contains($ua, 'Chromium')) return 'Chrome';
        if (str_contains($ua, 'Firefox/')) return 'Firefox';
        if (str_contains($ua, 'Safari/') && !str_contains($ua, 'Chrome')) return 'Safari';
        if (str_contains($ua, 'MSIE') || str_contains($ua, 'Trident/')) return 'Internet Explorer';
        return 'Desconocido';
    }

    private function detectarSO(string $ua): string
    {
        if (str_contains($ua, 'Windows NT')) return 'Windows';
        if (str_contains($ua, 'Mac OS X') || str_contains($ua, 'Macintosh')) return 'macOS';
        if (str_contains($ua, 'Android')) return 'Android';
        if (str_contains($ua, 'iPhone') || str_contains($ua, 'iPad') || str_contains($ua, 'iOS')) return 'iOS';
        if (str_contains($ua, 'Linux')) return 'Linux';
        if (str_contains($ua, 'CrOS')) return 'ChromeOS';
        return 'Desconocido';
    }
}
