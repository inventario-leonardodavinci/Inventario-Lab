<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modelo Movimiento - Representa un movimiento de inventario.
 *
 * Los movimientos pueden ser de tipo: entrada, salida, traslado o ajuste.
 * Cada movimiento tiene múltiples líneas que indican qué artículos
 * y en qué cantidades se movieron.
 *
 * @property int $id
 * @property string $tipo Tipo de movimiento: entrada, salida, traslado, ajuste
 * @property string|null $motivo Descripción del motivo del movimiento
 * @property int|null $ubicacion_origen_id Ubicación de origen (para salidas y traslados)
 * @property int|null $ubicacion_destino_id Ubicación de destino (para entradas y traslados)
 * @property int|null $sub_ubicacion_origen_id Sub-ubicación de origen
 * @property int|null $sub_ubicacion_destino_id Sub-ubicación de destino
 * @property int $usuario_id Usuario que realizó el movimiento
 * @property \Carbon\Carbon $created_at
 */
class Movimiento extends Model
{
    protected $table = 'movimientos';

    public const UPDATED_AT = null;

    protected $fillable = [
        'tipo',
        'motivo',
        'ubicacion_origen_id',
        'ubicacion_destino_id',
        'sub_ubicacion_origen_id',
        'sub_ubicacion_destino_id',
        'usuario_id',
    ];

    public function lineas(): HasMany
    {
        return $this->hasMany(LineaMovimiento::class, 'movimiento_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(UsuarioApp::class, 'usuario_id');
    }

    public function ubicacionOrigen(): BelongsTo
    {
        return $this->belongsTo(Ubicacion::class, 'ubicacion_origen_id');
    }

    public function ubicacionDestino(): BelongsTo
    {
        return $this->belongsTo(Ubicacion::class, 'ubicacion_destino_id');
    }

    public function subUbicacionOrigen(): BelongsTo
    {
        return $this->belongsTo(SubUbicacion::class, 'sub_ubicacion_origen_id');
    }

    public function subUbicacionDestino(): BelongsTo
    {
        return $this->belongsTo(SubUbicacion::class, 'sub_ubicacion_destino_id');
    }
}
