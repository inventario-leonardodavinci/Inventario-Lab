<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    /**
     * Normaliza los roles a solo 2: profesor y consultor.
     * - Renombra 'administrador' a 'profesor'
     * - Elimina rol 'profesor' duplicado si existe
     * - Asegura guard_name = 'api' para todos
     */
    public function up(): void
    {
        // Limpiar cache de permisos
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // 1. Verificar roles actuales
        $rolesActuales = DB::table('spatie_roles')->pluck('name', 'id')->toArray();
        
        // 2. Si existe 'administrador', renombrar a 'profesor'
        if (in_array('administrador', $rolesActuales)) {
            $idAdmin = array_search('administrador', $rolesActuales);
            
            // Si ya existe un rol 'profesor', necesitamos migrar los usuarios primero
            if (in_array('profesor', $rolesActuales)) {
                $idProfesorExistente = array_search('profesor', $rolesActuales);
                
                // Migrar usuarios de 'administrador' al 'profesor' existente
                DB::table('spatie_model_has_roles')
                    ->where('role_id', $idAdmin)
                    ->update(['role_id' => $idProfesorExistente]);
                
                // Eliminar el rol 'administrador'
                DB::table('spatie_roles')->where('id', $idAdmin)->delete();
            } else {
                // Simplemente renombrar 'administrador' a 'profesor'
                DB::table('spatie_roles')
                    ->where('id', $idAdmin)
                    ->update(['name' => 'profesor']);
            }
        }
        
        // 3. Asegurar que 'consultor' existe
        if (!in_array('consultor', $rolesActuales)) {
            DB::table('spatie_roles')->insert([
                'name' => 'consultor',
                'guard_name' => 'api',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        
        // 4. Asegurar que 'profesor' existe
        $rolesActualizados = DB::table('spatie_roles')->pluck('name')->toArray();
        if (!in_array('profesor', $rolesActualizados)) {
            DB::table('spatie_roles')->insert([
                'name' => 'profesor',
                'guard_name' => 'api',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        
        // 5. Eliminar cualquier otro rol que no sea 'profesor' o 'consultor'
        DB::table('spatie_roles')
            ->whereNotIn('name', ['profesor', 'consultor'])
            ->delete();
        
        // Limpiar cache nuevamente
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No se proporciona rollback para evitar pérdida de datos inconsistente
        // Los roles deben restaurarse manualmente si es necesario
    }
};
