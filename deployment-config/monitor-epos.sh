#!/bin/bash
# EPOS Auto-Update Monitor - jalan setiap 5 menit
TRAEFIK_CONFIG="/root/simpels-traefik.yml"
LOG_FILE="/var/log/epos-monitor.log"

# Cari container EPOS
EPOS_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "epos.*saza" | head -1)
if [ -z "$EPOS_CONTAINER" ]; then
    echo "$(date): No EPOS container found" >> $LOG_FILE
    exit 1
fi

# Get current IP
NEW_IP=$(docker exec dokploy-traefik nslookup $EPOS_CONTAINER 2>/dev/null | grep "Address:" | tail -1 | awk '{print $2}')
CURRENT_IP=$(grep -oP 'http://\K[0-9.]+' $TRAEFIK_CONFIG | grep -v "127.0" | head -1)

if [ "$NEW_IP" != "$CURRENT_IP" ]; then
    echo "$(date): EPOS IP changed: $CURRENT_IP -> $NEW_IP" >> $LOG_FILE
    sed -i "s|http://$CURRENT_IP:80|http://$NEW_IP:80|g" $TRAEFIK_CONFIG
    docker restart dokploy-traefik
    echo "$(date): Updated and restarted traefik" >> $LOG_FILE
fi
