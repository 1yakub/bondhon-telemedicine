# syntax=docker/dockerfile:1.7
# Bondhon API image: Laravel 13 on serversideup/php (nginx + php-fpm, www-data, health check,
# Laravel automations at boot). Dependencies build on the builder platform, no emulation.
ARG PHP_VERSION=8.4

FROM --platform=$BUILDPLATFORM serversideup/php:${PHP_VERSION}-cli AS vendor
USER root
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --no-progress --no-scripts --prefer-dist --optimize-autoloader
COPY . .
RUN mkdir -p bootstrap/cache storage/logs storage/framework/cache storage/framework/sessions storage/framework/views \
    && composer dump-autoload --no-dev --optimize --classmap-authoritative

FROM serversideup/php:${PHP_VERSION}-fpm-nginx AS runtime
ENV AUTORUN_ENABLED=true \
    AUTORUN_LARAVEL_MIGRATION=true \
    AUTORUN_LARAVEL_STORAGE_LINK=false \
    PHP_OPCACHE_ENABLE=1 \
    SSL_MODE=off \
    LOG_CHANNEL=stderr
USER root
COPY --chown=www-data:www-data --from=vendor /app /var/www/html
RUN rm -rf /var/www/html/tests /var/www/html/node_modules \
    && chmod -R ug+rwX /var/www/html/storage /var/www/html/bootstrap/cache
USER www-data
