#!/bin/sh
set -e

# Generar APP_KEY si no está definida
if [ -z "$APP_KEY" ]; then
    php artisan key:generate --force
fi

# Crear directorios de storage si no existen
php artisan storage:link --force 2>/dev/null || true

# Limpiar y optimizar caché
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Ejecutar migraciones
php artisan migrate --force

# Arrancar el servidor (nginx + php-fpm via serversideup)
exec /entrypoint.sh
