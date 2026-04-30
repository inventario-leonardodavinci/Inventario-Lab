<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ArticuloRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $esCreacion = $this->isMethod('POST');
        $articuloId = $this->route('articulo')?->id;

        return [
            'codigo' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('articulos', 'codigo')->ignore($articuloId),
            ],
            'nombre'       => [$esCreacion ? 'required' : 'sometimes', 'string', 'max:180'],
            'descripcion'  => ['nullable', 'string'],
            'categoria_id' => [$esCreacion ? 'required' : 'sometimes', 'integer', 'exists:categorias,id'],
            'unidad'       => ['nullable', 'string', 'max:40'],
            'notas'        => ['nullable', 'string'],
            'activo'       => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'codigo.unique' => 'Ya existe un artículo con ese código.',
            'codigo.max' => 'El código no puede superar los 100 caracteres.',
            'nombre.required' => 'El nombre del artículo es obligatorio.',
            'nombre.string' => 'El nombre debe ser una cadena de texto.',
            'nombre.max' => 'El nombre no puede superar los 180 caracteres.',
            'descripcion.string' => 'La descripción debe ser una cadena de texto.',
            'categoria_id.required' => 'La categoría es obligatoria.',
            'categoria_id.integer' => 'El identificador de categoría debe ser un número entero.',
            'categoria_id.exists' => 'La categoría seleccionada no existe.',
            'unidad.string' => 'La unidad debe ser una cadena de texto.',
            'unidad.max' => 'La unidad no puede superar los 40 caracteres.',
            'notas.string' => 'Las notas deben ser una cadena de texto.',
            'activo.boolean' => 'El campo activo debe ser verdadero o falso.',
        ];
    }
}
