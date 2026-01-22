#!/bin/bash

################################################################################
# SIMPELS-2.0 Auto Deployment Script for Linux
# 
# Usage:
#   bash DEPLOY-TO-LINUX.sh [path-to-simpels]
#
# Example:
#   bash DEPLOY-TO-LINUX.sh /var/www/simpels
#   bash DEPLOY-TO-LINUX.sh ~/simpels
#
# Prerequisites:
#   - PHP >= 8.2
#   - Composer installed
#   - Git installed
#   - MySQL/MariaDB running
#   - Permissions to write to project directory
#
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get deploy path from argument or use current directory
DEPLOY_PATH="${1:-.}"

# Check if path exists
if [ ! -d "$DEPLOY_PATH" ]; then
    echo -e "${RED}Error: Path '$DEPLOY_PATH' does not exist${NC}"
    exit 1
fi

# Check if Backend directory exists
if [ ! -d "$DEPLOY_PATH/Backend" ]; then
    echo -e "${RED}Error: Backend directory not found in '$DEPLOY_PATH'${NC}"
    exit 1
fi

BACKEND_PATH="$DEPLOY_PATH/Backend"

################################################################################
# HEADER
################################################################################

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          SIMPELS-2.0 Laravel 12 - Linux Deployment            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo "Deploy Path: $DEPLOY_PATH"
echo "Backend Path: $BACKEND_PATH"
echo ""

# Check prerequisites
echo -e "${CYAN}Checking prerequisites...${NC}"

if ! command -v php &> /dev/null; then
    echo -e "${RED}✗ PHP not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ PHP found: $(php -v | head -n1)${NC}"

if ! command -v composer &> /dev/null; then
    echo -e "${RED}✗ Composer not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Composer found${NC}"

if ! command -v git &> /dev/null; then
    echo -e "${RED}✗ Git not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Git found${NC}"

echo ""

################################################################################
# DEPLOYMENT STEPS
################################################################################

# Step 1: Navigate & pull code
echo -e "${CYAN}[1/11] Pulling latest code from git...${NC}"
cd "$BACKEND_PATH"
git pull origin main
echo -e "${GREEN}✓ Code pulled${NC}"
echo ""

# Step 2: Check if .env exists
echo -e "${CYAN}[2/11] Checking environment file...${NC}"
if [ ! -f "$BACKEND_PATH/.env" ]; then
    if [ -f "$BACKEND_PATH/.env.example" ]; then
        cp "$BACKEND_PATH/.env.example" "$BACKEND_PATH/.env"
        echo -e "${GREEN}✓ .env created from .env.example${NC}"
    else
        echo -e "${RED}✗ .env or .env.example not found${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ .env exists${NC}"
fi
echo ""

# Step 3: Backup and clean composer cache
echo -e "${CYAN}[3/11] Cleaning composer cache...${NC}"
rm -f "$BACKEND_PATH/composer.lock"
composer clear-cache
echo -e "${GREEN}✓ Composer cache cleaned${NC}"
echo ""

# Step 4: Install dependencies
echo -e "${CYAN}[4/11] Installing dependencies...${NC}"
composer install --no-interaction --optimize-autoloader --no-dev
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${RED}✗ Composer install failed${NC}"
    exit 1
fi
echo ""

# Step 5: Generate application key
echo -e "${CYAN}[5/11] Generating application key...${NC}"
php artisan key:generate --force
echo -e "${GREEN}✓ Application key generated${NC}"
echo ""

# Step 6: Clear existing caches
echo -e "${CYAN}[6/11] Clearing caches...${NC}"
php artisan cache:clear || true
php artisan view:clear || true
php artisan config:clear || true
php artisan event:clear || true
echo -e "${GREEN}✓ Caches cleared${NC}"
echo ""

# Step 7: Cache configuration
echo -e "${CYAN}[7/11] Caching configuration...${NC}"
php artisan config:cache
php artisan route:cache
php artisan view:cache
echo -e "${GREEN}✓ Configuration cached${NC}"
echo ""

# Step 8: Run database migrations
echo -e "${CYAN}[8/11] Running database migrations...${NC}"
php artisan migrate --force
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Migrations completed${NC}"
else
    echo -e "${RED}⚠ Migrations failed (database might not be ready)${NC}"
fi
echo ""

# Step 9: Seed database
echo -e "${CYAN}[9/11] Seeding database...${NC}"
php artisan db:seed --force || echo -e "${YELLOW}⚠ Seeding skipped${NC}"
echo ""

# Step 10: Set file permissions
echo -e "${CYAN}[10/11] Setting file permissions...${NC}"
chmod -R 755 storage bootstrap/cache
chmod -R 755 public
# Try to set owner to www-data if running as root
if [ "$EUID" -eq 0 ]; then
    chown -R www-data:www-data storage bootstrap/cache public
fi
echo -e "${GREEN}✓ Permissions set${NC}"
echo ""

# Step 11: Verify installation
echo -e "${CYAN}[11/11] Verifying installation...${NC}"
php artisan --version
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Installation verified${NC}"
else
    echo -e "${RED}✗ Verification failed${NC}"
    exit 1
fi
echo ""

################################################################################
# SUMMARY
################################################################################

echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║               ✅ DEPLOYMENT SUCCESSFUL!                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo "Next steps:"
echo "  1. Check logs: tail -f storage/logs/laravel.log"
echo "  2. Start web server: php artisan serve --host=0.0.0.0 --port=8000"
echo "  3. Or configure Nginx/Apache"
echo ""

echo "Useful commands:"
echo "  php artisan tinker                    # Interactive shell"
echo "  php artisan migrate:status            # Check migrations"
echo "  php artisan db:seed                   # Run seeders"
echo "  php artisan cache:clear               # Clear cache"
echo ""

echo -e "${YELLOW}Important:${NC}"
echo "  - Review .env configuration"
echo "  - Ensure database permissions"
echo "  - Check storage and bootstrap/cache writable"
echo "  - Configure web server (Nginx/Apache)"
echo "  - Set up SSL certificates"
echo ""
