<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
        $alertas = Alerta::query()
            ->with('articulo:id,nombre')
            ->latest('generada_en')
            ->paginate((int) $request->query('per_page', 20));

        return response()->json($alertas);
    }

    public function confirmar(Request $request, Alerta $alerta): JsonResponse
    {
        /** @var UsuarioApp $usuarioApp */
        $usuarioApp = $request->attributes->get('app_user');

        $alerta = $this->alertaService->confirmarAlerta($alerta, $usuarioApp);

        return response()->json(['data' => $alerta]);
    }

    public function resolver(Request $request, Alerta $alerta): JsonResponse
    {
        /** @var UsuarioApp $usuarioApp */
        $usuarioApp = $request->attributes->get('app_user');

        $alerta = $this->alertaService->resolverAlerta($alerta, $usuarioApp);

        return response()->json(['data' => $alerta]);
    }
}
