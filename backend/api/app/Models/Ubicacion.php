<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ubicacion extends Model
{
    protected $table = 'ubicaciones';

    protected $fillable = [
        'nombre',
        'descripcion',
        'tipo',
    ];

    public function nivelesStock(): HasMany
    {
        return $this->hasMany(NivelStock::class, 'ubicacion_id');
    }
}
