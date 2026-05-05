<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Alerta extends Model
{
    protected $table = 'alertas';

    protected $fillable = [
        'tipo',
        'severidad',
        'estado',
        'articulo_id',
        'ubicacion_id',
        'activo_id',
        'datos_json',
        'generada_en',
        'confirmada_por_id',
        'confirmada_en',
        'resuelta_por_id',
        'resuelta_en',
        'notas_resolucion',
    ];

    protected $casts = [
        'datos_json' => 'array',
        'generada_en' => 'datetime',
        'confirmada_en' => 'datetime',
        'resuelta_en' => 'datetime',
    ];

    public function articulo(): BelongsTo
    {
        return $this->belongsTo(Articulo::class, 'articulo_id');
    }

    public function confirmadaPor(): BelongsTo
    {
        return $this->belongsTo(UsuarioApp::class, 'confirmada_por_id');
    }

    public function resueltaPor(): BelongsTo
    {
        return $this->belongsTo(UsuarioApp::class, 'resuelta_por_id');
    }
}
