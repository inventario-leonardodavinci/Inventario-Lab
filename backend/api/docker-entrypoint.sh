#!/bin/sh
# No usar set -e - s6-overlay necesita que este script siempre termine exitosamente
# para poder iniciar los servicios (nginx/php-fpm)

# Script de inicialización para s6-overlay (ejecutado antes de nginx/php-fpm)
# Ver: https://github.com/serversideup/docker-php

echo "Running Laravel migrations..."
php artisan migrate --force --no-interaction 2>/dev/null || echo "Migrations skipped (DB may not be ready yet)"

echo "Caching Laravel config/routes/views..."
php artisan config:clear 2>/dev/null || true
php artisan config:cache 2>/dev/null || true
php artisan route:cache 2>/dev/null || true
php artisan view:cache 2>/dev/null || true

echo "Laravel initialization complete."
exit 0
