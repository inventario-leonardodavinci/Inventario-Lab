# Inventario Laboratorio - Leonardo Da Vinci

Aplicación web para la gestión del inventario del laboratorio de química del IES Leonardo Da Vinci.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React + TypeScript (Vite) |
| Backend | Laravel (API REST) |
| Base de datos | PostgreSQL (Insforge) |
| Autenticación | Insforge Auth |
| Notificaciones | Novu |
| Despliegue | Railway |

## Estructura del proyecto

```
├── backend/api/        Laravel API REST
├── frontend/app/       React + TypeScript SPA
├── docs/               Documentación del proyecto
├── Actas/              Actas de seguimiento
└── docker-compose.yml  Entorno local con Docker
```

## Arranque rápido

### Con Docker

```bash
docker-compose up --build
```

### Manual

**Backend:**
```bash
cd backend/api
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

**Frontend:**
```bash
cd frontend/app
cp .env.example .env
npm install
npm run dev
```

## Documentación

| Documento | Descripción |
|---|---|
| [Anteproyecto](docs/01-anteproyecto-final.md) | Definición del proyecto, participantes y alcance |
| [Plan técnico](docs/02-plan-tecnico.md) | Arquitectura, módulos y decisiones de diseño |
| [Política de commits](docs/03-politica-commits.md) | Convenciones de commits y ramas |
| [Importación Excel](docs/04-importacion-excel.md) | Mapeo y carga de datos iniciales |
| [Checklist equipo](docs/05-checklist-equipo.md) | Estado de tareas por fase y persona |
| [OpenAPI](docs/08-openapi-v1.yaml) | Contrato de la API REST |
| [Checklist despliegue](docs/09-release-hardening-checklist.md) | Verificaciones antes de producción |
| [Integración Novu](docs/10-novu-integration.md) | Configuración de notificaciones |
| [Matriz endpoints](docs/11-matriz-endpoints-pantallas.md) | Mapa endpoint ↔ pantalla ↔ estado |

## Equipo

- **Said Oudrhich** — Base de datos e integración Insforge
- **Mario González** — Frontend
- **César Sánchez** — Backend
