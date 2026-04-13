# Politica de commits

Objetivo: mantener trazabilidad clara de TFG y facilitar trabajo en equipo.

## Reglas

- Un commit = un cambio pequeno y concreto.
- Mensajes cortos, naturales y en espanol.
- Evitar mezclar muchos modulos en un mismo commit.
- Commit despues de cada microtarea verificable.

## Formato recomendado

`tipo: cambio breve`

Tipos sugeridos:
- `feat`: nueva funcionalidad
- `fix`: correccion
- `refactor`: mejora sin cambiar comportamiento
- `docs`: documentacion
- `chore`: tarea tecnica

## Ejemplos reales para este proyecto

- `docs: define alcance del MVP`
- `chore: crea esquema base de inventario`
- `feat: agrega categorias iniciales`
- `feat: agrega ubicaciones del laboratorio`
- `feat: endpoint para crear movimientos`
- `fix: bloquea stock negativo en salidas`
- `docs: anade mapeo de importacion excel`

## Recomendacion de ramas

- `main`: estable
- `dev`: integracion
- `feat/nombre-corto`: trabajo por funcionalidad
