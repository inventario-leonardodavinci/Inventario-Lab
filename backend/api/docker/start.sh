#!/bin/sh
# No usar set -e para permitir manejo de errores manual

echo "=========================================="
echo "Starting Laravel Application"
echo "=========================================="

# Crear usuario www-data si no existe (Alpine no lo tiene por defecto)
if ! id -u www-data > /dev/null 2>&1; then
    adduser -D -S -G www-data www-data 2>/dev/null || adduser -D -S www-data 2>/dev/null || echo "www-data user setup skipped"
fi

# Crear directorios de Laravel si no existen
mkdir -p /var/www/html/storage/framework/cache/data
mkdir -p /var/www/html/storage/framework/sessions
mkdir -p /var/www/html/storage/framework/views
mkdir -p /var/www/html/storage/logs
mkdir -p /var/www/html/bootstrap/cache
mkdir -p /var/log/nginx

# Configurar permisos
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache 2>/dev/null || chown -R 1000:1000 /var/www/html/storage /var/www/html/bootstrap/cache 2>/dev/null || echo "Permissions setup skipped"
chmod -R 755 /var/www/html/storage /var/www/html/bootstrap/cache

# Generar APP_KEY si no está configurado
if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "" ]; then
    echo "Generating APP_KEY..."
    php artisan key:generate --show 2>/dev/null || echo "APP_KEY generation skipped"
fi

# Configurar caché (no bloqueante)
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

# Generar nginx.conf con el PORT correcto de Railway
echo "Setting up nginx with PORT=${PORT:-80}..."
export PORT=${PORT:-80}
envsubst '${PORT}' < /etc/nginx/nginx.conf > /tmp/nginx.conf && mv /tmp/nginx.conf /etc/nginx/nginx.conf

# Probar configuración de nginx
echo "Testing nginx configuration..."
nginx -t 2>&1 || echo "Nginx config test failed but continuing..."

# Iniciar PHP-FPM en background
echo "Starting PHP-FPM..."
php-fpm -D 2>&1 || { echo "PHP-FPM failed to start"; exit 1; }

# Verificar que PHP-FPM está corriendo
sleep 2
if ! pgrep php-fpm > /dev/null; then
    echo "ERROR: PHP-FPM is not running"
    exit 1
fi
echo "PHP-FPM is running"

# Iniciar nginx en foreground
echo "Starting Nginx..."
exec nginx -g 'daemon off;'

