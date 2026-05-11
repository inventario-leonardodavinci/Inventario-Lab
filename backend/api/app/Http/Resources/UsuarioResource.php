<?php

namespace App\Http\Resources;

use App\Models\UsuarioApp;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource para serializar datos de usuarios.
 *
 * Incluye información básica del usuario y sus roles asignados.
 *
 * @mixin UsuarioApp
 */
class UsuarioResource extends JsonResource
{
    /**
     * Transformar el recurso en un array.
     *
     * @param Request $request Request actual
     * @return array<string, mixed> Datos serializados del usuario
     */
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'auth_user_id'   => $this->auth_user_id,
            'nombre_visible' => $this->nombre_visible,
            'activo'         => $this->activo,
            'roles'          => $this->roles->map(fn ($rol) => [
                'id'   => $rol->id,
                'name' => $rol->name,
            ])->values(),
            'created_at'     => $this->created_at,
            'updated_at'     => $this->updated_at,
        ];
    }
}
