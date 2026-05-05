FROM serversideup/php:8.3-fpm-nginx

WORKDIR /var/www/html

# Copiar manifiestos de dependencias
COPY --chown=www-data:www-data composer.json composer.lock ./

# Instalar dependencias PHP.
# --no-scripts: los scripts post-install (artisan) se ejecutan después de copiar el código.
# Si composer.lock no incluye sentry (instalación local con SSL roto),
# se actualiza solo ese paquete para que el build no falle.
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts --prefer-dist \
    && (composer show sentry/sentry-laravel > /dev/null 2>&1 || \
        composer require sentry/sentry-laravel --no-dev --no-interaction --no-scripts --prefer-dist --update-no-dev)

# Copiar el resto del código
COPY --chown=www-data:www-data . .

# Regenerar autoload con el código real y descubrir paquetes (incluido Sentry)
RUN composer dump-autoload --optimize --classmap-authoritative \
    && php artisan package:discover --ansi

# Script de arranque: ejecuta migraciones y luego inicia el servidor
COPY --chown=www-data:www-data docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

CMD ["/usr/local/bin/docker-entrypoint.sh"]
