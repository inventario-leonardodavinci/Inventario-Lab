<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Articulo extends Model
{
    protected $table = 'items';
    protected $fillable = [
        'code',
        'serial_number',
        'name',
        'material_type',
        'capacity_ml',
        'expiration_date',
        'category_id',
        'unit',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'capacity_ml' => 'decimal:2',
        'expiration_date' => 'date',
        'is_active' => 'boolean',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Categoria::class);
    }

    public function stockLevels(): HasMany
    {
        return $this->hasMany(NivelStock::class);
    }
}
