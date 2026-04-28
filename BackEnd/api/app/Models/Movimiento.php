<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Movimiento extends Model
{
    protected $table = 'movements';
    public const UPDATED_AT = null;

    protected $fillable = [
        'movement_type',
        'reason',
        'source_location_id',
        'target_location_id',
        'app_user_id',
    ];

    public function lines(): HasMany
    {
        return $this->hasMany(LineaMovimiento::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(UsuarioApp::class, 'app_user_id');
    }
}
