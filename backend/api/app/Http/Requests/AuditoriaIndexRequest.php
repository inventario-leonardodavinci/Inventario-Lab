<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Request para validación de filtros del listado de auditoría.
 */
class AuditoriaIndexRequest extends FormRequest
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
            'per_page'     => ['nullable', 'integer', 'min:1', 'max:100'],
            'entidad_tipo' => ['nullable', 'string', 'max:100'],
            'tipo_evento'  => ['nullable', 'string', 'max:100'],
            'desde'        => ['nullable', 'date'],
            'hasta'        => ['nullable', 'date', 'after_or_equal:desde'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'per_page.integer'       => 'El número de resultados por página debe ser un entero.',
            'per_page.min'           => 'El número de resultados por página debe ser al menos 1.',
            'per_page.max'           => 'El número de resultados por página no puede superar 100.',
            'desde.date'             => 'La fecha de inicio no es válida.',
            'hasta.date'             => 'La fecha de fin no es válida.',
            'hasta.after_or_equal'   => 'La fecha de fin debe ser igual o posterior a la fecha de inicio.',
        ];
    }
}
