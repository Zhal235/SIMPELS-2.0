# EPOS Deployment Configuration

## 📁 Files
- **simpels-traefik.yml**: Traefik routing config (EPOS IP: 10.0.1.42:80)
- **monitor-epos.sh**: Auto-monitor EPOS IP changes every 5 minutes

## 🚀 Setup
```bash
# Copy files to server
cp simpels-traefik.yml /root/
cp monitor-epos.sh /root/ && chmod +x /root/monitor-epos.sh

# Add cron job
crontab -e
# Add: */5 * * * * /root/monitor-epos.sh >/dev/null 2>&1

# Restart traefik
docker restart dokploy-traefik
```

## 🔧 Features
- ✅ Auto-detect EPOS container IP changes
- ✅ Auto-update traefik config + restart  
- ✅ Zero-downtime recovery (≤5 minutes)
- ✅ Logging: /var/log/epos-monitor.log

Last Updated: March 28, 2026
