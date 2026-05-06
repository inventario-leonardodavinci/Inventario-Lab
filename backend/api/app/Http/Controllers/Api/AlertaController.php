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
            ->with('articulo:id,nombre')
            ->latest('generada_en');

        // Filtro por estado
        if ($request->has('estado')) {
            $query->where('estado', $request->query('estado'));
        }

        // Filtro por tipo
        if ($request->has('tipo')) {
            $query->where('tipo', $request->query('tipo'));
        }

        // Filtro por severidad
        if ($request->has('severidad')) {
            $query->where('severidad', $request->query('severidad'));
        }

        $alertas = $query->paginate((int) $request->query('per_page', config('constantes.default_per_page')));

        // Transformar la respuesta para asegurar que el ID esté incluido
        $alertasTransformadas = $alertas->getCollection()->map(fn (Alerta $alerta) => [
            'id' => $alerta->id,
            'tipo' => $alerta->tipo,
            'estado' => $alerta->estado,
            'severidad' => $alerta->severidad,
            'articulo_id' => $alerta->articulo_id,
            'articulo' => $alerta->articulo?->nombre,
            'ubicacion_id' => $alerta->ubicacion_id,
            'datos_json' => $alerta->datos_json,
            'generada_en' => $alerta->generada_en,
            'confirmada_en' => $alerta->confirmada_en,
            'resuelta_en' => $alerta->resuelta_en,
            'notas_resolucion' => $alerta->notas_resolucion,
        ]);

        return ApiResponse::paginated(
            $alertasTransformadas->toArray(),
            [
                'current_page' => $alertas->currentPage(),
                'last_page' => $alertas->lastPage(),
                'total' => $alertas->total(),
            ]
        );
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

        return ApiResponse::success($alerta->toArray(), 'Alerta confirmada exitosamente.');
    }
}
