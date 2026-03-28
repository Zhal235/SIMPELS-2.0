# Deployment Configuration

## 📁 Files
- **simpels-traefik.yml**: Traefik routing config (EPOS IP: 10.0.1.42:80)
- **monitor-epos.sh**: Auto-monitor EPOS IP changes every 5 minutes
- **deployment-safety.sh**: Safety check before pushing from local

## 🚀 Setup
```bash
# Copy files to server
cp simpels-traefik.yml /root/
cp monitor-epos.sh /root/ && chmod +x /root/monitor-epos.sh
cp deployment-safety.sh /root/ && chmod +x /root/deployment-safety.sh

# Add cron job  
crontab -e
# Add: */5 * * * * /root/monitor-epos.sh >/dev/null 2>&1

# Restart traefik
docker restart dokploy-traefik
```

## 📋 Repositories

### SIMPELS Main: `https://github.com/Zhal235/SIMPELS-2.0.git`
- Frontend: `/etc/dokploy/applications/simpelssaza-simpelsfrontend-0bhef9/code`
- Mobile/PWA: `/etc/dokploy/applications/simpelssaza-appsimpels-xzwnps/code`

### EPOS: `https://github.com/Zhal235/EPOS_SAZA.git`
- Server location: `/etc/dokploy/compose/epos-saza-epos-saza-v7ri6t/code`

## 🛡️ Deployment Safety

**IMPORTANT: Before pushing from local, always run:**
```bash
# On server
/root/deployment-safety.sh
```

This prevents deployment conflicts by checking:
- ✅ No uncommitted changes on server
- ✅ No unpushed commits on server
- ✅ EPOS website accessible  
- ✅ All repositories clean

**If check fails:**
1. Commit/push any pending changes on server
2. Fix any issues reported
3. Re-run safety check until clean

## 🔧 Features
- ✅ Auto-detect EPOS container IP changes
- ✅ Auto-update traefik config + restart
- ✅ Zero-downtime recovery (≤5 minutes)
- ✅ Conflict prevention for local deployments
- ✅ Logging: /var/log/epos-monitor.log

## 🚨 Critical Notes
1. **EPOS has separate repository!** Don't modify EPOS files in SIMPELS repo
2. **Always run safety check** before pushing from local
3. **Monitor EPOS independently** - changes to EPOS won't trigger SIMPELS deployment

Last Updated: March 28, 2026
