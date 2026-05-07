<?php

/**
 * Tests de autorización por roles.
 *
 * Verifica que cada endpoint devuelva el código HTTP correcto
 * según el rol del usuario que lo llama:
 *   - administrador → acceso total
 *   - profesor      → acceso operativo (sin eliminar artículos, sin auditoria/usuarios)
 *   - consultor     → solo lectura (403 en escrituras)
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
    it('permite a administrador ver artículos', function () {
        $this->getJson('/api/v1/articulos', crearUsuarioConRol('administrador'))
            ->assertStatus(200);
    });

    it('permite a profesor ver artículos', function () {
        $this->getJson('/api/v1/articulos', crearUsuarioConRol('profesor'))
            ->assertStatus(200);
    });

    it('permite a consultor ver artículos', function () {
        $this->getJson('/api/v1/articulos', crearUsuarioConRol('consultor'))
            ->assertStatus(200);
    });
});

describe('POST /articulos — solo administrador y profesor', function () {
    it('permite a administrador crear artículo', function () {
        $this->postJson('/api/v1/articulos', [], crearUsuarioConRol('administrador'))
            ->assertStatus(422); // Falla por validación, no por permisos
    });

    it('permite a profesor crear artículo', function () {
        $this->postJson('/api/v1/articulos', [], crearUsuarioConRol('profesor'))
            ->assertStatus(422);
    });

    it('deniega a consultor crear artículo con 403', function () {
        $this->postJson('/api/v1/articulos', [], crearUsuarioConRol('consultor'))
            ->assertStatus(403);
    });
});

describe('DELETE /articulos/{id} — solo administrador', function () {
    it('deniega a profesor eliminar artículo con 403', function () {
        $this->deleteJson('/api/v1/articulos/1', [], crearUsuarioConRol('profesor'))
            ->assertStatus(403);
    });

    it('deniega a consultor eliminar artículo con 403', function () {
        $this->deleteJson('/api/v1/articulos/1', [], crearUsuarioConRol('consultor'))
            ->assertStatus(403);
    });
});

// ─── Movimientos ──────────────────────────────────────────────────────────────

describe('POST /movimientos — solo administrador y profesor', function () {
    it('permite a administrador registrar movimiento', function () {
        $this->postJson('/api/v1/movimientos', [], crearUsuarioConRol('administrador'))
            ->assertStatus(422);
    });

    it('permite a profesor registrar movimiento', function () {
        $this->postJson('/api/v1/movimientos', [], crearUsuarioConRol('profesor'))
            ->assertStatus(422);
    });

    it('deniega a consultor registrar movimiento con 403', function () {
        $this->postJson('/api/v1/movimientos', [], crearUsuarioConRol('consultor'))
            ->assertStatus(403);
    });
});

// ─── Categorías ───────────────────────────────────────────────────────────────

describe('POST /categorias — solo administrador', function () {
    it('permite a administrador crear categoría', function () {
        $this->postJson('/api/v1/categorias', [], crearUsuarioConRol('administrador'))
            ->assertStatus(422);
    });

    it('deniega a profesor crear categoría con 403', function () {
        $this->postJson('/api/v1/categorias', [], crearUsuarioConRol('profesor'))
            ->assertStatus(403);
    });

    it('deniega a consultor crear categoría con 403', function () {
        $this->postJson('/api/v1/categorias', [], crearUsuarioConRol('consultor'))
            ->assertStatus(403);
    });
});

describe('DELETE /categorias/{id} — solo administrador', function () {
    it('deniega a profesor eliminar categoría con 403', function () {
        $this->deleteJson('/api/v1/categorias/1', [], crearUsuarioConRol('profesor'))
            ->assertStatus(403);
    });

    it('deniega a consultor eliminar categoría con 403', function () {
        $this->deleteJson('/api/v1/categorias/1', [], crearUsuarioConRol('consultor'))
            ->assertStatus(403);
    });
});

// ─── Ubicaciones ──────────────────────────────────────────────────────────────

describe('POST /ubicaciones — solo administrador', function () {
    it('permite a administrador crear ubicación', function () {
        $this->postJson('/api/v1/ubicaciones', [], crearUsuarioConRol('administrador'))
            ->assertStatus(422);
    });

    it('deniega a profesor crear ubicación con 403', function () {
        $this->postJson('/api/v1/ubicaciones', [], crearUsuarioConRol('profesor'))
            ->assertStatus(403);
    });

    it('deniega a consultor crear ubicación con 403', function () {
        $this->postJson('/api/v1/ubicaciones', [], crearUsuarioConRol('consultor'))
            ->assertStatus(403);
    });
});

// ─── Mantenimiento ────────────────────────────────────────────────────────────

describe('POST /mantenimiento/activos — administrador y profesor', function () {
    it('permite a administrador crear activo', function () {
        $this->postJson('/api/v1/mantenimiento/activos', [], crearUsuarioConRol('administrador'))
            ->assertStatus(422);
    });

    it('permite a profesor crear activo', function () {
        $this->postJson('/api/v1/mantenimiento/activos', [], crearUsuarioConRol('profesor'))
            ->assertStatus(422);
    });

    it('deniega a consultor crear activo con 403', function () {
        $this->postJson('/api/v1/mantenimiento/activos', [], crearUsuarioConRol('consultor'))
            ->assertStatus(403);
    });
});

// ─── Usuarios (solo administrador) ───────────────────────────────────────────

describe('GET /usuarios — solo administrador', function () {
    it('permite a administrador ver usuarios', function () {
        $this->getJson('/api/v1/usuarios', crearUsuarioConRol('administrador'))
            ->assertStatus(200);
    });

    it('deniega a profesor ver usuarios con 403', function () {
        $this->getJson('/api/v1/usuarios', crearUsuarioConRol('profesor'))
            ->assertStatus(403);
    });

    it('deniega a consultor ver usuarios con 403', function () {
        $this->getJson('/api/v1/usuarios', crearUsuarioConRol('consultor'))
            ->assertStatus(403);
    });
});

describe('PATCH /usuarios/{id}/rol — solo administrador', function () {
    it('deniega a profesor cambiar rol con 403', function () {
        $this->patchJson('/api/v1/usuarios/1/rol', [], crearUsuarioConRol('profesor'))
            ->assertStatus(403);
    });

    it('deniega a consultor cambiar rol con 403', function () {
        $this->patchJson('/api/v1/usuarios/1/rol', [], crearUsuarioConRol('consultor'))
            ->assertStatus(403);
    });
});

// ─── Auditoría (solo administrador) ──────────────────────────────────────────

describe('GET /auditoria — solo administrador', function () {
    it('permite a administrador ver auditoría', function () {
        $this->getJson('/api/v1/auditoria', crearUsuarioConRol('administrador'))
            ->assertStatus(200);
    });

    it('deniega a profesor ver auditoría con 403', function () {
        $this->getJson('/api/v1/auditoria', crearUsuarioConRol('profesor'))
            ->assertStatus(403);
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
