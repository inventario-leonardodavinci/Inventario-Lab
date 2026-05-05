<?php

namespace App\Http\Controllers\Api;

use App\Data\UbicacionData;
use App\Http\Controllers\Controller;
use App\Models\Ubicacion;
use Illuminate\Http\JsonResponse;

class UbicacionController extends Controller
{
    public function index(): JsonResponse
    {
        $ubicaciones = Ubicacion::query()->orderBy('nombre')->get();
        return response()->json(['data' => $ubicaciones]);
    }

    public function show(Ubicacion $ubicacion): JsonResponse
    {
        return response()->json(['data' => $ubicacion]);
    }

    public function store(UbicacionData $data): JsonResponse
    {
        $ubicacion = Ubicacion::query()->create($data->toArray());
        return response()->json(['data' => $ubicacion], 201);
    }

    public function update(UbicacionData $data, Ubicacion $ubicacion): JsonResponse
    {
        $ubicacion->update($data->toArray());
        return response()->json(['data' => $ubicacion]);
    }
}
