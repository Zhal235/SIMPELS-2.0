<?php

namespace App\Http\Controllers;

use App\Models\BukuKas;
use App\Models\TransaksiKas;
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
            // Hitung total pemasukan dan pengeluaran dari transaksi
            // Exclude internal transfers (Transfer Internal Masuk/Keluar) dari laporan
            $totalPemasukanCash = TransaksiKas::where('buku_kas_id', $bukuKas->id)
                ->where('jenis', 'pemasukan')
                ->where('metode', 'cash')
                ->where('kategori', 'NOT LIKE', 'Transfer Internal%')
                ->sum('nominal');
            
            $totalPemasukanBank = TransaksiKas::where('buku_kas_id', $bukuKas->id)
                ->where('jenis', 'pemasukan')
                ->where('metode', 'transfer')
                ->where('kategori', 'NOT LIKE', 'Transfer Internal%')
                ->sum('nominal');
            
            $totalPengeluaranCash = TransaksiKas::where('buku_kas_id', $bukuKas->id)
                ->where('jenis', 'pengeluaran')
                ->where('metode', 'cash')
                ->where('kategori', 'NOT LIKE', 'Transfer Internal%')
                ->sum('nominal');
            
            $totalPengeluaranBank = TransaksiKas::where('buku_kas_id', $bukuKas->id)
                ->where('jenis', 'pengeluaran')
                ->where('metode', 'transfer')
                ->where('kategori', 'NOT LIKE', 'Transfer Internal%')
                ->sum('nominal');

            // Untuk saldo, kita harus INCLUDE transfer internal karena itu perpindahan uang
            // Transfer Internal Masuk (cash) = uang dari bank ke cash
            $transferInternalMasukCash = TransaksiKas::where('buku_kas_id', $bukuKas->id)
                ->where('jenis', 'pemasukan')
                ->where('metode', 'cash')
                ->where('kategori', 'LIKE', 'Transfer Internal%')
                ->sum('nominal');
            
            // Transfer Internal Keluar (bank) = uang dari bank ke cash
            $transferInternalKeluarBank = TransaksiKas::where('buku_kas_id', $bukuKas->id)
                ->where('jenis', 'pengeluaran')
                ->where('metode', 'transfer')
                ->where('kategori', 'LIKE', 'Transfer Internal%')
                ->sum('nominal');
            
            // Transfer Internal Masuk (bank) = uang dari cash ke bank
            $transferInternalMasukBank = TransaksiKas::where('buku_kas_id', $bukuKas->id)
                ->where('jenis', 'pemasukan')
                ->where('metode', 'transfer')
                ->where('kategori', 'LIKE', 'Transfer Internal%')
                ->sum('nominal');
            
            // Transfer Internal Keluar (cash) = uang dari cash ke bank
            $transferInternalKeluarCash = TransaksiKas::where('buku_kas_id', $bukuKas->id)
                ->where('jenis', 'pengeluaran')
                ->where('metode', 'cash')
                ->where('kategori', 'LIKE', 'Transfer Internal%')
                ->sum('nominal');

            // Saldo = saldo awal + pemasukan - pengeluaran + transfer internal
            $saldoCash = $bukuKas->saldo_cash_awal 
                + $totalPemasukanCash 
                - $totalPengeluaranCash
                + $transferInternalMasukCash 
                - $transferInternalKeluarCash;
                
            $saldoBank = $bukuKas->saldo_bank_awal 
                + $totalPemasukanBank 
                - $totalPengeluaranBank
                + $transferInternalMasukBank 
                - $transferInternalKeluarBank;
            
            $totalPemasukan = $totalPemasukanCash + $totalPemasukanBank;
            $totalPengeluaran = $totalPengeluaranCash + $totalPengeluaranBank;

            return [
                'id' => $bukuKas->id,
                'nama_kas' => $bukuKas->nama_kas,
                'saldo_cash' => (float) $saldoCash,
                'saldo_bank' => (float) $saldoBank,
                'total_saldo' => (float) ($saldoCash + $saldoBank),
                'total_pemasukan' => (float) $totalPemasukan,
                'total_pengeluaran' => (float) $totalPengeluaran,
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
