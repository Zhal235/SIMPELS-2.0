# SIMPELS-2.0 Copilot Instructions

## 🔴 ATURAN WAJIB: Batas Maksimal 400 Baris Per File

**Setiap file Dart di folder `mobile/lib/` TIDAK BOLEH melebihi 400 baris.**

Ini adalah peraturan baku yang harus selalu dipatuhi saat mengembangkan aplikasi ini.

### Cara Menegakkan Aturan Ini

Sebelum membuat atau mengedit file Dart apapun di `mobile/lib/`:
1. Hitung estimasi jumlah baris setelah perubahan.
2. Jika file melebihi 400 baris, **wajib extract** widget/logic ke file terpisah.
3. Setelah setiap sesi coding, cek dengan perintah:
   ```powershell
   Get-ChildItem "mobile\lib" -Recurse -Filter "*.dart" | ForEach-Object { $lines = (Get-Content $_.FullName | Measure-Object -Line).Lines; if ($lines -gt 400) { Write-Output "$lines - $($_.Name)" } }
   ```

### Strategi Ekstraksi

Ketika sebuah file melebihi 400 baris, pecah berdasarkan tanggung jawab:

| Tipe | Lokasi | Contoh |
|------|--------|--------|
| Widget reusable | `lib/widgets/` | `tagihan_card.dart`, `month_group.dart` |
| Tab screen | `lib/screens/tabs/` | `dashboard_tab.dart`, `profile_tab.dart` |
| Helper/utils | `lib/utils/` | `currency_formatter.dart` |
| Dialog | `lib/widgets/dialogs/` | `confirm_dialog.dart` |

### Aturan Tambahan

- **Tidak boleh ada TODO sebagai placeholder** — setiap TODO harus langsung diimplementasi dengan logic nyata.
- **Tidak boleh ada inline comment yang redundant** — hapus comment yang hanya mendeskripsikan ulang kode.
- **Tidak boleh ada file backup** (seperti `*_old.dart`) — gunakan git untuk version control.
- **Import path harus benar** setelah ekstraksi — selalu jalankan `flutter analyze` setelah refactoring.

### File-File Yang Sudah Direfactor (Contoh Arsitektur Yang Benar)

```
lib/
  screens/
    tabs/
      dashboard_tab.dart     ← max 400 baris
      pembayaran_tab.dart    ← max 400 baris
      profile_tab.dart       ← max 400 baris
  widgets/
    draft_pembayaran_list.dart
    tagihan_card.dart
    tagihan_list.dart
    month_group.dart
    notification_bell_widget.dart
    tabungan_card.dart
```
