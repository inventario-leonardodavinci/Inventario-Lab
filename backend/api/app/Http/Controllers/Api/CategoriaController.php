<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CategoriaRequest;
use App\Models\Categoria;
use Illuminate\Http\JsonResponse;

class CategoriaController extends Controller
{
    /**
     * Lista todas las categorías con el total de artículos activos asociados.
     */
    public function index(): JsonResponse
    {
        $categorias = Categoria::query()
            ->withCount(['articulos as total_articulos' => function ($query): void {
                $query->where('activo', true);
            }])
            ->orderBy('nombre')
            ->get();

        return response()->json(['data' => $categorias]);
    }

    /**
     * Detalle de una categoría.
     */
    public function show(Categoria $categoria): JsonResponse
    {
        $categoria->loadCount(['articulos as total_articulos' => function ($query): void {
            $query->where('activo', true);
        }]);

        return response()->json(['data' => $categoria]);
    }

    /**
     * Crear una nueva categoría (HTTP 201).
     */
    public function store(CategoriaRequest $request): JsonResponse
    {
        $categoria = Categoria::query()->create($request->validated());
        $categoria->total_articulos = 0;

        return response()->json(['data' => $categoria], 201);
    }

    /**
     * Actualizar una categoría existente (HTTP 200).
     */
    public function update(CategoriaRequest $request, Categoria $categoria): JsonResponse
    {
        $categoria->update($request->validated());

        $categoria->loadCount(['articulos as total_articulos' => function ($query): void {
            $query->where('activo', true);
        }]);

        return response()->json(['data' => $categoria]);
    }

    /**
     * Eliminar una categoría (solo si no tiene artículos asociados).
     */
    public function destroy(Categoria $categoria): JsonResponse
    {
        if ($categoria->articulos()->exists()) {
            return response()->json([
                'message' => 'No se puede eliminar una categoría que tiene artículos asociados.',
            ], 422);
        }

        $categoria->delete();

        return response()->json(null, 204);
    }
}
