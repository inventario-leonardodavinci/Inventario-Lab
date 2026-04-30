<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Categoria extends Model
{
    protected $table = 'categorias';

    protected $fillable = [
        'nombre',
    ];

    public function articulos(): HasMany
    {
        return $this->hasMany(Articulo::class, 'categoria_id');
    }
}
