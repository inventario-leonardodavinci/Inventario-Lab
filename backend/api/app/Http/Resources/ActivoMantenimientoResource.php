<?php

namespace App\Http\Resources;

use App\Models\ActivoMantenimiento;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ActivoMantenimiento */
class ActivoMantenimientoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'articulo_id' => $this->articulo_id,
            'articulo' => $this->articulo?->nombre,
            'codigo_activo' => $this->codigo_activo,
            'numero_serie' => $this->numero_serie,
            'estado' => $this->estado,
            'ubicacion_actual_id' => $this->ubicacion_actual_id,
            'ubicacion_actual' => $this->ubicacionActual?->nombre,
            'notas' => $this->notas,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
