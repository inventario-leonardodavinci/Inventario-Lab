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
- `database/sql/001_base_schema.sql`

## Siguiente paso recomendado

1. Crear backend Laravel y frontend React.
2. Aplicar el esquema SQL base en Insforge.
3. Preparar importacion inicial de los dos Excel.

## Estado de Insforge

- Proyecto enlazado por CLI.
- Metadatos del backend accesibles.
- Esquema base creado en la base de datos.
