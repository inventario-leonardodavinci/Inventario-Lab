<?php

namespace App\Console\Commands;

use App\Models\UsuarioApp;
use Illuminate\Console\Command;
use Spatie\Permission\PermissionRegistrar;

class PromoverAdmin extends Command
{
    protected $signature = 'admin:promover
                            {busqueda : Nombre visible o fragmento de auth_user_id del usuario}
                            {--rol=profesor : Rol a asignar (profesor|consultor)}';

    protected $description = 'Asigna un rol a un usuario por nombre visible o auth_user_id (para bootstrapping del primer profesor)';

    public function handle(): int
    {
        $busqueda = $this->argument('busqueda');
        $rol      = $this->option('rol');

        $rolesValidos = ['profesor', 'consultor'];
        if (! in_array($rol, $rolesValidos, true)) {
            $this->error("Rol inválido: {$rol}. Debe ser uno de: " . implode(', ', $rolesValidos));
            return self::FAILURE;
        }

        // Buscar por nombre_visible (exacto o parcial) o por auth_user_id
        $usuarios = UsuarioApp::query()
            ->with('roles')
            ->where('nombre_visible', 'like', "%{$busqueda}%")
            ->orWhere('auth_user_id', 'like', "%{$busqueda}%")
            ->get();

        if ($usuarios->isEmpty()) {
            $this->error("No se encontró ningún usuario que coincida con: {$busqueda}");
            $this->line('');
            $this->line('Usuarios existentes:');
            UsuarioApp::with('roles')->get()->each(function (UsuarioApp $u): void {
                $rol = $u->roles->first() ? $u->roles->first()->name : '(sin rol)';
                $this->line("  [{$u->id}] {$u->nombre_visible} — {$rol} (id: {$u->auth_user_id})");
            });
            return self::FAILURE;
        }

        if ($usuarios->count() > 1) {
            $this->warn("Se encontraron varios usuarios. Selecciona el correcto:");
            $opciones = $usuarios->map(function ($u) {
                $rol = $u->roles->first() ? $u->roles->first()->name : 'sin rol';
                return "[{$u->id}] {$u->nombre_visible} ({$rol})";
            })->toArray();
            $eleccion = $this->choice('¿Cuál usuario?', $opciones);
            $idx      = (int) explode(']', explode('[', $eleccion)[1])[0];
            $usuario  = $usuarios->firstWhere('id', $idx);
        } else {
            $usuario = $usuarios->first();
        }

        $rolActual = $usuario->roles->first() ? $usuario->roles->first()->name : '(sin rol)';
        $this->line("Usuario: <info>{$usuario->nombre_visible}</info> (auth_user_id: {$usuario->auth_user_id})");
        $this->line("Rol actual: <comment>{$rolActual}</comment> → Nuevo rol: <info>{$rol}</info>");

        if (! $this->confirm('¿Confirmar cambio de rol?', true)) {
            $this->line('Operación cancelada.');
            return self::SUCCESS;
        }

        $usuario->syncRoles([$rol]);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->info("✓ Rol actualizado correctamente a '{$rol}' para {$usuario->nombre_visible}.");
        return self::SUCCESS;
    }
}
