<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Requests\MovimientoRequest;
use App\Models\Movimiento;
use App\Models\UsuarioApp;
use App\Services\MovimientoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

/**
 * Controlador para la gestión de movimientos de inventario.
 *
 * Los movimientos representan entradas, salidas, traslados y ajustes
 * de stock. Cada movimiento es atómico y afecta los niveles de stock.
 */
class MovimientoController extends Controller
{
    /**
     * @param MovimientoService $movimientoService Servicio para operaciones de stock
     */
    public function __construct(private readonly MovimientoService $movimientoService)
    {
    }

    /**
     * Obtener resumen de movimientos del día actual.
     *
     * Si el usuario está autenticado, filtra solo sus movimientos.
     *
     * @param Request $request Request con el usuario autenticado
     * @return JsonResponse Conteo de entradas, salidas, ajustes y traslados de hoy
     */
    public function resumenHoy(Request $request): JsonResponse
    {
        $hoy = now()->toDateString();
        /** @var UsuarioApp|null $usuarioApp */
        $usuarioApp = $request->attributes->get('app_user');

        $conteosPorTipo = Movimiento::query()
            ->when($usuarioApp, fn ($query) => $query->where('usuario_id', $usuarioApp->id))
            ->whereDate('created_at', $hoy)
            ->selectRaw('tipo, COUNT(*) as total')
            ->groupBy('tipo')
            ->pluck('total', 'tipo');

        return ApiResponse::success([
            'entradas_hoy'  => (int) ($conteosPorTipo['entrada']  ?? 0),
            'salidas_hoy'   => (int) ($conteosPorTipo['salida']   ?? 0),
            'ajustes_hoy'   => (int) ($conteosPorTipo['ajuste']   ?? 0),
            'traslados_hoy' => (int) ($conteosPorTipo['traslado'] ?? 0),
        ]);
    }

    /**
     * Obtener resumen de movimientos en un rango de fechas.
     *
     * @param Request $request Request con parámetros 'desde' y 'hasta'
     * @return JsonResponse Estadísticas de movimientos en el rango especificado
     */
    public function resumenRango(Request $request): JsonResponse
    {
        $validados = $request->validate([
            'desde' => ['required', 'date'],
            'hasta' => ['required', 'date', 'after_or_equal:desde'],
        ]);

        $desde = $validados['desde'];
        $hasta = $validados['hasta'];
        /** @var UsuarioApp|null $usuarioApp */
        $usuarioApp = $request->attributes->get('app_user');

        $base = Movimiento::query()
            ->when($usuarioApp, fn ($query) => $query->where('usuario_id', $usuarioApp->id))
            ->whereDate('created_at', '>=', $desde)
            ->whereDate('created_at', '<=', $hasta);

        $conteos = (clone $base)
            ->selectRaw('tipo, COUNT(*) as total')
            ->groupBy('tipo')
            ->pluck('total', 'tipo');

        return ApiResponse::success([
            'desde' => $desde,
            'hasta' => $hasta,
            'total_movimientos' => (clone $base)->count(),
            'entradas' => (int) ($conteos['entrada'] ?? 0),
            'salidas' => (int) ($conteos['salida'] ?? 0),
            'ajustes' => (int) ($conteos['ajuste'] ?? 0),
            'traslados' => (int) ($conteos['traslado'] ?? 0),
        ]);
    }

    /**
     * Listar movimientos paginados con sus relaciones.
     *
     * @param Request $request Request con parámetro opcional 'per_page'
     * @return JsonResponse Listado paginado de movimientos
     */
    public function index(Request $request): JsonResponse
    {
        $paginacion = Movimiento::query()
            ->with([
                'usuario:id,nombre_visible',
                'lineas:id,movimiento_id,articulo_id,cantidad',
                'lineas.articulo:id,nombre',
            ])
            ->latest('id')
            ->paginate((int) $request->query('per_page', config('constantes.default_per_page')));

        $filas = $paginacion->getCollection()->map(function (Movimiento $movimiento): array {
            return [
                'id'                   => $movimiento->id,
                'tipo'                 => $movimiento->tipo,
                'motivo'               => $movimiento->motivo,
                'ubicacion_origen_id'  => $movimiento->ubicacion_origen_id,
                'ubicacion_destino_id' => $movimiento->ubicacion_destino_id,
                'usuario_id'           => $movimiento->usuario_id,
                'usuario'              => $movimiento->usuario?->nombre_visible,
                'lineas'               => $movimiento->lineas->map(fn ($linea) => [
                    'id'          => $linea->id,
                    'articulo_id' => $linea->articulo_id,
                    'articulo'    => $linea->articulo?->nombre,
                    'cantidad'    => (float) $linea->cantidad,
                ])->values(),
                'created_at' => $movimiento->created_at,
            ];
        });

        return ApiResponse::paginated(
            $filas->toArray(),
            [
                'current_page' => $paginacion->currentPage(),
                'last_page'    => $paginacion->lastPage(),
                'total'        => $paginacion->total(),
            ]
        );
    }

    /**
     * Crear un nuevo movimiento de inventario.
     *
     * La creación es atómica: todas las líneas y actualizaciones de stock
     * se ejecutan dentro de una transacción de base de datos.
     *
     * @param MovimientoRequest $request Datos validados del movimiento
     * @return JsonResponse Respuesta con código 201 Created
     */
    public function store(MovimientoRequest $request): JsonResponse
    {
        /** @var UsuarioApp $usuarioApp */
        $usuarioApp = $request->attributes->get('app_user');

        try {
            $movimiento = $this->movimientoService->crearMovimiento(
                $request->validated() + ['usuario_id' => $usuarioApp->id]
            );
        } catch (RuntimeException $excepcion) {
            return ApiResponse::error($excepcion->getMessage(), 422);
        }

        return ApiResponse::created($movimiento->toArray());
    }
}
