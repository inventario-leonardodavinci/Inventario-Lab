<?php

namespace App\Http\Resources;

use App\Models\ActivoMantenimiento;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource para serializar activos de mantenimiento.
 *
 * Incluye información del artículo asociado y ubicación actual.
 *
 * @mixin ActivoMantenimiento
 */
class ActivoMantenimientoResource extends JsonResource
{
    /**
     * Transformar el recurso en un array.
     *
     * @param Request $request Request actual
     * @return array<string, mixed> Datos serializados del activo
     */
    public function toArray(Request $request): array
    {
        return [
            'id'                    => $this->id,
            'articulo_id'           => $this->articulo_id,
            'articulo'              => $this->articulo?->nombre,
            'codigo_activo'         => $this->codigo_activo,
            'numero_serie'          => $this->numero_serie,
            'estado'                => $this->estado,
            'ubicacion_actual_id'   => $this->ubicacion_actual_id,
            'ubicacion_actual'      => $this->ubicacionActual?->nombre,
            'notes'                 => $this->notes,
            'next_service_due_date' => $this->next_service_due_date,
            'last_service_date'     => $this->last_service_date,
            'manufacturer'          => $this->manufacturer,
            'model'                 => $this->model,
            'purchase_date'         => $this->purchase_date,
            'warranty_end_date'     => $this->warranty_end_date,
            'created_at'            => $this->created_at,
            'updated_at'            => $this->updated_at,
        ];
    }
}
