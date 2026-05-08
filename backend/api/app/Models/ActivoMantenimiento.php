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
        'notes',
        'next_service_due_date',
        'last_service_date',
        'manufacturer',
        'model',
        'purchase_date',
        'warranty_end_date',
    ];

    protected function casts(): array
    {
        return [
            'purchase_date' => 'date',
            'warranty_end_date' => 'date',
            'last_service_date' => 'date',
            'next_service_due_date' => 'date',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function articulo(): BelongsTo
    {
        return $this->belongsTo(Articulo::class, 'articulo_id');
    }

    public function ubicacionActual(): BelongsTo
    {
        return $this->belongsTo(Ubicacion::class, 'ubicacion_actual_id');
    }
}
