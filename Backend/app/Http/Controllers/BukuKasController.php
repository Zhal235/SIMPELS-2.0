<?php

namespace App\Http\Controllers;

use App\Models\BukuKas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class BukuKasController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $bukuKasList = BukuKas::all();

        $result = $bukuKasList->map(function ($bukuKas) {
            // Hitung saldo dari transaksi (nanti akan dikembangkan)
            // Sementara hanya pakai saldo awal
            $saldoCash = $bukuKas->saldo_cash_awal;
            $saldoBank = $bukuKas->saldo_bank_awal;
            $totalPemasukan = 0;
            $totalPengeluaran = 0;

            // TODO: Nanti tambahkan perhitungan dari tabel transaksi_kas
            // $transaksi = $bukuKas->transaksi;
            // foreach ($transaksi as $trx) {
            //     if ($trx->jenis === 'pemasukan') {
            //         $totalPemasukan += $trx->nominal;
            //         if ($trx->metode === 'cash') $saldoCash += $trx->nominal;
            //         else $saldoBank += $trx->nominal;
            //     } else {
            //         $totalPengeluaran += $trx->nominal;
            //         if ($trx->metode === 'cash') $saldoCash -= $trx->nominal;
            //         else $saldoBank -= $trx->nominal;
            //     }
            // }

            return [
                'id' => $bukuKas->id,
                'nama_kas' => $bukuKas->nama_kas,
                'saldo_cash' => (float) $saldoCash,
                'saldo_bank' => (float) $saldoBank,
                'total_saldo' => (float) ($saldoCash + $saldoBank),
                'total_pemasukan' => (float) $totalPemasukan,
                'total_pengeluaran' => (float) $totalPengeluaran,
                'transaksi' => [] // Nanti diisi dari tabel transaksi_kas
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $result
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama_kas' => 'required|string|max:255',
            'saldo_cash_awal' => 'nullable|numeric|min:0',
            'saldo_bank_awal' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $bukuKas = BukuKas::create([
            'nama_kas' => $request->nama_kas,
            'saldo_cash_awal' => $request->saldo_cash_awal ?? 0,
            'saldo_bank_awal' => $request->saldo_bank_awal ?? 0,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Buku kas berhasil ditambahkan',
            'data' => $bukuKas
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $bukuKas = BukuKas::find($id);

        if (!$bukuKas) {
            return response()->json([
                'success' => false,
                'message' => 'Buku kas tidak ditemukan'
            ], 404);
        }

        // Hitung saldo real dari transaksi
        $saldoCash = $bukuKas->saldo_cash_awal;
        $saldoBank = $bukuKas->saldo_bank_awal;
        $totalPemasukan = 0;
        $totalPengeluaran = 0;
        $transaksi = []; // Nanti dari tabel transaksi_kas

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $bukuKas->id,
                'nama_kas' => $bukuKas->nama_kas,
                'saldo_cash' => (float) $saldoCash,
                'saldo_bank' => (float) $saldoBank,
                'total_saldo' => (float) ($saldoCash + $saldoBank),
                'total_pemasukan' => (float) $totalPemasukan,
                'total_pengeluaran' => (float) $totalPengeluaran,
                'transaksi' => $transaksi
            ]
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $bukuKas = BukuKas::find($id);

        if (!$bukuKas) {
            return response()->json([
                'success' => false,
                'message' => 'Buku kas tidak ditemukan'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nama_kas' => 'required|string|max:255',
            'saldo_cash_awal' => 'nullable|numeric|min:0',
            'saldo_bank_awal' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $bukuKas->update([
            'nama_kas' => $request->nama_kas,
            'saldo_cash_awal' => $request->saldo_cash_awal ?? 0,
            'saldo_bank_awal' => $request->saldo_bank_awal ?? 0,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Buku kas berhasil diupdate',
            'data' => $bukuKas
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $bukuKas = BukuKas::find($id);

        if (!$bukuKas) {
            return response()->json([
                'success' => false,
                'message' => 'Buku kas tidak ditemukan'
            ], 404);
        }

        $bukuKas->delete();

        return response()->json([
            'success' => true,
            'message' => 'Buku kas berhasil dihapus'
        ]);
    }
}
