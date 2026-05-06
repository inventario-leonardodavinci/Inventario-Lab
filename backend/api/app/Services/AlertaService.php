<?php

namespace App\Services;

use App\Models\Alerta;
use App\Models\NivelStock;
use App\Models\UsuarioApp;
use Illuminate\Support\Facades\DB;

class AlertaService
{
    /**
     * Evalúa el stock de un artículo:
     * - Genera alerta si está por debajo del mínimo
     * - Resuelve alertas automáticamente si el stock volvió a niveles normales
     */
    public function evaluarStockBajo(int $articuloId): void
    {
        $niveles = $this->obtenerNivelesStock($articuloId);

        foreach ($niveles as $nivel) {
            $this->procesarNivelStock($articuloId, $nivel);
        }
    }

    /**
     * Obtiene los niveles de stock para un artículo.
     */
    private function obtenerNivelesStock(int $articuloId): \Illuminate\Support\Collection
    {
        return NivelStock::query()
            ->where('articulo_id', $articuloId)
            ->get();
    }

    /**
     * Procesa un nivel de stock individual: evalúa si necesita alerta o resolución.
     */
    private function procesarNivelStock(int $articuloId, NivelStock $nivel): void
    {
        $cantidad = (float) $nivel->cantidad;
        $cantidadMinima = (float) $nivel->cantidad_minima;

        if (! $this->debeEvaluarNivel($cantidadMinima)) {
            return;
        }

        $alertaAbierta = $this->buscarAlertaAbierta($articuloId, $nivel->ubicacion_id);

        if ($cantidad < $cantidadMinima) {
            $this->crearAlertaStockBajo($articuloId, $nivel, $cantidad, $cantidadMinima, $alertaAbierta);
        } else {
            $this->resolverAlertaSiExiste($alertaAbierta);
        }
    }

    /**
     * Determina si un nivel debe ser evaluado (requiere stock mínimo configurado).
     */
    private function debeEvaluarNivel(float $cantidadMinima): bool
    {
        return $cantidadMinima > 0;
    }

    /**
     * Busca una alerta abierta para un artículo y ubicación específicos.
     */
    private function buscarAlertaAbierta(int $articuloId, int $ubicacionId): ?Alerta
    {
        return Alerta::query()
            ->where('tipo', 'stock_bajo')
            ->where('estado', 'abierta')
            ->where('articulo_id', $articuloId)
            ->where('ubicacion_id', $ubicacionId)
            ->first();
    }

    /**
     * Crea alerta de stock bajo si no existe una abierta.
     */
    private function crearAlertaStockBajo(
        int $articuloId,
        NivelStock $nivel,
        float $cantidad,
        float $cantidadMinima,
        ?Alerta $alertaAbierta
    ): void {
        if ($alertaAbierta) {
            return;
        }

        $this->generarAlerta([
            'tipo'         => 'stock_bajo',
            'articulo_id'  => $articuloId,
            'ubicacion_id' => $nivel->ubicacion_id,
            'datos_json'   => [
                'cantidad_actual'  => $cantidad,
                'cantidad_minima'  => $cantidadMinima,
                'ubicacion_id'     => $nivel->ubicacion_id,
            ],
            'severidad' => $this->calcularSeveridad($cantidad, $cantidadMinima),
        ]);
    }

    /**
     * Resuelve alerta automáticamente si existe.
     */
    private function resolverAlertaSiExiste(?Alerta $alertaAbierta): void
    {
        if (! $alertaAbierta) {
            return;
        }

        $this->resolverAlertaAutomaticamente($alertaAbierta, 'Stock normalizado automáticamente');
    }

    /**
     * Resuelve una alerta automáticamente por el sistema (sin usuario específico).
     */
    private function resolverAlertaAutomaticamente(Alerta $alerta, string $notas): void
    {
        $alerta->estado           = 'resuelta';
        $alerta->resuelta_por_id  = null; // Resuelto por el sistema
        $alerta->resuelta_en      = now();
        $alerta->notas_resolucion = $notas;
        $alerta->save();
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
     * el usuario, la fecha de resolución y notas de resolución.
     */
    public function resolverAlerta(Alerta $alerta, UsuarioApp $usuario, ?string $notas = null): Alerta
    {
        $alerta->estado           = 'resuelta';
        $alerta->resuelta_por_id  = $usuario->id;
        $alerta->resuelta_en      = now();
        $alerta->notas_resolucion = $notas;
        $alerta->save();

        return $alerta;
    }
}
