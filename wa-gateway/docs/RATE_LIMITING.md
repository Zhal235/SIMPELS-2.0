# WhatsApp Rate Limiting Configuration

## Environment Variables

Tambahkan ke Docker service `wagateway-f0cxa5`:

```bash
# Delay minimum antar pesan (default: 30 detik)
WA_WORKER_MIN_DELAY_MS=30000

# Delay maximum antar pesan (default: 3 menit)
WA_WORKER_MAX_DELAY_MS=180000

# Maximum pesan per jam (default: 100)
WA_MAX_MESSAGES_PER_HOUR=100

# Target waktu untuk menyelesaikan semua pesan pending (default: 8 jam)
WA_TARGET_COMPLETION_HOURS=8
```

## Cara Kerja Adaptive Delay

### Pesan Sedikit (≤10 pending):
- Delay: **30-60 detik** per pesan
- Cocok untuk pesan individual atau grup kecil

### Pesan Banyak (>10 pending):
- Delay **dihitung otomatis** berdasarkan:
  - Jumlah pesan pending
  - Target completion time (8 jam)
  - Rate limit per jam (100 pesan/jam)
  
- **Formula**: `delay = (8 jam × 3600 detik) / jumlah_pending`
- **Min**: 30 detik (tidak terlalu cepat → anti-ban)
- **Max**: 180 detik (3 menit, tidak terlalu lama)
- **Variasi**: ±20% random untuk tampak natural

### Contoh Perhitungan:

**100 pesan pending:**
- Target: 8 jam = 28,800 detik
- Delay optimal: 28,800 / 100 = **288 detik** → capped ke **180 detik** (max)
- Dengan rate limit 100 pesan/jam: minimal **36 detik/pesan**
- **Hasil**: 100 pesan × 3 menit = **5 jam** selesai ✅

**200 pesan pending:**
- Delay optimal: 28,800 / 200 = **144 detik** (2.4 menit)
- Dengan variasi ±20%: **115-173 detik**
- **Hasil**: 200 pesan × 2.4 menit = **8 jam** selesai ✅

**500 pesan pending:**
- Delay optimal: 28,800 / 500 = **57.6 detik**
- Dengan variasi ±20%: **46-69 detik**
- Rate limit 100/jam = minimal 36 detik → **57 detik OK** ✅
- **Hasil**: 500 pesan × 1 menit = **8.3 jam** selesai ✅

## Keuntungan

1. ✅ **Anti-Ban**: Tidak kirim terlalu cepat
2. ✅ **Predictable**: Semua pesan selesai dalam 8 jam
3. ✅ **Adaptive**: Auto adjust berdasarkan queue size
4. ✅ **Natural**: Random variation agar tidak terlihat bot
5. ✅ **Rate Limited**: BullMQ limiter 100 pesan/jam built-in

## Monitoring

Log worker akan menampilkan:
```
[Worker] Processing job 123 → 6281234567890
[Worker] Job 123 sent successfully
[Worker] Waiting 58.3s before next message (150 pending)
```

Informasi `(150 pending)` menunjukkan jumlah pesan yang masih antri.
