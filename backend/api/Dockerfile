FROM serversideup/php:8.3-fpm-nginx

WORKDIR /var/www/html

COPY --chown=www-data:www-data composer.json composer.lock ./

RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts --prefer-dist

COPY --chown=www-data:www-data . .

RUN composer dump-autoload --optimize --classmap-authoritative \
    && php artisan package:discover --ansi

# Copiar entrypoint como root para poder darle permisos
USER root
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# S6 Overlay (el /entrypoint.sh de la imagen base) necesita correr como root
CMD ["/docker-entrypoint.sh"]
