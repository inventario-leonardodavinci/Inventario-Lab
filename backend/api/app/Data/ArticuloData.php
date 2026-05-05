<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

/**
 * DTO para validación y transferencia de datos de Artículos.
 * Reemplaza la validación manual en ArticuloRequest.
 */
class ArticuloData extends Data
{
    public function __construct(
        public readonly string $nombre,
        public readonly ?string $codigo = null,
        public readonly ?string $descripcion = null,
        public readonly ?int $categoria_id = null,
        public readonly ?string $unidad = null,
        public readonly ?string $notas = null,
        public readonly ?float $stock_inicial = null,
        public readonly ?float $stock_minimo = null,
        public readonly ?int $ubicacion_id = null,
    ) {
    }

    /**
     * Reglas de validación para el DTO.
     */
    public static function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:180'],
            'codigo' => ['nullable', 'string', 'max:100', 'unique:articulos,codigo'],
            'descripcion' => ['nullable', 'string', 'max:1000'],
            'categoria_id' => ['required', 'integer', 'exists:categorias,id'],
            'unidad' => ['nullable', 'string', 'max:40'],
            'notas' => ['nullable', 'string'],
            'stock_inicial' => ['nullable', 'numeric', 'min:0'],
            'stock_minimo' => ['nullable', 'numeric', 'min:0'],
            'ubicacion_id' => ['nullable', 'integer', 'exists:ubicaciones,id'],
        ];
    }

    /**
     * Mensajes de error personalizados.
     */
    public static function messages(): array
    {
        return [
            'nombre.required' => 'El nombre del artículo es obligatorio.',
            'nombre.max' => 'El nombre no puede tener más de 180 caracteres.',
            'codigo.unique' => 'Ya existe un artículo con ese código.',
            'categoria_id.required' => 'La categoría es obligatoria.',
            'categoria_id.exists' => 'La categoría seleccionada no existe.',
            'ubicacion_id.exists' => 'La ubicación seleccionada no existe.',
            'stock_inicial.min' => 'El stock inicial no puede ser negativo.',
            'stock_minimo.min' => 'El stock mínimo no puede ser negativo.',
        ];
    }
}
