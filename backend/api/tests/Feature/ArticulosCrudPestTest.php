<?php

/**
 * Tests CRUD completos para el endpoint /api/v1/articulos.
 *
 * Cubre: index (con filtros), resumen, show, store, update, destroy.
 * Usa el rol 'profesor' para operaciones de escritura y 'consultor' para
 * verificar que los accesos denegados retornan 403.
 */

use App\Models\Articulo;
use App\Models\Categoria;
use App\Models\NivelStock;
use App\Models\Ubicacion;
use App\Models\UsuarioApp;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

function articulosHeaders(string $rol = 'profesor'): array
{
    Role::firstOrCreate(['name' => $rol, 'guard_name' => 'api']);
    $u = UsuarioApp::factory()->create(['activo' => true]);
    $u->assignRole($rol);
    return ['X-Auth-User-Id' => $u->auth_user_id];
}

// ─── SIN AUTENTICACIÓN ────────────────────────────────────────────────────────

describe('Sin cabecera X-Auth-User-Id', function () {
    it('devuelve 401 en GET /articulos', function () {
        $this->getJson('/api/v1/articulos')
            ->assertStatus(401);
    });
});

// ─── INDEX ────────────────────────────────────────────────────────────────────

describe('GET /articulos — listado paginado', function () {
    it('devuelve estructura paginada correcta con datos vacíos', function () {
        $this->getJson('/api/v1/articulos', articulosHeaders())
            ->assertStatus(200)
            ->assertJsonStructure(['data', 'meta' => ['current_page', 'last_page', 'total']])
            ->assertJsonPath('meta.total', 0);
    });

    it('devuelve los artículos creados con campos canónicos', function () {
        Articulo::factory()->create(['nombre' => 'Reactivo Alfa']);
        $this->getJson('/api/v1/articulos', articulosHeaders())
            ->assertStatus(200)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonStructure(['data' => [['id', 'nombre', 'codigo', 'stock_total', 'stock_minimo', 'estado_stock', 'categoria_id']]]);
    });

    it('filtra por nombre con search', function () {
        Articulo::factory()->create(['nombre' => 'Acetona pura 96%']);
        Articulo::factory()->create(['nombre' => 'Etanol industrial']);
        $this->getJson('/api/v1/articulos?search=Acetona', articulosHeaders())
            ->assertStatus(200)
            ->assertJsonPath('meta.total', 1);
    });

    it('filtra por código con search', function () {
        Articulo::factory()->create(['codigo' => 'QMC-001', 'nombre' => 'Cualquier nombre']);
        Articulo::factory()->create(['codigo' => 'BIO-999', 'nombre' => 'Otro artículo']);
        $this->getJson('/api/v1/articulos?search=QMC', articulosHeaders())
            ->assertStatus(200)
            ->assertJsonPath('meta.total', 1);
    });

    it('filtra por categoria_id', function () {
        $cat = Categoria::factory()->create();
        Articulo::factory()->count(2)->create(['categoria_id' => $cat->id]);
        Articulo::factory()->create(); // categoría diferente
        $this->getJson("/api/v1/articulos?categoria_id={$cat->id}", articulosHeaders())
            ->assertStatus(200)
            ->assertJsonPath('meta.total', 2);
    });

    it('filtra por ubicacion_id', function () {
        $ubi = Ubicacion::factory()->create();
        $artConStock = Articulo::factory()->create();
        NivelStock::factory()->create(['articulo_id' => $artConStock->id, 'ubicacion_id' => $ubi->id]);
        Articulo::factory()->create(); // sin stock en esa ubicación
        $this->getJson("/api/v1/articulos?ubicacion_id={$ubi->id}", articulosHeaders())
            ->assertStatus(200)
            ->assertJsonPath('meta.total', 1);
    });

    it('ordena por nombre ascendente por defecto', function () {
        Articulo::factory()->create(['nombre' => 'Zanahoria reactivo']);
        Articulo::factory()->create(['nombre' => 'Acetato etilo']);
        $res = $this->getJson('/api/v1/articulos?order_by=nombre&order_dir=asc', articulosHeaders());
        $res->assertStatus(200);
        $data = $res->json('data');
        expect($data[0]['nombre'])->toBe('Acetato etilo');
    });

    it('ordena por nombre descendente', function () {
        Articulo::factory()->create(['nombre' => 'Zanahoria reactivo']);
        Articulo::factory()->create(['nombre' => 'Acetato etilo']);
        $res = $this->getJson('/api/v1/articulos?order_by=nombre&order_dir=desc', articulosHeaders());
        $res->assertStatus(200);
        $data = $res->json('data');
        expect($data[0]['nombre'])->toBe('Zanahoria reactivo');
    });

    it('rechaza order_by no permitido con 422', function () {
        Articulo::factory()->count(2)->create();
        $this->getJson('/api/v1/articulos?order_by=campo_inexistente', articulosHeaders())
            ->assertStatus(422);
    });

    it('respeta paginación con per_page', function () {
        Articulo::factory()->count(5)->create();
        $res = $this->getJson('/api/v1/articulos?per_page=2', articulosHeaders());
        $res->assertStatus(200);
        expect(count($res->json('data')))->toBe(2);
        expect($res->json('meta.last_page'))->toBeGreaterThanOrEqual(3);
    });
});

// ─── RESUMEN ──────────────────────────────────────────────────────────────────

describe('GET /articulos/resumen — contadores globales', function () {
    it('devuelve estructura correcta', function () {
        $this->getJson('/api/v1/articulos/resumen', articulosHeaders())
            ->assertStatus(200)
            ->assertJsonStructure(['data' => ['total_articulos', 'stock_critico']]);
    });

    it('cuenta artículos críticos', function () {
        $ubi = Ubicacion::factory()->create();
        $art = Articulo::factory()->create();
        NivelStock::factory()->stockCritico()->create(['articulo_id' => $art->id, 'ubicacion_id' => $ubi->id]);
        $data = $this->getJson('/api/v1/articulos/resumen', articulosHeaders())->json('data');
        expect($data['stock_critico'])->toBeGreaterThanOrEqual(1);
    });
});

// ─── SHOW ─────────────────────────────────────────────────────────────────────

describe('GET /articulos/{id} — detalle completo', function () {
    it('devuelve todos los campos del artículo', function () {
        $articulo = Articulo::factory()->create(['nombre' => 'Éter dietílico']);
        $this->getJson("/api/v1/articulos/{$articulo->id}", articulosHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.nombre', 'Éter dietílico')
            ->assertJsonStructure(['data' => ['id', 'nombre', 'codigo', 'stock_total', 'stock_minimo', 'estado_stock', 'niveles_stock', 'categoria']]);
    });

    it('devuelve 404 para artículo inexistente', function () {
        $this->getJson('/api/v1/articulos/99999', articulosHeaders())
            ->assertStatus(404);
    });

    it('incluye niveles_stock con la cantidad correcta', function () {
        $articulo = Articulo::factory()->create();
        $ubi = Ubicacion::factory()->create();
        NivelStock::factory()->create(['articulo_id' => $articulo->id, 'ubicacion_id' => $ubi->id, 'cantidad' => 42.0]);
        $res = $this->getJson("/api/v1/articulos/{$articulo->id}", articulosHeaders());
        $niveles = $res->json('data.niveles_stock');
        expect($niveles)->toHaveCount(1);
        expect((float) $niveles[0]['cantidad'])->toBe(42.0);
    });

    it('suma el stock_total de varios niveles', function () {
        $articulo = Articulo::factory()->create();
        $ubi1 = Ubicacion::factory()->create();
        $ubi2 = Ubicacion::factory()->create();
        NivelStock::factory()->create(['articulo_id' => $articulo->id, 'ubicacion_id' => $ubi1->id, 'cantidad' => 10.0]);
        NivelStock::factory()->create(['articulo_id' => $articulo->id, 'ubicacion_id' => $ubi2->id, 'cantidad' => 15.0]);
        $stockTotal = $this->getJson("/api/v1/articulos/{$articulo->id}", articulosHeaders())->json('data.stock_total');
        expect((float) $stockTotal)->toBe(25.0);
    });

    it('marca estado_stock como critico cuando stock < stock_minimo', function () {
        $articulo = Articulo::factory()->create();
        $ubi = Ubicacion::factory()->create();
        NivelStock::factory()->create([
            'articulo_id'     => $articulo->id,
            'ubicacion_id'    => $ubi->id,
            'cantidad'        => 2.0,
            'cantidad_minima' => 10.0,
        ]);
        $estadoStock = $this->getJson("/api/v1/articulos/{$articulo->id}", articulosHeaders())->json('data.estado_stock');
        expect($estadoStock)->toBe('critico');
    });
});

// ─── STORE ────────────────────────────────────────────────────────────────────

describe('POST /articulos — creación', function () {
    it('crea artículo con datos mínimos y devuelve 201', function () {
        $cat = Categoria::factory()->create();
        $this->postJson('/api/v1/articulos', [
            'nombre'       => 'Ácido sulfúrico 98%',
            'categoria_id' => $cat->id,
        ], articulosHeaders())
            ->assertStatus(201)
            ->assertJsonPath('data.nombre', 'Ácido sulfúrico 98%');
        $this->assertDatabaseHas('articulos', ['nombre' => 'Ácido sulfúrico 98%']);
    });

    it('crea artículo con todos los campos opcionales', function () {
        $cat = Categoria::factory()->create();
        $this->postJson('/api/v1/articulos', [
            'nombre'       => 'Matraz aforo 100ml',
            'codigo'       => 'VID-100',
            'descripcion'  => 'Matraz de cuello largo',
            'categoria_id' => $cat->id,
            'unidad'       => 'uds',
            'notas'        => 'Frágil',
        ], articulosHeaders())
            ->assertStatus(201)
            ->assertJsonPath('data.codigo', 'VID-100')
            ->assertJsonPath('data.unidad', 'uds');
    });

    it('crea artículo con stock inicial y ubicación, generando nivel de stock', function () {
        $cat = Categoria::factory()->create();
        $ubi = Ubicacion::factory()->create();
        $res = $this->postJson('/api/v1/articulos', [
            'nombre'        => 'Reactivo con stock',
            'categoria_id'  => $cat->id,
            'stock_inicial' => 50,
            'stock_minimo'  => 5,
            'ubicacion_id'  => $ubi->id,
        ], articulosHeaders());
        $res->assertStatus(201)
            ->assertJsonPath('data.stock_total', 50);
        $this->assertDatabaseHas('niveles_stock', [
            'ubicacion_id'    => $ubi->id,
            'cantidad'        => 50,
            'cantidad_minima' => 5,
        ]);
    });

    it('no crea nivel de stock si falta ubicacion_id aunque haya stock_inicial', function () {
        $cat = Categoria::factory()->create();
        $this->postJson('/api/v1/articulos', [
            'nombre'        => 'Sin ubicación',
            'categoria_id'  => $cat->id,
            'stock_inicial' => 20,
        ], articulosHeaders())
            ->assertStatus(201);
        $this->assertDatabaseCount('niveles_stock', 0);
    });

    it('devuelve 422 si falta nombre', function () {
        $cat = Categoria::factory()->create();
        $this->postJson('/api/v1/articulos', ['categoria_id' => $cat->id], articulosHeaders())
            ->assertStatus(422)
            ->assertJsonStructure(['errors' => ['nombre']]);
    });

    it('devuelve 422 si falta categoria_id', function () {
        $this->postJson('/api/v1/articulos', ['nombre' => 'Sin categoría'], articulosHeaders())
            ->assertStatus(422)
            ->assertJsonStructure(['errors' => ['categoria_id']]);
    });

    it('devuelve 422 si categoria_id no existe en BD', function () {
        $this->postJson('/api/v1/articulos', [
            'nombre'       => 'Test',
            'categoria_id' => 99999,
        ], articulosHeaders())
            ->assertStatus(422);
    });

    it('devuelve 422 si el código ya existe', function () {
        $cat = Categoria::factory()->create();
        Articulo::factory()->create(['codigo' => 'DUP-001', 'categoria_id' => $cat->id]);
        $this->postJson('/api/v1/articulos', [
            'nombre'       => 'Otro artículo',
            'codigo'       => 'DUP-001',
            'categoria_id' => $cat->id,
        ], articulosHeaders())
            ->assertStatus(422);
    });

    it('consultor recibe 403 al intentar crear artículo', function () {
        $cat = Categoria::factory()->create();
        $this->postJson('/api/v1/articulos', [
            'nombre'       => 'Test 403',
            'categoria_id' => $cat->id,
        ], articulosHeaders('consultor'))
            ->assertStatus(403);
    });
});

// ─── UPDATE ───────────────────────────────────────────────────────────────────

describe('PATCH /articulos/{id} — actualización', function () {
    it('actualiza el nombre correctamente', function () {
        $articulo = Articulo::factory()->create(['nombre' => 'Nombre original']);
        $this->patchJson("/api/v1/articulos/{$articulo->id}", [
            'nombre' => 'Nombre actualizado',
        ], articulosHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.nombre', 'Nombre actualizado');
        $this->assertDatabaseHas('articulos', ['id' => $articulo->id, 'nombre' => 'Nombre actualizado']);
    });

    it('actualiza stock_minimo en todos los niveles del artículo', function () {
        $articulo = Articulo::factory()->create();
        $ubi1 = Ubicacion::factory()->create();
        $ubi2 = Ubicacion::factory()->create();
        NivelStock::factory()->create(['articulo_id' => $articulo->id, 'ubicacion_id' => $ubi1->id, 'cantidad_minima' => 0]);
        NivelStock::factory()->create(['articulo_id' => $articulo->id, 'ubicacion_id' => $ubi2->id, 'cantidad_minima' => 0]);
        $this->patchJson("/api/v1/articulos/{$articulo->id}", ['stock_minimo' => 20], articulosHeaders())
            ->assertStatus(200);
        $this->assertDatabaseHas('niveles_stock', ['articulo_id' => $articulo->id, 'cantidad_minima' => 20, 'ubicacion_id' => $ubi1->id]);
        $this->assertDatabaseHas('niveles_stock', ['articulo_id' => $articulo->id, 'cantidad_minima' => 20, 'ubicacion_id' => $ubi2->id]);
    });

    it('permite cambiar el código si no está duplicado', function () {
        $articulo = Articulo::factory()->create(['codigo' => 'COD-OLD']);
        $this->patchJson("/api/v1/articulos/{$articulo->id}", ['codigo' => 'COD-NEW'], articulosHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.codigo', 'COD-NEW');
    });

    it('devuelve 422 si el nuevo código ya pertenece a otro artículo', function () {
        $cat = Categoria::factory()->create();
        Articulo::factory()->create(['codigo' => 'EXIST-001', 'categoria_id' => $cat->id]);
        $otro = Articulo::factory()->create(['codigo' => 'OTRO-002', 'categoria_id' => $cat->id]);
        $this->patchJson("/api/v1/articulos/{$otro->id}", ['codigo' => 'EXIST-001'], articulosHeaders())
            ->assertStatus(422);
    });

    it('devuelve 404 para artículo inexistente', function () {
        $this->patchJson('/api/v1/articulos/99999', ['nombre' => 'X'], articulosHeaders())
            ->assertStatus(404);
    });

    it('consultor recibe 403 al intentar actualizar', function () {
        $articulo = Articulo::factory()->create();
        $this->patchJson("/api/v1/articulos/{$articulo->id}", ['nombre' => 'X'], articulosHeaders('consultor'))
            ->assertStatus(403);
    });
});

// ─── DESTROY ──────────────────────────────────────────────────────────────────

describe('DELETE /articulos/{id} — eliminación física', function () {
    it('elimina el artículo permanentemente', function () {
        $articulo = Articulo::factory()->create();
        $this->deleteJson("/api/v1/articulos/{$articulo->id}", [], articulosHeaders())
            ->assertStatus(200);
    });

    it('el registro se borra de la base de datos', function () {
        $articulo = Articulo::factory()->create();
        $this->deleteJson("/api/v1/articulos/{$articulo->id}", [], articulosHeaders());
        $this->assertDatabaseMissing('articulos', ['id' => $articulo->id]);
        $this->assertDatabaseCount('articulos', 0);
    });

    it('devuelve 404 para artículo inexistente', function () {
        $this->deleteJson('/api/v1/articulos/99999', [], articulosHeaders())
            ->assertStatus(404);
    });

    it('consultor recibe 403 al intentar eliminar', function () {
        $articulo = Articulo::factory()->create();
        $this->deleteJson("/api/v1/articulos/{$articulo->id}", [], articulosHeaders('consultor'))
            ->assertStatus(403);
    });
});
