<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NivelStock extends Model
{
    protected $table = 'niveles_stock';

    protected $fillable = [
        'articulo_id',
        'ubicacion_id',
        'cantidad',
        'cantidad_minima',
    ];

    protected $casts = [
        'cantidad' => 'decimal:2',
        'cantidad_minima' => 'decimal:2',
    ];

    public function articulo(): BelongsTo
    {
        return $this->belongsTo(Articulo::class, 'articulo_id');
    }

    public function ubicacion(): BelongsTo
    {
        return $this->belongsTo(Ubicacion::class, 'ubicacion_id');
    }
}
