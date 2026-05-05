#!/bin/sh
set -e

# Ejecutar migraciones en cada arranque (no bloqueante para evitar que falle el healthcheck)
php artisan migrate --force --no-interaction || echo "Migrations failed, continuing anyway..."

# Limpiar caché de config por si las variables de entorno cambiaron
php artisan config:clear || true
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

# Arrancar el servidor (nginx + php-fpm via serversideup/php)
exec /init
