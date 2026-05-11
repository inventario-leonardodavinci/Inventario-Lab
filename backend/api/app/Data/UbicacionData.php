<?php

namespace App\Data;

use Illuminate\Validation\Rule;
use Spatie\LaravelData\Data;

/**
 * DTO para validacion y transferencia de datos de Ubicaciones.
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
        $ubicacionId = request()->route('ubicacion')?->id;

        return [
            'nombre'      => ['required', 'string', 'max:100', Rule::unique('ubicaciones', 'nombre')->ignore($ubicacionId)],
            'tipo'        => ['required', 'string', 'in:armario,nevera,estanteria,cajon,vitrina,otro'],
            'descripcion' => ['nullable', 'string', 'max:500'],
        ];
    }

    public static function messages(): array
    {
        return [
            'nombre.required' => 'El nombre de la ubicacion es obligatorio.',
            'nombre.max'      => 'El nombre no puede superar los 100 caracteres.',
            'nombre.unique'   => 'Ya existe una ubicacion con ese nombre.',
            'tipo.required'   => 'El tipo de ubicacion es obligatorio.',
            'tipo.in'         => 'El tipo debe ser: armario, nevera, estanteria, cajon, vitrina u otro.',
        ];
    }
}
