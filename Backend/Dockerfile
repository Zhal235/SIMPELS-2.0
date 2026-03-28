FROM php:8.2-fpm-alpine

# Install system dependencies + nginx + supervisor + nodejs
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libxml2-dev \
    libzip-dev \
    zip \
    unzip \
    icu-dev \
    oniguruma-dev \
    nginx \
    supervisor \
    nodejs \
    npm

# Configure GD with freetype + jpeg support
RUN docker-php-ext-configure gd --with-freetype --with-jpeg

# Install PHP extensions (tokenizer, mbstring, xml sudah built-in di php:8.2-fpm-alpine)
RUN docker-php-ext-install \
    pdo \
    pdo_mysql \
    bcmath \
    zip \
    intl \
    gd

# Enable opcache (sudah ada, cukup enable)
RUN docker-php-ext-enable opcache

# Install Redis PHP extension
RUN pecl install redis && docker-php-ext-enable redis

# Configure OPcache for production
RUN { \
    echo 'opcache.enable=1'; \
    echo 'opcache.memory_consumption=128'; \
    echo 'opcache.interned_strings_buffer=8'; \
    echo 'opcache.max_accelerated_files=4000'; \
    echo 'opcache.revalidate_freq=60'; \
    echo 'opcache.fast_shutdown=1'; \
    echo 'opcache.validate_timestamps=0'; \
} >> /usr/local/etc/php/conf.d/opcache.ini

# PHP-FPM: listen on unix socket + tuning
RUN { \
    echo '[www]'; \
    echo 'listen = /run/php-fpm.sock'; \
    echo 'listen.owner = nginx'; \
    echo 'listen.group = nginx'; \
    echo 'listen.mode = 0660'; \
    echo 'pm = dynamic'; \
    echo 'pm.max_children = 20'; \
    echo 'pm.start_servers = 5'; \
    echo 'pm.min_spare_servers = 3'; \
    echo 'pm.max_spare_servers = 10'; \
    echo 'pm.max_requests = 500'; \
    echo 'clear_env = no'; \
} > /usr/local/etc/php-fpm.d/www.conf

# Nginx config for Laravel
RUN mkdir -p /run/nginx && { \
    echo 'server {'; \
    echo '    listen 80 default_server;'; \
    echo '    root /var/www/public;'; \
    echo '    index index.php;'; \
    echo '    client_max_body_size 50M;'; \
    echo '    location / {'; \
    echo '        try_files $uri $uri/ /index.php?$query_string;'; \
    echo '    }'; \
    echo '    location ~ \.php$ {'; \
    echo '        fastcgi_pass unix:/run/php-fpm.sock;'; \
    echo '        fastcgi_index index.php;'; \
    echo '        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;'; \
    echo '        include fastcgi_params;'; \
    echo '        fastcgi_read_timeout 300;'; \
    echo '        fastcgi_buffers 16 16k;'; \
    echo '        fastcgi_buffer_size 32k;'; \
    echo '    }'; \
    echo '    location ~ /\.ht { deny all; }'; \
    echo '}'; \
} > /etc/nginx/http.d/default.conf

# Supervisor config
RUN mkdir -p /etc/supervisor.d && { \
    echo '[supervisord]'; \
    echo 'nodaemon=true'; \
    echo 'logfile=/dev/null'; \
    echo 'logfile_maxbytes=0'; \
    echo 'user=root'; \
    echo ''; \
    echo '[program:php-fpm]'; \
    echo 'command=php-fpm -F'; \
    echo 'autostart=true'; \
    echo 'autorestart=true'; \
    echo 'stdout_logfile=/dev/stdout'; \
    echo 'stdout_logfile_maxbytes=0'; \
    echo 'stderr_logfile=/dev/stderr'; \
    echo 'stderr_logfile_maxbytes=0'; \
    echo ''; \
    echo '[program:nginx]'; \
    echo 'command=nginx -g "daemon off;"'; \
    echo 'autostart=true'; \
    echo 'autorestart=true'; \
    echo 'stdout_logfile=/dev/stdout'; \
    echo 'stdout_logfile_maxbytes=0'; \
    echo 'stderr_logfile=/dev/stderr'; \
    echo 'stderr_logfile_maxbytes=0'; \
    echo ''; \
    echo '[program:queue]'; \
    echo 'command=php /var/www/artisan queue:work --queue=default --tries=3 --timeout=30 --sleep=3'; \
    echo 'directory=/var/www'; \
    echo 'autostart=true'; \
    echo 'autorestart=true'; \
    echo 'stdout_logfile=/dev/stdout'; \
    echo 'stdout_logfile_maxbytes=0'; \
    echo 'stderr_logfile=/dev/stderr'; \
    echo 'stderr_logfile_maxbytes=0'; \
    echo 'user=www-data'; \
    echo ''; \
    echo '[program:scheduler]'; \
    echo 'command=/bin/sh -c "while true; do su -s /bin/sh www-data -c \"php /var/www/artisan schedule:run\" >> /dev/null 2>&1; sleep 60; done"'; \
    echo 'autostart=true'; \
    echo 'autorestart=true'; \
    echo 'stdout_logfile=/dev/null'; \
    echo 'stderr_logfile=/dev/null'; \
} > /etc/supervisor.d/app.ini

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Copy composer files first for layer caching
COPY composer.json composer.lock ./
RUN COMPOSER_MEMORY_LIMIT=-1 composer install --no-scripts --no-autoloader --no-interaction --prefer-dist

# Copy the rest of source code
COPY . .

# Build frontend assets
RUN npm install && npm run build

# Generate optimized autoloader + cache
RUN composer dump-autoload --optimize \
    && php artisan route:cache \
    && php artisan view:cache

# Set permissions
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache \
    && chmod -R 775 /var/www/storage /var/www/bootstrap/cache

# Entrypoint
COPY docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

CMD ["/entrypoint.sh"]
