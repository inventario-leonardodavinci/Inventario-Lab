<?php

namespace App\Http\Middleware;

use App\Models\UsuarioApp;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\PermissionRegistrar;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware para resolver el usuario autenticado desde cabeceras InsForge.
 *
 * Este middleware:
 * 1. Extrae el user_id de la cabecera X-Auth-User-Id
 * 2. Crea automáticamente el usuario en BD si es primer acceso
 * 3. Asigna rol 'consultor' por defecto si no tiene ninguno
 * 4. Promueve a profesor si el email está en la lista configurada
 *
 * El usuario resuelto se almacena en $request->attributes->get('app_user')
 */
class ResolverUsuarioApp
{
    /**
     * Cabeceras requeridas para identificar al usuario.
     *
     * @var array<string>
     */
    private const CABECERAS_REQUERIDAS = ['X-Auth-User-Id'];

    /**
     * Manejar la solicitud entrante.
     *
     * @param Request $request Request HTTP entrante
     * @param Closure $next Closure para continuar con la siguiente capa
     * @return Response Respuesta procesada
     */
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
            $nombreCabecera = $request->header('X-Auth-User-Name');
            $emailCabecera  = $request->header('X-Auth-User-Email') ?? '';

            $nombreLimpio = (is_string($nombreCabecera) && trim($nombreCabecera) !== '' && trim($nombreCabecera) !== 'Usuario')
                ? mb_substr(trim($nombreCabecera), 0, 180)
                : null;

            if (! $nombreLimpio && $emailCabecera !== '') {
                $nombreLimpio = mb_substr(explode('@', $emailCabecera)[0], 0, 180);
            }

            $usuarioApp = UsuarioApp::query()->create([
                'auth_user_id'   => $idUsuarioAutenticado,
                'nombre_visible' => $nombreLimpio ?? 'Usuario',
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
            app(PermissionRegistrar::class)->forgetCachedPermissions();
            $usuarioApp->load('roles');
        }

        $this->promoverSiEsProfesor($usuarioApp, $request->header('X-Auth-User-Email'));

        $request->attributes->set('app_user', $usuarioApp);

        return $next($request);
    }

    /**
     * Promueve al usuario a profesor si su email está en la lista PROFESOR_EMAILS.
     * Útil para cuentas OAuth (Google) que se crean como 'consultor' por defecto.
     */
    private function promoverSiEsProfesor(UsuarioApp $usuarioApp, ?string $emailHeader): void
    {
        if (! $emailHeader) {
            return;
        }

        $profesorEmails = array_filter(
            array_map('trim', explode(',', (string) config('constantes.profesor_emails', env('PROFESOR_EMAILS', ''))))
        );

        if (! in_array($emailHeader, $profesorEmails, true)) {
            return;
        }

        if ($usuarioApp->roles->first()?->name !== 'profesor') {
            $usuarioApp->syncRoles(['profesor']);
            app(PermissionRegistrar::class)->forgetCachedPermissions();
            $usuarioApp->load('roles');
        }
    }
}
