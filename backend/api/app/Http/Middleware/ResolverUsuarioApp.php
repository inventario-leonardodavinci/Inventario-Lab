<?php

namespace App\Http\Middleware;

use App\Models\UsuarioApp;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolverUsuarioApp
{
    public function handle(Request $request, Closure $next): Response
    {
        $idUsuarioAutenticado = $request->header('X-Auth-User-Id');

        if (! is_string($idUsuarioAutenticado) || $idUsuarioAutenticado === '') {
            return new JsonResponse([
                'message' => 'No autorizado: falta la cabecera X-Auth-User-Id.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $usuarioApp = UsuarioApp::query()
            ->with('roles')
            ->where('auth_user_id', $idUsuarioAutenticado)
            ->first();

        if (! $usuarioApp) {
            // Primer acceso: crear el usuario automáticamente.
            // Usamos X-Auth-User-Name si el cliente lo envía (flujo OAuth/Google/Apple).
            // Nunca guardar el placeholder genérico 'Usuario' — si no hay nombre real,
            // usar la parte local del email (cabecera X-Auth-User-Email) como fallback.
            $nombreCabecera = $request->header('X-Auth-User-Name');
            $emailCabecera  = $request->header('X-Auth-User-Email') ?? '';

            $nombreLimpio = (is_string($nombreCabecera) && trim($nombreCabecera) !== '' && trim($nombreCabecera) !== 'Usuario')
                ? mb_substr(trim($nombreCabecera), 0, 180)
                : null;

            if (! $nombreLimpio && $emailCabecera !== '') {
                // Parte local del email como fallback (p.ej. "juan.garcia" de "juan.garcia@gmail.com")
                $nombreLimpio = mb_substr(explode('@', $emailCabecera)[0], 0, 180);
            }

            $nombreInicial = $nombreLimpio ?? 'Usuario';

            $usuarioApp = UsuarioApp::query()->create([
                'auth_user_id'   => $idUsuarioAutenticado,
                'nombre_visible' => $nombreInicial,
                'activo'         => true,
            ]);

            $usuarioApp->load('roles');
        } elseif (! $usuarioApp->activo) {
            return new JsonResponse([
                'message' => 'Cuenta desactivada. Contacta con un profesor.'
            ], Response::HTTP_FORBIDDEN);
        }

        // Asignar rol 'consultor' si el usuario no tiene ninguno aún
        if (! $usuarioApp->hasAnyRole(['profesor', 'consultor'])) {
            $usuarioApp->assignRole('consultor');
            app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
            $usuarioApp->load('roles');
        }

        // ── Sincronizar rol elevado desde insforge ───────────────────────────────
        // Si el cliente envía X-Auth-User-Role: profesor, se actualiza
        // el rol en BD. Nunca se degrada: un 'profesor' promovido por un admin no
        // vuelve a 'consultor' aunque su metadata de insforge diga 'consultor'.
        $roleDesdeHeader = $request->header('X-Auth-User-Role');
        $rolesElevados   = ['profesor'];

        if (in_array($roleDesdeHeader, $rolesElevados, true)) {
            $rolActual = $usuarioApp->roles->first()?->name;
            if ($rolActual !== $roleDesdeHeader) {
                $usuarioApp->syncRoles([$roleDesdeHeader]);
                app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
                $usuarioApp->load('roles');
            }
        }

        // ── Promoverse por email si está en la lista PROFESOR_EMAILS ────────────
        // Si el email del usuario coincide con uno de los emails de profesor
        // configurados en .env, se promueve automáticamente a profesor.
        // Útil para cuentas OAuth (Google) que se crean como 'consultor' por defecto.
        $emailHeader  = $request->header('X-Auth-User-Email');
        $profesorEmails = array_filter(array_map('trim', explode(',', (string) config('constantes.profesor_emails', env('PROFESOR_EMAILS', env('ADMIN_EMAILS', ''))))));

        if ($emailHeader && in_array($emailHeader, $profesorEmails, true)) {
            $rolActual = $usuarioApp->roles->first()?->name;
            if ($rolActual !== 'profesor') {
                $usuarioApp->syncRoles(['profesor']);
                app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
                $usuarioApp->load('roles');
            }
        }

        // Almacenar el usuario resuelto en los atributos de la request.
        // El middleware AuditarEscritura se encarga de SET LOCAL app.current_user_id
        // dentro de una transacción explícita para que los triggers de auditoría
        // puedan leerlo correctamente incluso con connection pooling.
        $request->attributes->set('app_user', $usuarioApp);

        return $next($request);
    }
}
