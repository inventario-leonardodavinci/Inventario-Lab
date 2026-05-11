<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modelo HistorialSesion - Registra los eventos de sesión de usuarios.
 *
 * Almacena información de inicio de sesión, dispositivo utilizado,
 * ubicación geográfica aproximada y otros metadatos de seguridad.
 *
 * @property int $id
 * @property int $usuario_id
 * @property string|null $ip_address
 * @property string|null $user_agent
 * @property string|null $dispositivo Tipo de dispositivo (Móvil, Tablet, Escritorio)
 * @property string|null $navegador Navegador y versión detectada
 * @property string|null $sistema_operativo SO detectado
 * @property string|null $pais País detectado por geolocalización
 * @property string|null $ciudad Ciudad detectada por geolocalización
 * @property string $tipo_evento login, logout, refresh, oauth
 * @property bool $exitoso
 * @property \Carbon\Carbon $iniciada_en
 */
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
