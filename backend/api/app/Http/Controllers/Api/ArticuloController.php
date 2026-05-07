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
            'id'             => $articulo->id,
            'codigo'         => $articulo->codigo,
            'nombre'         => $articulo->nombre,
            'descripcion'    => $articulo->descripcion,
            'categoria_id'   => $articulo->categoria_id,
            'categoria'      => $articulo->categoria?->nombre,
            'unidad'         => $articulo->unidad,
            'notas'          => $articulo->notas,
            'activo'         => $articulo->activo,
            'stock_total'    => $stockTotal,
            'stock_minimo'   => $cantidadMinima,
            'estado_stock'   => ($cantidadMinima > 0 && $stockTotal < $cantidadMinima) ? 'critico' : 'ok',
            'numero_serie'   => $articulo->serial_number,
            'tipo_material'  => $articulo->material_type,
            'capacidad_ml'   => $articulo->capacity_ml,
            'fecha_caducidad'=> $articulo->expiration_date,
            'created_at'     => $articulo->created_at,
            'updated_at'     => $articulo->updated_at,
        ];
    }

    /**
     * Lista paginada de artículos con categoría resuelta y stock total.
     * Filtros: search, activo, categoria_id, ubicacion_id, estado_stock, order_by, order_dir
     */
    public function index(Request $request): JsonResponse
    {
        $busqueda = trim((string) $request->query('search', ''));
        $activo = $request->query('activo');
        $categoriaId = $request->query('categoria_id');
        $ubicacionId = $request->query('ubicacion_id');
        $estadoStock = $request->query('estado_stock');
        $orderBy = $request->query('order_by', 'nombre');
        $orderDir = $request->query('order_dir', 'asc');

        // Validar campos de ordenamiento permitidos
        $orderByPermitidos = ['nombre', 'codigo', 'stock_total', 'categoria', 'created_at'];
        if (!in_array($orderBy, $orderByPermitidos, true)) {
            $orderBy = 'nombre';
        }
        $orderDir = strtolower($orderDir) === 'desc' ? 'desc' : 'asc';

        $articulosQuery = Articulo::query()
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
            ->when($categoriaId !== null, function ($query) use ($categoriaId): void {
                $query->where('categoria_id', (int) $categoriaId);
            });

        // Filtro por ubicación requiere join con niveles_stock
        if ($ubicacionId !== null) {
            $articulosQuery->whereExists(function ($query) use ($ubicacionId): void {
                $query->selectRaw('1')
                    ->from('niveles_stock')
                    ->whereColumn('niveles_stock.articulo_id', 'articulos.id')
                    ->where('niveles_stock.ubicacion_id', (int) $ubicacionId);
            });
        }

        $articulos = $articulosQuery
            ->orderBy($orderBy === 'categoria' ? 'categoria_id' : $orderBy, $orderDir)
            ->paginate((int) $request->query('per_page', 100));

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

        // Filtrar por estado_stock si se solicita
        if ($estadoStock !== null) {
            $filas = $filas->filter(fn ($fila) => $fila['estado_stock'] === $estadoStock);
        }

        return response()->json([
            'data' => $filas->values(),
            'meta' => [
                'current_page' => $articulos->currentPage(),
                'last_page' => $articulos->lastPage(),
                'total' => $estadoStock !== null ? $filas->count() : $articulos->total(),
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
                'id'              => $articulo->id,
                'codigo'          => $articulo->codigo,
                'nombre'          => $articulo->nombre,
                'descripcion'     => $articulo->descripcion,
                'categoria_id'    => $articulo->categoria_id,
                'categoria'       => $articulo->categoria?->nombre,
                'unidad'          => $articulo->unidad,
                'notas'           => $articulo->notas,
                'activo'          => $articulo->activo,
                'stock_total'     => (float) $stockTotal,
                'stock_minimo'    => $cantidadMinima,
                'estado_stock'    => ($cantidadMinima > 0 && (float) $stockTotal <= $cantidadMinima) ? 'critico' : 'ok',
                'numero_serie'    => $articulo->serial_number,
                'tipo_material'   => $articulo->material_type,
                'capacidad_ml'    => $articulo->capacity_ml,
                'fecha_caducidad' => $articulo->expiration_date,
                'niveles_stock'   => $articulo->nivelesStock->map(fn ($nivel) => [
                    'id'              => $nivel->id,
                    'ubicacion_id'    => $nivel->ubicacion_id,
                    'ubicacion'       => $nivel->ubicacion?->nombre,
                    'cantidad'        => (float) $nivel->cantidad,
                    'cantidad_minima' => (float) $nivel->cantidad_minima,
                ]),
                'created_at'      => $articulo->created_at,
                'updated_at'      => $articulo->updated_at,
            ],
        ]);
    }

    /**
     * Crear un nuevo artículo (HTTP 201).
     * Acepta opcionalmente stock_inicial, stock_minimo y ubicacion_id
     * para crear el nivel de stock en el mismo paso.
     */
    public function store(ArticuloRequest $request): JsonResponse
    {
        $validados    = $request->validated();
        $stockInicial = (float) ($validados['stock_inicial'] ?? 0);
        $stockMinimo  = (float) ($validados['stock_minimo']  ?? 0);
        $ubicacionId  = $validados['ubicacion_id'] ?? null;

        $datosArticulo = array_diff_key($validados, array_flip(['stock_inicial', 'stock_minimo', 'ubicacion_id']));

        $articulo = Articulo::query()->create($datosArticulo + ['activo' => true]);

        if ($ubicacionId && ($stockInicial > 0 || $stockMinimo > 0)) {
            NivelStock::query()->create([
                'articulo_id'     => $articulo->id,
                'ubicacion_id'    => $ubicacionId,
                'cantidad'        => $stockInicial,
                'cantidad_minima' => $stockMinimo,
            ]);
        }

        $articulo->load('categoria:id,nombre');

        return response()->json([
            'data' => $this->serializar($articulo, $stockInicial, $stockMinimo),
        ], 201);
    }

    /**
     * Actualizar un artículo existente (HTTP 200).
     */
    public function update(ArticuloRequest $request, Articulo $articulo): JsonResponse
    {
        $validados = $request->validated();
        $stockMinimo = isset($validados['stock_minimo']) ? (float) $validados['stock_minimo'] : null;
        unset($validados['stock_minimo']);

        $articulo->update($validados);

        if ($stockMinimo !== null) {
            $articulo->nivelesStock()->update(['cantidad_minima' => $stockMinimo]);
        }

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
        $articulo->load('categoria:id,nombre');

        return response()->json([
            'data' => $this->serializar($articulo),
        ]);
    }
}
