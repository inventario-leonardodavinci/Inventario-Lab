<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Request para validación de creación y actualización de categorías.
 *
 * Valida que el nombre sea único y tenga longitud máxima permitida.
 */
class CategoriaRequest extends FormRequest
{
    /**
     * La autorización se maneja a nivel de middleware/rutas (role:profesor).
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Reglas de validación para el nombre de categoría.
     *
     * @return array<string, array<int, mixed>> Reglas de validación
     */
    public function rules(): array
    {
        $categoriaId = $this->route('categoria')?->id;

        return [
            'nombre' => [
                'required',
                'string',
                'max:' . config('constantes.nombre_max_length'),
                Rule::unique('categorias', 'nombre')->ignore($categoriaId),
            ],
        ];
    }

    /**
     * Mensajes de error personalizados en español.
     *
     * @return array<string, string> Mensajes de error
     */
    public function messages(): array
    {
        return [
            'nombre.required' => 'El nombre de la categoría es obligatorio.',
            'nombre.string' => 'El nombre debe ser una cadena de texto.',
            'nombre.max' => 'El nombre no puede superar los ' . config('constantes.nombre_max_length') . ' caracteres.',
            'nombre.unique' => 'Ya existe una categoría con ese nombre.',
        ];
    }
}
