<?php

namespace App\Services\Tabungan;

use App\Models\SantriTabungan;
use App\Models\SantriTabunganTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TabunganService
{
    public function getList(Request $request): array
    {
        $query = SantriTabungan::with(['santri.kelas', 'santri.asrama']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('kelas_id')) {
            $query->whereHas('santri', fn($q) => $q->where('kelas_id', $request->kelas_id));
        }

        if ($request->filled('asrama_id')) {
            $query->whereHas('santri', fn($q) => $q->where('asrama_id', $request->asrama_id));
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('santri', fn($q) =>
                $q->where('nama_santri', 'LIKE', "%{$search}%")
                  ->orWhere('nis', 'LIKE', "%{$search}%")
            );
        }

        $tabungan = $query->orderByDesc('saldo')->get()->map(fn($t) => [
            'id' => $t->id,
            'santri_id' => $t->santri_id,
            'saldo' => (float) $t->saldo,
            'status' => $t->status,
            'opened_at' => $t->opened_at?->format('Y-m-d'),
            'notes' => $t->notes,
            'santri' => [
                'id' => $t->santri->id,
                'nis' => $t->santri->nis,
                'nama_santri' => $t->santri->nama_santri,
                'foto' => $t->santri->foto,
                'kelas' => $t->santri->kelas?->nama_kelas,
                'asrama' => $t->santri->asrama?->nama_asrama,
            ],
        ]);

        $totalSaldo = $tabungan->sum('saldo');
        $totalSantri = $tabungan->count();
        $totalAktif = $tabungan->where('status', 'aktif')->count();

        return [
            'success' => true,
            'data' => $tabungan,
            'summary' => [
                'total_saldo' => $totalSaldo,
                'total_santri' => $totalSantri,
                'total_aktif' => $totalAktif,
                'total_nonaktif' => $totalSantri - $totalAktif,
            ],
        ];
    }

    public function createTabungan(Request $request): array
    {
        $existing = SantriTabungan::where('santri_id', $request->santri_id)->first();
        if ($existing) {
            return ['success' => false, 'message' => 'Santri ini sudah memiliki tabungan.', 'status_code' => 409];
        }

        $tabungan = SantriTabungan::create([
            'santri_id' => $request->santri_id,
            'saldo' => 0,
            'status' => 'aktif',
            'opened_at' => $request->opened_at,
            'notes' => $request->notes,
        ]);

        return ['success' => true, 'message' => 'Tabungan berhasil dibuka.', 'data' => $tabungan, 'status_code' => 201];
    }

    public function getDetail(string $santriId): array
    {
        $tabungan = SantriTabungan::with(['santri.kelas', 'santri.asrama'])
            ->where('santri_id', $santriId)
            ->first();

        if (!$tabungan) {
            return ['success' => false, 'data' => null, 'message' => 'Tabungan tidak ditemukan', 'status_code' => 404];
        }

        return [
            'success' => true,
            'data' => [
                'id' => $tabungan->id,
                'santri_id' => $tabungan->santri_id,
                'saldo' => (float) $tabungan->saldo,
                'status' => $tabungan->status,
                'opened_at' => $tabungan->opened_at?->format('Y-m-d'),
                'notes' => $tabungan->notes,
                'santri' => [
                    'id' => $tabungan->santri->id,
                    'nis' => $tabungan->santri->nis,
                    'nama_santri' => $tabungan->santri->nama_santri,
                    'foto' => $tabungan->santri->foto,
                    'kelas' => $tabungan->santri->kelas?->nama_kelas,
                    'asrama' => $tabungan->santri->asrama?->nama_asrama,
                ],
            ],
        ];
    }

    public function updateTabungan(Request $request, string $santriId): array
    {
        $tabungan = SantriTabungan::where('santri_id', $santriId)->firstOrFail();
        $tabungan->update($request->only(['status', 'notes']));

        return ['success' => true, 'data' => $tabungan];
    }

    public function setor(Request $request, string $santriId): array
    {
        $tabungan = SantriTabungan::where('santri_id', $santriId)->firstOrFail();

        if ($tabungan->status === 'nonaktif') {
            return ['success' => false, 'message' => 'Tabungan ini sudah dinonaktifkan.', 'status_code' => 400];
        }

        try {
            DB::beginTransaction();

            $saldoBaru = $tabungan->saldo + $request->amount;
            $tabungan->update(['saldo' => $saldoBaru]);

            $trx = SantriTabunganTransaction::create([
                'tabungan_id' => $tabungan->id,
                'santri_id' => $santriId,
                'type' => 'setor',
                'amount' => $request->amount,
                'saldo_after' => $saldoBaru,
                'description' => $request->description,
                'method' => $request->method ?? 'cash',
                'recorded_by' => $request->user()?->id,
            ]);

            DB::commit();

            return [
                'success' => true,
                'message' => 'Setoran berhasil dicatat.',
                'data' => [
                    'saldo_baru' => $saldoBaru,
                    'transaction' => $trx,
                ],
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            return ['success' => false, 'message' => $e->getMessage(), 'status_code' => 500];
        }
    }

    public function tarik(Request $request, string $santriId): array
    {
        $tabungan = SantriTabungan::where('santri_id', $santriId)->firstOrFail();

        if ($tabungan->status === 'nonaktif') {
            return ['success' => false, 'message' => 'Tabungan ini sudah dinonaktifkan.', 'status_code' => 400];
        }

        if ($request->amount > $tabungan->saldo) {
            return ['success' => false, 'message' => 'Saldo tabungan tidak mencukupi.', 'status_code' => 400];
        }

        try {
            DB::beginTransaction();

            $saldoBaru = $tabungan->saldo - $request->amount;
            $tabungan->update(['saldo' => $saldoBaru]);

            $trx = SantriTabunganTransaction::create([
                'tabungan_id' => $tabungan->id,
                'santri_id' => $santriId,
                'type' => 'tarik',
                'amount' => $request->amount,
                'saldo_after' => $saldoBaru,
                'description' => $request->description,
                'method' => $request->method ?? 'cash',
                'recorded_by' => $request->user()?->id,
            ]);

            DB::commit();

            return [
                'success' => true,
                'message' => 'Penarikan berhasil dicatat.',
                'data' => [
                    'saldo_baru' => $saldoBaru,
                    'transaction' => $trx,
                ],
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            return ['success' => false, 'message' => $e->getMessage(), 'status_code' => 500];
        }
    }

    public function getHistory(string $santriId): array
    {
        $tabungan = SantriTabungan::where('santri_id', $santriId)->firstOrFail();

        $transactions = SantriTabunganTransaction::where('tabungan_id', $tabungan->id)
            ->with('recordedBy:id,name')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'type' => $t->type,
                'amount' => (float) $t->amount,
                'saldo_after' => (float) $t->saldo_after,
                'description' => $t->description,
                'method' => $t->method,
                'recorded_by' => $t->recordedBy?->name,
                'created_at' => $t->created_at->format('Y-m-d H:i:s'),
            ]);

        return [
            'success' => true,
            'data' => $transactions,
            'tabungan' => [
                'id' => $tabungan->id,
                'saldo' => (float) $tabungan->saldo,
                'status' => $tabungan->status,
            ],
        ];
    }

    public function getLaporanSummary(): array
    {
        $totalSaldo = SantriTabungan::where('status', 'aktif')->sum('saldo');
        $totalSantri = SantriTabungan::where('status', 'aktif')->count();

        $startOfMonth = now()->startOfMonth();
        $setorMonth = SantriTabunganTransaction::where('type', 'setor')
            ->where('created_at', '>=', $startOfMonth)
            ->sum('amount');
        $tarikMonth = SantriTabunganTransaction::where('type', 'tarik')
            ->where('created_at', '>=', $startOfMonth)
            ->sum('amount');

        return [
            'success' => true,
            'data' => [
                'total_saldo' => (float) $totalSaldo,
                'total_santri' => $totalSantri,
                'setor_bulan_ini' => (float) $setorMonth,
                'tarik_bulan_ini' => (float) $tarikMonth,
            ],
        ];
    }

    public function editTransaction(Request $request, string $transactionId): array
    {
        $trx = SantriTabunganTransaction::findOrFail($transactionId);
        $tabungan = $trx->tabungan;

        try {
            DB::beginTransaction();

            $selisih = $request->amount - $trx->amount;

            $allTrx = SantriTabunganTransaction::where('tabungan_id', $tabungan->id)
                ->orderBy('created_at', 'asc')
                ->orderBy('id', 'asc')
                ->get();

            $trx->amount = $request->amount;
            $trx->description = $request->description ?? $trx->description;
            $trx->method = $request->method ?? $trx->method;
            $trx->save();

            $runningSaldo = 0;
            foreach ($allTrx as $t) {
                $amt = ($t->id === $trx->id) ? $request->amount : $t->amount;
                $runningSaldo = $t->type === 'setor'
                    ? $runningSaldo + $amt
                    : $runningSaldo - $amt;
                SantriTabunganTransaction::where('id', $t->id)->update(['saldo_after' => $runningSaldo]);
            }

            $tabungan->update(['saldo' => $tabungan->saldo + (
                $trx->type === 'setor' ? $selisih : -$selisih
            )]);

            DB::commit();

            return ['success' => true, 'message' => 'Transaksi berhasil diperbarui.'];
        } catch (\Exception $e) {
            DB::rollBack();
            return ['success' => false, 'message' => $e->getMessage(), 'status_code' => 500];
        }
    }

    public function closeTabungan(Request $request, string $santriId): array
    {
        $tabungan = SantriTabungan::where('santri_id', $santriId)->firstOrFail();

        try {
            DB::beginTransaction();

            if ($tabungan->saldo > 0) {
                SantriTabunganTransaction::create([
                    'tabungan_id' => $tabungan->id,
                    'santri_id' => $santriId,
                    'type' => 'tarik',
                    'amount' => $tabungan->saldo,
                    'saldo_after' => 0,
                    'description' => 'Penarikan saldo saat penutupan tabungan',
                    'method' => 'cash',
                    'recorded_by' => $request->user()?->id,
                ]);
            }

            SantriTabunganTransaction::where('tabungan_id', $tabungan->id)->delete();
            $tabungan->delete();

            DB::commit();

            return ['success' => true, 'message' => 'Tabungan berhasil ditutup dan dihapus.'];
        } catch (\Exception $e) {
            DB::rollBack();
            return ['success' => false, 'message' => $e->getMessage(), 'status_code' => 500];
        }
    }
}
