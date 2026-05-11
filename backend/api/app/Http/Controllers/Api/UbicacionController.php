<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Requests\UbicacionRequest;
use App\Models\Ubicacion;
use Illuminate\Http\JsonResponse;

/**
 * Controlador para la gestión de ubicaciones físicas del inventario.
 *
 * Proporciona endpoints CRUD para ubicaciones principales (armarios, almacenes)
 * incluyendo sus sub-ubicaciones asociadas.
 */
class UbicacionController extends Controller
{
    /**
     * Listar todas las ubicaciones con sus sub-ubicaciones.
     *
     * @return JsonResponse Listado de ubicaciones ordenadas por nombre
     */
    public function index(): JsonResponse
    {
        $ubicaciones = Ubicacion::query()
            ->with(['subUbicaciones' => function ($query): void {
                $query->where('activo', true)->orderBy('orden')->orderBy('nombre');
            }])
            ->orderBy('nombre')
            ->get();

        $resultado = $ubicaciones->map(fn ($ubicacion) => [
            'id' => $ubicacion->id,
            'nombre' => $ubicacion->nombre,
            'descripcion' => $ubicacion->descripcion,
            'tipo' => $ubicacion->tipo,
            'created_at' => $ubicacion->created_at,
            'updated_at' => $ubicacion->updated_at,
            'sub_ubicaciones' => $ubicacion->subUbicaciones->map(fn ($sub) => [
                'id' => $sub->id,
                'ubicacion_id' => $sub->ubicacion_id,
                'nombre' => $sub->nombre,
                'descripcion' => $sub->descripcion,
                'orden' => $sub->orden,
                'activo' => $sub->activo,
            ])->toArray(),
        ]);

        return ApiResponse::success($resultado->toArray());
    }

    /**
     * Mostrar detalle de una ubicación específica.
     *
     * @param Ubicacion $ubicacion Ubicación resuelta por route model binding
     * @return JsonResponse Datos de la ubicación
     */
    public function show(Ubicacion $ubicacion): JsonResponse
    {
        return ApiResponse::success($ubicacion->toArray());
    }

    /**
     * Crear una nueva ubicación.
     *
     * @param UbicacionRequest $request Datos validados de la ubicación
     * @return JsonResponse Respuesta con código 201 Created
     */
    public function store(UbicacionRequest $request): JsonResponse
    {
        $ubicacion = Ubicacion::query()->create($request->validated());
        return ApiResponse::created($ubicacion->toArray());
    }

    /**
     * Actualizar una ubicación existente.
     *
     * @param UbicacionRequest $request Datos validados para actualizar
     * @param Ubicacion $ubicacion Ubicación a actualizar
     * @return JsonResponse Datos actualizados de la ubicación
     */
    public function update(UbicacionRequest $request, Ubicacion $ubicacion): JsonResponse
    {
        $ubicacion->update($request->validated());

        return ApiResponse::success($ubicacion->toArray());
    }
}
