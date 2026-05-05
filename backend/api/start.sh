#!/bin/sh
# Entrypoint script para Railway
# Ejecuta migraciones y luego inicia nginx + php-fpm

echo "=========================================="
echo "Starting Laravel Application Setup"
echo "=========================================="

# Esperar a que la base de datos esté disponible (máximo 30 segundos)
echo "Waiting for database..."
for i in 1 2 3 4 5 6; do
    php artisan db:show > /dev/null 2>&1 && break
    echo "Database not ready, retrying... ($i/6)"
    sleep 5
done

# Ejecutar migraciones
echo "Running migrations..."
php artisan migrate --force --no-interaction 2>/dev/null || echo "Migrations failed or DB not ready"

# Configurar caché
echo "Caching configuration..."
php artisan config:clear 2>/dev/null || true
php artisan config:cache 2>/dev/null || true
php artisan route:cache 2>/dev/null || true
php artisan view:cache 2>/dev/null || true

echo "=========================================="
echo "Setup complete, starting services..."
echo "=========================================="

# Iniciar php-fpm en background
php-fpm -D

# Iniciar nginx en foreground (así el contenedor no termina)
nginx -g 'daemon off;'
