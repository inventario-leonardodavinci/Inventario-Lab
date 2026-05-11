<?php

namespace Database\Factories;

use App\Models\Ubicacion;
use Illuminate\Database\Eloquent\Factories\Factory;

class UbicacionFactory extends Factory
{
    protected $model = Ubicacion::class;

    public function definition(): array
    {
        return [
            'nombre'      => 'Ubicacion ' . $this->faker->unique()->bothify('??-###'),
            'descripcion' => $this->faker->optional()->sentence(),
            'tipo'        => $this->faker->randomElement(['armario', 'nevera', 'estanteria', 'cajon', 'vitrina', 'otro']),
        ];
    }
}
