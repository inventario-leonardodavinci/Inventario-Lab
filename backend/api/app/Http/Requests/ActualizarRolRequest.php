<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Request para validación de actualización de rol de usuario.
 */
class ActualizarRolRequest extends FormRequest
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
            'rol' => ['required', 'string', 'in:profesor,consultor'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'rol.required' => 'El rol es obligatorio.',
            'rol.in'       => 'El rol debe ser profesor o consultor.',
        ];
    }
}
