<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Requests\ArticuloIndexRequest;
use App\Http\Requests\ArticuloRequest;
use App\Models\Articulo;
use App\Models\NivelStock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Controlador para la gestión de artículos del inventario.
 *
 * Proporciona endpoints CRUD completos con filtrado, ordenamiento
 * y gestión de stock asociado.
 */
class ArticuloController extends Controller
{
    /**
     * Campos permitidos para ordenamiento en el listado.
     *
     * @var array<string>
     */
    private const CAMPOS_ORDENAMIENTO_PERMITIDOS = ['nombre', 'codigo', 'stock_total', 'categoria', 'created_at'];
    /**
     * Serializa un artículo al formato de respuesta estándar de la API.
     *
     * Incluye información de stock calculada y estado del inventario.
     *
     * @param Articulo $articulo Artículo a serializar
     * @param float $stockTotal Cantidad total en stock
     * @param float $cantidadMinima Cantidad mínima configurada para alertas
     * @return array<string, mixed> Datos serializados del artículo
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
            'stock_total'    => $stockTotal,
            'stock_minimo'   => $cantidadMinima,
            'estado_stock'   => ($cantidadMinima > 0 && $stockTotal < $cantidadMinima) ? 'critico' : 'ok',
            'numero_serie'      => $articulo->serial_number,
            'tipo_material'     => $articulo->material_type,
            'capacidad_ml'      => $articulo->capacity_ml,
            'fecha_caducidad'   => $articulo->expiration_date,
            'fecha_adquisicion' => $articulo->fecha_adquisicion,
            'precio_compra'     => $articulo->precio_compra !== null ? (float) $articulo->precio_compra : null,
            'proveedor'         => $articulo->proveedor,
            'numero_factura'    => $articulo->numero_factura,
            'created_at'        => $articulo->created_at,
            'updated_at'        => $articulo->updated_at,
        ];
    }

    /**
     * Lista paginada de artículos con categoría resuelta y stock total.
     *
     * Filtros disponibles:
     * - search: búsqueda por nombre o código
     * - categoria_id: filtrar por categoría
     * - ubicacion_id: filtrar por ubicación
     * - sub_ubicacion_id: filtrar por sub-ubicación
     * - estado_stock: 'ok' o 'critico'
     * - order_by: campo de ordenamiento
     * - order_dir: 'asc' o 'desc'
     *
     * @param ArticuloIndexRequest $request Request validado con filtros
     * @return JsonResponse Respuesta paginada con artículos serializados
     */
    public function index(ArticuloIndexRequest $request): JsonResponse
    {
        $filtros = $request->validated();

        $busqueda = trim((string) ($filtros['search'] ?? ''));
        $categoriaId = $filtros['categoria_id'] ?? null;
        $ubicacionId = $filtros['ubicacion_id'] ?? null;
        $subUbicacionId = $filtros['sub_ubicacion_id'] ?? null;
        $estadoStock = $filtros['estado_stock'] ?? null;
        $orderBy = $filtros['order_by'] ?? 'nombre';
        $orderDir = $filtros['order_dir'] ?? 'asc';
        $perPage = (int) ($filtros['per_page'] ?? config('constantes.default_per_page'));

        // Validar campos de ordenamiento permitidos
        if (!in_array($orderBy, self::CAMPOS_ORDENAMIENTO_PERMITIDOS, true)) {
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
                $op = \Illuminate\Support\Facades\DB::getDriverName() === 'pgsql' ? 'ILIKE' : 'LIKE';
                $query->where(function ($q) use ($busqueda, $op): void {
                    $q->where('nombre', $op, "%{$busqueda}%")
                        ->orWhere('codigo', $op, "%{$busqueda}%");
                });
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

        // Filtro por sub-ubicación
        if ($subUbicacionId !== null) {
            $articulosQuery->whereExists(function ($query) use ($subUbicacionId): void {
                $query->selectRaw('1')
                    ->from('niveles_stock')
                    ->whereColumn('niveles_stock.articulo_id', 'articulos.id')
                    ->where('niveles_stock.sub_ubicacion_id', (int) $subUbicacionId);
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
        $articulo->load(['categoria:id,nombre', 'nivelesStock.ubicacion', 'nivelesStock.subUbicacion']);

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
                'stock_total'     => (float) $stockTotal,
                'stock_minimo'    => $cantidadMinima,
                'estado_stock'    => ($cantidadMinima > 0 && (float) $stockTotal <= $cantidadMinima) ? 'critico' : 'ok',
                'numero_serie'      => $articulo->serial_number,
                'tipo_material'     => $articulo->material_type,
                'capacidad_ml'      => $articulo->capacity_ml,
                'fecha_caducidad'   => $articulo->expiration_date,
                'fecha_adquisicion' => $articulo->fecha_adquisicion,
                'precio_compra'     => $articulo->precio_compra !== null ? (float) $articulo->precio_compra : null,
                'proveedor'         => $articulo->proveedor,
                'numero_factura'    => $articulo->numero_factura,
                'niveles_stock'     => $articulo->nivelesStock->map(fn ($nivel) => [
                    'id'                => $nivel->id,
                    'ubicacion_id'      => $nivel->ubicacion_id,
                    'ubicacion'         => $nivel->ubicacion?->nombre,
                    'sub_ubicacion_id'  => $nivel->sub_ubicacion_id,
                    'sub_ubicacion'     => $nivel->subUbicacion?->nombre,
                    'cantidad'          => (float) $nivel->cantidad,
                    'cantidad_minima'   => (float) $nivel->cantidad_minima,
                ])->values()->toArray(),
                'created_at'      => $articulo->created_at,
                'updated_at'      => $articulo->updated_at,
            ]);
    }

    /**
     * Crear un nuevo artículo en el inventario.
     *
     * Acepta opcionalmente stock_inicial, stock_minimo y ubicacion_id
     * para crear el nivel de stock en el mismo paso (transacción atómica).
     *
     * @param ArticuloRequest $request Datos validados del artículo
     * @return JsonResponse Respuesta con código 201 Created
     */
    public function store(ArticuloRequest $request): JsonResponse
    {
        $validados       = $request->validated();
        $stockInicial     = (float) ($validados['stock_inicial'] ?? 0);
        $stockMinimo      = (float) ($validados['stock_minimo']  ?? 0);
        $ubicacionId      = $validados['ubicacion_id'] ?? null;
        $subUbicacionId   = $validados['sub_ubicacion_id'] ?? null;

        $datosArticulo = array_diff_key($validados, array_flip(['stock_inicial', 'stock_minimo', 'ubicacion_id', 'sub_ubicacion_id']));

        $articulo = Articulo::query()->create($datosArticulo);

        if ($ubicacionId && ($stockInicial > 0 || $stockMinimo > 0)) {
            NivelStock::query()->create([
                'articulo_id'       => $articulo->id,
                'ubicacion_id'      => $ubicacionId,
                'sub_ubicacion_id'  => $subUbicacionId,
                'cantidad'          => $stockInicial,
                'cantidad_minima'   => $stockMinimo,
            ]);
        }

        $articulo->load('categoria:id,nombre');

        return ApiResponse::created($this->serializar($articulo, $stockInicial, $stockMinimo));
    }

    /**
     * Actualizar un artículo existente.
     *
     * Permite actualizar los datos del artículo y opcionalmente
     * la cantidad mínima de stock en todas sus ubicaciones.
     *
     * @param ArticuloRequest $request Datos validados para actualizar
     * @param Articulo $articulo Artículo a actualizar (resuelto por route model binding)
     * @return JsonResponse Respuesta con datos actualizados
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
     * Eliminar un artículo permanentemente.
     *
     * @param Articulo $articulo Artículo a eliminar
     * @return JsonResponse Respuesta vacía con confirmación
     */
    public function destroy(Articulo $articulo): JsonResponse
    {
        $articulo->delete();

        return ApiResponse::success([], 'Artículo eliminado correctamente');
    }
}
