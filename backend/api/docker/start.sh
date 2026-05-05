#!/bin/sh
set -e

echo "=========================================="
echo "Starting Laravel Application"
echo "=========================================="

# Crear directorios de Laravel si no existen
mkdir -p /var/www/html/storage/framework/cache/data
mkdir -p /var/www/html/storage/framework/sessions
mkdir -p /var/www/html/storage/framework/views
mkdir -p /var/www/html/storage/logs
mkdir -p /var/www/html/bootstrap/cache
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 755 /var/www/html/storage /var/www/html/bootstrap/cache

# Generar APP_KEY si no está configurado
if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "" ]; then
    echo "Generating APP_KEY..."
    export APP_KEY=$(php artisan key:generate --show)
fi

# Configurar caché (sin DB - solo filesystem)
echo "Caching configuration..."
php artisan config:cache 2>/dev/null || echo "Config cache skipped"
php artisan route:cache 2>/dev/null || echo "Route cache skipped"
php artisan view:cache 2>/dev/null || echo "View cache skipped"

# Ejecutar migraciones si la DB está disponible (no bloqueante)
echo "Running migrations..."
php artisan migrate --force --no-interaction 2>/dev/null || echo "Migrations skipped (DB not ready)"

echo "=========================================="
echo "Starting services..."
echo "=========================================="

# Iniciar PHP-FPM en background
php-fpm -D

# Esperar a que PHP-FPM esté listo
sleep 2

# Iniciar nginx en foreground (así el contenedor no termina)
exec nginx -g 'daemon off;'
