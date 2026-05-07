<?php

namespace App\Http\Controllers\Api;

use App\Data\UbicacionData;
use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Models\Ubicacion;
use Illuminate\Http\JsonResponse;

class UbicacionController extends Controller
{
    public function index(): JsonResponse
    {
        $ubicaciones = Ubicacion::query()->orderBy('nombre')->get();
        return ApiResponse::success($ubicaciones->toArray());
    }

    public function show(Ubicacion $ubicacion): JsonResponse
    {
        return ApiResponse::success($ubicacion->toArray());
    }

    public function store(UbicacionData $data): JsonResponse
    {
        $ubicacion = Ubicacion::query()->create($data->toArray());
        return ApiResponse::created($ubicacion->toArray());
    }

    public function update(UbicacionData $data, Ubicacion $ubicacion): JsonResponse
    {
        $ubicacion->update($data->toArray());
        return ApiResponse::success($ubicacion->toArray());
    }
}
