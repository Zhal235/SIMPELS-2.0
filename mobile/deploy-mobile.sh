#!/bin/bash

# Deploy SIMPELS Mobile PWA to Server
# Target: mobilesimpels.saza.sch.id
# Usage: bash deploy-mobile.sh [server_ip] [web_root]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 SIMPELS Mobile PWA Deployment${NC}"
echo "================================="

# Default values
SERVER_IP="${1:-saza.sch.id}"
WEB_ROOT="${2:-/var/www/html}"
MOBILE_FOLDER="$WEB_ROOT/mobilesimpels"
BUILD_PATH="/home/simpels/SIMPELS-2.0/mobile/build/web"
NGINX_CONF="/home/simpels/SIMPELS-2.0/mobile/nginx-mobilesimpels.conf"

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "   Server: $SERVER_IP"
echo "   Web Root: $WEB_ROOT"
echo "   Mobile Folder: $MOBILE_FOLDER"
echo "   Build Path: $BUILD_PATH"
echo ""

# Check if build exists
if [ ! -d "$BUILD_PATH" ]; then
    echo -e "${RED}❌ Build folder not found: $BUILD_PATH${NC}"
    echo "   Run: cd mobile && flutter build web --release"
    exit 1
fi

echo -e "${YELLOW}📦 Step 1: Checking server connectivity${NC}"
if ! ping -c 1 "$SERVER_IP" &> /dev/null; then
    echo -e "${RED}⚠️  Cannot reach server: $SERVER_IP${NC}"
    echo "   Make sure server is reachable or use correct IP"
fi

echo -e "${GREEN}✓ Server reachable${NC}"
echo ""

echo -e "${YELLOW}📂 Step 2: Creating mobile folder structure${NC}"
ssh -q root@$SERVER_IP "mkdir -p $MOBILE_FOLDER && chmod 755 $MOBILE_FOLDER"
echo -e "${GREEN}✓ Folder created${NC}"
echo ""

echo -e "${YELLOW}🔄 Step 3: Uploading build files (scp)${NC}"
echo "   This may take a minute..."
# Compress and send
cd "$BUILD_PATH"
tar czf /tmp/mobile-build.tar.gz .
scp -q /tmp/mobile-build.tar.gz root@$SERVER_IP:/tmp/
rm /tmp/mobile-build.tar.gz
ssh -q root@$SERVER_IP "cd $MOBILE_FOLDER && rm -rf * && tar xzf /tmp/mobile-build.tar.gz && rm /tmp/mobile-build.tar.gz"
echo -e "${GREEN}✓ Files uploaded${NC}"
echo ""

echo -e "${YELLOW}⚙️  Step 4: Uploading Nginx configuration${NC}"
scp -q "$NGINX_CONF" root@$SERVER_IP:/etc/nginx/sites-available/mobilesimpels.saza.sch.id
ssh -q root@$SERVER_IP "ln -sf /etc/nginx/sites-available/mobilesimpels.saza.sch.id /etc/nginx/sites-enabled/"
echo -e "${GREEN}✓ Nginx config uploaded${NC}"
echo ""

echo -e "${YELLOW}🔐 Step 5: Setting permissions${NC}"
ssh -q root@$SERVER_IP "chmod -R 755 $MOBILE_FOLDER && chown -R www-data:www-data $MOBILE_FOLDER"
echo -e "${GREEN}✓ Permissions set${NC}"
echo ""

echo -e "${YELLOW}✔️  Step 6: Testing Nginx configuration${NC}"
if ssh -q root@$SERVER_IP "nginx -t 2>&1" | grep -q "successful"; then
    echo -e "${GREEN}✓ Nginx config is valid${NC}"
else
    echo -e "${RED}❌ Nginx config error${NC}"
    ssh -q root@$SERVER_IP "nginx -t"
    exit 1
fi
echo ""

echo -e "${YELLOW}🔄 Step 7: Reloading Nginx${NC}"
ssh -q root@$SERVER_IP "systemctl reload nginx"
echo -e "${GREEN}✓ Nginx reloaded${NC}"
echo ""

echo -e "${YELLOW}🌐 Step 8: Updating Cloudflare DNS${NC}"
echo "   ⚠️  Manual step required!"
echo "   If not already done, add DNS record in Cloudflare:"
echo "   - Type: CNAME"
echo "   - Name: mobilesimpels"
echo "   - Content: saza.sch.id"
echo "   - Proxy: Automatic (orange cloud)"
echo ""

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${YELLOW}📱 Access your app:${NC}"
echo "   https://mobilesimpels.saza.sch.id"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "   1. Go to Cloudflare dashboard"
echo "   2. Add CNAME record: mobilesimpels → saza.sch.id"
echo "   3. Test: curl https://mobilesimpels.saza.sch.id"
echo "   4. Open in browser and verify app works"
echo ""
echo "   Logs on server:"
echo "   - tail -f /var/log/nginx/mobilesimpels-access.log"
echo "   - tail -f /var/log/nginx/mobilesimpels-error.log"
