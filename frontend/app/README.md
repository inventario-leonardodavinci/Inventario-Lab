# Frontend — React + TypeScript

SPA del sistema de inventario, construida con React, TypeScript y Vite.

## Requisitos

- Node.js 20+
- npm

## Instalación

```bash
cp .env.example .env
npm install
npm run dev
```

La app queda disponible en `http://localhost:5173`.

## Variables de entorno relevantes

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base del backend Laravel |
| `VITE_INSFORGE_URL` | URL del proyecto Insforge |
| `VITE_INSFORGE_ANON_KEY` | Clave pública de Insforge |

Ver `.env.example` para la lista completa.

## Estructura relevante

```
src/
├── pages/          Vistas principales (una por ruta)
├── components/
│   ├── auth/       Guardas de ruta y formularios de sesión
│   ├── layout/     Shell, barra lateral, notificaciones
│   └── ui/         Componentes base (shadcn/ui)
├── services/       Clientes HTTP por recurso
├── context/        Contextos de autenticación y tema
├── hooks/          Hooks de datos (React Query)
├── stores/         Estado global (Zustand)
├── schemas/        Validaciones Zod
└── types/          Tipos TypeScript compartidos
```

## Comandos útiles

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Lint
npm run lint

# Tests unitarios
npm run test

# Tests E2E
npx playwright test
```
