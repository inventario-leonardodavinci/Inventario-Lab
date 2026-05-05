<?php

namespace App\Models;

use Illuminate\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Permission\Traits\HasRoles;

/**
 * Modelo de usuario de la aplicación.
 * Extiende Model (no User de Laravel) porque la autenticación la gestiona
 * Insforge Auth via cabecera X-Auth-User-Id.
 * Implementa AuthenticatableContract para que spatie/laravel-permission
 * pueda resolver el guard y asignar/verificar roles correctamente.
 */
class UsuarioApp extends Model implements AuthenticatableContract
{
    use HasRoles, Authenticatable;

    protected $table = 'usuarios_app';

    protected $guard_name = 'api';

    protected $fillable = [
        'auth_user_id',
        'nombre_visible',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function movimientos(): HasMany
    {
        return $this->hasMany(Movimiento::class, 'usuario_id');
    }
}
