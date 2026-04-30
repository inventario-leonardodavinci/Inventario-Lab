<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivoMantenimiento extends Model
{
    protected $table = 'activos_mantenimiento';

    protected $fillable = [
        'articulo_id',
        'codigo_activo',
        'numero_serie',
        'estado',
        'ubicacion_actual_id',
        'notas',
    ];

    public function articulo(): BelongsTo
    {
        return $this->belongsTo(Articulo::class, 'articulo_id');
    }

    public function ubicacionActual(): BelongsTo
    {
        return $this->belongsTo(Ubicacion::class, 'ubicacion_actual_id');
    }
}
