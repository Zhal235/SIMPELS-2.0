---
applyTo: frontend/src/**/*.{ts,tsx}
---

# Frontend TypeScript/React Instructions

## Batas Maksimal 300 Baris Per File

Setiap file `.tsx`/`.ts` di `frontend/src/` **TIDAK BOLEH melebihi 300 baris**.

Sebelum membuat atau mengedit file apapun:
1. Estimasi jumlah baris setelah perubahan.
2. Jika melebihi 300 baris, **wajib extract** ke file terpisah.
3. Cek kepatuhan:
   ```powershell
   Get-ChildItem "frontend\src" -Recurse -Include "*.tsx","*.ts" | ForEach-Object { $lines = (Get-Content $_.FullName | Measure-Object -Line).Lines; if ($lines -gt 300) { Write-Output "$lines - $($_.Name)" } }
   ```

### Strategi Ekstraksi

| Tipe | Lokasi | Contoh |
|------|--------|--------|
| Sub-komponen UI | `components/[feature]/` | `SantriTable.tsx`, `SantriForm.tsx` |
| Custom hook | `hooks/` | `useSantri.ts`, `usePagination.ts` |
| Tipe/interface | `types/` | `santri.types.ts` |
| Helper/utils | `utils/` | `formatCurrency.ts` |
| Kolom tabel | `components/[feature]/columns.tsx` | `santriColumns.tsx` |

## Aturan Wajib

- **Tidak boleh ada inline comment** — tulis kode yang self-explanatory.
- **Tidak boleh ada TODO sebagai placeholder** — implementasi langsung atau jangan tulis.
- **Tidak boleh ada file backup** (`*_old.tsx`, `*_backup.ts`) — gunakan git.
- **Tidak boleh ada `console.log`** yang tertinggal.
- **Selalu jalankan** `npm run build` setelah refactoring.
