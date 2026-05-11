<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Request para validación de creación y actualización de artículos.
 *
 * Valida los datos del artículo incluyendo campos opcionales
 * para stock inicial y ubicación en creación.
 */
class ArticuloRequest extends FormRequest
{
    /**
     * Determina si el usuario está autorizado para hacer esta solicitud.
     * La autorización se maneja a nivel de middleware/rutas.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Reglas de validación para el request.
     *
     * En creación (POST): nombre y categoría son requeridos.
     * En actualización (PATCH): todos los campos son opcionales (sometimes).
     *
     * @return array<string, array<int, mixed>> Reglas de validación
     */
    public function rules(): array
    {
        $esCreacion = $this->isMethod('POST');
        $articuloId = $this->route('articulo')?->id;

        return [
            'codigo' => [
                'nullable',
                'string',
                'max:' . config('constantes.codigo_max_length'),
                Rule::unique('articulos', 'codigo')->ignore($articuloId),
            ],
            'nombre'          => [$esCreacion ? 'required' : 'sometimes', 'string', 'max:' . config('constantes.nombre_max_length')],
            'descripcion'     => ['nullable', 'string', 'max:' . config('constantes.notas_max_length')],
            'categoria_id'    => [$esCreacion ? 'required' : 'sometimes', 'integer', 'exists:categorias,id'],
            'unidad'          => ['nullable', 'string', 'max:40'],
            'notas'           => ['nullable', 'string', 'max:' . config('constantes.notas_max_length')],
            'serial_number'   => ['nullable', 'string', 'max:120'],
            'material_type'   => ['nullable', 'string', 'max:80'],
            'capacity_ml'     => ['nullable', 'numeric', 'min:0'],
            'expiration_date' => ['nullable', 'date'],
            'stock_minimo'      => ['nullable', 'numeric', 'min:0'],
            'stock_inicial'     => ['nullable', 'numeric', 'min:0'],
            'ubicacion_id'      => ['nullable', 'integer', 'exists:ubicaciones,id'],
            'sub_ubicacion_id'  => ['nullable', 'integer', 'exists:sub_ubicaciones,id'],
            // Campos para equipos y máquinas inventariables
            'fecha_adquisicion' => ['nullable', 'date'],
            'precio_compra'     => ['nullable', 'numeric', 'min:0'],
            'proveedor'         => ['nullable', 'string', 'max:150'],
            'numero_factura'    => ['nullable', 'string', 'max:50'],
        ];
    }

    /**
     * Mensajes de error personalizados para las reglas de validación.
     *
     * @return array<string, string> Mensajes de error en español
     */
    public function messages(): array
    {
        return [
            'codigo.unique' => 'Ya existe un artículo con ese código.',
            'codigo.max' => 'El código no puede superar los ' . config('constantes.codigo_max_length') . ' caracteres.',
            'nombre.required' => 'El nombre del artículo es obligatorio.',
            'nombre.string' => 'El nombre debe ser una cadena de texto.',
            'nombre.max' => 'El nombre no puede superar los ' . config('constantes.nombre_max_length') . ' caracteres.',
            'descripcion.string' => 'La descripción debe ser una cadena de texto.',
            'categoria_id.required' => 'La categoría es obligatoria.',
            'categoria_id.integer' => 'El identificador de categoría debe ser un número entero.',
            'categoria_id.exists' => 'La categoría seleccionada no existe.',
            'unidad.string' => 'La unidad debe ser una cadena de texto.',
            'unidad.max' => 'La unidad no puede superar los 40 caracteres.',
            'notas.string' => 'Las notas deben ser una cadena de texto.',
        ];
    }
}
