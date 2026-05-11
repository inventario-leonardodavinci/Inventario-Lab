<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Request para validación de parámetros de listado de usuarios.
 *
 * Valida el parámetro de paginación per_page.
 */
class UsuarioIndexRequest extends FormRequest
{
    /**
     * La autorización se maneja a nivel de middleware/rutas (role:profesor).
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Reglas de validación para los parámetros de consulta.
     *
     * @return array<string, array<int, mixed>> Reglas de validación
     */
    public function rules(): array
    {
        return [
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
