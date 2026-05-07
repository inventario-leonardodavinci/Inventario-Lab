<?php

namespace App\Http\Resources;

use App\Models\UsuarioApp;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin UsuarioApp */
class UsuarioResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'auth_user_id'   => $this->auth_user_id,
            'nombre_visible' => $this->nombre_visible,
            'activo'         => $this->activo,
            'roles'          => $this->roles->map(fn ($r) => ['id' => $r->id, 'name' => $r->name])->values(),
            'created_at'     => $this->created_at,
            'updated_at'     => $this->updated_at,
        ];
    }
}
