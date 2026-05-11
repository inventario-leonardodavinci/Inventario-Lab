<?php

namespace Database\Factories;

use App\Models\Articulo;
use App\Models\Categoria;
use Illuminate\Database\Eloquent\Factories\Factory;

class ArticuloFactory extends Factory
{
    protected $model = Articulo::class;

    public function definition(): array
    {
        return [
            'codigo'       => strtoupper($this->faker->unique()->lexify('ART-???')),
            'nombre'       => $this->faker->unique()->words(3, true),
            'descripcion'  => $this->faker->optional()->sentence(),
            'categoria_id' => Categoria::factory(),
            'unidad'       => $this->faker->randomElement(['uds', 'kg', 'L', 'g', 'ml']),
            'notas'        => null,
        ];
    }


}
