# BackEnd (Laravel API)

Base Laravel clonada en `BackEnd/api`.

## Estado actual

- Estructura Laravel disponible en `BackEnd/api`.
- Dependencias Node del backend instaladas (`npm install`).
- Dependencias PHP (`vendor`) pendientes por un problema SSL local de Composer.

## Arranque recomendado del equipo

1. `cd BackEnd/api`
2. Resolver SSL de Composer o usar entorno con Composer funcional.
3. Ejecutar `composer install`.
4. Copiar `.env.example` a `.env`.
5. Ejecutar `php artisan key:generate`.

## Carpetas principales en `BackEnd/api`

- `app/` logica de negocio y controladores.
- `routes/` rutas API.
- `database/` migraciones, seeders y factories.
- `tests/` pruebas backend.
- `config/` configuracion de la aplicacion.
