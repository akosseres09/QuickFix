FROM php:8.2-apache-bullseye

ADD https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions /usr/local/bin/

RUN chmod +x /usr/local/bin/install-php-extensions && \
    IPE_GD_WITHOUTAVIF=1 install-php-extensions gd

RUN install-php-extensions bz2 gnupg imagick intl mcrypt memcached pdo_pgsql soap xdebug-stable

RUN apt-get update && apt-get install git unzip wget apache2 supervisor -y --no-install-recommends && \
apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=composer:latest /usr/bin/composer /usr/local/bin/composer

WORKDIR /var/www/html

RUN a2enmod rewrite