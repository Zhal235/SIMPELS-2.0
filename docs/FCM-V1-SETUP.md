# 🔐 Setup FCM v1 API dengan Service Account

Firebase sekarang menggunakan **FCM v1 API** yang lebih secure, tidak lagi pakai Server Key (Legacy).

## 📥 Download Service Account JSON

### 1. Buka Firebase Console
```
https://console.firebase.google.com/
```

### 2. Pilih Project
- Pilih project **simpels-faf58**

### 3. Buka Service Accounts
1. Klik ⚙️ **Project Settings**
2. Tab **Service accounts**
3. Klik **Generate new private key**
4. Confirm → Download file JSON

File akan bernama seperti:
```
simpels-faf58-firebase-adminsdk-xxxxx-xxxxxxxxxx.json
```

### 4. Rename File
Rename file menjadi:
```
firebase-credentials.json
```

---

## 🚀 Setup di Backend Laravel

### Opsi 1: Local Development

```bash
# Copy file ke storage/app/
cd Backend
cp path/to/firebase-credentials.json storage/app/firebase-credentials.json

# Set permission (Linux/Mac)
chmod 600 storage/app/firebase-credentials.json

# Set env
echo "FCM_PROJECT_ID=simpels-faf58" >> .env
```

### Opsi 2: Dokploy Production

#### A. Via Dokploy File Manager:
1. Login ke Dokploy Dashboard
2. Pilih project **SIMPELS Backend**
3. Tab **Files** atau **Terminal**
4. Upload `firebase-credentials.json` ke:
   ```
   /app/storage/app/firebase-credentials.json
   ```

#### B. Via Dokploy Terminal:
```bash
# SSH ke container
# Lalu paste isi file dengan:
cat > storage/app/firebase-credentials.json << 'EOF'
{
  "type": "service_account",
  "project_id": "simpels-faf58",
  ... paste semua isi file JSON ...
}
EOF

# Set permission
chmod 600 storage/app/firebase-credentials.json
```

#### C. Via Environment Variable (Alternative):
```bash
# Base64 encode file
cat firebase-credentials.json | base64

# Di Dokploy → Backend → Environment:
FIREBASE_CREDENTIALS_BASE64=paste_base64_here

# Lalu di deployment script decode:
echo $FIREBASE_CREDENTIALS_BASE64 | base64 -d > storage/app/firebase-credentials.json
```

### Opsi 3: Environment Variable .env

File `.env`:
```env
FCM_PROJECT_ID=simpels-faf58
```

---

## 🔄 Install Dependency

```bash
cd Backend
composer require google/auth
composer install
```

---

## ✅ Verify Setup

### Test via Tinker:
```bash
php artisan tinker
```

```php
// Test access token
$service = new \App\Services\FCMService();
$reflection = new ReflectionClass($service);
$method = $reflection->getMethod('getAccessToken');
$method->setAccessible(true);
$token = $method->invoke($service);
dump($token); // Harus return string access token

// Test send notification
$fcm = new \App\Services\FCMService();
$fcm->sendPaymentApproved(1, 100000, 1);
```

### Check Logs:
```bash
tail -f storage/logs/laravel.log
```

Harus muncul:
```
[INFO] FCM batch notification completed
```

---

## 🔍 Troubleshooting

### ❌ Error: "firebase-credentials.json not found"
**Check:**
```bash
ls -la storage/app/firebase-credentials.json
```

**Fix:**
```bash
# Pastikan file ada dan readable
chmod 600 storage/app/firebase-credentials.json
chown www-data:www-data storage/app/firebase-credentials.json
```

### ❌ Error: "Unable to get access token"
**Check:**
1. File JSON valid format
2. Service Account punya permission
3. Firebase Cloud Messaging API v1 sudah enabled

**Enable FCM API v1:**
```
Firebase Console → Cloud Messaging → 
Firebase Cloud Messaging API (V1) → Should be "Enabled"
```

### ❌ Error: "Class 'Google\Auth\Credentials\ServiceAccountCredentials' not found"
**Fix:**
```bash
composer require google/auth
composer dump-autoload
```

---

## 📊 Keuntungan FCM v1 vs Legacy

| Feature | Legacy (Server Key) | FCM v1 (Service Account) |
|---------|---------------------|--------------------------|
| Security | ⚠️ Key bisa expose | ✅ OAuth2 token |
| Expiry | ❌ Permanent | ✅ Auto expire & refresh |
| Control | ⚠️ Limited | ✅ Fine-grained IAM |
| Support | ❌ Deprecated 2024 | ✅ Active development |
| Token format | `AAAAxxx...` | `ya29.xxx...` (temporary) |

---

## 🎯 Migration Checklist

- [x] Update FCMService.php ke v1 API
- [x] Tambah google/auth dependency
- [ ] Download Service Account JSON
- [ ] Upload ke server storage/app/
- [ ] Set FCM_PROJECT_ID di .env
- [ ] Test send notification
- [ ] Verify logs

---

## 📚 Resources

- [FCM v1 Documentation](https://firebase.google.com/docs/cloud-messaging/migrate-v1)
- [Service Account Authentication](https://firebase.google.com/docs/admin/setup#initialize-sdk)
- [google/auth PHP Library](https://github.com/googleapis/google-auth-library-php)

---

**Setup FCM v1 selesai! 🎉**

Lebih secure dan future-proof dibanding Legacy API.
