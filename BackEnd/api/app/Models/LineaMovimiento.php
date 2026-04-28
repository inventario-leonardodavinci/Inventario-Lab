<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LineaMovimiento extends Model
{
    protected $table = 'movement_lines';
    public const UPDATED_AT = null;

    protected $fillable = [
        'movement_id',
        'item_id',
        'batch_id',
        'quantity',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
    ];

    public function movement(): BelongsTo
    {
        return $this->belongsTo(Movimiento::class);
    }
}
