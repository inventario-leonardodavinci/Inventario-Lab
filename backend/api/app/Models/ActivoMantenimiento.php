<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivoMantenimiento extends Model
{
    protected $table = 'maintenance_assets';
    protected $fillable = [
        'item_id',
        'asset_code',
        'serial_number',
        'status',
        'manufacturer',
        'model',
        'purchase_date',
        'warranty_end_date',
        'last_service_date',
        'next_service_due_date',
        'current_location_id',
        'notes',
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'warranty_end_date' => 'date',
        'last_service_date' => 'date',
        'next_service_due_date' => 'date',
    ];
}
