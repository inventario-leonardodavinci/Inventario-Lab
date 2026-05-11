<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Request para validación de creación y actualización de ubicaciones.
 *
 * Valida que el nombre sea único en el sistema y el tipo esté
 * dentro de los valores permitidos.
 */
class UbicacionRequest extends FormRequest
{
    /**
     * La autorización se maneja a nivel de middleware/rutas (role:profesor).
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Reglas de validación para la ubicación.
     *
     * @return array<string, array<int, mixed>> Reglas de validación
     */
    public function rules(): array
    {
        $esCreacion = $this->isMethod('POST');
        $ubicacionId = $this->route('ubicacion')?->id;

        return [
            'nombre' => [
                'required',
                'string',
                'max:100',
                Rule::unique('ubicaciones', 'nombre')->ignore($ubicacionId),
            ],
            'descripcion' => ['nullable', 'string'],
            'tipo' => [
                $esCreacion ? 'required' : 'sometimes',
                'string',
                Rule::in(['armario', 'nevera', 'estanteria', 'cajon', 'vitrina', 'otro']),
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
            'nombre.required' => 'El nombre de la ubicación es obligatorio.',
            'nombre.string' => 'El nombre debe ser una cadena de texto.',
            'nombre.max' => 'El nombre no puede superar los 100 caracteres.',
            'nombre.unique' => 'Ya existe una ubicación con ese nombre.',
            'descripcion.string' => 'La descripción debe ser una cadena de texto.',
            'tipo.required' => 'El tipo de ubicación es obligatorio.',
            'tipo.string' => 'El tipo debe ser una cadena de texto.',
            'tipo.in' => 'El tipo de ubicación debe ser uno de los siguientes: armario, nevera, estanteria, cajon, vitrina, otro.',
        ];
    }
}
