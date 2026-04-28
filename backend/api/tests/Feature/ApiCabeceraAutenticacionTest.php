<?php

namespace Tests\Feature;

use Tests\TestCase;

class ApiCabeceraAutenticacionTest extends TestCase
{
    public function test_perfil_requiere_cabecera_autenticacion(): void
    {
        $response = $this->getJson('/api/v1/perfil');

        $response->assertStatus(401);
    }
}
