<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Requests\SubUbicacionRequest;
use App\Models\SubUbicacion;
use App\Models\Ubicacion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controlador para la gestión de sub-ubicaciones (baldas, estantes).
 *
 * Las sub-ubicaciones son subdivisiones físicas dentro de ubicaciones principales.
 * Proporciona endpoints CRUD con manejo de stock asociado.
 */
class SubUbicacionController extends Controller
{
    /**
     * Listar sub-ubicaciones, opcionalmente filtradas por ubicación.
     *
     * Query params:
     * - ubicacion_id: filtrar por ubicación principal
     * - incluir_inactivas: si está presente, incluye sub-ubicaciones desactivadas
     *
     * @param Request $request Request con parámetros de filtrado
     * @return JsonResponse Listado de sub-ubicaciones
     */
    public function index(Request $request): JsonResponse
    {
        $query = SubUbicacion::with('ubicacion');

        // Filtrar por ubicación
        if ($request->has('ubicacion_id')) {
            $query->where('ubicacion_id', $request->input('ubicacion_id'));
        }

        // Solo activas por defecto
        if (!$request->has('incluir_inactivas')) {
            $query->where('activo', true);
        }

        $subUbicaciones = $query->ordenadas()->get();

        return ApiResponse::success($subUbicaciones->toArray());
    }

    /**
     * Mostrar detalle de una sub-ubicación específica.
     *
     * @param SubUbicacion $subUbicacion Sub-ubicación resuelta por route model binding
     * @return JsonResponse Datos de la sub-ubicación con relaciones cargadas
     */
    public function show(SubUbicacion $subUbicacion): JsonResponse
    {
        $subUbicacion->load(['ubicacion', 'articulos']);

        return ApiResponse::success($subUbicacion->toArray());
    }

    /**
     * Crear una nueva sub-ubicación.
     *
     * @param SubUbicacionRequest $request Datos validados de la sub-ubicación
     * @return JsonResponse Respuesta con código 201 Created
     */
    public function store(SubUbicacionRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['activo'] = $data['activo'] ?? true;
        $data['orden'] = $data['orden'] ?? 0;

        $subUbicacion = SubUbicacion::create($data);
        $subUbicacion->load('ubicacion');

        return ApiResponse::created($subUbicacion->toArray());
    }

    /**
     * Actualizar una sub-ubicación existente.
     *
     * @param SubUbicacionRequest $request Datos validados para actualizar
     * @param SubUbicacion $subUbicacion Sub-ubicación a actualizar
     * @return JsonResponse Datos actualizados de la sub-ubicación
     */
    public function update(SubUbicacionRequest $request, SubUbicacion $subUbicacion): JsonResponse
    {
        $data = $request->validated();

        $subUbicacion->update($data);
        $subUbicacion->load('ubicacion');

        return ApiResponse::success($subUbicacion->toArray());
    }

    /**
     * Eliminar o desactivar una sub-ubicación.
     *
     * Si la sub-ubicación tiene stock asociado, se desactiva en lugar de eliminar.
     * Si no tiene stock, se elimina físicamente.
     *
     * @param SubUbicacion $subUbicacion Sub-ubicación a eliminar/desactivar
     * @return JsonResponse Mensaje de confirmación
     */
    public function destroy(SubUbicacion $subUbicacion): JsonResponse
    {
        // Verificar si hay stock asociado
        $stockCount = $subUbicacion->nivelesStock()->count();

        if ($stockCount > 0) {
            // Desactivar en lugar de eliminar
            $subUbicacion->update(['activo' => false]);
            return ApiResponse::success([
                'message' => 'Sub-ubicación desactivada (tenía stock asociado)',
                'sub_ubicacion' => $subUbicacion->toArray(),
            ]);
        }

        $subUbicacion->delete();
        return ApiResponse::success(['message' => 'Sub-ubicación eliminada']);
    }

    /**
     * Listar sub-ubicaciones de una ubicación específica.
     *
     * @param Ubicacion $ubicacion Ubicación padre
     * @return JsonResponse Listado de sub-ubicaciones de la ubicación
     */
    public function porUbicacion(Ubicacion $ubicacion): JsonResponse
    {
        $subUbicaciones = $ubicacion->subUbicaciones;

        return ApiResponse::success($subUbicaciones->toArray());
    }
}
