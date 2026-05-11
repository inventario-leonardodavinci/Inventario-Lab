<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modelo ActivoMantenimiento - Representa un activo que requiere mantenimiento.
 *
 * Los activos son equipos o máquinas que necesitan seguimiento de mantenimiento
 * y tienen un ciclo de vida más complejo que los artículos de consumo.
 *
 * Estados posibles: operativo, mantenimiento_pendiente, en_mantenimiento,
 *                   fuera_servicio, retirado
 *
 * @property int $id
 * @property int|null $articulo_id
 * @property string $codigo_activo Código único del activo
 * @property string|null $numero_serie
 * @property string $estado
 * @property int|null $ubicacion_actual_id
 * @property string|null $notes
 * @property string|null $next_service_due_date Próximo mantenimiento programado
 * @property string|null $last_service_date Último mantenimiento realizado
 * @property string|null $manufacturer Fabricante
 * @property string|null $model Modelo
 * @property string|null $purchase_date Fecha de compra
 * @property string|null $warranty_end_date Fin de garantía
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
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
