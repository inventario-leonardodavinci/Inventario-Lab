<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Request para validación de creación y actualización de sub-ubicaciones.
 *
 * Valida que el nombre sea único dentro de la misma ubicación padre.
 */
class SubUbicacionRequest extends FormRequest
{
    /**
     * La autorización se maneja a nivel de middleware/rutas (role:profesor).
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Reglas de validación para el request.
     *
     * En creación: ubicacion_id es requerida.
     * En actualización: todos los campos son opcionales.
     *
     * @return array<string, array<int, mixed>> Reglas de validación
     */
    public function rules(): array
    {
        $esCreacion = $this->isMethod('POST');
        $subUbicacionId = $this->route('sub_ubicacion')?->id;
        $ubicacionId = $this->input('ubicacion_id');

        return [
            'ubicacion_id' => [
                $esCreacion ? 'required' : 'sometimes',
                'integer',
                'exists:ubicaciones,id',
            ],
            'nombre' => [
                'required',
                'string',
                'max:100',
                Rule::unique('sub_ubicaciones', 'nombre')
                    ->where('ubicacion_id', $ubicacionId)
                    ->ignore($subUbicacionId),
            ],
            'descripcion' => ['nullable', 'string'],
            'orden' => ['nullable', 'integer', 'min:0'],
            'activo' => ['nullable', 'boolean'],
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
            'ubicacion_id.required' => 'La ubicación principal es obligatoria.',
            'ubicacion_id.exists' => 'La ubicación seleccionada no existe.',
            'nombre.required' => 'El nombre de la sub-ubicación es obligatorio.',
            'nombre.unique' => 'Ya existe una sub-ubicación con ese nombre en esta ubicación.',
            'orden.integer' => 'El orden debe ser un número entero.',
            'orden.min' => 'El orden debe ser mayor o igual a 0.',
        ];
    }

    /**
     * Preparar los datos para validación.
     *
     * Convierte el campo 'activo' de string a boolean si es necesario.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('activo') && is_string($this->input('activo'))) {
            $this->merge([
                'activo' => filter_var($this->input('activo'), FILTER_VALIDATE_BOOLEAN),
            ]);
        }
    }
}
