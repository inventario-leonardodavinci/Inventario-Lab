<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HistorialSesion extends Model
{
    public $timestamps = false;

    protected $table = 'historial_sesiones';

    protected $fillable = [
        'usuario_id',
        'ip_address',
        'user_agent',
        'dispositivo',
        'navegador',
        'sistema_operativo',
        'pais',
        'ciudad',
        'iniciada_en',
    ];

    protected $casts = [
        'iniciada_en' => 'datetime',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(UsuarioApp::class, 'usuario_id');
    }
}
