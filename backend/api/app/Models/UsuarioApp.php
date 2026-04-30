<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UsuarioApp extends Model
{
    protected $table = 'usuarios_app';

    protected $fillable = [
        'auth_user_id',
        'nombre_visible',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Rol::class, 'usuario_roles', 'usuario_id', 'rol_id');
    }

    public function movimientos(): HasMany
    {
        return $this->hasMany(Movimiento::class, 'usuario_id');
    }

    public function tieneRol(string $nombreRol): bool
    {
        return $this->roles()->where('name', $nombreRol)->exists();
    }
}
