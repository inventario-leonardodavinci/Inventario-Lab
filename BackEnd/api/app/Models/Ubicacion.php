<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ubicacion extends Model
{
    protected $table = 'locations';
    protected $fillable = ['name'];

    public function stockLevels(): HasMany
    {
        return $this->hasMany(NivelStock::class);
    }
}
