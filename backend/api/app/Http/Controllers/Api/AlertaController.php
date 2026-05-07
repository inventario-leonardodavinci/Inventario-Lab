<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Models\Alerta;
use App\Models\UsuarioApp;
use App\Services\AlertaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AlertaController extends Controller
{
    public function __construct(private readonly AlertaService $alertaService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = Alerta::query()
            ->with(['articulo:id,nombre,categoria_id', 'articulo.categoria:id,nombre'])
            ->latest('generada_en');

        if ($request->has('estado')) {
            $query->where('estado', $request->query('estado'));
        }

        if ($request->has('tipo')) {
            $query->where('tipo', $request->query('tipo'));
        }

        if ($request->has('severidad')) {
            $query->where('severidad', $request->query('severidad'));
        }

        $alertas = $query->paginate((int) $request->query('per_page', config('constantes.default_per_page')));

        $alertasTransformadas = $alertas->getCollection()->map(fn (Alerta $alerta) => [
            'id'                => $alerta->id,
            'tipo'              => $alerta->tipo,
            'severidad'         => $alerta->severidad,
            'estado'            => $alerta->estado,
            'articulo_id'       => $alerta->articulo_id,
            'articulo'          => $alerta->articulo ? [
                'id'        => $alerta->articulo->id,
                'nombre'    => $alerta->articulo->nombre,
                'categoria' => $alerta->articulo->categoria ? [
                    'id'     => $alerta->articulo->categoria->id,
                    'nombre' => $alerta->articulo->categoria->nombre,
                ] : null,
            ] : null,
            'categoria'         => $alerta->articulo?->categoria ? [
                'id'     => $alerta->articulo->categoria->id,
                'nombre' => $alerta->articulo->categoria->nombre,
            ] : null,
            'datos_json'        => $alerta->datos_json,
            'generada_en'       => $alerta->generada_en,
            'created_at'        => $alerta->generada_en,
            'confirmada_por_id' => $alerta->confirmada_por_id,
            'confirmada_en'     => $alerta->confirmada_en,
            'resuelta_por_id'   => $alerta->resuelta_por_id,
            'resuelta_en'       => $alerta->resuelta_en,
            'notas_resolucion'  => $alerta->notas_resolucion,
        ]);

        return ApiResponse::paginated(
            $alertasTransformadas->toArray(),
            [
                'current_page' => $alertas->currentPage(),
                'last_page'    => $alertas->lastPage(),
                'total'        => $alertas->total(),
            ]
        );
    }

    public function resumen(Request $request): JsonResponse
    {
        $base = Alerta::query();

        if ($request->has('desde')) {
            $base->whereDate('generada_en', '>=', $request->query('desde'));
        }

        if ($request->has('hasta')) {
            $base->whereDate('generada_en', '<=', $request->query('hasta'));
        }

        $porEstado = (clone $base)
            ->selectRaw('estado, COUNT(*) as total')
            ->groupBy('estado')
            ->pluck('total', 'estado');

        $porSeveridad = (clone $base)
            ->selectRaw('severidad, COUNT(*) as total')
            ->groupBy('severidad')
            ->pluck('total', 'severidad');

        return ApiResponse::success([
            'total' => (clone $base)->count(),
            'por_estado' => [
                'abierta' => (int) ($porEstado['abierta'] ?? 0),
                'confirmada' => (int) ($porEstado['confirmada'] ?? 0),
                'resuelta' => (int) ($porEstado['resuelta'] ?? 0),
            ],
            'por_severidad' => [
                'alta' => (int) ($porSeveridad['alta'] ?? 0),
                'media' => (int) ($porSeveridad['media'] ?? 0),
                'baja' => (int) ($porSeveridad['baja'] ?? 0),
            ],
        ]);
    }

    public function confirmar(Request $request, Alerta $alerta): JsonResponse
    {
        /** @var UsuarioApp $usuarioApp */
        $usuarioApp = $request->attributes->get('app_user');

        $alerta = $this->alertaService->confirmarAlerta($alerta, $usuarioApp);

        return ApiResponse::success($alerta->toArray(), 'Alerta confirmada exitosamente.');
    }

    public function resolver(Request $request, Alerta $alerta): JsonResponse
    {
        /** @var UsuarioApp $usuarioApp */
        $usuarioApp = $request->attributes->get('app_user');

        $notas = $request->input('notas_resolucion');
        $alerta = $this->alertaService->resolverAlerta($alerta, $usuarioApp, $notas);

        return ApiResponse::success($alerta->toArray(), 'Alerta resuelta exitosamente.');
    }
}
