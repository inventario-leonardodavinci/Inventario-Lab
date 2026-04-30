<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Rol extends Model
{
    protected $table = 'roles';

    protected $fillable = [
        'name',
    ];

    public function usuarios(): BelongsToMany
    {
        return $this->belongsToMany(UsuarioApp::class, 'usuario_roles', 'rol_id', 'usuario_id');
    }
}
