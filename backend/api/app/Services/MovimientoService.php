<?php

namespace App\Services;

use App\Models\LineaMovimiento;
use App\Models\Movimiento;
use App\Models\NivelStock;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class MovimientoService
{
    public function __construct(private readonly AlertaService $alertaService)
    {
    }

    /**
     * Crea un movimiento completo dentro de una transacción atómica.
     *
     * @param array{
     *   tipo: string,
     *   motivo: ?string,
     *   ubicacion_origen_id: ?int,
     *   ubicacion_destino_id: ?int,
     *   usuario_id: int,
     *   lineas: array<int, array{articulo_id: int, cantidad: float}>
     * } $datos
     */
    public function crearMovimiento(array $datos): Movimiento
    {
        return DB::transaction(function () use ($datos): Movimiento {
            $movimiento = Movimiento::query()->create([
                'tipo'                  => $datos['tipo'],
                'motivo'                => $datos['motivo'] ?? null,
                'ubicacion_origen_id'   => $datos['ubicacion_origen_id'] ?? null,
                'ubicacion_destino_id'  => $datos['ubicacion_destino_id'] ?? null,
                'usuario_id'            => $datos['usuario_id'],
            ]);

            foreach ($datos['lineas'] as $linea) {
                $cantidad = (float) $linea['cantidad'];

                if ($cantidad <= 0) {
                    throw new RuntimeException('La cantidad de la línea debe ser mayor que cero.');
                }

                LineaMovimiento::query()->create([
                    'movimiento_id' => $movimiento->id,
                    'articulo_id'   => $linea['articulo_id'],
                    'cantidad'      => $cantidad,
                ]);

                $this->aplicarDeltaStock(
                    tipo: $datos['tipo'],
                    articuloId: (int) $linea['articulo_id'],
                    cantidad: $cantidad,
                    origenId: $datos['ubicacion_origen_id'] ?? null,
                    destinoId: $datos['ubicacion_destino_id'] ?? null,
                );

                $this->alertaService->evaluarStockBajo((int) $linea['articulo_id']);
            }

            return $movimiento->load(['lineas.articulo', 'usuario']);
        });
    }

    /**
     * Despacha la actualización de stock según el tipo de movimiento.
     */
    public function aplicarDeltaStock(
        string $tipo,
        int $articuloId,
        float $cantidad,
        ?int $origenId,
        ?int $destinoId
    ): void {
        match ($tipo) {
            'entrada' => $this->manejarEntrada($articuloId, $cantidad, $destinoId),
            'salida'  => $this->manejarSalida($articuloId, $cantidad, $origenId),
            'traslado' => $this->manejarTraslado($articuloId, $cantidad, $origenId, $destinoId),
            'ajuste'  => $this->manejarAjuste($articuloId, $cantidad, $destinoId),
            default   => throw new RuntimeException("Tipo de movimiento desconocido: {$tipo}."),
        };
    }

    private function manejarEntrada(int $articuloId, float $cantidad, ?int $destinoId): void
    {
        if ($destinoId === null) {
            throw new RuntimeException('Se requiere ubicación destino para una entrada.');
        }
        $this->incrementarStock($articuloId, $destinoId, $cantidad);
    }

    private function manejarSalida(int $articuloId, float $cantidad, ?int $origenId): void
    {
        if ($origenId === null) {
            throw new RuntimeException('Se requiere ubicación origen para una salida.');
        }
        $this->decrementarStock($articuloId, $origenId, $cantidad);
    }

    private function manejarTraslado(int $articuloId, float $cantidad, ?int $origenId, ?int $destinoId): void
    {
        if ($origenId === null || $destinoId === null) {
            throw new RuntimeException('Se requieren ubicación origen y destino para un traslado.');
        }
        $this->decrementarStock($articuloId, $origenId, $cantidad);
        $this->incrementarStock($articuloId, $destinoId, $cantidad);
    }

    private function manejarAjuste(int $articuloId, float $cantidad, ?int $destinoId): void
    {
        if ($destinoId === null) {
            throw new RuntimeException('Se requiere ubicación destino para un ajuste.');
        }
        $this->establecerStock($articuloId, $destinoId, $cantidad);
    }

    /**
     * Incrementa el stock de un artículo en una ubicación.
     * Crea el registro si no existe.
     */
    public function incrementarStock(int $articuloId, int $ubicacionId, float $cantidad): void
    {
        $stock = NivelStock::query()->firstOrCreate(
            ['articulo_id' => $articuloId, 'ubicacion_id' => $ubicacionId],
            ['cantidad' => 0, 'cantidad_minima' => 0]
        );

        $stock->cantidad = (float) $stock->cantidad + $cantidad;
        $stock->save();
    }

    /**
     * Decrementa el stock de un artículo en una ubicación.
     * Lanza RuntimeException si el stock es insuficiente.
     */
    public function decrementarStock(int $articuloId, int $ubicacionId, float $cantidad): void
    {
        $stock = NivelStock::query()
            ->lockForUpdate()
            ->where('articulo_id', $articuloId)
            ->where('ubicacion_id', $ubicacionId)
            ->first();

        if (! $stock || (float) $stock->cantidad < $cantidad) {
            throw new RuntimeException('Stock insuficiente para este movimiento.');
        }

        $stock->cantidad = (float) $stock->cantidad - $cantidad;
        $stock->save();
    }

    /**
     * Establece el stock de un artículo en una ubicación al valor indicado.
     */
    public function establecerStock(int $articuloId, int $ubicacionId, float $cantidad): void
    {
        NivelStock::query()->updateOrCreate(
            ['articulo_id' => $articuloId, 'ubicacion_id' => $ubicacionId],
            ['cantidad' => $cantidad]
        );
    }
}
