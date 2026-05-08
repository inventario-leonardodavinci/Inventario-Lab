<?php

namespace Tests\Feature;

use Tests\TestCase;

class ApiRutasPruebaHumoTest extends TestCase
{
    public function test_endpoints_api_v1_existen_y_estan_protegidos(): void
    {
        $rutas = [
            '/api/v1/inventario',
            '/api/v1/movimientos',
            '/api/v1/alertas',
            '/api/v1/mantenimiento/activos',
        ];

        foreach ($rutas as $ruta) {
            $response = $this->getJson($ruta);
            $response->assertStatus(401);
        }
    }
}
