# Backend — Laravel API REST

API REST del sistema de inventario, construida con Laravel y conectada a PostgreSQL en Insforge.

## Requisitos

- PHP 8.2+
- Composer
- PostgreSQL (o conexión a Insforge)

## Instalación

```bash
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

La API queda disponible en `http://localhost:8000`.

## Variables de entorno relevantes

| Variable | Descripción |
|---|---|
| `DB_HOST` / `DB_PORT` / `DB_DATABASE` | Conexión PostgreSQL |
| `DB_USERNAME` / `DB_PASSWORD` | Credenciales BD |
| `INSFORGE_URL` | URL del proyecto Insforge |
| `NOVU_API_KEY` / `NOVU_API_URL` | Notificaciones Novu |

Ver `.env.example` para la lista completa.

## Estructura relevante

```
app/
├── Http/Controllers/Api/   Controladores por recurso
├── Http/Middleware/        Autenticación y roles
├── Models/                 Modelos Eloquent
├── Services/               Lógica de negocio
└── Jobs/                   Tareas en cola

database/
├── migrations/             Migraciones en orden cronológico
└── seeders/                Datos iniciales (catálogos y roles)

routes/
└── api.php                 Definición de rutas
```

## Comandos útiles

```bash
# Ejecutar tests
php artisan test

# Limpiar caché
php artisan optimize:clear

# Ver rutas registradas
php artisan route:list --path=api
```

## Contrato API

Ver [`docs/08-openapi-v1.yaml`](../../docs/08-openapi-v1.yaml) en la raíz del proyecto.
