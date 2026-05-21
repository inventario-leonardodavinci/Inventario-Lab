<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Requests\MantenimientoRequest;
use App\Http\Resources\ActivoMantenimientoResource;
use App\Models\ActivoMantenimiento;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MantenimientoController extends Controller
{

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

    public function store(MantenimientoRequest $request): JsonResponse
    {
        $activo = ActivoMantenimiento::query()->create($request->validated());
        $activo->load(['articulo:id,nombre', 'ubicacionActual:id,nombre']);

        return ApiResponse::created((new ActivoMantenimientoResource($activo))->toArray($request));
    }

    public function update(MantenimientoRequest $request, ActivoMantenimiento $activo): JsonResponse
    {
        $activo->update($request->validated());
        $activo->load(['articulo:id,nombre', 'ubicacionActual:id,nombre']);

        return ApiResponse::success((new ActivoMantenimientoResource($activo))->toArray($request));
    }

    public function destroy(ActivoMantenimiento $activo): JsonResponse
    {
        $activo->delete();
        return ApiResponse::deleted();
    }
}
