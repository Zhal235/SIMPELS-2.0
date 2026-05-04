<?php

namespace App\Http\Controllers;

use App\Models\TransaksiKas;
use App\Models\BukuKas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class TransaksiKasController extends Controller
{
    public function index(Request $request)
    {
        // Default: bulan ini jika tidak ada filter tanggal sama sekali
        $hasDateFilter = $request->has('start_date') || $request->has('end_date');

        $query = TransaksiKas::with(['bukuKas:id,nama_kas', 'author:id,name'])
            ->select([
                'id', 'buku_kas_id', 'no_transaksi', 'tanggal', 'jenis',
                'metode', 'kategori', 'kategori_id', 'nominal', 'keterangan',
                'pembayaran_id', 'created_by', 'created_at', 'updated_at'
            ]);

        if ($request->has('buku_kas_id')) {
            $query->where('buku_kas_id', $request->buku_kas_id);
        }

        if ($request->has('jenis')) {
            $query->where('jenis', $request->jenis);
        }

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('tanggal', [$request->start_date, $request->end_date]);
        } elseif ($request->has('start_date')) {
            $query->where('tanggal', '>=', $request->start_date);
        } elseif ($request->has('end_date')) {
            $query->where('tanggal', '<=', $request->end_date);
        } elseif (!$hasDateFilter) {
            // Default: bulan ini agar tidak load semua data
            $query->whereYear('tanggal', now()->year)
                  ->whereMonth('tanggal', now()->month);
        }

        if ($request->has('created_by') && $request->created_by !== '') {
            $query->where('created_by', $request->created_by);
        }

        if ($request->get('group_by') === 'kategori') {
            $groupQ = clone $query;
            if ($request->has('jenis')) {
                $groupQ->where('jenis', $request->jenis);
            }
            $grouped = $groupQ->select('kategori_id', 'kategori', DB::raw('SUM(nominal) as total'))
                ->groupBy('kategori_id', 'kategori')
                ->orderBy('total', 'desc')
                ->get();
            return response()->json(['success' => true, 'data' => $grouped]);
        }

        $transaksi = $query->orderBy('tanggal', 'desc')->orderBy('id', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $transaksi,
            'meta' => [
                'total' => $transaksi->count(),
                'filtered_by_default_month' => !$hasDateFilter,
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'buku_kas_id' => 'required|exists:buku_kas,id',
            'tanggal' => 'required|date',
            'jenis' => 'required|in:pemasukan,pengeluaran',
            'metode' => 'required|in:cash,transfer',
            'kategori' => 'required_without:kategori_id|string',
            'kategori_id' => 'nullable|exists:kategori_pengeluaran,id',
            'nominal' => 'required|numeric|min:0',
            'keterangan' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $noTransaksi = TransaksiKas::generateNoTransaksi($request->jenis);

        $transaksi = TransaksiKas::create([
            'buku_kas_id' => $request->buku_kas_id,
            'no_transaksi' => $noTransaksi,
            'tanggal' => $request->tanggal,
            'jenis' => $request->jenis,
            'metode' => $request->metode,
            'kategori' => $request->kategori_id ? (\App\Models\KategoriPengeluaran::find($request->kategori_id)?->name ?? $request->kategori) : $request->kategori,
            'kategori_id' => $request->kategori_id ?? null,
            'nominal' => $request->nominal,
            'keterangan' => $request->keterangan,
            'created_by' => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Transaksi berhasil dicatat',
            'data' => $transaksi->load(['bukuKas:id,nama_kas', 'author:id,name'])
        ], 201);
    }

    public function update(Request $request, string $id)
    {
        $transaksi = TransaksiKas::find($id);

        if (!$transaksi) {
            return response()->json(['success' => false, 'message' => 'Transaksi tidak ditemukan'], 404);
        }

        if ($transaksi->pembayaran_id) {
            return response()->json(['success' => false, 'message' => 'Tidak bisa mengedit transaksi yang terkait dengan pembayaran.'], 400);
        }

        $validator = Validator::make($request->all(), [
            'buku_kas_id' => 'required|exists:buku_kas,id',
            'tanggal'     => 'required|date',
            'jenis'       => 'required|in:pemasukan,pengeluaran',
            'metode'      => 'required|in:cash,transfer',
            'kategori'    => 'required|string',
            'kategori_id' => 'nullable|exists:kategori_pengeluaran,id',
            'nominal'     => 'required|numeric|min:0',
            'keterangan'  => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $validator->errors()], 422);
        }

        $transaksi->update([
            'buku_kas_id' => $request->buku_kas_id,
            'tanggal'     => $request->tanggal,
            'jenis'       => $request->jenis,
            'metode'      => $request->metode,
            'kategori'    => $request->kategori_id
                ? (\App\Models\KategoriPengeluaran::find($request->kategori_id)?->name ?? $request->kategori)
                : $request->kategori,
            'kategori_id' => $request->kategori_id ?? null,
            'nominal'     => $request->nominal,
            'keterangan'  => $request->keterangan,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Transaksi berhasil diperbarui',
            'data'    => $transaksi->load(['bukuKas:id,nama_kas', 'author:id,name'])
        ]);
    }

    public function show(string $id)
    {
        $transaksi = TransaksiKas::with(['bukuKas', 'pembayaran'])->find($id);

        if (!$transaksi) {
            return response()->json(['success' => false, 'message' => 'Transaksi tidak ditemukan'], 404);
        }

        return response()->json(['success' => true, 'data' => $transaksi]);
    }

    public function destroy(string $id)
    {
        $transaksi = TransaksiKas::find($id);

        if (!$transaksi) {
            return response()->json(['success' => false, 'message' => 'Transaksi tidak ditemukan'], 404);
        }

        if ($transaksi->pembayaran_id) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak bisa menghapus transaksi yang terkait dengan pembayaran. Batalkan pembayaran terlebih dahulu.'
            ], 400);
        }

        $transaksi->delete();

        return response()->json(['success' => true, 'message' => 'Transaksi berhasil dihapus']);
    }
}
