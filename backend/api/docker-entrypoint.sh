#!/bin/sh
set -e

# Script de inicialización para s6-overlay (ejecutado antes de nginx/php-fpm)
# Ver: https://github.com/serversideup/docker-php

echo "Running Laravel migrations..."
php artisan migrate --force --no-interaction || echo "Migrations skipped (DB may not be ready yet)"

echo "Caching Laravel config/routes/views..."
php artisan config:clear 2>/dev/null || true
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

echo "Laravel initialization complete."
