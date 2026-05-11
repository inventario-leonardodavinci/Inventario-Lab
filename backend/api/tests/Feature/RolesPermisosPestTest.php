<?php

/**
 * Tests de autorización por roles.
 *
 * Verifica que cada endpoint devuelva el código HTTP correcto
 * según el rol del usuario que lo llama:
 *   - profesor  → acceso completo (lectura + escritura + administración)
 *   - consultor → solo lectura (403 en escrituras)
 *
 * El sistema de roles usa Spatie (laravel-permission).
 * Tablas activas: spatie_roles, spatie_model_has_roles.
 * El middleware 'app.user' crea el usuario y le asigna 'consultor' si no tiene rol.
 */

use App\Models\UsuarioApp;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Crea un UsuarioApp con el rol indicado y devuelve la cabecera de autenticación.
 */
function crearUsuarioConRol(string $rol): array
{
    // Asegurar que el rol existe en Spatie con el guard correcto del modelo
    Role::firstOrCreate(['name' => $rol, 'guard_name' => 'api']);

    $usuario = UsuarioApp::factory()->create([
        'activo' => true,
    ]);
    $usuario->assignRole($rol);

    return ['X-Auth-User-Id' => $usuario->auth_user_id];
}

// ─── Artículos ────────────────────────────────────────────────────────────────

describe('GET /articulos — lectura libre para todos', function () {
    it('permite a profesor ver artículos', function () {
        $this->getJson('/api/v1/articulos', crearUsuarioConRol('profesor'))
            ->assertStatus(200);
    });

    it('permite a consultor ver artículos', function () {
        $this->getJson('/api/v1/articulos', crearUsuarioConRol('consultor'))
            ->assertStatus(200);
    });
});

describe('POST /articulos — solo profesor', function () {
    it('permite a profesor crear artículo (validación)', function () {
        $this->postJson('/api/v1/articulos', [], crearUsuarioConRol('profesor'))
            ->assertStatus(422);
    });

    it('deniega a consultor crear artículo con 403', function () {
        $this->postJson('/api/v1/articulos', [], crearUsuarioConRol('consultor'))
            ->assertStatus(403);
    });
});

describe('DELETE /articulos/{id} — solo profesor', function () {
    it('permite a profesor desactivar artículo (no encontrado → 404)', function () {
        $this->deleteJson('/api/v1/articulos/99999', [], crearUsuarioConRol('profesor'))
            ->assertStatus(404);
    });

    it('deniega a consultor eliminar artículo con 403', function () {
        $articulo = \App\Models\Articulo::factory()->create();
        $this->deleteJson("/api/v1/articulos/{$articulo->id}", [], crearUsuarioConRol('consultor'))
            ->assertStatus(403);
    });
});

// ─── Movimientos ──────────────────────────────────────────────────────────────

describe('POST /movimientos — solo profesor', function () {
    it('permite a profesor registrar movimiento (validación)', function () {
        $this->postJson('/api/v1/movimientos', [], crearUsuarioConRol('profesor'))
            ->assertStatus(422);
    });

    it('deniega a consultor registrar movimiento con 403', function () {
        $this->postJson('/api/v1/movimientos', [], crearUsuarioConRol('consultor'))
            ->assertStatus(403);
    });
});

// ─── Categorías ───────────────────────────────────────────────────────────────

describe('POST /categorias — solo profesor', function () {
    it('permite a profesor crear categoría (validación)', function () {
        $this->postJson('/api/v1/categorias', [], crearUsuarioConRol('profesor'))
            ->assertStatus(422);
    });

    it('deniega a consultor crear categoría con 403', function () {
        $this->postJson('/api/v1/categorias', [], crearUsuarioConRol('consultor'))
            ->assertStatus(403);
    });
});

describe('DELETE /categorias/{id} — solo profesor', function () {
    it('permite a profesor eliminar categoría (no encontrada → 404)', function () {
        $this->deleteJson('/api/v1/categorias/99999', [], crearUsuarioConRol('profesor'))
            ->assertStatus(404);
    });

    it('deniega a consultor eliminar categoría con 403', function () {
        $categoria = \App\Models\Categoria::factory()->create();
        $this->deleteJson("/api/v1/categorias/{$categoria->id}", [], crearUsuarioConRol('consultor'))
            ->assertStatus(403);
    });
});

// ─── Ubicaciones ──────────────────────────────────────────────────────────────

describe('POST /ubicaciones — solo profesor', function () {
    it('permite a profesor crear ubicación (validación)', function () {
        $this->postJson('/api/v1/ubicaciones', [], crearUsuarioConRol('profesor'))
            ->assertStatus(422);
    });

    it('deniega a consultor crear ubicación con 403', function () {
        $this->postJson('/api/v1/ubicaciones', [], crearUsuarioConRol('consultor'))
            ->assertStatus(403);
    });
});

// ─── Mantenimiento ────────────────────────────────────────────────────────────

describe('POST /mantenimiento/activos — solo profesor', function () {
    it('permite a profesor crear activo (validación)', function () {
        $this->postJson('/api/v1/mantenimiento/activos', [], crearUsuarioConRol('profesor'))
            ->assertStatus(422);
    });

    it('deniega a consultor crear activo con 403', function () {
        $this->postJson('/api/v1/mantenimiento/activos', [], crearUsuarioConRol('consultor'))
            ->assertStatus(403);
    });
});

// ─── Usuarios (solo profesor) ─────────────────────────────────────────────────

describe('GET /usuarios — solo profesor', function () {
    it('permite a profesor ver usuarios', function () {
        $this->getJson('/api/v1/usuarios', crearUsuarioConRol('profesor'))
            ->assertStatus(200);
    });

    it('deniega a consultor ver usuarios con 403', function () {
        $this->getJson('/api/v1/usuarios', crearUsuarioConRol('consultor'))
            ->assertStatus(403);
    });
});

describe('PATCH /usuarios/{id}/rol — solo profesor', function () {
    it('deniega a consultor cambiar rol con 403', function () {
        $this->patchJson('/api/v1/usuarios/1/rol', [], crearUsuarioConRol('consultor'))
            ->assertStatus(403);
    });
});

// ─── Auditoría (solo profesor) ────────────────────────────────────────────────

describe('GET /auditoria — solo profesor', function () {
    it('permite a profesor ver auditoría', function () {
        $this->getJson('/api/v1/auditoria', crearUsuarioConRol('profesor'))
            ->assertStatus(200);
    });

    it('deniega a consultor ver auditoría con 403', function () {
        $this->getJson('/api/v1/auditoria', crearUsuarioConRol('consultor'))
            ->assertStatus(403);
    });
});

// ─── Comportamiento del middleware ResolverUsuarioApp ─────────────────────────

describe('ResolverUsuarioApp — comportamiento automático', function () {
    it('asigna rol consultor automáticamente a usuarios nuevos sin rol', function () {
        $usuario = UsuarioApp::factory()->create(['activo' => true]);
        // Usuario sin rol — el middleware debe asignarle 'consultor'
        $this->getJson('/api/v1/articulos', ['X-Auth-User-Id' => $usuario->auth_user_id])
            ->assertStatus(200);

        $usuario->refresh();
        expect($usuario->hasRole('consultor'))->toBeTrue();
    });

    it('bloquea usuario inactivo con 403', function () {
        $usuario = UsuarioApp::factory()->create(['activo' => false]);
        $this->getJson('/api/v1/articulos', ['X-Auth-User-Id' => $usuario->auth_user_id])
            ->assertStatus(403);
    });

    it('rechaza petición sin cabecera con 401', function () {
        $this->getJson('/api/v1/articulos')
            ->assertStatus(401);
    });
});
