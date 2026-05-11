<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modelo Ubicacion - Representa una ubicación física del inventario.
 *
 * Las ubicaciones pueden tener múltiples sub-ubicaciones (baldas, estantes)
 * y niveles de stock asociados.
 *
 * @property int $id
 * @property string $nombre
 * @property string|null $descripcion
 * @property string|null $tipo
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class Ubicacion extends Model
{
    use HasFactory;
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

    /**
     * Sub-ubicaciones (baldas, estantes) dentro de esta ubicación.
     * Solo retorna sub-ubicaciones activas, ordenadas por orden y nombre.
     */
    public function subUbicaciones(): HasMany
    {
        return $this->hasMany(SubUbicacion::class, 'ubicacion_id')
            ->where('activo', true)
            ->orderBy('orden')
            ->orderBy('nombre');
    }
}
