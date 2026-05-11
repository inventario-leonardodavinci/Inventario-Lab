<?php

namespace Database\Factories;

use App\Models\Articulo;
use App\Models\NivelStock;
use App\Models\Ubicacion;
use Illuminate\Database\Eloquent\Factories\Factory;

class NivelStockFactory extends Factory
{
    protected $model = NivelStock::class;

    public function definition(): array
    {
        return [
            'articulo_id'      => Articulo::factory(),
            'ubicacion_id'     => Ubicacion::factory(),
            'sub_ubicacion_id' => null,
            'cantidad'         => $this->faker->randomFloat(2, 5, 100),
            'cantidad_minima'  => 0,
        ];
    }

    public function stockCritico(): static
    {
        return $this->state([
            'cantidad'        => 1.0,
            'cantidad_minima' => 10.0,
        ]);
    }
}
