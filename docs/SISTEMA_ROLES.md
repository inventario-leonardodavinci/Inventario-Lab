# Sistema de Roles y Permisos - Documentación

**Fecha:** 6 de Mayo 2026  
**Estado:** ⚠️ SISTEMA DUAL - Requiere atención

---

## 📋 Resumen Ejecutivo

El proyecto tiene **dos sistemas de roles** coexistiendo:

1. **Sistema Propio (Legacy):** Tablas `roles` + `usuario_roles`
2. **Sistema Spatie:** Tablas `spatie_roles` + `spatie_model_has_roles`

**⚠️ PROBLEMA:** El middleware `AsegurarRol` usa Spatie (`HasRoles` trait), pero las migraciones muestran intento de migración incompleto.

---

## 🗄️ Esquema de Base de Datos

### Tablas del Sistema Propio (Legacy)
```sql
roles                    -- Roles definidos (administrador, profesor, consultor)
usuario_roles           -- Asignación usuario ↔ rol
```

### Tablas del Sistema Spatie
```sql
spatie_roles            -- Roles de spatie/laravel-permission
spatie_permissions      -- Permisos de spatie
spatie_model_has_roles  -- Asignación modelo ↔ rol
spatie_role_has_permissions
spatie_model_has_permissions
```

---

## 🔧 Implementación Actual

### Modelo: `UsuarioApp.php`
```php
use Spatie\Permission\Traits\HasRoles;

class UsuarioApp extends Model implements AuthenticatableContract
{
    use HasRoles, Authenticatable;  // ← Usa Spatie
    
    // Métodos disponibles de Spatie:
    // - hasAnyRole($roles)
    // - hasRole($role)
    // - can($permission)
    // - etc.
}
```

### Middleware: `AsegurarRol.php`
```php
if (! $usuarioApp->hasAnyRole($roles)) {  // ← Usa método de Spatie
    return new JsonResponse(['message' => 'No tienes permiso...'], 403);
}
```

### Middleware: `AsegurarPermiso.php`
```php
if (! $usuarioApp->can($permiso)) {  // ← Usa método can() de Spatie
    return new JsonResponse(['message' => 'No tienes permiso...'], 403);
}
```

---

## 📁 Migraciones Relacionadas

### `2026_05_05_030000_crear_tablas_permisos_spatie.php`
- Crea tablas de Spatie: `spatie_roles`, `spatie_permissions`, etc.
- Estado: ✅ Ejecutada

### `2026_05_06_000000_migrar_roles_casero_a_spatie.php`
- Migra datos de `roles` + `usuario_roles` → `spatie_roles` + `spatie_model_has_roles`
- Guard name: `'api'`
- Estado: ⚠️ **PENDIENTE DE VERIFICACIÓN**

---

## ⚠️ Problemas Identificados

### 1. **Sistema Dual Activo**
- El código usa Spatie (`HasRoles` trait)
- Pero las tablas propias (`roles`, `usuario_roles`) aún existen
- Riesgo de inconsistencia si se modifica un sistema pero no el otro

### 2. **Middleware Personalizado**
- `AsegurarRol` y `AsegurarPermiso` son wrappers alrededor de Spatie
- Pero no hay fallback si Spatie falla

### 3. **Configuración Spatie**
- Archivo `config/permission.php` debe existir
- Debe tener `guard_name` configurado como `'api'`

---

## 🎯 Recomendaciones

### Opción A: Completar Migración a Spatie (Recomendado)
1. ✅ Verificar que `2026_05_06_000000_migrar_roles_casero_a_spatie.php` se ejecutó correctamente
2. ✅ Eliminar tablas propias (`roles`, `usuario_roles`) después de confirmar migración
3. ✅ Actualizar seeders para usar Spatie
4. ✅ Documentar que el sistema usa Spatie exclusivamente

### Opción B: Revertir a Sistema Propio
1. ❌ Eliminar trait `HasRoles` de `UsuarioApp`
2. ❌ Implementar métodos propios `hasAnyRole()`, `can()`, etc.
3. ❌ Modificar middlewares para usar sistema propio
4. ❌ Eliminar tablas y migraciones de Spatie

### Opción C: Sistema Híbrido (NO RECOMENDADO)
- Mantener ambos sistemas activos
- Alta complejidad, riesgo de bugs

---

## 📝 Notas para Desarrolladores

### Verificar Estado Actual
```sql
-- Verificar roles en sistema propio
SELECT * FROM roles;

-- Verificar roles en Spatie
SELECT * FROM spatie_roles;

-- Verificar asignaciones sistema propio
SELECT * FROM usuario_roles;

-- Verificar asignaciones Spatie
SELECT * FROM spatie_model_has_roles;
```

### Configuración Requerida
```php
// config/permission.php
return [
    'models' => [
        'permission' => Spatie\Permission\Models\Permission::class,
        'role' => Spatie\Permission\Models\Role::class,
    ],
    'table_names' => [
        'roles' => 'spatie_roles',
        'permissions' => 'spatie_permissions',
        'model_has_permissions' => 'spatie_model_has_permissions',
        'model_has_roles' => 'spatie_model_has_roles',
        'role_has_permissions' => 'spatie_role_has_permissions',
    ],
    'column_names' => [
        'model_morph_key' => 'model_id',
    ],
    'guard_name' => 'api',  // ← Importante: debe coincidir con UsuarioApp
];
```

### Uso en Código
```php
// En controladores - Verificar rol
if ($request->user()->hasRole('administrador')) {
    // ...
}

// En rutas - Middleware
Route::post('/articulos', [ArticuloController::class, 'store'])
    ->middleware(['auth', 'role:administrador,profesor']);

// Verificar permiso
if ($request->user()->can('crear articulos')) {
    // ...
}
```

---

## 🔍 Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `UsuarioApp.php` | Modelo con trait `HasRoles` |
| `AsegurarRol.php` | Middleware de autorización por rol |
| `AsegurarPermiso.php` | Middleware de autorización por permiso |
| `config/permission.php` | Configuración de Spatie |
| `bootstrap/app.php` | Registro de middlewares |

---

## ⚡ Acción Inmediata Requerida

1. **Verificar estado de la migración:**
   ```bash
   php artisan migrate:status
   ```

2. **Verificar datos migrados:**
   ```sql
   SELECT COUNT(*) FROM spatie_roles;
   SELECT COUNT(*) FROM spatie_model_has_roles;
   ```

3. **Decidir estrategia:**
   - Si Spatie está completo → Eliminar tablas propias
   - Si hay inconsistencias → Corregir migración

---

**Documento creado por:** Claude  
**Próxima revisión:** Después de decidir estrategia de roles
