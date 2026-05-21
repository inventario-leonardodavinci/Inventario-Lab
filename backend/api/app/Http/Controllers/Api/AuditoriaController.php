<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Http\Requests\AuditoriaIndexRequest;
use App\Models\RegistroAuditoria;
use Illuminate\Http\JsonResponse;

class AuditoriaController extends Controller
{
    /**
     * Lista paginada de registros de auditoría con filtros opcionales.
     * Solo accesible para profesores (protegido por middleware en rutas).
     */
    public function index(AuditoriaIndexRequest $request): JsonResponse
    {
        $perPage = min(max((int) $request->validated('per_page', 20), 1), 100);

        $query = RegistroAuditoria::query()
            ->with('usuario:id,nombre_visible')
            ->orderBy('created_at', 'desc')
            ->when($request->filled('entidad_tipo'), fn ($q) => $q->where('entidad_tipo', $request->validated('entidad_tipo')))
            ->when($request->filled('tipo_evento'), fn ($q) => $q->where('tipo_evento', strtoupper((string) $request->validated('tipo_evento'))))
            ->when($request->filled('desde'), fn ($q) => $q->whereDate('created_at', '>=', $request->validated('desde')))
            ->when($request->filled('hasta'), fn ($q) => $q->whereDate('created_at', '<=', $request->validated('hasta')));

        $registros = $query->paginate($perPage);

        return ApiResponse::paginated(
            $registros->items(),
            [
                'current_page' => $registros->currentPage(),
                'last_page'    => $registros->lastPage(),
                'total'        => $registros->total(),
            ]
        );
    }
}
