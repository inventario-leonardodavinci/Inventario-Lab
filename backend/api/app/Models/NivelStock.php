<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NivelStock extends Model
{
    protected $table = 'stock_levels';
    protected $fillable = [
        'item_id',
        'location_id',
        'quantity',
        'min_quantity',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'min_quantity' => 'decimal:2',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(Articulo::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Ubicacion::class);
    }
}
