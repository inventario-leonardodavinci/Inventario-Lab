# Control de Acceso por Roles — Inventario Salud Ambiental

> Documento generado mediante análisis del código fuente.
> Fuentes: `routes/api.php` (backend Laravel) + componentes frontend React.

---

## Roles del sistema

| Rol interno | Alias legado | Descripción |
|---|---|---|
| `administrador` | `admin` | Control total del sistema |
| `profesor` | `tecnico` | Gestión operativa del inventario |
| `consultor` | `consulta` | Solo lectura |

Los alias legados (`admin`, `tecnico`, `consulta`) se mapean en `GuardRol.tsx` para compatibilidad.
El rol se obtiene de la tabla `usuario_roles` + `roles` del backend (no de Spatie).

---

## Protección real por capa

```
FRONTEND (UI)                    BACKEND (API) ← ÚNICA PROTECCIÓN REAL
─────────────────────────────    ──────────────────────────────────────
GuardRol     → oculta elementos  middleware 'role:xxx' → devuelve 403
esAdmin      → bloquea página    middleware 'app.user'  → verifica sesión
RutaProteg.  → requiere login    middleware 'throttle'  → limita llamadas
```

> **Principio fundamental:** La UI solo mejora la UX ocultando elementos. La **única protección real** es el middleware `role:` del backend. Si alguien llama la API directamente sin permiso, recibe un **HTTP 403**.

---

## Tabla de permisos completa

### `/articulos` — Inventario de Artículos

| Acción | Frontend | Backend | administrador | profesor | consultor |
|---|---|---|:---:|:---:|:---:|
| Ver listado | — | `GET /articulos` (libre) | ✅ | ✅ | ✅ |
| Ver detalle | — | `GET /articulos/{id}` (libre) | ✅ | ✅ | ✅ |
| **Crear artículo** | sin guard | `POST /articulos` → `role:administrador,profesor` | ✅ | ✅ | ❌ 403 |
| **Editar artículo** | sin guard | `PATCH /articulos/{id}` → `role:administrador,profesor` | ✅ | ✅ | ❌ 403 |
| **Eliminar artículo** | sin guard | `DELETE /articulos/{id}` → `role:administrador` | ✅ | ❌ 403 | ❌ 403 |
| **Registrar movimiento** | sin guard | `POST /movimientos` → `role:administrador,profesor` | ✅ | ✅ | ❌ 403 |
| Ver movimientos | — | `GET /movimientos` (libre) | ✅ | ✅ | ✅ |

> ⚠️ **Gap de UI:** El frontend de `/articulos` no tiene `GuardRol` ni `esAdmin`. Los botones de crear/editar/movimiento son visibles para todos los roles, pero el backend devolverá 403 al `consultor`. **Se recomienda ocultar estos controles en el frontend** para mejorar la UX.

---

### `/categorias` — Categorías

| Acción | Frontend | Backend | administrador | profesor | consultor |
|---|---|---|:---:|:---:|:---:|
| Ver listado | — | `GET /categorias` (libre) | ✅ | ✅ | ✅ |
| **Crear categoría** | `GuardRol:administrador` | `POST /categorias` → `role:administrador` | ✅ | ❌ oculto + 403 | ❌ oculto + 403 |
| **Editar categoría** | `GuardRol:administrador` | `PATCH /categorias/{id}` → `role:administrador` | ✅ | ❌ oculto + 403 | ❌ oculto + 403 |
| **Eliminar categoría** | `GuardRol:administrador` | `DELETE /categorias/{id}` → `role:administrador` | ✅ | ❌ oculto + 403 | ❌ oculto + 403 |

> ✅ **Doble protección correcta** (UI oculta + API rechaza).

---

### `/ubicaciones` — Ubicaciones

| Acción | Frontend | Backend | administrador | profesor | consultor |
|---|---|---|:---:|:---:|:---:|
| Ver listado | — | `GET /ubicaciones` (libre) | ✅ | ✅ | ✅ |
| **Crear ubicación** | `GuardRol:administrador` | `POST /ubicaciones` → `role:administrador` | ✅ | ❌ oculto + 403 | ❌ oculto + 403 |
| **Editar ubicación** | sin guard | `PATCH /ubicaciones/{id}` → `role:administrador` | ✅ | ❌ 403 | ❌ 403 |

> ⚠️ **Gap menor de UI:** El botón de editar ubicación no tiene `GuardRol` en el frontend, pero el backend lo protege.

---

### `/mantenimiento` — Activos de Mantenimiento

| Acción | Frontend | Backend | administrador | profesor | consultor |
|---|---|---|:---:|:---:|:---:|
| Ver activos | — | `GET /mantenimiento/activos` (libre) | ✅ | ✅ | ✅ |
| **Crear activo** | sin guard | `POST /mantenimiento/activos` → `role:administrador,profesor` | ✅ | ✅ | ❌ 403 |
| **Actualizar estado** | sin guard | `PATCH /mantenimiento/activos/{id}` → `role:administrador,profesor` | ✅ | ✅ | ❌ 403 |

> ⚠️ **Gap de UI:** Los botones de crear/editar son visibles para `consultor` pero la API devuelve 403. Mejorar UX con `GuardRol`.

---

### `/usuarios` — Gestión de Usuarios

| Acción | Frontend | Backend | administrador | profesor | consultor |
|---|---|---|:---:|:---:|:---:|
| **Acceder a la página** | `esAdmin` check | — | ✅ | ❌ bloqueado | ❌ bloqueado |
| **Ver lista de usuarios** | — | `GET /usuarios` → `role:administrador` | ✅ | ❌ 403 | ❌ 403 |
| **Cambiar rol** | — | `PATCH /usuarios/{id}/rol` → `role:administrador` | ✅ | ❌ 403 | ❌ 403 |
| **Activar/desactivar** | — | `PATCH /usuarios/{id}/estado` → `role:administrador` | ✅ | ❌ 403 | ❌ 403 |
| **Eliminar usuario** | — | `DELETE /usuarios/{id}` → `role:administrador` | ✅ | ❌ 403 | ❌ 403 |

> ✅ Doble protección. El enlace del sidebar también está dentro de `<GuardRol roles={['administrador']}>`.

---

### `/auditoria` — Auditoría del Sistema

| Acción | Frontend | Backend | administrador | profesor | consultor |
|---|---|---|:---:|:---:|:---:|
| **Acceder a la página** | `esAdmin` check | — | ✅ | ❌ bloqueado | ❌ bloqueado |
| **Ver registros** | — | `GET /auditoria` → `role:administrador` | ✅ | ❌ 403 | ❌ 403 |

> ✅ Triple protección: link de sidebar oculto + página bloqueada + API rechaza.

---

### `/perfil` — Perfil de Usuario

| Acción | Backend | administrador | profesor | consultor |
|---|---|:---:|:---:|:---:|
| Ver perfil | `GET /perfil` (libre) | ✅ | ✅ | ✅ |
| Editar perfil | `PATCH /perfil` (libre) | ✅ | ✅ | ✅ |
| Ver historial sesiones | `GET /perfil/historial-sesiones` (libre) | ✅ | ✅ | ✅ |
| Cerrar sesión remota | `DELETE /perfil/sesiones/{id}` (libre) | ✅ | ✅ | ✅ |

> El perfil es libre para todos los usuarios autenticados (solo requiere sesión válida).

---

### `/` — Panel Principal

| Acción | Backend | administrador | profesor | consultor |
|---|---|:---:|:---:|:---:|
| Ver KPIs | `GET /articulos` + `GET /categorias` + `GET /ubicaciones` (libres) | ✅ | ✅ | ✅ |
| Ver stock crítico | `GET /articulos` (libre) | ✅ | ✅ | ✅ |
| Ver actividad reciente | `GET /movimientos` (libre) | ✅ | ✅ | ✅ |

---

## Visibilidad del Sidebar

| Enlace | administrador | profesor | consultor |
|---|:---:|:---:|:---:|
| Panel | ✅ | ✅ | ✅ |
| Artículos | ✅ | ✅ | ✅ |
| Categorías | ✅ | ✅ | ✅ |
| Ubicaciones | ✅ | ✅ | ✅ |
| Mantenimiento | ✅ | ✅ | ✅ |
| **Auditoría** | ✅ | ❌ oculto | ❌ oculto |
| **Usuarios** | ✅ | ❌ oculto | ❌ oculto |

---

## Resumen de gaps detectados

### 🔴 Gap de UX (no de seguridad — el backend protege correctamente)

| Página | Problema | Solución |
|---|---|---|
| `/articulos` | Botones crear/editar/movimiento visibles para `consultor` | Añadir `GuardRol` en los botones de acción |
| `/mantenimiento` | Botones crear/editar visibles para `consultor` | Añadir `GuardRol` en botones |
| `/ubicaciones` | Botón editar visible para `profesor` y `consultor` | Añadir `GuardRol` en botón editar |

### 🟡 Inconsistencia de tipos

El tipo `Rol` en `types/index.ts` solo incluye `'administrador' | 'profesor' | 'consultor'`,
pero `SesionUsuario.role` en `authApi.ts` incluye también `'admin' | 'tecnico' | 'consulta'`.
El componente `GuardRol` maneja el mapeo. Sin embargo, cualquier comparación directa
(`user.role === 'administrador'`) puede fallar si el usuario tiene el rol legado `'admin'`.

**Afectados:** `Auditoria.tsx` y `Usuarios.tsx` usan `user?.role === 'admin' || user?.role === 'administrador'` — correcto.

---

## Checklist de verificación manual

### Con usuario `administrador`
- [ ] Crear artículo → debe funcionar
- [ ] Editar artículo → debe funcionar
- [ ] Eliminar artículo → debe funcionar
- [ ] Registrar entrada/salida/traslado/ajuste → debe funcionar
- [ ] Crear/editar/eliminar categoría → debe funcionar (botón visible)
- [ ] Crear/editar ubicación → debe funcionar (botón visible)
- [ ] Acceder a `/auditoria` → debe mostrar registros
- [ ] Acceder a `/usuarios` → debe mostrar lista de usuarios
- [ ] Cambiar rol de usuario → debe funcionar
- [ ] Crear activo de mantenimiento → debe funcionar

### Con usuario `profesor`
- [ ] Ver artículos, categorías, ubicaciones → ✅ debe funcionar
- [ ] Crear artículo → debe funcionar (backend: `role:administrador,profesor`)
- [ ] Eliminar artículo → debe devolver error 403
- [ ] Registrar movimiento → debe funcionar
- [ ] Intentar crear categoría vía API directa → debe devolver 403
- [ ] Acceder a `/auditoria` → debe mostrar pantalla "Acceso restringido"
- [ ] Acceder a `/usuarios` → debe mostrar pantalla "Acceso restringido"
- [ ] Crear activo de mantenimiento → debe funcionar

### Con usuario `consultor`
- [ ] Ver panel, artículos, categorías, ubicaciones → ✅ debe funcionar
- [ ] Intentar crear artículo (si ve el botón) → debe devolver 403
- [ ] Intentar registrar movimiento → debe devolver 403
- [ ] Intentar crear activo → debe devolver 403
- [ ] Acceder a `/auditoria` → debe mostrar pantalla "Acceso restringido"
- [ ] Acceder a `/usuarios` → debe mostrar pantalla "Acceso restringido"
- [ ] Ver perfil propio → ✅ debe funcionar
- [ ] Cambiar su propia contraseña → ✅ debe funcionar
