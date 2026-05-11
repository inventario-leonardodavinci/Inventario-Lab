<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modelo RegistroAuditoria - Registra cambios en el sistema para trazabilidad.
 *
 * Cada registro representa un evento de auditoría (creación, actualización,
 * eliminación) sobre una entidad específica del sistema.
 *
 * @property int $id
 * @property int|null $usuario_id Usuario que realizó la acción (null si sistema)
 * @property string $tipo_evento INSERT, UPDATE, DELETE
 * @property string $entidad_tipo Nombre de la tabla/entidad afectada
 * @property int $entidad_id ID del registro afectado
 * @property array|null $antes_json Estado anterior del registro
 * @property array|null $despues_json Estado posterior del registro
 * @property array|null $payload_json Datos adicionales de contexto
 * @property string|null $ip_address IP desde donde se realizó la acción
 * @property string|null $user_agent User agent del cliente
 * @property \Carbon\Carbon $created_at
 */
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
        'ip_address',
        'user_agent',
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
