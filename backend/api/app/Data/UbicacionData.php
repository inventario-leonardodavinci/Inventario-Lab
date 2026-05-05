<?php

namespace App\Data;

use Spatie\LaravelData\Data;

/**
 * DTO para validación y transferencia de datos de Ubicaciones.
 */
class UbicacionData extends Data
{
    public function __construct(
        public readonly string $nombre,
        public readonly string $tipo,
        public readonly ?string $descripcion = null,
    ) {
    }

    public static function rules(): array
    {
        return [
            'nombre'      => ['required', 'string', 'max:100'],
            'tipo'        => ['required', 'string', 'in:armario,nevera,estanteria,cajon,vitrina,otro'],
            'descripcion' => ['nullable', 'string', 'max:500'],
        ];
    }

    public static function messages(): array
    {
        return [
            'nombre.required' => 'El nombre de la ubicación es obligatorio.',
            'nombre.max'      => 'El nombre no puede superar los 100 caracteres.',
            'tipo.required'   => 'El tipo de ubicación es obligatorio.',
            'tipo.in'         => 'El tipo debe ser: armario, nevera, estantería, cajón, vitrina u otro.',
        ];
    }
}
