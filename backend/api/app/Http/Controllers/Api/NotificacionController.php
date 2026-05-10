<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Models\HistorialSesion;
use App\Models\UsuarioApp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controller para gestión de historial de sesiones.
 * Alertas eliminadas - solo queda historial de accesos.
 */
class NotificacionController extends Controller
{
    /**
     * Lista el historial de sesiones del usuario autenticado.
     */
    public function index(Request $request): JsonResponse
    {
        $limite = min(max((int) $request->query('limit', 50), 1), 100);

        /** @var UsuarioApp $usuarioApp */
        $usuarioApp = $request->attributes->get('app_user');

        $historial = HistorialSesion::query()
            ->where('usuario_id', $usuarioApp->id)
            ->latest('iniciada_en')
            ->limit($limite)
            ->get()
            ->map(fn (HistorialSesion $s): array => [
                'id' => $s->id,
                'tipo_evento' => $s->tipo_evento,
                'dispositivo' => $s->dispositivo,
                'sistema_operativo' => $s->sistema_operativo,
                'navegador' => $s->navegador,
                'ip_address' => $s->ip_address,
                'pais' => $s->pais,
                'ciudad' => $s->ciudad,
                'exitoso' => $s->exitoso,
                'iniciada_en' => $s->iniciada_en?->toISOString(),
            ]);

        return ApiResponse::success($historial->toArray());
    }

    /**
     * Registra un evento de inicio de sesión.
     */
    public function guardarEventoLogin(Request $request): JsonResponse
    {
        /** @var UsuarioApp $usuarioApp */
        $usuarioApp = $request->attributes->get('app_user');

        $ua  = $request->userAgent() ?? '';
        $ip  = $this->resolverIp($request);
        $geo = $this->geolocalizarIp($ip);

        $tipoEvento = in_array($request->input('tipo_evento'), HistorialSesion::TIPOS_EVENTO, true)
            ? $request->input('tipo_evento')
            : 'login';

        HistorialSesion::create([
            'usuario_id'        => $usuarioApp->id,
            'ip_address'        => $ip,
            'user_agent'        => $ua,
            'dispositivo'       => $this->detectarDispositivo($ua),
            'navegador'         => $this->detectarNavegador($ua),
            'sistema_operativo' => $this->detectarSO($ua),
            'pais'              => $geo['pais'] ?? null,
            'ciudad'            => $geo['ciudad'] ?? null,
            'tipo_evento'       => $tipoEvento,
            'exitoso'           => true,
            'iniciada_en'       => now(),
        ]);

        return ApiResponse::created([
            'user_id'      => $usuarioApp->id,
            'triggered_at' => now()->toISOString(),
        ], 'Evento registrado');
    }

    /**
     * Elimina un registro del historial de sesiones.
     */
    public function destroy(int $id, Request $request): JsonResponse
    {
        /** @var UsuarioApp $usuarioApp */
        $usuarioApp = $request->attributes->get('app_user');

        $registro = HistorialSesion::query()
            ->where('id', $id)
            ->where('usuario_id', $usuarioApp->id)
            ->first();

        if (!$registro) {
            return ApiResponse::notFound('Registro no encontrado');
        }

        $registro->delete();

        return ApiResponse::success([], 'Registro eliminado');
    }

    // ─── Helpers privados ───────────────────────────────────────────────────

    private function resolverIp(Request $request): string
    {
        $candidatos = [
            $request->header('CF-Connecting-IP'),
            $request->header('X-Real-IP'),
            $request->header('X-Forwarded-For'),
            $request->ip(),
        ];

        foreach ($candidatos as $ip) {
            if (!$ip) continue;
            $primera = trim(explode(',', $ip)[0]);
            if (filter_var($primera, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                return $primera;
            }
        }

        return $request->ip() ?? '0.0.0.0';
    }

    private function geolocalizarIp(string $ip): array
    {
        if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
            return [];
        }

        if (app()->environment('local', 'testing')) {
            return [];
        }

        try {
            $url       = "http://ip-api.com/json/{$ip}?fields=status,country,city&lang=es";
            $ctx       = stream_context_create(['http' => ['timeout' => 1]]);
            $respuesta = @file_get_contents($url, false, $ctx);

            if (!$respuesta) return [];

            $datos = json_decode($respuesta, true);
            if (($datos['status'] ?? '') !== 'success') return [];

            return [
                'pais'   => $datos['country'] ?? null,
                'ciudad' => $datos['city'] ?? null,
            ];
        } catch (\Throwable) {
            return [];
        }
    }

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
            'Edg' => 'Edge', 'Edge' => 'Edge', 'OPR' => 'Opera', 'Opera' => 'Opera',
            'Chrome' => 'Chrome', 'Firefox' => 'Firefox', 'Safari' => 'Safari',
            'MSIE' => 'IE', 'Trident' => 'IE',
        ];

        foreach ($patrones as $clave => $patron) {
            if (preg_match($patron, $ua, $m)) {
                return ($nombres[$clave] ?? $clave) . ' ' . ($m[1] ?? '');
            }
        }

        return 'Desconocido';
    }

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
        if (str_contains($ua, 'CrOS')) return 'ChromeOS';
        if (str_contains($ua, 'Linux')) return 'Linux';

        return 'Desconocido';
    }
}
