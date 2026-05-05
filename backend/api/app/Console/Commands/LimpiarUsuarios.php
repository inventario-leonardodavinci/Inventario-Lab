<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class LimpiarUsuarios extends Command
{
    protected $signature = 'usuarios:limpiar 
                            {--mantener-datos : Mantener movimientos y auditoría (sin trazabilidad de usuario)}
                            {--solo-inactivos : Borrar solo usuarios desactivados}
                            {--force : Ejecutar sin confirmación}';

    protected $description = 'Limpia la base de datos de usuarios para empezar desde cero';

    public function handle(): int
    {
        $mantenerDatos = $this->option('mantener-datos');
        $soloInactivos = $this->option('solo-inactivos');
        $force = $this->option('force');

        $this->warn('⚠️  Esto eliminará usuarios de la base de datos.');
        $this->warn('   Las tablas de Insforge Auth NO se verán afectadas.');
        $this->newLine();

        // Contar usuarios
        $tabla = 'usuarios_app';
        $query = DB::table($tabla);
        if ($soloInactivos) {
            $query->where('activo', false);
        }
        $totalUsuarios = $query->count();

        if ($totalUsuarios === 0) {
            $this->info('✅ No hay usuarios para eliminar.');
            return self::SUCCESS;
        }

        $tipo = $soloInactivos ? 'inactivos' : 'todos';
        $this->info("Usuarios a eliminar: {$totalUsuarios} ({$tipo})");
        $this->newLine();

        // Listar usuarios que se van a borrar
        $usuarios = $query->select('id', 'nombre_visible', 'auth_user_id', 'activo')->get();
        $this->table(
            ['ID', 'Nombre', 'Auth ID', 'Activo'],
            $usuarios->map(fn($u) => [
                $u->id,
                $u->nombre_visible ?? 'N/A',
                substr($u->auth_user_id, 0, 20) . '...',
                $u->activo ? 'Sí' : 'No'
            ])->toArray()
        );
        $this->newLine();

        if (!$force && !$this->confirm('¿Confirmas que quieres eliminar estos usuarios?', false)) {
            $this->info('❌ Operación cancelada.');
            return self::SUCCESS;
        }

        // Mostrar qué pasará con los datos relacionados
        $this->newLine();
        $this->info('Datos relacionados que se verán afectados:');

        $movimientoIds = DB::table('movimientos')->whereIn('usuario_id', $usuarios->pluck('id'))->pluck('id');
        $stats = [
            ['Tabla', 'Registros afectados', 'Acción'],
            ['spatie_model_has_roles', DB::table('spatie_model_has_roles')->where('model_type', 'App\Models\UsuarioApp')->whereIn('model_id', $usuarios->pluck('id'))->count(), 'Eliminar'],
            ['historial_sesiones', DB::table('historial_sesiones')->whereIn('usuario_id', $usuarios->pluck('id'))->count(), 'Eliminar'],
            ['registros_auditoria', DB::table('registros_auditoria')->whereIn('usuario_id', $usuarios->pluck('id'))->count(), 'Eliminar'],
            ['movimientos', $movimientoIds->count(), 'Eliminar'],
            ['lineas_movimiento', DB::table('lineas_movimiento')->whereIn('movimiento_id', $movimientoIds)->count(), 'Eliminar'],
        ];
        $this->table(['Tabla', 'Registros', 'Acción'], array_slice($stats, 1));
        $this->newLine();

        if (!$force && !$this->confirm('¿Proceder con la eliminación?', false)) {
            $this->info('❌ Operación cancelada.');
            return self::SUCCESS;
        }

        // Ejecutar limpieza en transacción
        DB::transaction(function () use ($usuarios, $mantenerDatos) {
            $ids = $usuarios->pluck('id');

            // 1. Eliminar roles de usuarios (spatie)
            DB::table('spatie_model_has_roles')
                ->where('model_type', 'App\Models\UsuarioApp')
                ->whereIn('model_id', $ids)
                ->delete();
            $this->info('✅ Roles de usuarios eliminados');

            // 2. Eliminar historial de sesiones
            DB::table('historial_sesiones')->whereIn('usuario_id', $ids)->delete();
            $this->info('✅ Historial de sesiones eliminado');

            // 3. Eliminar registros de auditoría
            DB::table('registros_auditoria')->whereIn('usuario_id', $ids)->delete();
            $this->info('✅ Registros de auditoría eliminados');

            // 4. Eliminar movimientos asociados (la FK no permite NULL)
            // Primero eliminar líneas de movimiento (dependen de movimientos)
            $movimientoIds = DB::table('movimientos')->whereIn('usuario_id', $ids)->pluck('id');
            if ($movimientoIds->count() > 0) {
                DB::table('lineas_movimiento')->whereIn('movimiento_id', $movimientoIds)->delete();
                $this->info('✅ Líneas de movimiento eliminadas: ' . $movimientoIds->count());
            }
            // Ahora eliminar movimientos
            $countMov = DB::table('movimientos')->whereIn('usuario_id', $ids)->delete();
            $this->info('✅ Movimientos eliminados: ' . $countMov);

            // 4. Eliminar usuarios
            DB::table('usuarios_app')->whereIn('id', $ids)->delete();
            $this->info('✅ Usuarios eliminados');
        });

        $this->newLine();
        $this->info('🎉 ¡Base de datos limpia! Puedes empezar el flujo desde cero.');
        $this->warn('   Los usuarios deberán volver a entrar para crearse automáticamente.');

        return self::SUCCESS;
    }
}
