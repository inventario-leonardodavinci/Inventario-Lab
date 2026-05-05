<?php

namespace App\Data;

use Spatie\LaravelData\Data;

/**
 * DTO para validación y transferencia de datos de Categorías.
 */
class CategoriaData extends Data
{
    public function __construct(
        public readonly string $nombre,
    ) {
    }

    public static function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:100', 'unique:categorias,nombre'],
        ];
    }

    public static function messages(): array
    {
        return [
            'nombre.required' => 'El nombre de la categoría es obligatorio.',
            'nombre.max'      => 'El nombre no puede superar los 100 caracteres.',
            'nombre.unique'   => 'Ya existe una categoría con ese nombre.',
        ];
    }
}
