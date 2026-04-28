# Integracion Novu (codigo abierto)

## Objetivo
Notificaciones en la aplicacion por usuario al iniciar sesion y para eventos de alerta.

## Variables del backend
Configurar en `BackEnd/api/.env`:
- `NOVU_API_URL` (por defecto `https://api.novu.co`)
- `NOVU_API_KEY`
- `NOVU_LOGIN_TRIGGER` (por defecto `user-login`)

## Flujo implementado
1. Frontend llama `POST /api/v1/notifications/login-event`.
2. Backend resuelve usuario por `X-Auth-User-Id`.
3. `NovuService` dispara evento en Novu.
4. El usuario ve notificaciones en el panel (`NotificationCenter`).

## Pendientes recomendados para producción
- Canal en aplicacion y correo en Novu con plantillas definitivas.
- Firma/verificacion de callbacks de Novu.
- Cola asincrona para disparo de eventos masivos.
