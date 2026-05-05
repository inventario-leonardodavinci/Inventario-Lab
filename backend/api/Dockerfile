FROM php:8.3-fpm-alpine

WORKDIR /var/www/html

# Instalar dependencias del sistema, nginx y PostgreSQL
RUN apk add --no-cache \
    nginx \
    supervisor \
    curl \
    libpng-dev \
    libzip-dev \
    zip \
    unzip \
    oniguruma-dev \
    libxml2-dev \
    postgresql-dev \
    && docker-php-ext-install \
    pdo_mysql \
    pdo_pgsql \
    pgsql \
    mbstring \
    exif \
    pcntl \
    bcmath \
    gd \
    zip \
    opcache

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copiar configuración de nginx
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/php-fpm.conf /usr/local/etc/php-fpm.d/www.conf

# Copiar manifiestos de dependencias
COPY composer.json composer.lock ./

# Instalar dependencias PHP
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts --prefer-dist \
    || composer update --no-dev --optimize-autoloader --no-interaction --no-scripts --prefer-dist

# Copiar el resto del código
COPY . .

# Regenerar autoload
RUN composer dump-autoload --optimize --classmap-authoritative \
    && php artisan package:discover --ansi

# Configurar permisos
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache

# Script de inicio
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 80

CMD ["/start.sh"]
