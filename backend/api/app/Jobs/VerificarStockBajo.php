<?php

namespace App\Jobs;

use App\Models\Articulo;
use App\Services\AlertaService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class VerificarStockBajo implements ShouldQueue
{
    use Queueable;

    /**
     * Itera todos los artículos activos y evalúa si su stock está por debajo
     * del mínimo configurado, generando alertas cuando corresponda.
     */
    public function handle(AlertaService $alertaService): void
    {
        Articulo::query()
            ->where('activo', true)
            ->select('id')
            ->each(function (Articulo $articulo) use ($alertaService): void {
                $alertaService->evaluarStockBajo($articulo->id);
            });
    }
}
