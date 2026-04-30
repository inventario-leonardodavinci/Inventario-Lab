<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ArticuloRequest;
use App\Models\Articulo;
use App\Models\NivelStock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ArticuloController extends Controller
{
    /**
     * Serializa un artículo al formato de respuesta estándar.
     */
    private function serializar(Articulo $articulo, float $stockTotal = 0.0, float $cantidadMinima = 0.0): array
    {
        return [
            'id'           => $articulo->id,
            'codigo'       => $articulo->codigo,
            'nombre'       => $articulo->nombre,
            'descripcion'  => $articulo->descripcion,
            'categoria_id' => $articulo->categoria_id,
            'categoria'    => $articulo->categoria?->nombre,
            'unidad'       => $articulo->unidad,
            'notas'        => $articulo->notas,
            'activo'       => $articulo->activo,
            'stock_total'  => $stockTotal,
            'estado_stock' => $stockTotal <= $cantidadMinima ? 'critico' : 'ok',
            'created_at'   => $articulo->created_at,
            'updated_at'   => $articulo->updated_at,
        ];
    }

    /**
     * Lista paginada de artículos con categoría resuelta y stock total.
     */
    public function index(Request $request): JsonResponse
    {
        $busqueda = trim((string) $request->query('search', ''));
        $activo = $request->query('activo');

        $articulos = Articulo::query()
            ->with('categoria:id,nombre')
            ->when($busqueda !== '', function ($query) use ($busqueda): void {
                $query->where(function ($q) use ($busqueda): void {
                    $q->where('nombre', 'ILIKE', "%{$busqueda}%")
                        ->orWhere('codigo', 'ILIKE', "%{$busqueda}%");
                });
            })
            ->when($activo !== null, function ($query) use ($activo): void {
                $query->where('activo', filter_var($activo, FILTER_VALIDATE_BOOLEAN));
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

            return $this->serializar($articulo, $cantidad, $cantidadMinima);
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

    /**
     * Detalle de un artículo con categoría y niveles de stock por ubicación.
     */
    public function show(Articulo $articulo): JsonResponse
    {
        $articulo->load(['categoria:id,nombre', 'nivelesStock.ubicacion']);

        $stockTotal = $articulo->nivelesStock->sum('cantidad');
        $cantidadMinima = (float) ($articulo->nivelesStock->min('cantidad_minima') ?? 0);

        return response()->json([
            'data' => [
                'id' => $articulo->id,
                'codigo' => $articulo->codigo,
                'nombre' => $articulo->nombre,
                'descripcion' => $articulo->descripcion,
                'categoria_id' => $articulo->categoria_id,
                'categoria' => $articulo->categoria?->nombre,
                'unidad' => $articulo->unidad,
                'notas' => $articulo->notas,
                'activo' => $articulo->activo,
                'stock_total' => (float) $stockTotal,
                'estado_stock' => (float) $stockTotal <= $cantidadMinima ? 'critico' : 'ok',
                'niveles_stock' => $articulo->nivelesStock->map(fn ($nivel) => [
                    'id' => $nivel->id,
                    'ubicacion_id' => $nivel->ubicacion_id,
                    'ubicacion' => $nivel->ubicacion?->nombre,
                    'cantidad' => (float) $nivel->cantidad,
                    'cantidad_minima' => (float) $nivel->cantidad_minima,
                ]),
                'created_at' => $articulo->created_at,
                'updated_at' => $articulo->updated_at,
            ],
        ]);
    }

    /**
     * Crear un nuevo artículo (HTTP 201).
     */
    public function store(ArticuloRequest $request): JsonResponse
    {
        $articulo = Articulo::query()->create(
            $request->validated() + ['activo' => true]
        );

        $articulo->load('categoria:id,nombre');

        return response()->json([
            'data' => $this->serializar($articulo, 0.0, 0.0),
        ], 201);
    }

    /**
     * Actualizar un artículo existente (HTTP 200).
     */
    public function update(ArticuloRequest $request, Articulo $articulo): JsonResponse
    {
        $articulo->update($request->validated());
        $articulo->load('categoria:id,nombre');

        $stockTotal = (float) $articulo->nivelesStock()->sum('cantidad');
        $cantidadMinima = (float) ($articulo->nivelesStock()->min('cantidad_minima') ?? 0);

        return response()->json([
            'data' => $this->serializar($articulo, $stockTotal, $cantidadMinima),
        ]);
    }

    /**
     * Desactivación lógica del artículo (activo = false). No borrado físico.
     */
    public function destroy(Articulo $articulo): JsonResponse
    {
        $articulo->update(['activo' => false]);

        return response()->json([
            'data' => $this->serializar($articulo),
        ]);
    }
}
