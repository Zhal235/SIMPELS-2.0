<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Kelas;
use App\Models\Santri;
use Illuminate\Validation\Rule;

class KelasController extends Controller
{
    /**
     * GET /api/kelas
     * Tampilkan semua kelas dengan jumlah santri (withCount)
     */
    public function index()
    {
        $items = Kelas::query()
            ->with(['wali_kelas'])
            ->withCount('santri')
            ->orderBy('nama_kelas')
            ->get();
        return response()->json([
            'success' => true,
            'message' => 'Daftar kelas berhasil dimuat',
            'data' => $items,
        ]);
    }

    /**
     * POST /api/kelas
     * Simpan kelas baru
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_kelas' => ['required', 'string', 'max:100'],
            'tingkat' => ['required', 'integer'],
            'wali_kelas_id' => ['nullable', 'integer'],
            // Jika ingin validasi existence: uncomment baris di bawah ini saat tabel pegawai tersedia
            // 'wali_kelas_id' => ['nullable', Rule::exists('pegawai', 'id')],
        ]);

        $kelas = Kelas::create($validated);
        return response()->json([
            'success' => true,
            'message' => 'Kelas berhasil dibuat',
            'data' => $kelas,
        ], 201);
    }

    /**
     * PUT /api/kelas/{id}
     * Perbarui data kelas
     */
    public function update(Request $request, int $id)
    {
        $kelas = Kelas::findOrFail($id);
        $validated = $request->validate([
            'nama_kelas' => ['sometimes', 'required', 'string', 'max:100'],
            'tingkat' => ['sometimes', 'required', 'integer'],
            'wali_kelas_id' => ['nullable', 'integer'],
            // 'wali_kelas_id' => ['nullable', Rule::exists('pegawai', 'id')],
        ]);

        $kelas->update($validated);
        return response()->json([
            'success' => true,
            'message' => 'Kelas berhasil diperbarui',
            'data' => $kelas,
        ]);
    }

    /**
     * DELETE /api/kelas/{id}
     * Hapus kelas
     */
    public function destroy(int $id)
    {
        $kelas = Kelas::findOrFail($id);
        $kelas->delete();
        return response()->json([
            'success' => true,
            'message' => 'Kelas berhasil dihapus',
        ]);
    }

    /**
     * POST /api/kelas/{kelas}/add-member/{santri}
     * Assign santri ke kelas
     */
    public function addMember(int $kelas_id, string $santri_id)
    {
        $kelas = Kelas::findOrFail($kelas_id);
        $santri = Santri::findOrFail($santri_id);

        // Validasi: jika santri sudah punya kelas lain, tolak
        if (!is_null($santri->kelas_id) && $santri->kelas_id !== $kelas->id) {
            return response()->json([
                'success' => false,
                'message' => 'Santri sudah terdaftar di kelas lain.',
            ], 422);
        }

        // Set kelas_id dan kelas_nama (jika kolom tersedia)
        $santri->kelas_id = $kelas->id;
        // Jika kolom kelas_nama ada di tabel, Eloquent akan mengisi nilainya
        // (kolom ditambahkan pada migrasi baru)
        $santri->setAttribute('kelas_nama', $kelas->nama_kelas);
        $santri->save();

        return response()->json([
            'success' => true,
            'message' => 'Anggota kelas berhasil diperbarui',
            'data' => $santri,
        ]);
    }

    /**
     * POST /api/kelas/{kelas}/remove-member/{santri}
     * Keluarkan santri dari kelas
     */
    public function removeMember(int $kelas_id, string $santri_id)
    {
        // Optional: pastikan kelas ada, meski tidak digunakan lebih lanjut
        Kelas::findOrFail($kelas_id);
        $santri = Santri::findOrFail($santri_id);
        $santri->kelas_id = null;
        $santri->setAttribute('kelas_nama', null);
        $santri->save();

        return response()->json([
            'success' => true,
            'message' => 'Anggota kelas berhasil diperbarui',
            'data' => $santri,
        ]);
    }

    /**
     * Endpoint baru sesuai spesifikasi:
     * POST /v1/kesantrian/kelas/{kelas}/anggota
     * Body: { santri_id: string }
     */
    public function tambahAnggota(Request $request, int $kelas_id)
    {
        $data = $request->validate([
            'santri_id' => ['required', 'string'],
        ]);

        $kelas = Kelas::findOrFail($kelas_id);
        $santri = Santri::findOrFail($data['santri_id']);

        // Validasi: santri tidak boleh sudah punya kelas lain
        if (!is_null($santri->kelas_id) && $santri->kelas_id !== $kelas->id) {
            return response()->json([
                'success' => false,
                'message' => 'Santri sudah terdaftar di kelas lain.',
            ], 422);
        }

        $santri->kelas_id = $kelas->id;
        $santri->setAttribute('kelas_nama', $kelas->nama_kelas);
        $santri->save();

        return response()->json([
            'success' => true,
            'message' => 'Anggota kelas berhasil diperbarui',
            'data' => $santri,
        ]);
    }

    /**
     * Endpoint baru sesuai spesifikasi:
     * DELETE /v1/kesantrian/kelas/{kelas}/anggota/{santri}
     */
    public function keluarkanAnggota(int $kelas_id, string $santri_id)
    {
        // Pastikan kelas valid
        Kelas::findOrFail($kelas_id);
        $santri = Santri::findOrFail($santri_id);

        $santri->kelas_id = null;
        $santri->setAttribute('kelas_nama', null);
        $santri->save();

        return response()->json([
            'success' => true,
            'message' => 'Anggota kelas berhasil diperbarui',
            'data' => $santri,
        ]);
    }

    /**
     * PROMOSI NAIK KELAS (Persiapan fitur nanti)
     * Endpoint: POST /api/kelas/promote
     * Body: { from_tingkat: number, target_kelas_id: number }
     * Memindahkan semua santri dari kelas dengan tingkat = from_tingkat ke kelas target_kelas_id
     * Catatan: Pastikan target_kelas_id memiliki tingkat = from_tingkat + 1 untuk konsistensi.
     */
    public function promote(Request $request)
    {
        $data = $request->validate([
            'from_tingkat' => ['required', 'integer'],
            'target_kelas_id' => ['required', 'integer'],
        ]);

        $fromTingkat = (int) $data['from_tingkat'];
        $targetId = (int) $data['target_kelas_id'];

        $target = Kelas::findOrFail($targetId);
        $sourceKelasIds = Kelas::query()->where('tingkat', $fromTingkat)->pluck('id');

        // Update mass: semua santri di kelas tingkat from_tingkat dipindah ke target kelas
        $affected = Santri::query()
            ->whereIn('kelas_id', $sourceKelasIds)
            ->update([
                'kelas_id' => $target->id,
                'kelas_nama' => $target->nama_kelas,
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Promosi kelas berhasil dijalankan',
            'moved_count' => $affected,
            'from_tingkat' => $fromTingkat,
            'target_kelas' => $target,
        ]);
    }
}
