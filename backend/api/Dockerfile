FROM serversideup/php:8.3-fpm-nginx

WORKDIR /var/www/html

# Instalar dependencias primero (capa cacheada)
COPY --chown=www-data:www-data composer.json composer.lock ./

RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts --prefer-dist

# Copiar el resto del código
COPY --chown=www-data:www-data . .

# Ejecutar scripts post-autoload y optimizar
RUN composer dump-autoload --optimize --classmap-authoritative \
    && php artisan package:discover --ansi \
    && php artisan optimize:clear

# Copiar entrypoint personalizado
COPY --chown=root:root docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 8080

CMD ["/docker-entrypoint.sh"]
