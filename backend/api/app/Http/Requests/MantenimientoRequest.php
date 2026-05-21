<?php

namespace App\Http\Requests;

use App\Models\ActivoMantenimiento;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Request para validación de creación y actualización de activos de mantenimiento.
 *
 * En creación (POST): codigo_activo y estado son requeridos.
 * En actualización (PATCH): todos los campos son opcionales (sometimes).
 */
class MantenimientoRequest extends FormRequest
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
        $esCreacion = $this->isMethod('POST');

        /** @var ActivoMantenimiento|null $activo */
        $activo = $this->route('activo');

        return [
            'articulo_id'           => ['nullable', 'integer', 'exists:articulos,id'],
            'codigo_activo'         => [
                $esCreacion ? 'required' : 'sometimes',
                'string',
                'max:100',
                Rule::unique('activos_mantenimiento', 'codigo_activo')->ignore($activo?->id),
            ],
            'numero_serie'          => ['nullable', 'string', 'max:120'],
            'estado'                => [
                $esCreacion ? 'required' : 'sometimes',
                'string',
                Rule::in(['operativo', 'mantenimiento_pendiente', 'en_mantenimiento', 'fuera_servicio', 'retirado']),
            ],
            'ubicacion_actual_id'   => ['nullable', 'integer', 'exists:ubicaciones,id'],
            'notes'                 => ['nullable', 'string'],
            'next_service_due_date' => ['nullable', 'date'],
            'last_service_date'     => ['nullable', 'date'],
            'manufacturer'          => ['nullable', 'string', 'max:120'],
            'model'                 => ['nullable', 'string', 'max:120'],
            'purchase_date'         => ['nullable', 'date'],
            'warranty_end_date'     => ['nullable', 'date'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'articulo_id.exists'         => 'El artículo indicado no existe.',
            'codigo_activo.required'     => 'El código del activo es obligatorio.',
            'codigo_activo.unique'       => 'Ya existe un activo con ese código.',
            'estado.required'            => 'El estado es obligatorio.',
            'estado.in'                  => 'El estado debe ser uno de: operativo, mantenimiento_pendiente, en_mantenimiento, fuera_servicio, retirado.',
            'ubicacion_actual_id.exists' => 'La ubicación indicada no existe.',
        ];
    }
}
