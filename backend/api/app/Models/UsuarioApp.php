<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Permission\Traits\HasRoles;

class UsuarioApp extends Model
{
    use HasRoles;
    protected $table = 'usuarios_app';

    protected $fillable = [
        'auth_user_id',
        'nombre_visible',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    /**
     * Necesario para spatie/laravel-permission.
     * Usa guard 'api' para la API.
     */
    protected function getDefaultGuardName(): string
    {
        return 'api';
    }

    public function movimientos(): HasMany
    {
        return $this->hasMany(Movimiento::class, 'usuario_id');
    }
}
