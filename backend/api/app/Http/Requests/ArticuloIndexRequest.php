<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ArticuloIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:180'],
            'activo' => ['nullable', 'boolean'],
            'categoria_id' => ['nullable', 'integer', 'exists:categorias,id'],
            'ubicacion_id' => ['nullable', 'integer', 'exists:ubicaciones,id'],
            'estado_stock' => ['nullable', Rule::in(['ok', 'critico'])],
            'order_by' => ['nullable', Rule::in(['nombre', 'codigo', 'stock_total', 'categoria', 'created_at'])],
            'order_dir' => ['nullable', Rule::in(['asc', 'desc'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:500'],
        ];
    }
}
