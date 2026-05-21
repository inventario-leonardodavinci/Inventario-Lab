<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Request para validación de actualización de estado (activo/inactivo) de usuario.
 */
class ActualizarEstadoRequest extends FormRequest
{
    /**
     * La autorización se maneja a nivel de middleware (role:profesor).
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'activo' => ['required', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'activo.required' => 'El campo activo es obligatorio.',
            'activo.boolean'  => 'El campo activo debe ser verdadero o falso.',
        ];
    }
}
