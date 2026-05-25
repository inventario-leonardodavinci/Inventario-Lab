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
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

/**
 * Controlador para la gestión de artículos del inventario.
 *
 * Proporciona endpoints CRUD completos con filtrado, ordenamiento
 * y gestión de stock asociado. También expone un endpoint de exportación
 * CSV con todos los artículos agrupados por categoría.
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
    private function serializar(Articulo $articulo, float $stockTotal = 0.0, float $cantidadMinima = 0.0, bool $esCritico = false): array
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
            'estado_stock'   => $esCritico ? 'critico' : 'ok',
            'numero_serie'      => $articulo->serial_number,
            'tipo_material'     => $articulo->material_type,
            'capacidad_ml'      => $articulo->capacity_ml,
            'fecha_caducidad'   => $articulo->expiration_date,
            'fecha_adquisicion' => $articulo->fecha_adquisicion,
            'precio_compra'     => $articulo->precio_compra !== null ? (float) $articulo->precio_compra : null,
            'proveedor'         => $articulo->proveedor,
            'numero_factura'    => $articulo->numero_factura,
            'ubicaciones'       => $articulo->nombres_ubicaciones ?? null,
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
            ->selectRaw('articulo_id, SUM(cantidad) as stock_total, SUM(cantidad_minima) as stock_minimo, MAX(CASE WHEN cantidad_minima > 0 AND cantidad < cantidad_minima THEN 1 ELSE 0 END) as es_critico')
            ->groupBy('articulo_id');

        $driver = \Illuminate\Support\Facades\DB::getDriverName();
        if ($driver === 'pgsql') {
            $aggFunc = "STRING_AGG(DISTINCT ubicaciones.nombre, ', ')";
        } elseif ($driver === 'sqlite') {
            $aggFunc = "GROUP_CONCAT(ubicaciones.nombre, ', ')";
        } else {
            $aggFunc = "GROUP_CONCAT(DISTINCT ubicaciones.nombre SEPARATOR ', ')";
        }

        $ubicacionesSubquery = NivelStock::query()
            ->join('ubicaciones', 'ubicaciones.id', '=', 'niveles_stock.ubicacion_id')
            ->selectRaw("articulo_id, {$aggFunc} as nombres_ubicaciones")
            ->groupBy('articulo_id');

        $articulosQuery = Articulo::query()
            ->with('categoria:id,nombre')
            ->leftJoinSub($stockSubquery, 'stock_agg', function ($join): void {
                $join->on('stock_agg.articulo_id', '=', 'articulos.id');
            })
            ->leftJoinSub($ubicacionesSubquery, 'ubicaciones_agg', function ($join): void {
                $join->on('ubicaciones_agg.articulo_id', '=', 'articulos.id');
            })
            ->select('articulos.*')
            ->selectRaw('COALESCE(stock_agg.stock_total, 0) as stock_total_calc')
            ->selectRaw('COALESCE(stock_agg.stock_minimo, 0) as stock_minimo_calc')
            ->selectRaw('COALESCE(stock_agg.es_critico, 0) as es_critico_calc')
            ->selectRaw('ubicaciones_agg.nombres_ubicaciones')
            ->when($busqueda !== '', function ($query) use ($busqueda, $driver): void {
                $op = $driver === 'pgsql' ? 'ILIKE' : 'LIKE';
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
            $articulosQuery->whereRaw('COALESCE(stock_agg.es_critico, 0) = 1');
        } elseif ($estadoStock === 'ok') {
            $articulosQuery->whereRaw('COALESCE(stock_agg.es_critico, 0) = 0');
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
            $esCritico = (bool) ($articulo->es_critico_calc ?? false);
            return $this->serializar($articulo, $stockTotal, $stockMinimo, $esCritico);
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
            ->selectRaw('articulo_id, SUM(cantidad) as stock_total, SUM(cantidad_minima) as stock_minimo, MAX(CASE WHEN cantidad_minima > 0 AND cantidad < cantidad_minima THEN 1 ELSE 0 END) as es_critico')
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
                ->whereRaw('COALESCE(stock_agg.es_critico, 0) = 1')
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
        $cantidadMinima = (float) $articulo->nivelesStock->sum('cantidad_minima');
        $esCritico = $articulo->nivelesStock->contains(function ($nivel) {
            return $nivel->cantidad_minima > 0 && $nivel->cantidad < $nivel->cantidad_minima;
        });

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
                'estado_stock'    => $esCritico ? 'critico' : 'ok',
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

        $esCritico = $stockMinimo > 0 && $stockInicial < $stockMinimo;
        return ApiResponse::created($this->serializar($articulo, $stockInicial, $stockMinimo, $esCritico));
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
        $cantidadMinima = (float) $articulo->nivelesStock()->sum('cantidad_minima');
        $esCritico = $articulo->nivelesStock()->whereRaw('cantidad_minima > 0 AND cantidad < cantidad_minima')->exists();

        return ApiResponse::success($this->serializar($articulo, $stockTotal, $cantidadMinima, $esCritico));
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

    /**
     * Actualizar la cantidad mínima de un nivel de stock específico.
     *
     * @param Request $request
     * @param Articulo $articulo
     * @param NivelStock $nivel
     * @return JsonResponse
     */
    public function updateNivelStock(Request $request, Articulo $articulo, NivelStock $nivel): JsonResponse
    {
        $validados = $request->validate([
            'cantidad_minima' => 'required|numeric|min:0'
        ]);

        if ($nivel->articulo_id !== $articulo->id) {
            return ApiResponse::error('El nivel de stock no pertenece al artículo', 400);
        }

        $nivel->update(['cantidad_minima' => $validados['cantidad_minima']]);

        $articulo->load('categoria:id,nombre');
        $stockTotal = (float) $articulo->nivelesStock()->sum('cantidad');
        $cantidadMinima = (float) $articulo->nivelesStock()->sum('cantidad_minima');
        $esCritico = $articulo->nivelesStock()->whereRaw('cantidad_minima > 0 AND cantidad < cantidad_minima')->exists();

        return ApiResponse::success($this->serializar($articulo, $stockTotal, $cantidadMinima, $esCritico));
    }

    /**
     * Eliminar un nivel de stock. Solo permitido si la cantidad es 0.
     *
     * @param Articulo $articulo
     * @param NivelStock $nivel
     * @return JsonResponse
     */
    public function destroyNivelStock(Articulo $articulo, NivelStock $nivel): JsonResponse
    {
        if ($nivel->articulo_id !== $articulo->id) {
            return ApiResponse::error('El nivel de stock no pertenece al artículo', 400);
        }

        if ($nivel->cantidad > 0) {
            return ApiResponse::error('No se puede eliminar una ubicación que aún tiene stock', 400);
        }

        $nivel->delete();

        $articulo->load('categoria:id,nombre');
        $stockTotal = (float) $articulo->nivelesStock()->sum('cantidad');
        $cantidadMinima = (float) $articulo->nivelesStock()->sum('cantidad_minima');
        $esCritico = $articulo->nivelesStock()->whereRaw('cantidad_minima > 0 AND cantidad < cantidad_minima')->exists();

        return ApiResponse::success($this->serializar($articulo, $stockTotal, $cantidadMinima, $esCritico), 'Ubicación eliminada correctamente');
    }

    /**
     * Exportar todos los artículos agrupados por categoría en formato CSV.
     *
     * Devuelve un archivo CSV con todos los artículos del inventario,
     * ordenados por categoría y luego por nombre dentro de cada categoría.
     * No aplica paginación — devuelve el inventario completo.
     *
     * @return Response Respuesta CSV descargable
     */
    public function exportar(): Response
    {
        $stockSubquery = NivelStock::query()
            ->selectRaw('articulo_id, SUM(cantidad) as stock_total, SUM(cantidad_minima) as stock_minimo, MAX(CASE WHEN cantidad_minima > 0 AND cantidad < cantidad_minima THEN 1 ELSE 0 END) as es_critico')
            ->groupBy('articulo_id');

        $articulos = Articulo::query()
            ->with('categoria:id,nombre')
            ->leftJoinSub($stockSubquery, 'stock_agg', function ($join): void {
                $join->on('stock_agg.articulo_id', '=', 'articulos.id');
            })
            ->leftJoin('categorias', 'categorias.id', '=', 'articulos.categoria_id')
            ->select('articulos.*')
            ->selectRaw('COALESCE(stock_agg.stock_total, 0) as stock_total_calc')
            ->selectRaw('COALESCE(stock_agg.stock_minimo, 0) as stock_minimo_calc')
            ->selectRaw('COALESCE(stock_agg.es_critico, 0) as es_critico_calc')
            ->orderByRaw('COALESCE(categorias.nombre, \'Sin categoría\') ASC')
            ->orderBy('articulos.nombre', 'asc')
            ->get();

        $cabeceras = [
            'Categoría',
            'Código',
            'Nombre',
            'Descripción',
            'Unidad',
            'Stock Total',
            'Stock Mínimo',
            'Estado Stock',
            'Número de Serie',
            'Tipo de Material',
            'Capacidad (ml)',
            'Fecha Caducidad',
            'Fecha Adquisición',
            'Precio Compra',
            'Proveedor',
            'Número Factura',
            'Notas',
        ];

        $filas = [];
        $filas[] = implode(';', array_map(fn ($c) => '"' . str_replace('"', '""', $c) . '"', $cabeceras));

        $categoriaActual = null;

        foreach ($articulos as $articulo) {
            $nombreCategoria = $articulo->categoria?->nombre ?? 'Sin categoría';

            // Insertar línea vacía entre categorías para facilitar la lectura
            if ($categoriaActual !== null && $categoriaActual !== $nombreCategoria) {
                $filas[] = '';
            }
            $categoriaActual = $nombreCategoria;

            $stockTotal  = (float) ($articulo->stock_total_calc ?? 0);
            $stockMinimo = (float) ($articulo->stock_minimo_calc ?? 0);
            $esCritico = (bool) ($articulo->es_critico_calc ?? false);
            $estadoStock = $esCritico ? 'Crítico' : 'OK';

            $fila = [
                $articulo->categoria?->nombre ?? 'Sin categoría',
                $articulo->codigo ?? '',
                $articulo->nombre,
                $articulo->descripcion ?? '',
                $articulo->unidad ?? '',
                $stockTotal,
                $stockMinimo,
                $estadoStock,
                $articulo->serial_number ?? '',
                $articulo->material_type ?? '',
                $articulo->capacity_ml !== null ? (float) $articulo->capacity_ml : '',
                $articulo->expiration_date?->format('Y-m-d') ?? '',
                $articulo->fecha_adquisicion?->format('Y-m-d') ?? '',
                $articulo->precio_compra !== null ? number_format((float) $articulo->precio_compra, 2, '.', '') : '',
                $articulo->proveedor ?? '',
                $articulo->numero_factura ?? '',
                $articulo->notas ?? '',
            ];

            $filas[] = implode(';', array_map(fn ($v) => '"' . str_replace('"', '""', (string) $v) . '"', $fila));
        }

        $contenidoCsv = "\xEF\xBB\xBF" . implode("\r\n", $filas);
        $nombreArchivo = 'inventario_' . now()->format('Y-m-d') . '.csv';

        return response($contenidoCsv, 200, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $nombreArchivo . '"',
            'Content-Length'      => strlen($contenidoCsv),
            'Cache-Control'       => 'no-cache, no-store, must-revalidate',
        ]);
    }
}
