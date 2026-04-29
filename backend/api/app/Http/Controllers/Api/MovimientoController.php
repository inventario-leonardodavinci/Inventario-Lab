<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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

    public function resumenHoy(): JsonResponse
    {
        $hoy = now()->toDateString();

        $entradasHoy = Movimiento::query()
            ->where('movement_type', 'entry')
            ->whereDate('created_at', $hoy)
            ->count();

        $salidasHoy = Movimiento::query()
            ->where('movement_type', 'exit')
            ->whereDate('created_at', $hoy)
            ->count();

        return response()->json([
            'entradas_hoy' => $entradasHoy,
            'salidas_hoy'  => $salidasHoy,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $filas = Movimiento::query()
            ->with(['user:id,display_name', 'lines:id,movement_id,item_id,quantity'])
            ->latest('id')
            ->paginate((int) $request->query('per_page', 20));

        return response()->json($filas);
    }

    public function store(Request $request): JsonResponse
    {
        $validados = $request->validate([
            'movement_type' => ['required', 'in:entry,exit,transfer,adjustment'],
            'reason' => ['nullable', 'string', 'max:255'],
            'source_location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'target_location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.item_id' => ['required', 'integer', 'exists:items,id'],
            'lines.*.quantity' => ['required', 'numeric', 'gt:0'],
        ]);

        /** @var UsuarioApp $usuarioApp */
        $usuarioApp = $request->attributes->get('app_user');

        try {
            $movimiento = $this->movimientoService->crearMovimiento($validados + [
                'app_user_id' => $usuarioApp->id,
            ]);
        } catch (RuntimeException $excepcion) {
            return response()->json([
                'message' => $excepcion->getMessage(),
            ], 409);
        }

        return response()->json(['data' => $movimiento], 201);
    }
}
