<?php

/**
 * Tests de autenticación con Pest.
 * Equivalente más expresivo de ApiCabeceraAutenticacionTest y ApiRutasPruebaHumoTest.
 */

it('rechaza peticiones sin cabecera X-Auth-User-Id con 401', function () {
    $this->getJson('/api/v1/perfil')->assertStatus(401);
});

it('protege todos los endpoints principales de la API v1', function (string $ruta) {
    $this->getJson($ruta)->assertStatus(401);
})->with([
    '/api/v1/movimientos',
    '/api/v1/mantenimiento/activos',
    '/api/v1/articulos',
    '/api/v1/categorias',
    '/api/v1/ubicaciones',
]);

it('devuelve 200 en el health check', function () {
    $this->get('/up')->assertStatus(200);
});
