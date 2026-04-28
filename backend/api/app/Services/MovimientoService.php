<?php

namespace App\Services;

use App\Models\Movimiento;
use App\Models\LineaMovimiento;
use App\Models\NivelStock;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class MovimientoService
{
    /**
     * @param array{
     *   movement_type:string,
     *   app_user_id:int,
     *   reason:?string,
     *   source_location_id:?int,
     *   target_location_id:?int,
     *   lines:array<int,array{item_id:int,quantity:float}>
     * } $datos
     */
    public function crearMovimiento(array $datos): Movimiento
    {
        return DB::transaction(function () use ($datos): Movimiento {
            $movimiento = Movimiento::query()->create([
                'movement_type' => $datos['movement_type'],
                'reason' => $datos['reason'] ?? null,
                'source_location_id' => $datos['source_location_id'] ?? null,
                'target_location_id' => $datos['target_location_id'] ?? null,
                'app_user_id' => $datos['app_user_id'],
            ]);

            foreach ($datos['lines'] as $linea) {
                $cantidad = (float) $linea['quantity'];
                if ($cantidad <= 0) {
                    throw new RuntimeException('Cantidad invalida en la linea de movimiento.');
                }

                LineaMovimiento::query()->create([
                    'movement_id' => $movimiento->id,
                    'item_id' => $linea['item_id'],
                    'quantity' => $cantidad,
                ]);

                $this->aplicarDeltaStock(
                    tipoMovimiento: $datos['movement_type'],
                    articuloId: (int) $linea['item_id'],
                    cantidad: $cantidad,
                    ubicacionOrigenId: $datos['source_location_id'] ?? null,
                    ubicacionDestinoId: $datos['target_location_id'] ?? null
                );
            }

            return $movimiento->load('lines');
        });
    }

    private function aplicarDeltaStock(
        string $tipoMovimiento,
        int $articuloId,
        float $cantidad,
        ?int $ubicacionOrigenId,
        ?int $ubicacionDestinoId
    ): void {
        if ($tipoMovimiento === 'entry') {
            $this->incrementarStock($articuloId, (int) $ubicacionDestinoId, $cantidad);
            return;
        }

        if ($tipoMovimiento === 'exit') {
            $this->decrementarStock($articuloId, (int) $ubicacionOrigenId, $cantidad);
            return;
        }

        if ($tipoMovimiento === 'transfer') {
            $this->decrementarStock($articuloId, (int) $ubicacionOrigenId, $cantidad);
            $this->incrementarStock($articuloId, (int) $ubicacionDestinoId, $cantidad);
            return;
        }

        if ($tipoMovimiento === 'adjustment') {
            $this->incrementarStock($articuloId, (int) $ubicacionDestinoId, $cantidad);
        }
    }

    private function incrementarStock(int $articuloId, int $ubicacionId, float $cantidad): void
    {
        $stock = NivelStock::query()->firstOrCreate(
            ['item_id' => $articuloId, 'location_id' => $ubicacionId],
            ['quantity' => 0, 'min_quantity' => 0]
        );

        $stock->quantity = (float) $stock->quantity + $cantidad;
        $stock->save();
    }

    private function decrementarStock(int $articuloId, int $ubicacionId, float $cantidad): void
    {
        $stock = NivelStock::query()
            ->lockForUpdate()
            ->where('item_id', $articuloId)
            ->where('location_id', $ubicacionId)
            ->first();

        if (! $stock || (float) $stock->quantity < $cantidad) {
            throw new RuntimeException('Stock insuficiente para este movimiento.');
        }

        $stock->quantity = (float) $stock->quantity - $cantidad;
        $stock->save();
    }
}
