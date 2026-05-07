<?php

namespace App\Http\Controllers\Api;

use App\Data\CategoriaData;
use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Models\Categoria;
use Illuminate\Http\JsonResponse;

class CategoriaController extends Controller
{
    public function index(): JsonResponse
    {
        $categorias = Categoria::query()
            ->withCount(['articulos as total_articulos' => fn ($q) => $q->where('activo', true)])
            ->orderBy('nombre')
            ->get();

        return ApiResponse::success($categorias->toArray());
    }

    public function show(Categoria $categoria): JsonResponse
    {
        $categoria->loadCount(['articulos as total_articulos' => fn ($q) => $q->where('activo', true)]);
        return ApiResponse::success($categoria->toArray());
    }

    public function store(CategoriaData $data): JsonResponse
    {
        $categoria = Categoria::query()->create($data->toArray());
        $categoria->total_articulos = 0;
        return ApiResponse::created($categoria->toArray());
    }

    public function update(CategoriaData $data, Categoria $categoria): JsonResponse
    {
        $categoria->update($data->toArray());
        $categoria->loadCount(['articulos as total_articulos' => fn ($q) => $q->where('activo', true)]);
        return ApiResponse::success($categoria->toArray());
    }

    public function destroy(Categoria $categoria): JsonResponse
    {
        if ($categoria->articulos()->exists()) {
            return ApiResponse::error('No se puede eliminar una categoría que tiene artículos asociados.', 422);
        }

        $categoria->delete();
        return ApiResponse::deleted();
    }
}
