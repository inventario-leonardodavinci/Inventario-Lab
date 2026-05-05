<?php

namespace App\Services;

use App\Models\Alerta;
use App\Models\NivelStock;
use App\Models\UsuarioApp;
use Illuminate\Support\Facades\DB;

class AlertaService
{
    /**
     * Evalúa si el stock de un artículo está por debajo del mínimo
     * y genera una alerta si no existe ya una abierta del mismo tipo.
     */
    public function evaluarStockBajo(int $articuloId): void
    {
        $niveles = NivelStock::query()
            ->where('articulo_id', $articuloId)
            ->get();

        foreach ($niveles as $nivel) {
            if ((float) $nivel->cantidad_minima > 0 && (float) $nivel->cantidad <= (float) $nivel->cantidad_minima) {
                // Comprobar si ya existe una alerta abierta de tipo stock_bajo para este artículo
                $existeAlerta = Alerta::query()
                    ->where('tipo', 'stock_bajo')
                    ->where('estado', 'abierta')
                    ->where('articulo_id', $articuloId)
                    ->exists();

                if (! $existeAlerta) {
                    $this->generarAlerta([
                        'tipo'         => 'stock_bajo',
                        'articulo_id'  => $articuloId,
                        'ubicacion_id' => $nivel->ubicacion_id,
                        'datos_json'   => [
                            'cantidad_actual'  => (float) $nivel->cantidad,
                            'cantidad_minima'  => (float) $nivel->cantidad_minima,
                            'ubicacion_id'     => $nivel->ubicacion_id,
                        ],
                        'severidad' => $this->calcularSeveridad(
                            (float) $nivel->cantidad,
                            (float) $nivel->cantidad_minima
                        ),
                    ]);
                }
            }
        }
    }

    /**
     * Crea una alerta con deduplicación: no crea si ya existe una abierta
     * del mismo tipo para el mismo artículo.
     */
    public function generarAlerta(array $datos): Alerta
    {
        return DB::transaction(function () use ($datos): Alerta {
            // lockForUpdate garantiza que dos transacciones concurrentes no
            // pasen ambas el SELECT y generen alertas duplicadas.
            $existente = Alerta::query()
                ->lockForUpdate()
                ->where('tipo', $datos['tipo'])
                ->where('estado', 'abierta')
                ->where('articulo_id', $datos['articulo_id'] ?? null)
                ->first();

            if ($existente !== null) {
                return $existente;
            }

            return Alerta::query()->create([
                'tipo'         => $datos['tipo'],
                'severidad'    => $datos['severidad'] ?? 'baja',
                'estado'       => 'abierta',
                'articulo_id'  => $datos['articulo_id'] ?? null,
                'ubicacion_id' => $datos['ubicacion_id'] ?? null,
                'activo_id'    => $datos['activo_id'] ?? null,
                'datos_json'   => $datos['datos_json'] ?? null,
                'generada_en'  => now(),
            ]);
        });
    }

    /**
     * Calcula la severidad de una alerta de stock bajo según la proporción
     * entre el stock actual y el mínimo configurado.
     */
    public function calcularSeveridad(float $actual, float $minimo): string
    {
        if ($minimo <= 0) {
            return 'baja';
        }

        $ratio = $actual / $minimo;

        return match (true) {
            $ratio >= 0.75 => 'baja',
            $ratio >= 0.50 => 'media',
            $ratio >= 0.25 => 'alta',
            default        => 'critica',
        };
    }

    /**
     * Confirma una alerta: cambia su estado a 'confirmada' y registra
     * el usuario y la fecha de confirmación.
     */
    public function confirmarAlerta(Alerta $alerta, UsuarioApp $usuario): Alerta
    {
        $alerta->estado             = 'confirmada';
        $alerta->confirmada_por_id  = $usuario->id;
        $alerta->confirmada_en      = now();
        $alerta->save();

        return $alerta;
    }

    /**
     * Resuelve una alerta: cambia su estado a 'resuelta' y registra
     * el usuario y la fecha de resolución.
     */
    public function resolverAlerta(Alerta $alerta, UsuarioApp $usuario): Alerta
    {
        $alerta->estado          = 'resuelta';
        $alerta->resuelta_por_id = $usuario->id;
        $alerta->resuelta_en     = now();
        $alerta->save();

        return $alerta;
    }
}
