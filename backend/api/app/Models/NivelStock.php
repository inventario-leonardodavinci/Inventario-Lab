<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modelo NivelStock - Representa el stock de un artículo en una ubicación específica.
 *
 * Cada registro indica la cantidad disponible de un artículo en una ubicación
 * y sub-ubicación concretas, junto con la cantidad mínima para alertas.
 *
 * @property int $id
 * @property int $articulo_id
 * @property int $ubicacion_id
 * @property int|null $sub_ubicacion_id
 * @property float $cantidad Cantidad actual en stock
 * @property float $cantidad_minima Cantidad mínima para alertas de stock crítico
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class NivelStock extends Model
{
    use HasFactory;
    protected $table = 'niveles_stock';

    protected $fillable = [
        'articulo_id',
        'ubicacion_id',
        'sub_ubicacion_id',
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

    /**
     * Sub-ubicación específica (balda, estante) donde está el stock.
     */
    public function subUbicacion(): BelongsTo
    {
        return $this->belongsTo(SubUbicacion::class, 'sub_ubicacion_id');
    }
}
