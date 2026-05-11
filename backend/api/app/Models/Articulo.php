<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modelo Articulo - Representa un artículo del inventario.
 *
 * Cada artículo puede tener múltiples niveles de stock en diferentes ubicaciones
 * y participar en movimientos de inventario.
 *
 * @property int $id
 * @property string $codigo
 * @property string $nombre
 * @property string|null $descripcion
 * @property int $categoria_id
 * @property string|null $unidad
 * @property string|null $notas
 * @property string|null $serial_number
 * @property string|null $material_type
 * @property float|null $capacity_ml
 * @property string|null $expiration_date
 * @property string|null $fecha_adquisicion
 * @property float|null $precio_compra
 * @property string|null $proveedor
 * @property string|null $numero_factura
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class Articulo extends Model
{
    use HasFactory;
    protected $table = 'articulos';

    protected $fillable = [
        'codigo',
        'nombre',
        'descripcion',
        'categoria_id',
        'unidad',
        'notas',
        'serial_number',
        'material_type',
        'capacity_ml',
        'expiration_date',
        'fecha_adquisicion',
        'precio_compra',
        'proveedor',
        'numero_factura',
    ];

    protected $casts = [
        'capacity_ml'      => 'float',
        'expiration_date'  => 'date:Y-m-d',
        'fecha_adquisicion'=> 'date:Y-m-d',
        'precio_compra'    => 'decimal:2',
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
