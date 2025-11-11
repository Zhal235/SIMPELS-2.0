<?php

namespace App\Http\Controllers;

use App\Models\TransaksiKas;
use App\Models\BukuKas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TransaksiKasController extends Controller
{
    /**
     * Display a listing of the resource (untuk laporan transaksi)
     */
    public function index(Request $request)
    {
        $query = TransaksiKas::with(['bukuKas', 'pembayaran']);

        // Filter by buku kas
        if ($request->has('buku_kas_id')) {
            $query->where('buku_kas_id', $request->buku_kas_id);
        }

        // Filter by jenis (pemasukan/pengeluaran)
        if ($request->has('jenis')) {
            $query->where('jenis', $request->jenis);
        }

        // Filter by date range
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('tanggal', [$request->start_date, $request->end_date]);
        }

        $transaksi = $query->orderBy('tanggal', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $transaksi
        ]);
    }

    /**
     * Store a newly created resource (manual input transaksi)
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'buku_kas_id' => 'required|exists:buku_kas,id',
            'tanggal' => 'required|date',
            'jenis' => 'required|in:pemasukan,pengeluaran',
            'metode' => 'required|in:cash,transfer',
            'kategori' => 'required|string',
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
            'kategori' => $request->kategori,
            'nominal' => $request->nominal,
            'keterangan' => $request->keterangan,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Transaksi berhasil dicatat',
            'data' => $transaksi->load('bukuKas')
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $transaksi = TransaksiKas::with(['bukuKas', 'pembayaran'])->find($id);

        if (!$transaksi) {
            return response()->json([
                'success' => false,
                'message' => 'Transaksi tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $transaksi
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $transaksi = TransaksiKas::find($id);

        if (!$transaksi) {
            return response()->json([
                'success' => false,
                'message' => 'Transaksi tidak ditemukan'
            ], 404);
        }

        // Tidak bisa hapus transaksi yang terkait dengan pembayaran
        if ($transaksi->pembayaran_id) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak bisa menghapus transaksi yang terkait dengan pembayaran. Batalkan pembayaran terlebih dahulu.'
            ], 400);
        }

        $transaksi->delete();

        return response()->json([
            'success' => true,
            'message' => 'Transaksi berhasil dihapus'
        ]);
    }
}
