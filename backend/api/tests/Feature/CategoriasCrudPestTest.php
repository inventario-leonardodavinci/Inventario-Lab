<?php

/**
 * Tests CRUD completos para el endpoint /api/v1/categorias.
 *
 * Cubre: index (con conteo de artículos), show, store, update, destroy.
 * Verifica que la eliminación falla cuando hay artículos asociados.
 */

use App\Models\Articulo;
use App\Models\Categoria;
use App\Models\UsuarioApp;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

function catHeaders(string $rol = 'profesor'): array
{
    Role::firstOrCreate(['name' => $rol, 'guard_name' => 'api']);
    $u = UsuarioApp::factory()->create(['activo' => true]);
    $u->assignRole($rol);
    return ['X-Auth-User-Id' => $u->auth_user_id];
}

// ─── INDEX ────────────────────────────────────────────────────────────────────

describe('GET /categorias — listado', function () {
    it('devuelve array vacío cuando no hay categorías', function () {
        $res = $this->getJson('/api/v1/categorias', catHeaders());
        $res->assertStatus(200)
            ->assertJsonPath('data', []);
    });

    it('devuelve todas las categorías creadas', function () {
        Categoria::factory()->count(3)->create();
        $res = $this->getJson('/api/v1/categorias', catHeaders());
        $res->assertStatus(200);
        expect(count($res->json('data')))->toBe(3);
    });

    it('incluye el campo total_articulos con el conteo correcto', function () {
        $cat = Categoria::factory()->create();
        Articulo::factory()->count(3)->create(['categoria_id' => $cat->id]);
        Articulo::factory()->create(['categoria_id' => $cat->id]);
        $res = $this->getJson('/api/v1/categorias', catHeaders());
        $catData = collect($res->json('data'))->firstWhere('id', $cat->id);
        expect($catData['total_articulos'])->toBe(4);
    });

    it('reporta 0 artículos en categoría vacía', function () {
        $cat = Categoria::factory()->create();
        $catData = collect($this->getJson('/api/v1/categorias', catHeaders())->json('data'))->firstWhere('id', $cat->id);
        expect($catData['total_articulos'])->toBe(0);
    });

    it('devuelve categorías ordenadas por nombre', function () {
        Categoria::factory()->create(['nombre' => 'Reactivos']);
        Categoria::factory()->create(['nombre' => 'Vidrio']);
        Categoria::factory()->create(['nombre' => 'Aparatos']);
        $nombres = array_column($this->getJson('/api/v1/categorias', catHeaders())->json('data'), 'nombre');
        expect($nombres)->toBe(['Aparatos', 'Reactivos', 'Vidrio']);
    });

    it('consultor puede ver el listado de categorías', function () {
        Categoria::factory()->count(2)->create();
        $this->getJson('/api/v1/categorias', catHeaders('consultor'))
            ->assertStatus(200);
    });
});

// ─── SHOW ─────────────────────────────────────────────────────────────────────

describe('GET /categorias/{id} — detalle', function () {
    it('devuelve la categoría correcta por ID', function () {
        $cat = Categoria::factory()->create(['nombre' => 'Fungibles lab']);
        $this->getJson("/api/v1/categorias/{$cat->id}", catHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.nombre', 'Fungibles lab')
            ->assertJsonPath('data.id', $cat->id);
    });

    it('devuelve 404 para ID inexistente', function () {
        $this->getJson('/api/v1/categorias/99999', catHeaders())
            ->assertStatus(404);
    });
});

// ─── STORE ────────────────────────────────────────────────────────────────────

describe('POST /categorias — creación', function () {
    it('crea categoría con nombre válido y devuelve 201', function () {
        $this->postJson('/api/v1/categorias', ['nombre' => 'Instrumentos de medida'], catHeaders())
            ->assertStatus(201)
            ->assertJsonPath('data.nombre', 'Instrumentos de medida');
        $this->assertDatabaseHas('categorias', ['nombre' => 'Instrumentos de medida']);
    });

    it('devuelve total_articulos = 0 para nueva categoría', function () {
        $res = $this->postJson('/api/v1/categorias', ['nombre' => 'Nueva Cat'], catHeaders());
        expect($res->json('data.total_articulos'))->toBe(0);
    });

    it('devuelve 422 si nombre está vacío', function () {
        $this->postJson('/api/v1/categorias', ['nombre' => ''], catHeaders())
            ->assertStatus(422);
    });

    it('devuelve 422 si falta el campo nombre', function () {
        $this->postJson('/api/v1/categorias', [], catHeaders())
            ->assertStatus(422);
    });

    it('devuelve 422 si el nombre ya existe (único)', function () {
        Categoria::factory()->create(['nombre' => 'Reactivos']);
        $this->postJson('/api/v1/categorias', ['nombre' => 'Reactivos'], catHeaders())
            ->assertStatus(422);
    });

    it('consultor recibe 403 al intentar crear categoría', function () {
        $this->postJson('/api/v1/categorias', ['nombre' => 'Test'], catHeaders('consultor'))
            ->assertStatus(403);
    });
});

// ─── UPDATE ───────────────────────────────────────────────────────────────────

describe('PATCH /categorias/{id} — actualización', function () {
    it('actualiza el nombre de la categoría', function () {
        $cat = Categoria::factory()->create(['nombre' => 'Nombre viejo']);
        $this->patchJson("/api/v1/categorias/{$cat->id}", ['nombre' => 'Nombre nuevo'], catHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.nombre', 'Nombre nuevo');
        $this->assertDatabaseHas('categorias', ['id' => $cat->id, 'nombre' => 'Nombre nuevo']);
    });

    it('permite actualizar con el mismo nombre (no viola unique propio)', function () {
        $cat = Categoria::factory()->create(['nombre' => 'Mi categoría']);
        $this->patchJson("/api/v1/categorias/{$cat->id}", ['nombre' => 'Mi categoría'], catHeaders())
            ->assertStatus(200);
    });

    it('devuelve 422 si el nombre ya existe en otra categoría', function () {
        Categoria::factory()->create(['nombre' => 'Reactivos']);
        $otra = Categoria::factory()->create(['nombre' => 'Vidrio']);
        $this->patchJson("/api/v1/categorias/{$otra->id}", ['nombre' => 'Reactivos'], catHeaders())
            ->assertStatus(422);
    });

    it('devuelve 404 para categoría inexistente', function () {
        $this->patchJson('/api/v1/categorias/99999', ['nombre' => 'X'], catHeaders())
            ->assertStatus(404);
    });

    it('consultor recibe 403 al intentar actualizar', function () {
        $cat = Categoria::factory()->create();
        $this->patchJson("/api/v1/categorias/{$cat->id}", ['nombre' => 'X'], catHeaders('consultor'))
            ->assertStatus(403);
    });
});

// ─── DESTROY ──────────────────────────────────────────────────────────────────

describe('DELETE /categorias/{id} — eliminación', function () {
    it('elimina categoría vacía y devuelve 204', function () {
        $cat = Categoria::factory()->create();
        $this->deleteJson("/api/v1/categorias/{$cat->id}", [], catHeaders())
            ->assertStatus(204);
        $this->assertDatabaseMissing('categorias', ['id' => $cat->id]);
    });

    it('no puede eliminar categoría con artículos asociados (422)', function () {
        $cat = Categoria::factory()->create();
        Articulo::factory()->create(['categoria_id' => $cat->id]);
        $this->deleteJson("/api/v1/categorias/{$cat->id}", [], catHeaders())
            ->assertStatus(422)
            ->assertJsonStructure(['message']);
        $this->assertDatabaseHas('categorias', ['id' => $cat->id]);
    });

    it('devuelve 404 para categoría inexistente', function () {
        $this->deleteJson('/api/v1/categorias/99999', [], catHeaders())
            ->assertStatus(404);
    });

    it('consultor recibe 403 al intentar eliminar', function () {
        $cat = Categoria::factory()->create();
        $this->deleteJson("/api/v1/categorias/{$cat->id}", [], catHeaders('consultor'))
            ->assertStatus(403);
    });
});
