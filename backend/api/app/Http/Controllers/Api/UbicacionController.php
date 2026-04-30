<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UbicacionRequest;
use App\Models\Ubicacion;
use Illuminate\Http\JsonResponse;

class UbicacionController extends Controller
{
    /**
     * Lista todas las ubicaciones ordenadas por nombre.
     */
    public function index(): JsonResponse
    {
        $ubicaciones = Ubicacion::query()
            ->orderBy('nombre')
            ->get();

        return response()->json(['data' => $ubicaciones]);
    }

    /**
     * Detalle de una ubicación.
     */
    public function show(Ubicacion $ubicacion): JsonResponse
    {
        return response()->json(['data' => $ubicacion]);
    }

    /**
     * Crear una nueva ubicación (HTTP 201).
     */
    public function store(UbicacionRequest $request): JsonResponse
    {
        $ubicacion = Ubicacion::query()->create($request->validated());

        return response()->json(['data' => $ubicacion], 201);
    }

    /**
     * Actualizar una ubicación existente (HTTP 200).
     */
    public function update(UbicacionRequest $request, Ubicacion $ubicacion): JsonResponse
    {
        $ubicacion->update($request->validated());

        return response()->json(['data' => $ubicacion]);
    }
}
