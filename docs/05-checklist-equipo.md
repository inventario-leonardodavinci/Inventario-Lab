# Checklist de ejecucion y reparto de tareas

## Principios de trabajo (Insforge-first)

- Usar Auth nativa de Insforge (no duplicar sistema de login).
- Gestionar base de datos con `npx @insforge/cli db ...`.
- Revisar `npx @insforge/cli metadata` al inicio de cada bloque.
- Commits cortos y concretos en espanol.
- No subir secretos ni `.insforge/project.json` al repositorio.

## Estado actual del proyecto

- [x] Proyecto enlazado con Insforge.
- [x] Esquema base creado en PostgreSQL (Insforge).
- [x] Categorias y ubicaciones semilla cargadas.
- [x] Estructura de items adaptada al Excel de fungibles.
- [x] Soporte para `serial_number` y `expiration_date`.
- [ ] Importacion automatica de los dos Excel.
- [ ] API backend en Laravel.
- [ ] Frontend React + TypeScript.
- [ ] RLS/policies y pruebas end-to-end.

## Fase 1 - Datos y reglas (Said)

- [ ] Validar diccionario de datos final (`items`, `stock_levels`, `movements`).
- [ ] Definir equivalencias completas de ubicacion para los Excel.
- [ ] Crear script de importacion con reporte de errores.
- [ ] Probar importacion en entorno de prueba.
- [ ] Exportar backup inicial (`db export`) antes de cargas masivas.

## Fase 2 - Backend API Laravel (Cesar)

- [ ] Crear proyecto Laravel y estructura por modulos.
- [ ] Configurar conexion a Insforge/PostgreSQL.
- [ ] Implementar CRUD de categorias, ubicaciones e items.
- [ ] Implementar endpoints de movimientos con validacion de stock.
- [ ] Implementar auditoria de acciones clave.
- [ ] Documentar endpoints (coleccion o markdown).

## Fase 3 - Frontend React TS (Mario)

- [ ] Crear proyecto React + TypeScript.
- [ ] Configurar cliente `@insforge/sdk` para Auth y Realtime.
- [ ] Pantalla de inventario (tabla, filtros, formulario alta/edicion).
- [ ] Pantalla de movimientos (entrada, salida, traslado).
- [ ] Vista de historial/logs y alertas de stock.
- [ ] Validaciones de formulario para serie/caducidad.

## Fase 4 - Seguridad y calidad (equipo)

- [ ] Definir permisos por rol (`admin`, `tecnico`, `consulta`).
- [ ] Aplicar RLS/policies en tablas sensibles.
- [ ] Revisar logs y salud con `diagnose` y `logs`.
- [ ] Pruebas funcionales minimas por modulo.
- [ ] Prueba de flujo completo: alta item -> movimiento -> auditoria.

## Fase 5 - Despliegue y entrega (equipo)

- [ ] Configurar variables de entorno en despliegue.
- [ ] Ejecutar build local antes de cada deploy.
- [ ] Desplegar frontend y verificar rutas.
- [ ] Checklist de defensa (demo + casos de uso + limites conocidos).

## Cadencia recomendada

- Reunion corta diaria: 10-15 min.
- Cierre semanal: demo interna + incidencias + decisiones.
- Regla de merge: no mezclar features grandes en un solo commit/PR.
