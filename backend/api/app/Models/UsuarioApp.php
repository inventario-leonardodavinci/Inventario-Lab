<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UsuarioApp extends Model
{
    protected $table = 'app_users';
    protected $fillable = [
        'auth_user_id',
        'display_name',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Rol::class, 'app_user_roles');
    }

    public function movements(): HasMany
    {
        return $this->hasMany(Movimiento::class);
    }
}
