<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

/**
 * Modelo SubUbicacion - Representa una sub-ubicación dentro de una ubicación principal.
 *
 * Las sub-ubicaciones son subdivisiones físicas como baldas, estantes o cajones
 * dentro de una ubicación principal (armario, almacén, etc.).
 *
 * @property int $id
 * @property int $ubicacion_id
 * @property string $nombre
 * @property string|null $descripcion
 * @property int $orden
 * @property bool $activo
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class SubUbicacion extends Model
{
    protected $table = 'sub_ubicaciones';

    protected $fillable = [
        'ubicacion_id',
        'nombre',
        'descripcion',
        'orden',
        'activo',
    ];

    protected $casts = [
        'orden' => 'integer',
        'activo' => 'boolean',
    ];

    /**
     * Ubicación principal (padre)
     */
    public function ubicacion(): BelongsTo
    {
        return $this->belongsTo(Ubicacion::class, 'ubicacion_id');
    }

    /**
     * Niveles de stock asociados a esta sub-ubicación
     */
    public function nivelesStock(): HasMany
    {
        return $this->hasMany(NivelStock::class, 'sub_ubicacion_id');
    }

    /**
     * Artículos en esta sub-ubicación (a través de niveles_stock)
     */
    public function articulos()
    {
        return $this->hasManyThrough(
            Articulo::class,
            NivelStock::class,
            'sub_ubicacion_id',
            'id',
            'id',
            'articulo_id'
        );
    }

    /**
     * Scope para filtrar solo sub-ubicaciones activas.
     *
     * @param Builder $query
     * @return Builder
     */
    public function scopeActivas(Builder $query): Builder
    {
        return $query->where('activo', true);
    }

    /**
     * Scope para filtrar sub-ubicaciones de una ubicación específica.
     *
     * @param Builder $query
     * @param int $ubicacionId
     * @return Builder
     */
    public function scopeDeUbicacion(Builder $query, int $ubicacionId): Builder
    {
        return $query->where('ubicacion_id', $ubicacionId);
    }

    /**
     * Scope para ordenar sub-ubicaciones por el campo orden y nombre.
     *
     * @param Builder $query
     * @return Builder
     */
    public function scopeOrdenadas(Builder $query): Builder
    {
        return $query->orderBy('orden')->orderBy('nombre');
    }
}
