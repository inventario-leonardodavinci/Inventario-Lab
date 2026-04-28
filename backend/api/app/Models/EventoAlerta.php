<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventoAlerta extends Model
{
    protected $table = 'alert_events';
    protected $fillable = [
        'alert_rule_id',
        'alert_type',
        'severity',
        'status',
        'item_id',
        'location_id',
        'asset_id',
        'trigger_payload_json',
        'triggered_at',
        'acknowledged_at',
        'acknowledged_by_user_id',
        'resolved_at',
        'resolved_by_user_id',
        'resolution_notes',
    ];

    protected $casts = [
        'trigger_payload_json' => 'array',
        'triggered_at' => 'datetime',
        'acknowledged_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];

    public function acknowledgedBy(): BelongsTo
    {
        return $this->belongsTo(UsuarioApp::class, 'acknowledged_by_user_id');
    }
}
