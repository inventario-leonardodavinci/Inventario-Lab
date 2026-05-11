<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * Envuelve las peticiones de escritura (POST, PATCH, PUT, DELETE) en una
 * transacción de base de datos y establece SET LOCAL app.current_user_id
 * antes de ejecutar el handler.
 *
 * Esto garantiza que los triggers de auditoría (fn_auditoria) puedan leer
 * el usuario actual incluso con connection pooling, ya que SET LOCAL es
 * visible para todos los statements dentro de la misma transacción.
 *
 * Requiere que ResolverUsuarioApp haya fijado el atributo 'app_user' en la
 * request antes de que este middleware se ejecute.
 */
class AuditarEscritura
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var \App\Models\UsuarioApp|null $usuarioApp */
        $usuarioApp = $request->attributes->get('app_user');

        if (! $usuarioApp || ! in_array($request->method(), ['POST', 'PATCH', 'PUT', 'DELETE'], true)) {
            return $next($request);
        }

        $ip       = $request->ip() ?? '';
        $agent    = mb_substr((string) $request->userAgent(), 0, 500);
        $url      = mb_substr($request->method() . ' ' . $request->path(), 0, 300);

        $userId = (int) $usuarioApp->id;
        // SET LOCAL no admite parámetros posicionales ($1) en PostgreSQL.
        // El user_id es un entero interno del servidor (seguro). Los strings
        // se escapan con addslashes para evitar inyección SQL.
        $ipEsc    = addslashes($ip);
        $agentEsc = addslashes($agent);
        $urlEsc   = addslashes($url);

        return DB::transaction(function () use ($request, $next, $userId, $ipEsc, $agentEsc, $urlEsc): Response {
            if (DB::getDriverName() === 'pgsql') {
                DB::statement("SET LOCAL app.current_user_id = {$userId}");
                DB::statement("SET LOCAL app.ip_address = '{$ipEsc}'");
                DB::statement("SET LOCAL app.user_agent = '{$agentEsc}'");
                DB::statement("SET LOCAL app.url_accion = '{$urlEsc}'");
            }
            return $next($request);
        });
    }
}
