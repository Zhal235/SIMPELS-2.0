<?php

namespace App\Http\Controllers;

use App\Models\SantriTabungan;
use App\Models\SantriTabunganTransaction;
use App\Models\Santri;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class TabunganController extends Controller
{
    /**
     * GET /api/tabungan
     * Daftar semua santri yang memiliki tabungan, lengkap dengan data santri.
     */
    public function index(Request $request)
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

        $tabungan = $query->orderByDesc('saldo')->get()->map(function ($t) {
            return [
                'id'          => $t->id,
                'santri_id'   => $t->santri_id,
                'saldo'       => (float) $t->saldo,
                'status'      => $t->status,
                'opened_at'   => $t->opened_at?->format('Y-m-d'),
                'notes'       => $t->notes,
                'santri'      => [
                    'id'          => $t->santri->id,
                    'nis'         => $t->santri->nis,
                    'nama_santri' => $t->santri->nama_santri,
                    'foto'        => $t->santri->foto,
                    'kelas'       => $t->santri->kelas?->nama_kelas,
                    'asrama'      => $t->santri->asrama?->nama_asrama,
                ],
            ];
        });

        $totalSaldo      = $tabungan->sum('saldo');
        $totalSantri     = $tabungan->count();
        $totalAktif      = $tabungan->where('status', 'aktif')->count();

        return response()->json([
            'success' => true,
            'data'    => $tabungan,
            'summary' => [
                'total_saldo'    => $totalSaldo,
                'total_santri'   => $totalSantri,
                'total_aktif'    => $totalAktif,
                'total_nonaktif' => $totalSantri - $totalAktif,
            ],
        ]);
    }

    /**
     * POST /api/tabungan
     * Buka tabungan baru untuk santri.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'santri_id' => 'required|exists:santri,id',
            'opened_at' => 'required|date',
            'notes'     => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        // Cek apakah santri sudah punya tabungan
        $existing = SantriTabungan::where('santri_id', $request->santri_id)->first();
        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Santri ini sudah memiliki tabungan.',
            ], 409);
        }

        $tabungan = SantriTabungan::create([
            'santri_id' => $request->santri_id,
            'saldo'     => 0,
            'status'    => 'aktif',
            'opened_at' => $request->opened_at,
            'notes'     => $request->notes,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tabungan berhasil dibuka.',
            'data'    => $tabungan,
        ], 201);
    }

    /**
     * GET /api/tabungan/{santriId}
     * Detail tabungan milik satu santri.
     */
    public function show($santriId)
    {
        $tabungan = SantriTabungan::with(['santri.kelas', 'santri.asrama'])
            ->where('santri_id', $santriId)
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data'    => [
                'id'        => $tabungan->id,
                'santri_id' => $tabungan->santri_id,
                'saldo'     => (float) $tabungan->saldo,
                'status'    => $tabungan->status,
                'opened_at' => $tabungan->opened_at?->format('Y-m-d'),
                'notes'     => $tabungan->notes,
                'santri'    => [
                    'id'          => $tabungan->santri->id,
                    'nis'         => $tabungan->santri->nis,
                    'nama_santri' => $tabungan->santri->nama_santri,
                    'foto'        => $tabungan->santri->foto,
                    'kelas'       => $tabungan->santri->kelas?->nama_kelas,
                    'asrama'      => $tabungan->santri->asrama?->nama_asrama,
                ],
            ],
        ]);
    }

    /**
     * PATCH /api/tabungan/{santriId}
     * Update status / notes tabungan.
     */
    public function update(Request $request, $santriId)
    {
        $tabungan = SantriTabungan::where('santri_id', $santriId)->firstOrFail();

        $validator = Validator::make($request->all(), [
            'status' => 'sometimes|in:aktif,nonaktif',
            'notes'  => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $tabungan->update($request->only(['status', 'notes']));

        return response()->json(['success' => true, 'data' => $tabungan]);
    }

    /**
     * POST /api/tabungan/{santriId}/setor
     * Setor tabungan (credit).
     */
    public function setor(Request $request, $santriId)
    {
        $validator = Validator::make($request->all(), [
            'amount'      => 'required|numeric|min:1',
            'description' => 'nullable|string|max:255',
            'method'      => 'nullable|in:cash,transfer',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $tabungan = SantriTabungan::where('santri_id', $santriId)->firstOrFail();

        if ($tabungan->status === 'nonaktif') {
            return response()->json([
                'success' => false,
                'message' => 'Tabungan ini sudah dinonaktifkan.',
            ], 400);
        }

        try {
            DB::beginTransaction();

            $saldoBaru = $tabungan->saldo + $request->amount;
            $tabungan->update(['saldo' => $saldoBaru]);

            $trx = SantriTabunganTransaction::create([
                'tabungan_id' => $tabungan->id,
                'santri_id'   => $santriId,
                'type'        => 'setor',
                'amount'      => $request->amount,
                'saldo_after' => $saldoBaru,
                'description' => $request->description,
                'method'      => $request->method ?? 'cash',
                'recorded_by' => $request->user()?->id,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Setoran berhasil dicatat.',
                'data'    => [
                    'saldo_baru'  => $saldoBaru,
                    'transaction' => $trx,
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/tabungan/{santriId}/tarik
     * Tarik tabungan (debit).
     */
    public function tarik(Request $request, $santriId)
    {
        $validator = Validator::make($request->all(), [
            'amount'      => 'required|numeric|min:1',
            'description' => 'nullable|string|max:255',
            'method'      => 'nullable|in:cash,transfer',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $tabungan = SantriTabungan::where('santri_id', $santriId)->firstOrFail();

        if ($tabungan->status === 'nonaktif') {
            return response()->json([
                'success' => false,
                'message' => 'Tabungan ini sudah dinonaktifkan.',
            ], 400);
        }

        if ($request->amount > $tabungan->saldo) {
            return response()->json([
                'success' => false,
                'message' => 'Saldo tabungan tidak mencukupi.',
            ], 400);
        }

        try {
            DB::beginTransaction();

            $saldoBaru = $tabungan->saldo - $request->amount;
            $tabungan->update(['saldo' => $saldoBaru]);

            $trx = SantriTabunganTransaction::create([
                'tabungan_id' => $tabungan->id,
                'santri_id'   => $santriId,
                'type'        => 'tarik',
                'amount'      => $request->amount,
                'saldo_after' => $saldoBaru,
                'description' => $request->description,
                'method'      => $request->method ?? 'cash',
                'recorded_by' => $request->user()?->id,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Penarikan berhasil dicatat.',
                'data'    => [
                    'saldo_baru'  => $saldoBaru,
                    'transaction' => $trx,
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/tabungan/{santriId}/history
     * Riwayat transaksi tabungan per santri.
     */
    public function history(Request $request, $santriId)
    {
        $tabungan = SantriTabungan::where('santri_id', $santriId)->firstOrFail();

        $transactions = SantriTabunganTransaction::where('tabungan_id', $tabungan->id)
            ->with('recordedBy:id,name')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($t) => [
                'id'          => $t->id,
                'type'        => $t->type,
                'amount'      => (float) $t->amount,
                'saldo_after' => (float) $t->saldo_after,
                'description' => $t->description,
                'method'      => $t->method,
                'recorded_by' => $t->recordedBy?->name,
                'created_at'  => $t->created_at->format('Y-m-d H:i:s'),
            ]);

        return response()->json([
            'success' => true,
            'data'    => $transactions,
            'tabungan' => [
                'id'     => $tabungan->id,
                'saldo'  => (float) $tabungan->saldo,
                'status' => $tabungan->status,
            ],
        ]);
    }

    /**
     * GET /api/tabungan/laporan/summary
     * Laporan ringkas tabungan: total saldo, setor/tarik bulan ini.
     */
    public function laporan()
    {
        $totalSaldo  = SantriTabungan::where('status', 'aktif')->sum('saldo');
        $totalSantri = SantriTabungan::where('status', 'aktif')->count();

        $startOfMonth = now()->startOfMonth();
        $setorMonth   = SantriTabunganTransaction::where('type', 'setor')
                            ->where('created_at', '>=', $startOfMonth)
                            ->sum('amount');
        $tarikMonth   = SantriTabunganTransaction::where('type', 'tarik')
                            ->where('created_at', '>=', $startOfMonth)
                            ->sum('amount');

        return response()->json([
            'success' => true,
            'data'    => [
                'total_saldo'       => (float) $totalSaldo,
                'total_santri'      => $totalSantri,
                'setor_bulan_ini'   => (float) $setorMonth,
                'tarik_bulan_ini'   => (float) $tarikMonth,
            ],
        ]);
    }

    /**
     * DELETE /api/tabungan/{santriId}
     * Tutup dan hapus tabungan. Jika ada saldo, catat transaksi penarikan terlebih dahulu.
     */
    public function destroy(Request $request, $santriId)
    {
        $tabungan = SantriTabungan::where('santri_id', $santriId)->firstOrFail();

        try {
            DB::beginTransaction();

            if ($tabungan->saldo > 0) {
                SantriTabunganTransaction::create([
                    'tabungan_id' => $tabungan->id,
                    'santri_id'   => $santriId,
                    'type'        => 'tarik',
                    'amount'      => $tabungan->saldo,
                    'saldo_after' => 0,
                    'description' => 'Penarikan saldo saat penutupan tabungan',
                    'method'      => 'cash',
                    'recorded_by' => $request->user()?->id,
                ]);
            }

            SantriTabunganTransaction::where('tabungan_id', $tabungan->id)->delete();
            $tabungan->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Tabungan berhasil ditutup dan dihapus.',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
