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
            ->with('category:id,name')
            ->when($busqueda !== '', function ($query) use ($busqueda): void {
                $query->where(function ($q) use ($busqueda): void {
                    $q->where('name', 'ILIKE', "%{$busqueda}%")
                        ->orWhere('code', 'ILIKE', "%{$busqueda}%");
                });
            })
            ->orderBy('name')
            ->paginate((int) $request->query('per_page', 20));

        $articuloIds = $articulos->getCollection()->pluck('id');
        $stockPorArticulo = NivelStock::query()
            ->selectRaw('item_id, SUM(quantity) as total_quantity, MIN(min_quantity) as min_quantity')
            ->whereIn('item_id', $articuloIds)
            ->groupBy('item_id')
            ->get()
            ->keyBy('item_id');

        $filas = $articulos->getCollection()->map(function (Articulo $articulo) use ($stockPorArticulo): array {
            $stock = $stockPorArticulo->get($articulo->id);
            $cantidad = (float) ($stock->total_quantity ?? 0);
            $cantidadMinima = (float) ($stock->min_quantity ?? 0);

            return [
                'id' => $articulo->id,
                'code' => $articulo->code,
                'name' => $articulo->name,
                'category' => $articulo->category?->name,
                'stock' => $cantidad,
                'min_stock' => $cantidadMinima,
                'status' => $cantidad <= $cantidadMinima ? 'critical' : 'ok',
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
            'code' => ['nullable', 'string', 'max:100', Rule::unique('items', 'code')],
            'name' => ['required', 'string', 'max:180'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'unit' => ['nullable', 'string', 'max:40'],
            'material_type' => ['nullable', 'string', 'max:60'],
            'capacity_ml' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $articulo = Articulo::query()->create($validados + ['is_active' => true]);

        return response()->json(['data' => $articulo], 201);
    }
}
