<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MovimientoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tipo'                        => ['required', 'string', 'in:entrada,salida,traslado,ajuste'],
            'motivo'                      => ['nullable', 'string', 'max:255'],
            'ubicacion_origen_id'         => ['nullable', 'integer', 'exists:ubicaciones,id'],
            'ubicacion_destino_id'        => ['nullable', 'integer', 'exists:ubicaciones,id'],
            'lineas'                      => ['required', 'array', 'min:1'],
            'lineas.*.articulo_id'        => ['required', 'integer', 'exists:articulos,id'],
            'lineas.*.cantidad'           => ['required', 'numeric', 'gt:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'tipo.required'                   => 'El tipo de movimiento es obligatorio.',
            'tipo.in'                         => 'El tipo de movimiento debe ser: entrada, salida, traslado o ajuste.',
            'ubicacion_origen_id.exists'      => 'La ubicación de origen no existe.',
            'ubicacion_destino_id.exists'     => 'La ubicación de destino no existe.',
            'lineas.required'                 => 'Debe incluir al menos una línea de movimiento.',
            'lineas.min'                      => 'Debe incluir al menos una línea de movimiento.',
            'lineas.*.articulo_id.required'   => 'El artículo de la línea es obligatorio.',
            'lineas.*.articulo_id.exists'     => 'El artículo de la línea no existe.',
            'lineas.*.cantidad.required'      => 'La cantidad de la línea es obligatoria.',
            'lineas.*.cantidad.gt'            => 'La cantidad debe ser mayor que cero.',
        ];
    }
}
