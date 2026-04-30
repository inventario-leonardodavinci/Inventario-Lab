<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RegistroAuditoria extends Model
{
    protected $table = 'registros_auditoria';

    public const UPDATED_AT = null;

    protected $fillable = [
        'usuario_id',
        'tipo_evento',
        'entidad_tipo',
        'entidad_id',
        'antes_json',
        'despues_json',
        'payload_json',
    ];

    protected $casts = [
        'antes_json' => 'array',
        'despues_json' => 'array',
        'payload_json' => 'array',
        'created_at' => 'datetime',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(UsuarioApp::class, 'usuario_id');
    }
}
