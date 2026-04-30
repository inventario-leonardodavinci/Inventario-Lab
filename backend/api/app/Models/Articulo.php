<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Articulo extends Model
{
    protected $table = 'articulos';

    protected $fillable = [
        'codigo',
        'nombre',
        'descripcion',
        'categoria_id',
        'unidad',
        'notas',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class, 'categoria_id');
    }

    public function nivelesStock(): HasMany
    {
        return $this->hasMany(NivelStock::class, 'articulo_id');
    }

    public function lineasMovimiento(): HasMany
    {
        return $this->hasMany(LineaMovimiento::class, 'articulo_id');
    }
}
