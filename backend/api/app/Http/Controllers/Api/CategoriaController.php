<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Requests\CategoriaRequest;
use App\Models\Categoria;
use Illuminate\Http\JsonResponse;

class CategoriaController extends Controller
{
    public function index(): JsonResponse
    {
        $categorias = Categoria::query()
            ->withCount('articulos as total_articulos')
            ->orderBy('nombre')
            ->get();

        return ApiResponse::success($categorias->toArray());
    }

    public function show(Categoria $categoria): JsonResponse
    {
        $categoria->loadCount('articulos as total_articulos');
        return ApiResponse::success($categoria->toArray());
    }

    public function store(CategoriaRequest $request): JsonResponse
    {
        $categoria = Categoria::query()->create($request->validated());
        $categoria->total_articulos = 0;
        return ApiResponse::created($categoria->toArray());
    }

    public function update(CategoriaRequest $request, Categoria $categoria): JsonResponse
    {
        $categoria->update($request->validated());
        $categoria->loadCount('articulos as total_articulos');
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
