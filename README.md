# Inventario Laboratorio - Leonardo Da Vinci

Aplicacion web para la gestion de inventario del laboratorio de quimica.

## Stack acordado

- Frontend: React + TypeScript
- Backend: Laravel (version actual)
- Base de datos: PostgreSQL gestionada en Insforge

## Objetivo del MVP

- Inventariar materiales, equipos y reactivos.
- Registrar entradas, salidas y traslados.
- Mantener trazabilidad completa de movimientos.
- Cargar datos iniciales desde Excel.

## Datos iniciales confirmados

- Excel de partida:
  - `Inventario Material fungible laboratorio.xlsx`
  - `Medios cultivo L201.xlsx`
- Categorias:
  - `Medios de cultivo`
  - `Fungibles`
  - `Reactivos quimicos`
  - `Inventariables`
- Ubicaciones:
  - `Armario alto 1` a `Armario alto 7`
  - `Armario bajo 1` a `Armario bajo 7`
  - `Nevera 1`
  - `Cajonera 1`
  - `Cajonera 2`
  - `Almacen`

## Documentacion del proyecto

- `docs/01-anteproyecto-final.md`
- `docs/02-plan-tecnico.md`
- `docs/03-politica-commits.md`
- `docs/04-importacion-excel.md`
- `docs/05-checklist-equipo.md`
- `docs/06-matriz-cambios-bd.md`
- `docs/07-bd-operacion-mcp-checklist.md`
- `docs/08-openapi-v1.yaml`
- `docs/09-release-hardening-checklist.md`
- `docs/10-novu-integration.md`
- `docs/11-matriz-endpoints-pantallas.md`
- `docs/12-convencion-idioma-es.md`
- `docs/13-inventario-espanolizacion.md`
- `docs/14-reporte-cierre-espanolizacion.md`
- `database/sql/001_base_schema.sql`

## Siguiente paso recomendado

1. Frontend listo en `FrontEnd/app` (React + TS + dependencias).
2. Backend base en `BackEnd/api` (Laravel skeleton).
3. Completar `composer install` en backend cuando se resuelva SSL local.
4. Aplicar SQL versionado: `001`, `005`, `006`, `007`.
5. Ejecutar migraciones Laravel y `InventoryCatalogSeeder`.
6. Preparar importacion inicial de los dos Excel.

## Preparacion local rapida

- Ejecutar script de preparación:
  - `.\setup-dev.ps1`
- Opciones:
  - `.\setup-dev.ps1 -OmitirFrontend`
  - `.\setup-dev.ps1 -OmitirBackend`

## Estado de Insforge

- Proyecto enlazado por CLI.
- Metadatos del backend accesibles.
- Esquema base creado en la base de datos.
