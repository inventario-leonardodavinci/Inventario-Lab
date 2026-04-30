<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Movimiento extends Model
{
    protected $table = 'movimientos';

    public const UPDATED_AT = null;

    protected $fillable = [
        'tipo',
        'motivo',
        'ubicacion_origen_id',
        'ubicacion_destino_id',
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
}
