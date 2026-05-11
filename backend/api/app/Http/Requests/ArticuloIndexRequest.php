<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Request para validación de parámetros de listado de artículos.
 *
 * Valida filtros, ordenamiento y paginación para el endpoint de listado.
 */
class ArticuloIndexRequest extends FormRequest
{
    /**
     * La autorización se maneja a nivel de middleware.
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
            'search' => ['nullable', 'string', 'max:180'],
            'categoria_id' => ['nullable', 'integer', 'exists:categorias,id'],
            'ubicacion_id' => ['nullable', 'integer', 'exists:ubicaciones,id'],
            'sub_ubicacion_id' => ['nullable', 'integer', 'exists:sub_ubicaciones,id'],
            'estado_stock' => ['nullable', Rule::in(['ok', 'critico'])],
            'order_by' => ['nullable', Rule::in(['nombre', 'codigo', 'stock_total', 'categoria', 'created_at'])],
            'order_dir' => ['nullable', Rule::in(['asc', 'desc'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:500'],
        ];
    }
}
