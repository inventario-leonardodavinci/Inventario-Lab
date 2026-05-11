<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modelo LineaMovimiento - Representa una línea de un movimiento de inventario.
 *
 * Cada línea indica un artículo específico y la cantidad movida
 * dentro de un movimiento mayor.
 *
 * @property int $id
 * @property int $movimiento_id
 * @property int $articulo_id
 * @property float $cantidad
 * @property \Carbon\Carbon $created_at
 */
class LineaMovimiento extends Model
{
    protected $table = 'lineas_movimiento';

    public const UPDATED_AT = null;

    protected $fillable = [
        'movimiento_id',
        'articulo_id',
        'cantidad',
    ];

    protected $casts = [
        'cantidad' => 'decimal:2',
    ];

    public function movimiento(): BelongsTo
    {
        return $this->belongsTo(Movimiento::class, 'movimiento_id');
    }

    public function articulo(): BelongsTo
    {
        return $this->belongsTo(Articulo::class, 'articulo_id');
    }
}
