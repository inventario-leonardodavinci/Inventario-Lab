FROM serversideup/php:8.3-fpm-nginx AS base

WORKDIR /var/www/html

COPY --chown=www-data:www-data backend/api/composer.json backend/api/composer.lock ./

RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts --prefer-dist

COPY --chown=www-data:www-data backend/api/ .

RUN composer dump-autoload --optimize --classmap-authoritative \
    && php artisan optimize:clear

EXPOSE 8080
