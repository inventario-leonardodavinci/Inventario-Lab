<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Resources\ActivoMantenimientoResource;
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
        $perPage = min(max((int) $request->query('per_page', 20), 1), 100);

        $activos = ActivoMantenimiento::query()
            ->with(['articulo:id,nombre', 'ubicacionActual:id,nombre'])
            ->latest('id')
            ->paginate($perPage);

        return ApiResponse::paginated(
            collect($activos->items())->map(fn ($activo) => (new ActivoMantenimientoResource($activo))->toArray($request))->toArray(),
            [
                'current_page' => $activos->currentPage(),
                'last_page'    => $activos->lastPage(),
                'total'        => $activos->total(),
            ]
        );
    }

    public function resumen(): JsonResponse
    {
        $base = ActivoMantenimiento::query();

        return ApiResponse::success([
            'total' => (clone $base)->count(),
            'operativos' => (clone $base)->where('estado', 'operativo')->count(),
            'en_mantenimiento' => (clone $base)->where('estado', 'en_mantenimiento')->count(),
            'mantenimiento_pendiente' => (clone $base)->where('estado', 'mantenimiento_pendiente')->count(),
            'fuera_servicio' => (clone $base)->where('estado', 'fuera_servicio')->count(),
            'retirados' => (clone $base)->where('estado', 'retirado')->count(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validados = $request->validate([
            'articulo_id'           => ['nullable', 'integer', 'exists:articulos,id'],
            'codigo_activo'         => ['required', 'string', 'max:100', 'unique:activos_mantenimiento,codigo_activo'],
            'numero_serie'          => ['nullable', 'string', 'max:120'],
            'estado'                => ['required', 'string', 'in:' . implode(',', self::ESTADOS_VALIDOS)],
            'ubicacion_actual_id'   => ['nullable', 'integer', 'exists:ubicaciones,id'],
            'notes'                 => ['nullable', 'string'],
            'next_service_due_date' => ['nullable', 'date'],
            'last_service_date'     => ['nullable', 'date'],
            'manufacturer'          => ['nullable', 'string', 'max:120'],
            'model'                 => ['nullable', 'string', 'max:120'],
            'purchase_date'         => ['nullable', 'date'],
            'warranty_end_date'     => ['nullable', 'date'],
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

        return ApiResponse::created((new ActivoMantenimientoResource($activo))->toArray($request));
    }

    public function update(Request $request, ActivoMantenimiento $activo): JsonResponse
    {
        $validados = $request->validate([
            'articulo_id'           => ['nullable', 'integer', 'exists:articulos,id'],
            'codigo_activo'         => ['sometimes', 'string', 'max:100', 'unique:activos_mantenimiento,codigo_activo,' . $activo->id],
            'numero_serie'          => ['nullable', 'string', 'max:120'],
            'estado'                => ['sometimes', 'string', 'in:' . implode(',', self::ESTADOS_VALIDOS)],
            'ubicacion_actual_id'   => ['nullable', 'integer', 'exists:ubicaciones,id'],
            'notes'                 => ['nullable', 'string'],
            'next_service_due_date' => ['nullable', 'date'],
            'last_service_date'     => ['nullable', 'date'],
            'manufacturer'          => ['nullable', 'string', 'max:120'],
            'model'                 => ['nullable', 'string', 'max:120'],
            'purchase_date'         => ['nullable', 'date'],
            'warranty_end_date'     => ['nullable', 'date'],
        ], [
            'articulo_id.exists'         => 'El artículo indicado no existe.',
            'codigo_activo.unique'       => 'Ya existe un activo con ese código.',
            'estado.in'                  => 'El estado debe ser uno de: operativo, mantenimiento_pendiente, en_mantenimiento, fuera_servicio, retirado.',
            'ubicacion_actual_id.exists' => 'La ubicación indicada no existe.',
        ]);

        $activo->update($validados);
        $activo->load(['articulo:id,nombre', 'ubicacionActual:id,nombre']);

        return ApiResponse::success((new ActivoMantenimientoResource($activo))->toArray($request));
    }

    public function destroy(ActivoMantenimiento $activo): JsonResponse
    {
        $activo->delete();
        return ApiResponse::success(['message' => 'Activo de mantenimiento eliminado exitosamente.']);
    }
}
