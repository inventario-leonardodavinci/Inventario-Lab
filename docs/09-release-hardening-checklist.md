# Lista de verificacion de endurecimiento para despliegue

## Seguridad
- [ ] Variables sensibles en `.env` (sin credenciales por defecto en producción).
- [ ] `APP_DEBUG=false` en producción.
- [ ] Limitacion de peticiones activa en `api/v1`.
- [ ] Pruebas de autorización negativa (roles sin permiso) ejecutadas.
- [ ] Validaciones de entrada en endpoints críticos (`inventory`, `movements`, `maintenance`).

## Rendimiento
- [ ] Paginación en servidor activa en listados grandes.
- [ ] Índices críticos revisados en consultas de inventario y alertas.
- [ ] Frontend con carga diferida de páginas (`React.lazy` + `Suspense`).
- [ ] Caché HTTP y base de datos revisados para panel principal.

## Calidad y pruebas
- [ ] Pruebas backend en verde (`php artisan test`).
- [ ] Revision de estilo frontend en verde (`npm run lint`).
- [ ] Compilacion frontend en verde (`npm run build`).
- [ ] Prueba manual de humo: inicio de sesion -> inventario -> movimiento -> alerta -> notificacion.

## Operación y reversión
- [ ] Copia de seguridad de base de datos realizada antes del despliegue.
- [ ] Migraciones aplicadas en orden y verificadas.
- [ ] Seeder de catálogos ejecutado sin duplicados.
- [ ] Plan de reversión definido (revertir version + restaurar copia de seguridad).
