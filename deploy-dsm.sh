#!/bin/bash

# SIMPELS Deploy to Synology DSM
# Usage: ./deploy-dsm.sh

echo "🚀 Deploying SIMPELS to Synology DSM..."

# 1. Build frontend
echo "📦 Building frontend..."
cd frontend
npm install
npm run build
cd ..

# 2. Optimize backend
echo "⚙️  Optimizing backend..."
cd Backend
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan migrate --force
cd ..

# 3. Copy to DSM shared folder (adjust path)
DSM_PATH="/volume1/docker/simpels"
echo "📂 Copying files to $DSM_PATH..."
sudo mkdir -p $DSM_PATH
sudo cp -r Backend $DSM_PATH/
sudo cp -r frontend/dist $DSM_PATH/frontend/
sudo cp docker-compose.yml $DSM_PATH/
sudo cp nginx.conf $DSM_PATH/
sudo cp Backend/.env $DSM_PATH/Backend/.env

# 4. Set permissions
echo "🔒 Setting permissions..."
sudo chown -R 1026:100 $DSM_PATH
sudo chmod -R 755 $DSM_PATH
sudo chmod -R 775 $DSM_PATH/Backend/storage
sudo chmod -R 775 $DSM_PATH/Backend/bootstrap/cache

# 5. Start Docker containers
echo "🐳 Starting Docker containers..."
cd $DSM_PATH
sudo docker-compose up -d

echo "✅ Deployment complete!"
echo "📱 Access at: http://your-dsm-ip:8080"
echo "🔧 Backend API: http://your-dsm-ip:8001/api"
