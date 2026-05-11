<?php

namespace App\Services;

use App\Models\LineaMovimiento;
use App\Models\Movimiento;
use App\Models\NivelStock;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Servicio para operaciones de movimientos de inventario.
 *
 * Gestiona la lógica de negocio para crear movimientos y actualizar
 * los niveles de stock de manera atómica. Soporta operaciones de:
 * - Entrada: incrementa stock en ubicación destino
 * - Salida: decrementa stock en ubicación origen
 * - Traslado: mueve stock entre ubicaciones
 * - Ajuste: establece stock a valor específico
 */
class MovimientoService
{
    /**
     * Crea un movimiento completo dentro de una transacción atómica.
     *
     * @param array{
     *   tipo: string,
     *   motivo: ?string,
     *   ubicacion_origen_id: ?int,
     *   ubicacion_destino_id: ?int,
     *   sub_ubicacion_origen_id: ?int,
     *   sub_ubicacion_destino_id: ?int,
     *   usuario_id: int,
     *   lineas: array<int, array{articulo_id: int, cantidad: float}>
     * } $datos
     */
    public function crearMovimiento(array $datos): Movimiento
    {
        return DB::transaction(function () use ($datos): Movimiento {
            $movimiento = Movimiento::query()->create([
                'tipo'                      => $datos['tipo'],
                'motivo'                    => $datos['motivo'] ?? null,
                'ubicacion_origen_id'       => $datos['ubicacion_origen_id'] ?? null,
                'ubicacion_destino_id'      => $datos['ubicacion_destino_id'] ?? null,
                'sub_ubicacion_origen_id'   => $datos['sub_ubicacion_origen_id'] ?? null,
                'sub_ubicacion_destino_id'  => $datos['sub_ubicacion_destino_id'] ?? null,
                'usuario_id'                => $datos['usuario_id'],
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
                    subOrigenId: $datos['sub_ubicacion_origen_id'] ?? null,
                    subDestinoId: $datos['sub_ubicacion_destino_id'] ?? null,
                );
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
        ?int $destinoId,
        ?int $subOrigenId = null,
        ?int $subDestinoId = null,
    ): void {
        match ($tipo) {
            'entrada' => $this->manejarEntrada($articuloId, $cantidad, $destinoId, $subDestinoId),
            'salida'  => $this->manejarSalida($articuloId, $cantidad, $origenId, $subOrigenId),
            'traslado' => $this->manejarTraslado($articuloId, $cantidad, $origenId, $destinoId, $subOrigenId, $subDestinoId),
            'ajuste'  => $this->manejarAjuste($articuloId, $cantidad, $destinoId, $subDestinoId),
            default   => throw new RuntimeException("Tipo de movimiento desconocido: {$tipo}."),
        };
    }

    private function manejarEntrada(int $articuloId, float $cantidad, ?int $destinoId, ?int $subDestinoId = null): void
    {
        if ($destinoId === null) {
            throw new RuntimeException('Se requiere ubicación destino para una entrada.');
        }
        $this->incrementarStock($articuloId, $destinoId, $cantidad, $subDestinoId);
    }

    private function manejarSalida(int $articuloId, float $cantidad, ?int $origenId, ?int $subOrigenId = null): void
    {
        if ($origenId === null) {
            throw new RuntimeException('Se requiere ubicación origen para una salida.');
        }
        $this->decrementarStock($articuloId, $origenId, $cantidad, $subOrigenId);
    }

    private function manejarTraslado(int $articuloId, float $cantidad, ?int $origenId, ?int $destinoId, ?int $subOrigenId = null, ?int $subDestinoId = null): void
    {
        if ($origenId === null || $destinoId === null) {
            throw new RuntimeException('Se requieren ubicación origen y destino para un traslado.');
        }
        $this->decrementarStock($articuloId, $origenId, $cantidad, $subOrigenId);
        $this->incrementarStock($articuloId, $destinoId, $cantidad, $subDestinoId);
    }

    private function manejarAjuste(int $articuloId, float $cantidad, ?int $destinoId, ?int $subDestinoId = null): void
    {
        if ($destinoId === null) {
            throw new RuntimeException('Se requiere ubicación destino para un ajuste.');
        }
        if ($cantidad < 0) {
            throw new RuntimeException('La cantidad de stock no puede ser negativa.');
        }
        $this->establecerStock($articuloId, $destinoId, $cantidad, $subDestinoId);
    }

    /**
     * Incrementa el stock de un artículo en una ubicación/sub-ubicación.
     * Crea el registro si no existe.
     */
    public function incrementarStock(int $articuloId, int $ubicacionId, float $cantidad, ?int $subUbicacionId = null): void
    {
        $query = NivelStock::query()
            ->lockForUpdate()
            ->where('articulo_id', $articuloId)
            ->where('ubicacion_id', $ubicacionId);

        if ($subUbicacionId !== null) {
            $query->where('sub_ubicacion_id', $subUbicacionId);
        } else {
            $query->whereNull('sub_ubicacion_id');
        }

        $stock = $query->first();

        if ($stock) {
            $stock->cantidad = (float) $stock->cantidad + $cantidad;
            $stock->save();
        } else {
            NivelStock::query()->create([
                'articulo_id'       => $articuloId,
                'ubicacion_id'      => $ubicacionId,
                'sub_ubicacion_id'  => $subUbicacionId,
                'cantidad'          => $cantidad,
                'cantidad_minima'   => 0,
            ]);
        }
    }

    /**
     * Decrementa el stock de un artículo en una ubicación/sub-ubicación.
     * Lanza RuntimeException si el stock es insuficiente.
     */
    public function decrementarStock(int $articuloId, int $ubicacionId, float $cantidad, ?int $subUbicacionId = null): void
    {
        $query = NivelStock::query()
            ->lockForUpdate()
            ->where('articulo_id', $articuloId)
            ->where('ubicacion_id', $ubicacionId);

        if ($subUbicacionId !== null) {
            $query->where('sub_ubicacion_id', $subUbicacionId);
        }

        $stock = $query->first();

        if (! $stock || (float) $stock->cantidad < $cantidad) {
            throw new RuntimeException('Stock insuficiente para este movimiento.');
        }

        $stock->cantidad = (float) $stock->cantidad - $cantidad;
        $stock->save();
    }

    /**
     * Establece el stock de un artículo en una ubicación/sub-ubicación al valor indicado.
     */
    public function establecerStock(int $articuloId, int $ubicacionId, float $cantidad, ?int $subUbicacionId = null): void
    {
        $conditions = [
            'articulo_id'   => $articuloId,
            'ubicacion_id'  => $ubicacionId,
        ];

        if ($subUbicacionId !== null) {
            $conditions['sub_ubicacion_id'] = $subUbicacionId;
        }

        NivelStock::query()->updateOrCreate(
            $conditions,
            ['cantidad' => $cantidad]
        );
    }
}
