<?php

namespace Database\Factories;

use App\Models\UsuarioApp;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory para UsuarioApp.
 * Usado exclusivamente en tests — no en seeders de producción.
 */
class UsuarioAppFactory extends Factory
{
    protected $model = UsuarioApp::class;

    public function definition(): array
    {
        return [
            'auth_user_id'   => Str::uuid()->toString(),
            'nombre_visible' => $this->faker->name(),
            'activo'         => true,
        ];
    }

    public function inactivo(): static
    {
        return $this->state(['activo' => false]);
    }
}
