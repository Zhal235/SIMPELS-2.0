# 🚀 FINAL STEP: Add DNS Record di Cloudflare

## ⚡ Quickest Way (3 Clicks)

### Step 1: Open Cloudflare Dashboard
```
https://dash.cloudflare.com/
```
Login dengan email & password Anda

### Step 2: Pilih Domain saza.sch.id
Setelah login, pilih: **saza.sch.id** dari list domains

### Step 3: Add CNAME Record

**PATH:** DNS → + Add Record

Fill these fields:
```
Type:     CNAME
Name:     mobilesimpels
Content:  saza.sch.id
TTL:      Auto
Proxy:    🟠 Automatic (Cloudflare DNS)
```

Then click **Save**

---

## ✅ Done! 

Setelah 1-5 menit DNS propagate, coba buka:
```
https://mobilesimpels.saza.sch.id
```

Harus langsung masuk ke Flutter mobile app! 🎉

---

## 🧪 Verify DNS Propagation

Dari terminal:
```bash
nslookup mobilesimpels.saza.sch.id
# Harus return: saza.sch.id (CNAME pointing to Cloudflare)

# Atau langsung test app:
curl https://mobilesimpels.saza.sch.id
```

---

## 🔑 Alternative: Automated (dengan Cloudflare API)

Jika ingin automated, saya butuh:

**Option A: Global API Key**
- Login Cloudflare → Account Settings → API Tokens
- Copy "Global API Key"
- Kasih ke saya

**Option B: API Token (lebih aman)**
- Login Cloudflare → Account Settings → API Tokens  
- Create Token dengan:
  - Permissions: Zone.DNS (Edit)
  - Zone: saza.sch.id
- Copy token

Kasih salah satu, saya buat DNS record langsung via API!

---

**Status:** ✅ 99% DONE - Tinggal add DNS record!
