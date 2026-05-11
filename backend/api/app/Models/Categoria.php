<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modelo Categoria - Representa una categoría de artículos.
 *
 * Las categorías permiten agrupar artículos por tipo o finalidad.
 *
 * @property int $id
 * @property string $nombre
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class Categoria extends Model
{
    use HasFactory;
    protected $table = 'categorias';

    protected $fillable = [
        'nombre',
    ];

    public function articulos(): HasMany
    {
        return $this->hasMany(Articulo::class, 'categoria_id');
    }
}
