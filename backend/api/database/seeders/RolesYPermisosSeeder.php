<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * Seeder para roles y permisos con spatie/laravel-permission.
 * Reemplaza el sistema de roles casero con permisos granulares.
 */
class RolesYPermisosSeeder extends Seeder
{
    /**
     * Lista de permisos disponibles en el sistema.
     */
    private const PERMISOS = [
        // Artículos
        'articulos.ver',
        'articulos.crear',
        'articulos.editar',
        'articulos.eliminar',

        // Categorías
        'categorias.ver',
        'categorias.crear',
        'categorias.editar',
        'categorias.eliminar',

        // Ubicaciones
        'ubicaciones.ver',
        'ubicaciones.crear',
        'ubicaciones.editar',

        // Movimientos
        'movimientos.ver',
        'movimientos.crear',

        // Alertas
        'alertas.ver',
        'alertas.confirmar',
        'alertas.resolver',

        // Auditoría
        'auditoria.ver',

        // Usuarios (solo admin)
        'usuarios.ver',
        'usuarios.editar_roles',

        // Mantenimiento
        'mantenimiento.ver',
        'mantenimiento.crear',
        'mantenimiento.editar',

        // Informes
        'informes.ver',
    ];

    /**
     * Configuración de roles y sus permisos.
     */
    private const ROLES = [
        'administrador' => [
            'articulos.ver', 'articulos.crear', 'articulos.editar', 'articulos.eliminar',
            'categorias.ver', 'categorias.crear', 'categorias.editar', 'categorias.eliminar',
            'ubicaciones.ver', 'ubicaciones.crear', 'ubicaciones.editar',
            'movimientos.ver', 'movimientos.crear',
            'alertas.ver', 'alertas.confirmar', 'alertas.resolver',
            'auditoria.ver',
            'usuarios.ver', 'usuarios.editar_roles',
            'mantenimiento.ver', 'mantenimiento.crear', 'mantenimiento.editar',
            'informes.ver',
        ],
        'profesor' => [
            'articulos.ver', 'articulos.crear', 'articulos.editar',
            'categorias.ver',
            'ubicaciones.ver',
            'movimientos.ver', 'movimientos.crear',
            'alertas.ver', 'alertas.confirmar', 'alertas.resolver',
            'mantenimiento.ver', 'mantenimiento.crear', 'mantenimiento.editar',
            'informes.ver',
        ],
        'consultor' => [
            'articulos.ver',
            'categorias.ver',
            'ubicaciones.ver',
            'movimientos.ver',
            'alertas.ver',
            'informes.ver',
        ],
    ];

    public function run(): void
    {
        // Crear permisos (idempotente: no falla si ya existen)
        foreach (self::PERMISOS as $permiso) {
            Permission::firstOrCreate(
                ['name' => $permiso, 'guard_name' => 'api']
            );
        }

        // Crear roles y asignar permisos
        foreach (self::ROLES as $nombreRol => $permisos) {
            $rol = Role::firstOrCreate(
                ['name' => $nombreRol, 'guard_name' => 'api']
            );
            $rol->syncPermissions($permisos);
        }
    }
}
