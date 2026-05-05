<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RegistroAuditoria;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditoriaController extends Controller
{
    /**
     * Lista paginada de registros de auditoría con filtros opcionales.
     * Solo accesible para administradores (protegido por middleware en rutas).
     */
    public function index(Request $request): JsonResponse
    {
        $query = RegistroAuditoria::query()
            ->with('usuario:id,nombre_visible')
            ->orderBy('created_at', 'desc');

        // Filtro por tabla (entidad_tipo)
        if ($request->filled('entidad_tipo')) {
            $query->where('entidad_tipo', $request->query('entidad_tipo'));
        }

        // Filtro por operación (tipo_evento: INSERT, UPDATE, DELETE)
        if ($request->filled('tipo_evento')) {
            $query->where('tipo_evento', strtoupper((string) $request->query('tipo_evento')));
        }

        // Filtro por rango de fechas
        if ($request->filled('desde')) {
            $query->whereDate('created_at', '>=', $request->query('desde'));
        }

        if ($request->filled('hasta')) {
            $query->whereDate('created_at', '<=', $request->query('hasta'));
        }

        $registros = $query->paginate((int) $request->query('per_page', 20));

        return response()->json([
            'data' => $registros->items(),
            'meta' => [
                'current_page' => $registros->currentPage(),
                'last_page'    => $registros->lastPage(),
                'total'        => $registros->total(),
            ],
        ]);
    }
}
