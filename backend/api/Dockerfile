FROM serversideup/php:8.3-fpm-nginx

WORKDIR /var/www/html

# Copiar manifiestos de dependencias
COPY --chown=www-data:www-data composer.json composer.lock ./

# Instalar dependencias PHP.
# --no-dev: sin dependencias de desarrollo en producción.
# --no-update: respetar versiones del lock file para los paquetes existentes.
# Si el lock está desincronizado con composer.json (p.ej. sentry añadido manualmente),
# --no-update falla — usamos install sin lock para resolver todo desde composer.json.
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts --prefer-dist \
    || composer update --no-dev --optimize-autoloader --no-interaction --no-scripts --prefer-dist

# Copiar el resto del código
COPY --chown=www-data:www-data . .

# Regenerar autoload con el código real y descubrir paquetes (incluido Sentry)
RUN composer dump-autoload --optimize --classmap-authoritative \
    && php artisan package:discover --ansi

# Script de arranque: ejecuta migraciones y luego inicia el servidor
COPY --chown=www-data:www-data docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

CMD ["/usr/local/bin/docker-entrypoint.sh"]
