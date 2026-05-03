FROM serversideup/php:8.3-fpm-nginx

WORKDIR /var/www/html

COPY --chown=www-data:www-data composer.json composer.lock ./

RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts --prefer-dist

COPY --chown=www-data:www-data . .

RUN composer dump-autoload --optimize --classmap-authoritative \
    && php artisan optimize:clear

EXPOSE 8080
