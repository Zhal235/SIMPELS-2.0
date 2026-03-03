---
applyTo: "mobile/lib/**/*.dart"
---

## Aturan Dart - Mobile Flutter (SIMPELS-2.0)

### Batas Maksimal 400 Baris Per File

Setiap file `.dart` di `mobile/lib/` TIDAK BOLEH melebihi 400 baris.

Jika hasil edit akan membuat file melebihi 400 baris, **wajib** lakukan ekstraksi sebelum menyimpan:

- Widget besar → extract ke `lib/widgets/nama_widget.dart`
- Tab screen → extract ke `lib/screens/tabs/nama_tab.dart`
- Dialog → extract ke `lib/widgets/dialogs/nama_dialog.dart`
- Helper logic → extract ke `lib/utils/nama_helper.dart`

### Larangan

- ❌ Jangan buat file `*_old.dart` atau `*_backup.dart`
- ❌ Jangan biarkan TODO sebagai placeholder — langsung implementasi
- ❌ Jangan tambah inline comment yang hanya mendeskripsikan ulang kode
- ❌ Jangan buat fitur/abstraksi yang belum dibutuhkan

### Wajib Setelah Refactoring

Jalankan `flutter analyze` untuk memastikan tidak ada error import path yang salah.
