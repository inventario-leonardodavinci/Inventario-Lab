<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivoMantenimiento;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MantenimientoController extends Controller
{
    private const ESTADOS_VALIDOS = [
        'operativo',
        'mantenimiento_pendiente',
        'en_mantenimiento',
        'fuera_servicio',
        'retirado',
    ];

    public function index(Request $request): JsonResponse
    {
        $activos = ActivoMantenimiento::query()
            ->with(['articulo:id,nombre', 'ubicacionActual:id,nombre'])
            ->latest('id')
            ->paginate((int) $request->query('per_page', 20));

        return response()->json($activos);
    }

    public function store(Request $request): JsonResponse
    {
        $validados = $request->validate([
            'articulo_id'        => ['nullable', 'integer', 'exists:articulos,id'],
            'codigo_activo'      => ['required', 'string', 'max:100', 'unique:activos_mantenimiento,codigo_activo'],
            'numero_serie'       => ['nullable', 'string', 'max:120'],
            'estado'             => ['required', 'string', 'in:' . implode(',', self::ESTADOS_VALIDOS)],
            'ubicacion_actual_id' => ['nullable', 'integer', 'exists:ubicaciones,id'],
            'notas'              => ['nullable', 'string'],
        ], [
            'articulo_id.exists'         => 'El artículo indicado no existe.',
            'codigo_activo.required'     => 'El código del activo es obligatorio.',
            'codigo_activo.unique'       => 'Ya existe un activo con ese código.',
            'estado.required'            => 'El estado es obligatorio.',
            'estado.in'                  => 'El estado debe ser uno de: operativo, mantenimiento_pendiente, en_mantenimiento, fuera_servicio, retirado.',
            'ubicacion_actual_id.exists' => 'La ubicación indicada no existe.',
        ]);

        $activo = ActivoMantenimiento::query()->create($validados);
        $activo->load(['articulo:id,nombre', 'ubicacionActual:id,nombre']);

        return response()->json(['data' => $activo], 201);
    }

    public function update(Request $request, ActivoMantenimiento $activo): JsonResponse
    {
        $validados = $request->validate([
            'articulo_id'        => ['nullable', 'integer', 'exists:articulos,id'],
            'codigo_activo'      => ['sometimes', 'string', 'max:100', 'unique:activos_mantenimiento,codigo_activo,' . $activo->id],
            'numero_serie'       => ['nullable', 'string', 'max:120'],
            'estado'             => ['sometimes', 'string', 'in:' . implode(',', self::ESTADOS_VALIDOS)],
            'ubicacion_actual_id' => ['nullable', 'integer', 'exists:ubicaciones,id'],
            'notas'              => ['nullable', 'string'],
        ], [
            'articulo_id.exists'         => 'El artículo indicado no existe.',
            'codigo_activo.unique'       => 'Ya existe un activo con ese código.',
            'estado.in'                  => 'El estado debe ser uno de: operativo, mantenimiento_pendiente, en_mantenimiento, fuera_servicio, retirado.',
            'ubicacion_actual_id.exists' => 'La ubicación indicada no existe.',
        ]);

        $activo->update($validados);
        $activo->load(['articulo:id,nombre', 'ubicacionActual:id,nombre']);

        return response()->json(['data' => $activo]);
    }
}
