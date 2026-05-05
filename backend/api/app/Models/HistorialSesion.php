<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HistorialSesion extends Model
{
    public $timestamps = false;

    protected $table = 'historial_sesiones';

    /** Valores válidos para tipo_evento — alineados con el CHECK constraint de BD */
    public const TIPOS_EVENTO = ['login', 'logout', 'refresh', 'oauth'];

    protected $fillable = [
        'usuario_id',
        'ip_address',
        'user_agent',
        'dispositivo',
        'navegador',
        'sistema_operativo',
        'pais',
        'ciudad',
        'tipo_evento',
        'exitoso',
        'iniciada_en',
    ];

    protected $casts = [
        'iniciada_en' => 'datetime',
        'exitoso'     => 'boolean',
        'tipo_evento' => 'string',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(UsuarioApp::class, 'usuario_id');
    }
}
