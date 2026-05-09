# Plan de Auditoría y Limpieza - Inventario Salud Ambiental

## Objetivo
Sanitizar el codebase eliminando código muerto, duplicaciones, archivos huérfanos y consolidando funcionalidades redundantes. Mejorar la mantenibilidad y reducir el bundle size.

---

## 1. FRONTEND - Hooks y Queries

### 1.1 Hooks deprecados a eliminar ✅ COMPLETADO
- [x] **`useInventario` en `queries.ts`**
  - ~~Marcado como `@deprecated` - es un alias de `useArticulos`~~
  - ~~**Solo se usa en:** `usePanelData.ts`~~
  - **Completado:** Reemplazado en `usePanelData.ts` por `useArticulos()` y eliminada la función (commit `312a7ca`)

### 1.2 Funciones duplicadas/consolidables
- [ ] **`extraerCriticos()` en `panelUtils.ts`** vs lógica directa en componentes
  - La API ya devuelve `estado_stock: 'critico' | 'ok'` calculado
  - Filtrar directamente con `articulos.filter(a => a.estado_stock === 'critico')` es más directo
  - **Usado en:** `usePanelData.ts` (línea 35), `PanelPrincipal.tsx`

- [ ] **`mapearAlertas()` en `panelUtils.ts`**
  - Transforma datos para una tabla que ya no existe (tabla de alertas del panel)
  - Verificar si el componente `TablaAlertas` del panel usa esto o tiene su propio mapeo

### 1.3 Query keys huérfanos
- [ ] `queryKeys.notificaciones` - Eliminado en refactor Novu, verificar si queda alguna referencia
- [ ] `queryKeys.alertas` - Aún existe pero solo se usa en página Alertas dedicada (correcto)

---

## 2. FRONTEND - Utilidades

### 2.1 `panelUtils.ts` - Evaluar eliminación completa
- [ ] **`traducirTipoMovimiento()`** - Delega en `formatearTipoMovimiento` del formatters.ts
  - Ya existe `formatearTipoMovimiento` que hace lo mismo
  - Mantener compatibilidad legacy innecesaria (esquema inglés ya no existe)

- [ ] **`formatearKpi()`** - Usado solo en `construirKpiCards`
  - Podría integrarse directamente en el componente o en formatters.ts

- [ ] **`construirKpiCards()`** - Usado en `PanelPrincipal.tsx`
  - Considerar si esta lógica debería estar en el componente o en un hook dedicado

- [ ] **`mapearMovimientosRecientes()`** - Usado en `usePanelData.ts`
  - Transformación simple que podría hacerse inline o en el componente `ListaActividad`

**Recomendación:** Evaluar si `panelUtils.ts` aporta valor o solo añade indirección. Todo su contenido podría:
- Moverse a `formatters.ts` (funciones puras de formateo)
- Integrarse en hooks/components (lógica de mapeo)

### 2.2 `formatters.ts` - Consolidar duplicados
- [ ] **Verificar uso de todas las funciones exportadas**
  - `formatearTipoAlerta` - ¿Se usa?
  - `formatearSeveridad` - ¿Se usa?
  - `formatearEstadoAlerta` - ¿Se usa? (aún existe tabla alertas)
  - `formatearTipoUbicacion` - ¿Se usa?

### 2.3 `apiUtils.ts`
- [ ] **`unwrapData()`** - Verificar si se usa en algún servicio
- [ ] **`buildQueryString()`** - Verificar si los servicios usan esto o construyen manualmente

---

## 3. FRONTEND - Servicios API

### 3.1 Servicios potencialmente huérfanos
- [ ] **`alertasApi.ts`** - ⚠️ **CÓDIGO MUERTO CONFIRMADO**
  - `useAlertas` ya no se usa en página Artículos (eliminado en refactor)
  - **Verificación:** No hay página `/alertas.tsx` ni componentes que usen los hooks de alertas
  - **Solo se usan en:** tests (`queries.test.tsx`) y sus propias definiciones en `queries.ts`
  - **Recomendación:** Eliminar `alertasApi.ts`, hooks relacionados de `queries.ts`, y tests asociados
  - **Nota:** La tabla `alertas` en BD queda como registro histórico (no hay interfaz para consultarla)

- [ ] **`notificacionesApi.ts`** - Parcialmente eliminado
  - Ya eliminamos `getNotificaciones` y tipos relacionados
  - Solo queda `enviarEventoLogin` - verificar que aún se use en `ContextoAutenticacion.tsx`

### 3.2 Consolidar clientes HTTP
- [ ] **`clienteApi.ts`** vs **`insforgeClient.ts`**
  - ¿Ambos se usan?
  - `insforgeClient` se usa para autenticación
  - `apiClient` (clienteApi) se usa para API propia
  - Verificar si hay duplicación de lógica de headers/auth

---

## 4. FRONTEND - Componentes

### 4.1 Componentes huérfanos (verificar existencia)
- [ ] Buscar en `src/components` archivos que nunca se importan
- [ ] Buscar en `src/pages` páginas que no tienen ruta asignada

### 4.2 Componentes con imports muertos
- [ ] **`ArticuloCard.tsx`** - Revisar si usa todas las importaciones
- [ ] **`ArticuloDrawer.tsx`** - Posibles imports no usados de componentes shadcn

### 4.3 Duplicaciones UI
- [ ] **Botones de acción en `ArticuloCard` vs `ArticulosTabla`**
  - Lógica similar de "Entrada/Salida/Traslado" repetida
  - Considerar componente `AccionesArticulo` compartido

---

## 5. FRONTEND - Tipos TypeScript

### 5.1 Tipos no usados en `types/index.ts`
- [ ] Revisar si todos los tipos exportados se usan en algún lugar
- [ ] Eliminar tipos legacy del esquema inglés (status, movement_type, etc.) si ya no se usan

### 5.2 Interfaces duplicadas
- [ ] `FilaInventarioItem` en `panelUtils.ts` vs tipo `Articulo` en `types/index.ts`
  - Son el mismo concepto con nombres diferentes

---

## 6. BACKEND - API Routes

### 6.1 Rutas definidas pero huérfanas
Verificar si estas rutas tienen controller implementado y se usan:
- [ ] `/api/v1/alertas` - ¿Hay frontend que consuma esto ahora?
- [ ] `/api/v1/informes` - ¿Existe? ¿Se usa?
- [ ] `/api/v1/dashboard` - ¿Existe? ¿Se usa?

### 6.2 Controllers con métodos huérfanos
- [ ] **`AlertaController`** - ¿Todos los métodos se usan?
  - `index` - ¿Se usa en alguna página?
  - `show` - ¿Se usa?
  - `store` - ¿Se crean alertas manualmente o son automáticas?
  - `update/destroy` - ¿Se usan?

---

## 7. BACKEND - Modelos

### 7.1 Relaciones no usadas
- [ ] Verificar si todos los `belongsTo`, `hasMany` del esquema se usan
- [ ] Eliminar relaciones huérfanas que generan queries N+1 innecesarias

### 7.2 Scopes locales no usados
- [ ] Eliminar scopes de modelo que nunca se llaman

---

## 8. BASE DE DATOS

### 8.1 Tablas potencialmente huérfanas
- [ ] **`alertas`** - ¿Se usa o todo se maneja por `estado_stock` en artículos?
  - Si no hay página dedicada de alertas, la tabla puede estar obsoleta
  - Verificar triggers que generan alertas automáticamente

- [ ] **`historial_sesiones`** - ¿Se consulta en algún lugar?
  - La insertamos en cada login pero ¿se lee?

### 8.2 Columnas no usadas
- [ ] Revisar migraciones y eliminar columnas que nunca se consultan

---

## 9. CONFIGURACIÓN Y DEPENDENCIAS

### 9.1 Dependencias npm no usadas
- [ ] `@novu/react` - Ya eliminado ✓
- [ ] Revisar `package.json` completo con `depcheck`

### 9.2 Variables de entorno obsoletas
- [ ] Eliminar de `.env.example` y documentación:
  - `VITE_NOVU_APPLICATION_IDENTIFIER` - Ya eliminado ✓
  - `NOVU_*` del backend - Ya eliminado ✓

### 9.3 Scripts y utilidades de build
- [ ] Revisar si hay scripts en `package.json` que no se usan
- [ ] Eliminar configuraciones de herramientas no usadas

---

## 10. DOCUMENTACIÓN

### 10.1 Documentos obsoletos
- [ ] `docs/10-novu-integration.md` - Ya eliminado ✓
- [ ] Revisar otros docs si referencian funcionalidades eliminadas

### 10.2 README desactualizado
- [ ] Actualizar stack y características si han cambiado

---

## Plan de Ejecución Recomendado

### Fase 1: Código seguro (sin riesgo)
1. Eliminar imports no usados
2. Eliminar comentarios muertos (TODO resueltos, código comentado)
3. Consolidar funciones de formateo duplicadas

### Fase 2: Refactorización con verificación
1. Reemplazar `useInventario` por `useArticulos`
2. Evaluar eliminación de `panelUtils.ts`
3. Consolidar duplicados en `formatters.ts`

### Fase 3: Eliminación de funcionalidades
1. Verificar uso real de `alertasApi.ts` y eliminar si no se usa
2. Limpiar componentes huérfanos
3. Auditar tablas BD y eliminar si están obsoletas

### Fase 4: Dependencias
1. Ejecutar `depcheck` o similar
2. Limpiar `package.json`
3. Actualizar lockfiles

---

## Métricas de Éxito

- [ ] Build pasa sin errores ni warnings
- [ ] Bundle size reducido (comparar antes/después)
- [ ] Tests (si existen) pasan
- [ ] No hay imports no resueltos
- [ ] No hay exports no usados

---

## Notas

**Prioridad alta:**
- `useInventario` deprecation
- `panelUtils.ts` evaluación
- `alertasApi.ts` verificación de uso

**Riesgo medio:**
- Eliminación de tablas BD (requiere migración)
- Consolidación de tipos TypeScript

**Prioridad baja:**
- Limpieza de documentación
- Optimización de imports
