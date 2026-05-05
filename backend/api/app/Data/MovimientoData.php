<?php

namespace App\Data;

use Spatie\LaravelData\Attributes\Validation\ArrayType;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;

/**
 * DTO para validación y transferencia de datos de Movimientos.
 */
class MovimientoData extends Data
{
    public function __construct(
        public readonly string $tipo,
        public readonly array $lineas,
        public readonly ?string $motivo = null,
        public readonly ?int $ubicacion_origen_id = null,
        public readonly ?int $ubicacion_destino_id = null,
    ) {
    }

    public static function rules(): array
    {
        return [
            'tipo'                  => ['required', 'string', 'in:entrada,salida,traslado,ajuste'],
            'motivo'                => ['nullable', 'string', 'max:255'],
            'ubicacion_origen_id'   => ['nullable', 'integer', 'exists:ubicaciones,id'],
            'ubicacion_destino_id'  => ['nullable', 'integer', 'exists:ubicaciones,id'],
            'lineas'                => ['required', 'array', 'min:1'],
            'lineas.*.articulo_id'  => ['required', 'integer', 'exists:articulos,id'],
            'lineas.*.cantidad'     => ['required', 'numeric', 'min:0.01'],
        ];
    }

    public static function messages(): array
    {
        return [
            'tipo.required'                 => 'El tipo de movimiento es obligatorio.',
            'tipo.in'                       => 'El tipo debe ser: entrada, salida, traslado o ajuste.',
            'lineas.required'               => 'Debe incluir al menos un artículo.',
            'lineas.min'                    => 'Debe incluir al menos un artículo.',
            'lineas.*.articulo_id.required' => 'El artículo es obligatorio.',
            'lineas.*.articulo_id.exists'   => 'El artículo seleccionado no existe.',
            'lineas.*.cantidad.required'    => 'La cantidad es obligatoria.',
            'lineas.*.cantidad.min'         => 'La cantidad debe ser mayor que cero.',
            'ubicacion_origen_id.exists'    => 'La ubicación de origen no existe.',
            'ubicacion_destino_id.exists'   => 'La ubicación de destino no existe.',
        ];
    }
}
