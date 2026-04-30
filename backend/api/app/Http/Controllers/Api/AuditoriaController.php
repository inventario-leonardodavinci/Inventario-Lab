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
        if ($request->filled('tabla')) {
            $query->where('entidad_tipo', $request->query('tabla'));
        }

        // Filtro por operación (tipo_evento: INSERT, UPDATE, DELETE)
        if ($request->filled('operacion')) {
            $query->where('tipo_evento', strtoupper((string) $request->query('operacion')));
        }

        // Filtro por rango de fechas
        if ($request->filled('desde')) {
            $query->where('created_at', '>=', $request->query('desde'));
        }

        if ($request->filled('hasta')) {
            $query->where('created_at', '<=', $request->query('hasta'));
        }

        $registros = $query->paginate((int) $request->query('per_page', 20));

        return response()->json($registros);
    }
}
