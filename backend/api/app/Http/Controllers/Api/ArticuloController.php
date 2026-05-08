<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Requests\ArticuloIndexRequest;
use App\Http\Requests\ArticuloRequest;
use App\Models\Articulo;
use App\Models\NivelStock;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
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
            'numero_serie'      => $articulo->serial_number,
            'tipo_material'     => $articulo->material_type,
            'capacidad_ml'      => $articulo->capacity_ml,
            'fecha_caducidad'   => $articulo->expiration_date,
            'fecha_adquisicion' => $articulo->fecha_adquisicion,
            'precio_compra'     => $articulo->precio_compra,
            'proveedor'         => $articulo->proveedor,
            'numero_factura'    => $articulo->numero_factura,
            'created_at'        => $articulo->created_at,
            'updated_at'        => $articulo->updated_at,
        ];
    }

    /**
     * Lista paginada de artículos con categoría resuelta y stock total.
     * Filtros: search, activo, categoria_id, ubicacion_id, estado_stock, order_by, order_dir
     */
    public function index(ArticuloIndexRequest $request): JsonResponse
    {
        $filtros = $request->validated();

        $busqueda = trim((string) ($filtros['search'] ?? ''));
        $activo = $filtros['activo'] ?? null;
        $categoriaId = $filtros['categoria_id'] ?? null;
        $ubicacionId = $filtros['ubicacion_id'] ?? null;
        $estadoStock = $filtros['estado_stock'] ?? null;
        $orderBy = $filtros['order_by'] ?? 'nombre';
        $orderDir = $filtros['order_dir'] ?? 'asc';
        $perPage = (int) ($filtros['per_page'] ?? config('constantes.default_per_page'));

        // Validar campos de ordenamiento permitidos
        $orderByPermitidos = ['nombre', 'codigo', 'stock_total', 'categoria', 'created_at'];
        if (!in_array($orderBy, $orderByPermitidos, true)) {
            $orderBy = 'nombre';
        }
        $orderDir = strtolower($orderDir) === 'desc' ? 'desc' : 'asc';

        $stockSubquery = NivelStock::query()
            ->selectRaw('articulo_id, SUM(cantidad) as stock_total, MIN(cantidad_minima) as stock_minimo')
            ->groupBy('articulo_id');

        $articulosQuery = Articulo::query()
            ->with('categoria:id,nombre')
            ->leftJoinSub($stockSubquery, 'stock_agg', function ($join): void {
                $join->on('stock_agg.articulo_id', '=', 'articulos.id');
            })
            ->select('articulos.*')
            ->selectRaw('COALESCE(stock_agg.stock_total, 0) as stock_total_calc')
            ->selectRaw('COALESCE(stock_agg.stock_minimo, 0) as stock_minimo_calc')
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

        if ($estadoStock === 'critico') {
            $articulosQuery->whereRaw('COALESCE(stock_agg.stock_minimo, 0) > 0')
                ->whereRaw('COALESCE(stock_agg.stock_total, 0) < COALESCE(stock_agg.stock_minimo, 0)');
        } elseif ($estadoStock === 'ok') {
            $articulosQuery->where(function ($query): void {
                $query->whereRaw('COALESCE(stock_agg.stock_minimo, 0) = 0')
                    ->orWhereRaw('COALESCE(stock_agg.stock_total, 0) >= COALESCE(stock_agg.stock_minimo, 0)');
            });
        }

        $orderField = match ($orderBy) {
            'stock_total' => DB::raw('stock_total_calc'),
            'categoria' => 'categoria_id',
            default => $orderBy,
        };

        $articulos = $articulosQuery
            ->orderBy($orderField, $orderDir)
            ->paginate($perPage);

        $filas = $articulos->getCollection()->map(function (Articulo $articulo): array {
            $stockTotal = (float) ($articulo->stock_total_calc ?? 0);
            $stockMinimo = (float) ($articulo->stock_minimo_calc ?? 0);
            return $this->serializar($articulo, $stockTotal, $stockMinimo);
        });

        return ApiResponse::paginated(
            $filas->values()->toArray(),
            [
                'current_page' => $articulos->currentPage(),
                'last_page'    => $articulos->lastPage(),
                'total'        => $articulos->total(),
            ]
        );
    }

    public function resumen(Request $request): JsonResponse
    {
        $categoriaId = $request->query('categoria_id');
        $ubicacionId = $request->query('ubicacion_id');

        $stockSubquery = NivelStock::query()
            ->selectRaw('articulo_id, SUM(cantidad) as stock_total, MIN(cantidad_minima) as stock_minimo')
            ->groupBy('articulo_id');

        $base = Articulo::query()
            ->leftJoinSub($stockSubquery, 'stock_agg', fn ($join) => $join->on('stock_agg.articulo_id', '=', 'articulos.id'))
            ->when($categoriaId !== null, fn ($query) => $query->where('articulos.categoria_id', (int) $categoriaId))
            ->when($ubicacionId !== null, function ($query) use ($ubicacionId): void {
                $query->whereExists(function ($sub) use ($ubicacionId): void {
                    $sub->selectRaw('1')
                        ->from('niveles_stock')
                        ->whereColumn('niveles_stock.articulo_id', 'articulos.id')
                        ->where('niveles_stock.ubicacion_id', (int) $ubicacionId);
                });
            });

        return ApiResponse::success([
            'total_articulos' => (clone $base)->count('articulos.id'),
            'activos' => (clone $base)->where('articulos.activo', true)->count('articulos.id'),
            'inactivos' => (clone $base)->where('articulos.activo', false)->count('articulos.id'),
            'stock_critico' => (clone $base)
                ->whereRaw('COALESCE(stock_agg.stock_minimo, 0) > 0')
                ->whereRaw('COALESCE(stock_agg.stock_total, 0) < COALESCE(stock_agg.stock_minimo, 0)')
                ->count('articulos.id'),
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

        return ApiResponse::success([
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
                'numero_serie'      => $articulo->serial_number,
                'tipo_material'     => $articulo->material_type,
                'capacidad_ml'      => $articulo->capacity_ml,
                'fecha_caducidad'   => $articulo->expiration_date,
                'fecha_adquisicion' => $articulo->fecha_adquisicion,
                'precio_compra'     => $articulo->precio_compra,
                'proveedor'         => $articulo->proveedor,
                'numero_factura'    => $articulo->numero_factura,
                'niveles_stock'     => $articulo->nivelesStock->map(fn ($nivel) => [
                    'id'              => $nivel->id,
                    'ubicacion_id'    => $nivel->ubicacion_id,
                    'ubicacion'       => $nivel->ubicacion?->nombre,
                    'cantidad'        => (float) $nivel->cantidad,
                    'cantidad_minima' => (float) $nivel->cantidad_minima,
                ])->values()->toArray(),
                'created_at'      => $articulo->created_at,
                'updated_at'      => $articulo->updated_at,
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

        return ApiResponse::created($this->serializar($articulo, $stockInicial, $stockMinimo));
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

        return ApiResponse::success($this->serializar($articulo, $stockTotal, $cantidadMinima));
    }

    /**
     * Desactivación lógica del artículo (activo = false). No borrado físico.
     */
    public function destroy(Articulo $articulo): JsonResponse
    {
        $articulo->update(['activo' => false]);
        $articulo->load('categoria:id,nombre');

        return ApiResponse::success($this->serializar($articulo));
    }
}
