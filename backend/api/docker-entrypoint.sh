#!/bin/sh
set -e

# Ejecutar migraciones en cada arranque (idempotente con --force)
php artisan migrate --force --no-interaction

# Limpiar caché de config por si las variables de entorno cambiaron
php artisan config:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Arrancar el servidor (nginx + php-fpm via serversideup/php)
exec init
