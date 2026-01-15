# 🚀 NGINX Deployment Configuration - Quick Reference

## Changed Files Summary

```
frontend/.env
  - VITE_API_BASE: http://127.0.0.1:8000/api → /api

Backend/.env
  - APP_URL: http://localhost:8001 → http://localhost:8888

Backend/config/cors.php
  - Added: http://localhost:8888
  - Added: http://127.0.0.1:8888

Backend/config/sanctum.php
  - Added: localhost:8888
  - Added: 127.0.0.1:8888
```

## Architecture

```
VirtualBox Port 8888 (Host) 
        ↓
Nginx (Port 80 in VM)
  ├─ / → Frontend (React/Vite dist/)
  └─ /api → Laravel Backend (Port 8001)
```

## Quick Git Commands

```bash
# Stage all changes
git add frontend/.env Backend/.env Backend/config/cors.php Backend/config/sanctum.php NGINX_DEPLOYMENT_CHANGES.md DEPLOYMENT_CHANGES_SUMMARY.md

# Commit with descriptive message
git commit -m "Configure Nginx reverse proxy architecture for Ubuntu deployment

- frontend/.env: Update VITE_API_BASE to /api (relative path)
- Backend/.env: Update APP_URL to http://localhost:8888
- Backend/config/cors.php: Add localhost:8888 to allowed origins
- Backend/config/sanctum.php: Add localhost:8888 to stateful domains

This configuration aligns local development with Nginx reverse proxy architecture:
- Nginx serves Frontend at / and proxies /api to Backend
- VirtualBox port forwarding: 8888 (host) → 80 (VM Nginx)
- Supports both same-origin requests (via Nginx) and mobile/external API calls

See NGINX_DEPLOYMENT_CHANGES.md for detailed documentation"

# Push to repository
git push origin main
```

## Testing Before Commit

### 1. Frontend Development Server
```bash
cd frontend
npm run dev
# Visit http://localhost:5173
# Verify: Can login, API requests work, no CORS errors
```

### 2. Backend Development Server
```bash
cd Backend
php artisan serve --port=8001
# OR use existing setup
# Visit http://localhost:8001/api/* (with Postman or curl)
# Verify: API endpoints respond correctly
```

### 3. Nginx Reverse Proxy (if VM is running)
```bash
# From host machine
curl http://localhost:8888
# Should get frontend HTML
curl http://localhost:8888/api/user
# Should get API response (after login)
```

## Environment Variables

### Frontend (`frontend/.env`)
```
VITE_PORT=5173
VITE_API_BASE=/api
```

### Backend (`Backend/.env`)
Key changes:
```
APP_URL=http://localhost:8888
APP_DEBUG=true  # Set to false in production
```

## Important Notes

⚠️ **Before Production Deployment to Ubuntu:**

1. **Update APP_URL for production domain**
   ```dotenv
   APP_URL=https://your-domain.com
   ```

2. **Update CORS for production domain**
   ```php
   'allowed_origins' => [
       'https://your-domain.com',
       // ... remove localhost entries
   ],
   ```

3. **Update Sanctum for production domain**
   ```php
   'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 
       'your-domain.com,' . Sanctum::currentApplicationUrlWithPort()
   )),
   ```

4. **Security hardening**
   - Set `APP_DEBUG=false`
   - Use HTTPS only (`SESSION_SECURE_COOKIE=true`)
   - Use environment-specific configs

## File Structure Reference

```
SIMPELS-2.0/
├── frontend/
│   ├── .env ← UPDATED: VITE_API_BASE=/api
│   ├── src/
│   │   └── api/
│   │       ├── index.ts  (reads VITE_API_BASE)
│   │       └── index.js  (reads VITE_API_BASE)
│   └── vite.config.ts
├── Backend/
│   ├── .env ← UPDATED: APP_URL=http://localhost:8888
│   ├── config/
│   │   ├── cors.php ← UPDATED: added localhost:8888
│   │   └── sanctum.php ← UPDATED: added localhost:8888
│   ├── routes/
│   │   └── api.php (all routes prefixed with /api)
│   └── public/
│       └── index.php
├── NGINX_DEPLOYMENT_CHANGES.md (NEW: Detailed documentation)
└── DEPLOYMENT_CHANGES_SUMMARY.md (NEW: This file)
```

## Deployment Checklist

- [x] Updated frontend .env with relative API path
- [x] Updated Backend .env with correct APP_URL
- [x] Updated CORS configuration for new origin
- [x] Updated Sanctum configuration for cookie authentication
- [x] Created detailed documentation
- [ ] Test frontend development server
- [ ] Test backend development server
- [ ] Test Nginx reverse proxy (if available)
- [ ] Commit and push to repository
- [ ] Review in pull request
- [ ] Merge to main branch

## Support

For detailed information, see: **NGINX_DEPLOYMENT_CHANGES.md**

Questions? Refer to the full documentation file for:
- Detailed architecture explanation
- File-by-file changes with before/after
- Troubleshooting guide
- Production deployment notes

---
**Status**: ✅ Ready for Deployment  
**Date**: January 15, 2026
