<?php

/**
 * Tests CRUD para el endpoint /api/v1/ubicaciones.
 *
 * Cubre: index (con sub_ubicaciones), show, store, update.
 * No existe DELETE en el controlador actual (ubicaciones son permanentes).
 */

use App\Models\Ubicacion;
use App\Models\UsuarioApp;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

function ubiHeaders(string $rol = 'profesor'): array
{
    Role::firstOrCreate(['name' => $rol, 'guard_name' => 'api']);
    $u = UsuarioApp::factory()->create(['activo' => true]);
    $u->assignRole($rol);
    return ['X-Auth-User-Id' => $u->auth_user_id];
}

// ─── INDEX ────────────────────────────────────────────────────────────────────

describe('GET /ubicaciones — listado', function () {
    it('devuelve array vacío cuando no hay ubicaciones', function () {
        $this->getJson('/api/v1/ubicaciones', ubiHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data', []);
    });

    it('devuelve las ubicaciones con campos básicos', function () {
        Ubicacion::factory()->count(2)->create();
        $res = $this->getJson('/api/v1/ubicaciones', ubiHeaders());
        $res->assertStatus(200);
        expect(count($res->json('data')))->toBe(2);
    });

    it('incluye sub_ubicaciones como array (vacío si no hay)', function () {
        Ubicacion::factory()->create();
        $res = $this->getJson('/api/v1/ubicaciones', ubiHeaders());
        $sub = $res->json('data.0.sub_ubicaciones');
        expect($sub)->toBeArray();
    });

    it('devuelve estructura completa por ubicación', function () {
        Ubicacion::factory()->create(['nombre' => 'Armario A', 'tipo' => 'armario']);
        $this->getJson('/api/v1/ubicaciones', ubiHeaders())
            ->assertStatus(200)
            ->assertJsonStructure(['data' => [['id', 'nombre', 'tipo', 'descripcion', 'sub_ubicaciones']]]);
    });

    it('ordena por nombre alfabéticamente', function () {
        Ubicacion::factory()->create(['nombre' => 'Zona Reactivos']);
        Ubicacion::factory()->create(['nombre' => 'Armario Central']);
        $nombres = array_column($this->getJson('/api/v1/ubicaciones', ubiHeaders())->json('data'), 'nombre');
        expect($nombres[0])->toBe('Armario Central');
    });

    it('consultor puede ver el listado de ubicaciones', function () {
        Ubicacion::factory()->count(2)->create();
        $this->getJson('/api/v1/ubicaciones', ubiHeaders('consultor'))
            ->assertStatus(200);
    });
});

// ─── SHOW ─────────────────────────────────────────────────────────────────────

describe('GET /ubicaciones/{id} — detalle', function () {
    it('devuelve la ubicación correcta por ID', function () {
        $ubi = Ubicacion::factory()->create(['nombre' => 'Nevera principal', 'tipo' => 'nevera']);
        $this->getJson("/api/v1/ubicaciones/{$ubi->id}", ubiHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.nombre', 'Nevera principal')
            ->assertJsonPath('data.tipo', 'nevera');
    });

    it('devuelve 404 para ID inexistente', function () {
        $this->getJson('/api/v1/ubicaciones/99999', ubiHeaders())
            ->assertStatus(404);
    });
});

// ─── STORE ────────────────────────────────────────────────────────────────────

describe('POST /ubicaciones — creación', function () {
    it('crea ubicación con nombre y tipo válidos', function () {
        $this->postJson('/api/v1/ubicaciones', [
            'nombre' => 'Armario Nuevo',
            'tipo'   => 'armario',
        ], ubiHeaders())
            ->assertStatus(201);
        $this->assertDatabaseHas('ubicaciones', ['nombre' => 'Armario Nuevo', 'tipo' => 'armario']);
    });

    it('crea ubicación con descripción opcional', function () {
        $this->postJson('/api/v1/ubicaciones', [
            'nombre'      => 'Estantería Oeste',
            'tipo'        => 'estanteria',
            'descripcion' => 'Estantería lateral izquierda',
        ], ubiHeaders())
            ->assertStatus(201);
    });

    it('crea ubicación con cualquier tipo válido', function () {
        $tipos = ['armario', 'nevera', 'estanteria', 'cajon', 'vitrina', 'otro'];
        foreach ($tipos as $tipo) {
            $this->postJson('/api/v1/ubicaciones', [
                'nombre' => "Test tipo {$tipo}",
                'tipo'   => $tipo,
            ], ubiHeaders())
                ->assertStatus(201);
        }
    });

    it('devuelve 422 si falta nombre', function () {
        $this->postJson('/api/v1/ubicaciones', ['tipo' => 'armario'], ubiHeaders())
            ->assertStatus(422);
    });

    it('devuelve 422 si falta tipo en creación', function () {
        $this->postJson('/api/v1/ubicaciones', ['nombre' => 'Test sin tipo'], ubiHeaders())
            ->assertStatus(422);
    });

    it('devuelve 422 si tipo no está en los valores permitidos', function () {
        $this->postJson('/api/v1/ubicaciones', [
            'nombre' => 'Test tipo inválido',
            'tipo'   => 'caja_magica',
        ], ubiHeaders())
            ->assertStatus(422);
    });

    it('devuelve 422 si el nombre ya existe (único)', function () {
        Ubicacion::factory()->create(['nombre' => 'Armario Duplicado']);
        $this->postJson('/api/v1/ubicaciones', [
            'nombre' => 'Armario Duplicado',
            'tipo'   => 'armario',
        ], ubiHeaders())
            ->assertStatus(422);
    });

    it('consultor recibe 403 al intentar crear ubicación', function () {
        $this->postJson('/api/v1/ubicaciones', [
            'nombre' => 'Test',
            'tipo'   => 'armario',
        ], ubiHeaders('consultor'))
            ->assertStatus(403);
    });
});

// ─── UPDATE ───────────────────────────────────────────────────────────────────

describe('PATCH /ubicaciones/{id} — actualización', function () {
    it('actualiza el nombre de la ubicación', function () {
        $ubi = Ubicacion::factory()->create(['nombre' => 'Nombre viejo', 'tipo' => 'armario']);
        $this->patchJson("/api/v1/ubicaciones/{$ubi->id}", [
            'nombre' => 'Nombre actualizado',
            'tipo'   => $ubi->tipo,
        ], ubiHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.nombre', 'Nombre actualizado');
        $this->assertDatabaseHas('ubicaciones', ['id' => $ubi->id, 'nombre' => 'Nombre actualizado']);
    });

    it('actualiza la descripción', function () {
        $ubi = Ubicacion::factory()->create();
        $this->patchJson("/api/v1/ubicaciones/{$ubi->id}", [
            'nombre'      => $ubi->nombre,
            'tipo'        => $ubi->tipo,
            'descripcion' => 'Nueva descripción actualizada',
        ], ubiHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.descripcion', 'Nueva descripción actualizada');
    });

    it('devuelve 404 para ubicación inexistente', function () {
        $this->patchJson('/api/v1/ubicaciones/99999', ['nombre' => 'X', 'tipo' => 'armario'], ubiHeaders())
            ->assertStatus(404);
    });

    it('devuelve 422 si el nombre ya existe en otra ubicación', function () {
        Ubicacion::factory()->create(['nombre' => 'Armario A']);
        $ubi = Ubicacion::factory()->create(['nombre' => 'Armario B']);
        $this->patchJson("/api/v1/ubicaciones/{$ubi->id}", ['nombre' => 'Armario A'], ubiHeaders())
            ->assertStatus(422);
    });

    it('consultor recibe 403 al intentar actualizar', function () {
        $ubi = Ubicacion::factory()->create();
        $this->patchJson("/api/v1/ubicaciones/{$ubi->id}", ['nombre' => $ubi->nombre], ubiHeaders('consultor'))
            ->assertStatus(403);
    });
});
