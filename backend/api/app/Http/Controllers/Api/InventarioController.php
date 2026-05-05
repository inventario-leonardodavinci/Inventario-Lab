<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Articulo;
use App\Models\NivelStock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class InventarioController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $busqueda = trim((string) $request->query('search', ''));

        $articulos = Articulo::query()
            ->with('categoria:id,nombre')
            ->when($busqueda !== '', function ($query) use ($busqueda): void {
                $query->where(function ($q) use ($busqueda): void {
                    $q->where('nombre', 'ILIKE', "%{$busqueda}%")
                        ->orWhere('codigo', 'ILIKE', "%{$busqueda}%");
                });
            })
            ->orderBy('nombre')
            ->paginate((int) $request->query('per_page', 20));

        $articuloIds = $articulos->getCollection()->pluck('id');
        $stockPorArticulo = NivelStock::query()
            ->selectRaw('articulo_id, SUM(cantidad) as total_cantidad, MIN(cantidad_minima) as cantidad_minima')
            ->whereIn('articulo_id', $articuloIds)
            ->groupBy('articulo_id')
            ->get()
            ->keyBy('articulo_id');

        $filas = $articulos->getCollection()->map(function (Articulo $articulo) use ($stockPorArticulo): array {
            $stock = $stockPorArticulo->get($articulo->id);
            $cantidad = (float) ($stock->total_cantidad ?? 0);
            $cantidadMinima = (float) ($stock->cantidad_minima ?? 0);

            return [
                'id' => $articulo->id,
                'codigo' => $articulo->codigo,
                'nombre' => $articulo->nombre,
                'categoria' => $articulo->categoria?->nombre,
                'stock' => $cantidad,
                'stock_minimo' => $cantidadMinima,
                'estado_stock' => ($cantidadMinima > 0 && $cantidad <= $cantidadMinima) ? 'critico' : 'ok',
            ];
        });

        return response()->json([
            'data' => $filas,
            'meta' => [
                'current_page' => $articulos->currentPage(),
                'last_page' => $articulos->lastPage(),
                'total' => $articulos->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validados = $request->validate([
            'codigo' => ['nullable', 'string', 'max:100', Rule::unique('articulos', 'codigo')],
            'nombre' => ['required', 'string', 'max:180'],
            'categoria_id' => ['required', 'integer', 'exists:categorias,id'],
            'unidad' => ['nullable', 'string', 'max:40'],
            'notas' => ['nullable', 'string'],
        ], [
            'codigo.unique' => 'Ya existe un artículo con ese código.',
            'nombre.required' => 'El nombre del artículo es obligatorio.',
            'nombre.max' => 'El nombre no puede superar los 180 caracteres.',
            'categoria_id.required' => 'La categoría es obligatoria.',
            'categoria_id.exists' => 'La categoría seleccionada no existe.',
        ]);

        $articulo = Articulo::query()->create($validados + ['activo' => true]);

        return response()->json(['data' => $articulo], 201);
    }
}
