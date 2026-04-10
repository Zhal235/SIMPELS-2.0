<?php

namespace App\Services\Santri;

use App\Models\Santri;
use App\Http\Resources\SantriResource;
use App\Traits\ValidatesDeletion;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Throwable;

class SantriCrudService
{
    use ValidatesDeletion;

    public function getList(Request $request): array
    {
        $page = max((int) $request->query('page', 1), 1);
        $perPage = max((int) $request->query('perPage', 10), 1);
        $query = Santri::query();

        if ($request->filled('q')) {
            $search = $request->input('q');
            $query->where(function ($q) use ($search) {
                $q->where('nama_santri', 'like', "%{$search}%")
                  ->orWhere('nis', 'like', "%{$search}%")
                  ->orWhere('nisn', 'like', "%{$search}%");
            });
        }

        if ($request->filled('kelas_id')) {
            $query->where('kelas_id', $request->input('kelas_id'));
        }

        if ($request->filled('asrama_id')) {
            $asramaId = $request->input('asrama_id');
            if ($asramaId === 'non_asrama') {
                $query->whereNull('asrama_id');
            } else {
                $query->where('asrama_id', $asramaId);
            }
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->boolean('withoutAsrama')) {
            $query->whereNull('asrama_id');
        }

        if ($request->has('has_wallet')) {
            $hasWallet = filter_var($request->input('has_wallet'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($hasWallet === true) {
                $query->whereHas('wallet', fn($q) => $q->where('is_active', true));
            }
            if ($hasWallet === false) {
                $query->whereDoesntHave('wallet', fn($q) => $q->where('is_active', true));
            }
        }

        $paginator = $query
            ->with(['kelas', 'asrama', 'rfid_tag', 'wallet' => fn($q) => $q->where('is_active', true)])
            ->orderBy('nama_santri')
            ->paginate($perPage, ['*'], 'page', $page);

        return [
            'status' => 'success',
            'data' => SantriResource::collection($paginator->items()),
            'total' => $paginator->total(),
            'page' => $paginator->currentPage(),
            'perPage' => $paginator->perPage(),
        ];
    }

    public function findById(string $id): array
    {
        $santri = Santri::query()->with(['kelas', 'asrama'])->find($id);

        if (!$santri) {
            return ['status' => 'error', 'message' => 'Santri tidak ditemukan', 'status_code' => 404];
        }

        return ['status' => 'success', 'data' => new SantriResource($santri)];
    }

    public function create(Request $request): array
    {
        $data = method_exists($request, 'getSanitizedData')
            ? $request->getSanitizedData()
            : $this->sanitize($request->validate($this->storeRules()));

        if ($request->hasFile('foto')) {
            $data['foto'] = $request->file('foto')->store('foto-santri', 'r2');
        }

        $santri = Santri::create($data);

        return ['status' => 'success', 'message' => 'Santri berhasil disimpan', 'data' => $santri, 'status_code' => 201];
    }

    public function update(Request $request, string $id): array
    {
        $santri = Santri::find($id);

        if (!$santri) {
            return ['status' => 'error', 'message' => 'Santri tidak ditemukan', 'status_code' => 404];
        }

        $data = method_exists($request, 'getSanitizedData')
            ? $request->getSanitizedData()
            : $this->sanitize($request->validate($this->updateRules($santri->id)));

        if ($request->hasFile('foto')) {
            $data['foto'] = $request->file('foto')->store('foto-santri', 'r2');
        }

        $santri->update($data);

        return ['status' => 'success', 'message' => 'Santri berhasil diperbarui', 'data' => $santri];
    }

    private function sanitize(array $data): array
    {
        unset($data['kelas_nama'], $data['asrama_nama']);
        return $data;
    }

    public function delete(string $id): array
    {
        $santri = Santri::with(['wallet'])->find($id);

        if (!$santri) {
            return ['status' => 'error', 'message' => 'Santri tidak ditemukan', 'status_code' => 404];
        }

        $walletWarning = null;
        if ($santri->wallet && $santri->wallet->balance > 0) {
            $walletWarning = [
                'type' => 'Saldo Dompet',
                'count' => 1,
                'relation' => 'wallet',
                'action' => '⚠️ PENTING: Tarik saldo dompet sebesar Rp ' . number_format($santri->wallet->balance, 0, ',', '.') . ' terlebih dahulu! (Menu: Dompet → Penarikan Saldo)',
            ];
        }

        $validation = $this->validateDeletion($santri, [
            'tagihanSantri' => [
                'label' => 'Tagihan Santri',
                'action' => 'Hapus semua tagihan santri "' . $santri->nama_santri . '" terlebih dahulu (Menu: Tagihan Santri → Filter Santri)',
            ],
            'pembayaran' => [
                'label' => 'Pembayaran',
                'action' => 'Hapus semua pembayaran santri "' . $santri->nama_santri . '" terlebih dahulu (Menu: Pembayaran → Filter Santri)',
            ],
            'walletTransactions' => [
                'label' => 'Transaksi Dompet',
                'action' => 'Hapus semua transaksi dompet santri "' . $santri->nama_santri . '" terlebih dahulu',
            ],
            'wallet' => [
                'label' => 'Dompet Digital',
                'action' => 'Hapus dompet digital santri "' . $santri->nama_santri . '" terlebih dahulu',
            ],
            'rfid_tag' => [
                'label' => 'RFID Tag',
                'action' => 'Hapus RFID Tag santri "' . $santri->nama_santri . '" terlebih dahulu (Menu: RFID Tag)',
            ],
        ]);

        if ($walletWarning && !$validation['can_delete']) {
            array_unshift($validation['dependencies'], $walletWarning);
            $validation['instructions'] = str_replace(
                'Langkah yang harus dilakukan',
                'Langkah yang harus dilakukan (WAJIB BERURUTAN)',
                $validation['instructions']
            );
        }

        if (!$validation['can_delete']) {
            return [
                'status' => 'error',
                'message' => $validation['message'],
                'reason' => $validation['reason'],
                'dependencies' => $validation['dependencies'],
                'instructions' => $validation['instructions'],
                'status_code' => 422,
            ];
        }

        $santri->delete();

        return ['status' => 'success', 'message' => $validation['message']];
    }

    private function storeRules(): array
    {
        return [
            'nis' => ['required', 'string', 'max:255', 'unique:santri,nis'],
            'nama_santri' => ['required', 'string', 'max:255'],
            'tempat_lahir' => ['required', 'string', 'max:255'],
            'tanggal_lahir' => ['required', 'date'],
            'jenis_kelamin' => ['required', Rule::in(['L', 'P'])],
            'alamat' => ['required', 'string'],
            'nama_ayah' => ['required', 'string', 'max:255'],
            'nama_ibu' => ['required', 'string', 'max:255'],
            'nisn' => ['nullable', 'string', 'max:255'],
            'nik_santri' => ['nullable', 'string', 'max:255'],
            'kelas_id' => ['nullable'],
            'kelas_nama' => ['nullable', 'string', 'max:255'],
            'asrama_id' => ['nullable'],
            'asrama_nama' => ['nullable', 'string', 'max:255'],
            'asal_sekolah' => ['nullable', 'string', 'max:255'],
            'hobi' => ['nullable', 'string', 'max:255'],
            'cita_cita' => ['nullable', 'string', 'max:255'],
            'jumlah_saudara' => ['nullable', 'integer'],
            'provinsi' => ['nullable', 'string', 'max:255'],
            'kabupaten' => ['nullable', 'string', 'max:255'],
            'kecamatan' => ['nullable', 'string', 'max:255'],
            'desa' => ['nullable', 'string', 'max:255'],
            'kode_pos' => ['nullable', 'string', 'max:20'],
            'no_kk' => ['nullable', 'string', 'max:255'],
            'nik_ayah' => ['nullable', 'string', 'max:255'],
            'pendidikan_ayah' => ['nullable', 'string', 'max:255'],
            'pekerjaan_ayah' => ['nullable', 'string', 'max:255'],
            'hp_ayah' => ['nullable', 'string', 'max:255'],
            'nik_ibu' => ['nullable', 'string', 'max:255'],
            'pendidikan_ibu' => ['nullable', 'string', 'max:255'],
            'pekerjaan_ibu' => ['nullable', 'string', 'max:255'],
            'hp_ibu' => ['nullable', 'string', 'max:255'],
            'foto' => ['nullable', 'file', 'image', 'max:2048'],
            'status' => ['nullable', Rule::in(['aktif', 'keluar', 'mutasi', 'alumni', 'lulus'])],
            'jenis_penerimaan' => ['nullable', Rule::in(['baru', 'mutasi_masuk'])],
            'tanggal_keluar' => ['nullable', 'date'],
            'tujuan_mutasi' => ['nullable', 'string', 'max:255'],
            'alasan_mutasi' => ['nullable', 'string'],
        ];
    }

    private function updateRules(string $id): array
    {
        $rules = $this->storeRules();
        $rules['nis'] = ['required', 'string', 'max:255', Rule::unique('santri', 'nis')->ignore($id, 'id')];
        return $rules;
    }
}
