<?php

namespace App\Data;

use Illuminate\Validation\Rule;
use Spatie\LaravelData\Data;

/**
 * DTO para validacion y transferencia de datos de Categorias.
 */
class CategoriaData extends Data
{
    public function __construct(
        public readonly string $nombre,
    ) {
    }

    public static function rules(): array
    {
        $categoriaId = request()->route('categoria')?->id;

        return [
            'nombre' => ['required', 'string', 'max:100', Rule::unique('categorias', 'nombre')->ignore($categoriaId)],
        ];
    }

    public static function messages(): array
    {
        return [
            'nombre.required' => 'El nombre de la categoria es obligatorio.',
            'nombre.max'      => 'El nombre no puede superar los 100 caracteres.',
            'nombre.unique'   => 'Ya existe una categoria con ese nombre.',
        ];
    }
}
