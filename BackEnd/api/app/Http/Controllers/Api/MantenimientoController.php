<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivoMantenimiento;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MantenimientoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $activos = ActivoMantenimiento::query()
            ->latest('id')
            ->paginate((int) $request->query('per_page', 20));

        return response()->json($activos);
    }

    public function store(Request $request): JsonResponse
    {
        $validados = $request->validate([
            'item_id' => ['nullable', 'integer', 'exists:items,id'],
            'asset_code' => ['required', 'string', 'max:100', 'unique:maintenance_assets,asset_code'],
            'serial_number' => ['nullable', 'string', 'max:120'],
            'status' => ['required', 'in:operational,maintenance_due,in_maintenance,out_of_service,retired'],
            'manufacturer' => ['nullable', 'string', 'max:120'],
            'model' => ['nullable', 'string', 'max:120'],
            'current_location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'notes' => ['nullable', 'string'],
        ]);

        $activo = ActivoMantenimiento::query()->create($validados);

        return response()->json(['data' => $activo], 201);
    }
}
