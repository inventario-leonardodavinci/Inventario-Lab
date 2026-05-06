<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\MovimientoRequest;
use App\Models\UsuarioApp;
use App\Models\Movimiento;
use App\Services\MovimientoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class MovimientoController extends Controller
{
    public function __construct(private readonly MovimientoService $movimientoService)
    {
    }

    public function resumenHoy(Request $request): JsonResponse
    {
        $hoy = now()->toDateString();
        $usuarioApp = $request->attributes->get('app_user');

        $conteosPorTipo = Movimiento::query()
            ->when($usuarioApp, fn ($query) => $query->where('usuario_id', $usuarioApp->id))
            ->whereDate('created_at', $hoy)
            ->selectRaw('tipo, COUNT(*) as total')
            ->groupBy('tipo')
            ->pluck('total', 'tipo');

        return response()->json([
            'entradas_hoy'  => (int) ($conteosPorTipo['entrada']  ?? 0),
            'salidas_hoy'   => (int) ($conteosPorTipo['salida']   ?? 0),
            'ajustes_hoy'   => (int) ($conteosPorTipo['ajuste']   ?? 0),
            'traslados_hoy' => (int) ($conteosPorTipo['traslado'] ?? 0),
        ]);
    }

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

        return response()->json([
            'data' => $filas,
            'meta' => [
                'current_page' => $paginacion->currentPage(),
                'last_page'    => $paginacion->lastPage(),
                'total'        => $paginacion->total(),
            ],
        ]);
    }

    public function store(MovimientoRequest $request): JsonResponse
    {
        /** @var UsuarioApp $usuarioApp */
        $usuarioApp = $request->attributes->get('app_user');

        try {
            $movimiento = $this->movimientoService->crearMovimiento(
                $request->validated() + ['usuario_id' => $usuarioApp->id]
            );
        } catch (RuntimeException $excepcion) {
            return response()->json(['message' => $excepcion->getMessage()], 422);
        }

        return response()->json(['data' => $movimiento], 201);
    }
}
