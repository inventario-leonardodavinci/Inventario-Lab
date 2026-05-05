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
                'id'         => $a->id,
                'title'      => 'Alerta: ' . strtoupper($a->tipo),
                'body'       => $a->notas_resolucion ?: 'Nueva alerta pendiente de revision.',
                'status'     => $a->estado,
                'created_at' => $a->generada_en,
            ]);

        return response()->json([
            'data'         => $alertas,
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

        $ua  = $request->userAgent() ?? '';
        $ip  = $this->resolverIp($request);
        $geo = $this->geolocalizarIp($ip);

        HistorialSesion::create([
            'usuario_id'        => $usuarioApp->id,
            'ip_address'        => $ip,
            'user_agent'        => $ua,
            'dispositivo'       => $this->detectarDispositivo($ua),
            'navegador'         => $this->detectarNavegador($ua),
            'sistema_operativo' => $this->detectarSO($ua),
            'pais'              => $geo['pais'] ?? null,
            'ciudad'            => $geo['ciudad'] ?? null,
            'tipo_evento'       => 'login',
            'exitoso'           => true,
            'iniciada_en'       => now(),
        ]);

        return response()->json([
            'message'      => 'Evento de inicio de sesion recibido.',
            'user_id'      => $usuarioApp->id,
            'triggered_at' => now()->toISOString(),
        ], 201);
    }

    // ─── IP real ─────────────────────────────────────────────────────────────

    private function resolverIp(Request $request): string
    {
        $candidatos = [
            $request->header('CF-Connecting-IP'),
            $request->header('X-Real-IP'),
            $request->header('X-Forwarded-For'),
            $request->ip(),
        ];

        foreach ($candidatos as $ip) {
            if (! $ip) {
                continue;
            }
            $primera = trim(explode(',', $ip)[0]);
            if (filter_var($primera, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                return $primera;
            }
        }

        return $request->ip() ?? '0.0.0.0';
    }

    // ─── Geolocalización ─────────────────────────────────────────────────────

    private function geolocalizarIp(string $ip): array
    {
        if (! filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
            return [];
        }

        if (app()->environment('local', 'testing')) {
            return [];
        }

        try {
            $url       = "http://ip-api.com/json/{$ip}?fields=status,country,city&lang=es";
            $ctx       = stream_context_create(['http' => ['timeout' => 1]]);
            $respuesta = @file_get_contents($url, false, $ctx);

            if (! $respuesta) {
                return [];
            }

            $datos = json_decode($respuesta, true);

            if (($datos['status'] ?? '') !== 'success') {
                return [];
            }

            return [
                'pais'   => $datos['country'] ?? null,
                'ciudad' => $datos['city'] ?? null,
            ];
        } catch (\Throwable) {
            return [];
        }
    }

    // ─── Detección de dispositivo ─────────────────────────────────────────────

    private function detectarDispositivo(string $ua): string
    {
        if (preg_match('/ipad|tablet|kindle|playbook|silk|(android(?!.*mobile))/i', $ua)) {
            return 'Tablet';
        }
        if (preg_match('/mobile|android|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i', $ua)) {
            return 'Móvil';
        }
        return 'Escritorio';
    }

    // ─── Detección de navegador con versión ──────────────────────────────────

    private function detectarNavegador(string $ua): string
    {
        $patrones = [
            'Edg'     => '/Edg\/(\d+)/',
            'Edge'    => '/Edge\/(\d+)/',
            'OPR'     => '/OPR\/(\d+)/',
            'Opera'   => '/Opera\/(\d+)/',
            'Chrome'  => '/Chrome\/(\d+)/',
            'Firefox' => '/Firefox\/(\d+)/',
            'Safari'  => '/Version\/(\d+).*Safari/',
            'MSIE'    => '/MSIE (\d+)/',
            'Trident' => '/rv:(\d+).*Trident/',
        ];

        $nombres = [
            'Edg'     => 'Edge',
            'Edge'    => 'Edge',
            'OPR'     => 'Opera',
            'Opera'   => 'Opera',
            'Chrome'  => 'Chrome',
            'Firefox' => 'Firefox',
            'Safari'  => 'Safari',
            'MSIE'    => 'IE',
            'Trident' => 'IE',
        ];

        foreach ($patrones as $clave => $patron) {
            if (preg_match($patron, $ua, $m)) {
                return ($nombres[$clave] ?? $clave) . ' ' . ($m[1] ?? '');
            }
        }

        return 'Desconocido';
    }

    // ─── Detección de SO con versión ─────────────────────────────────────────

    private function detectarSO(string $ua): string
    {
        if (preg_match('/Windows NT (\d+\.\d+)/i', $ua, $m)) {
            $versiones = ['10.0' => '10/11', '6.3' => '8.1', '6.2' => '8', '6.1' => '7', '6.0' => 'Vista'];
            return 'Windows ' . ($versiones[$m[1]] ?? $m[1]);
        }
        if (preg_match('/Mac OS X (\d+[._]\d+)/i', $ua, $m)) {
            return 'macOS ' . str_replace('_', '.', $m[1]);
        }
        if (preg_match('/Android (\d+\.\d+)/i', $ua, $m)) {
            return 'Android ' . $m[1];
        }
        if (preg_match('/iPhone OS (\d+[._]\d+)/i', $ua, $m)) {
            return 'iOS ' . str_replace('_', '.', $m[1]);
        }
        if (preg_match('/iPad.*OS (\d+[._]\d+)/i', $ua, $m)) {
            return 'iPadOS ' . str_replace('_', '.', $m[1]);
        }
        if (str_contains($ua, 'CrOS')) {
            return 'ChromeOS';
        }
        if (str_contains($ua, 'Linux')) {
            return 'Linux';
        }
        return 'Desconocido';
    }
}
