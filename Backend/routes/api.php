<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Kesantrian\SantriController;
use App\Http\Controllers\Kesantrian\AsramaController;
use App\Http\Controllers\KelasController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\JenisTagihanController;
use App\Http\Controllers\TahunAjaranController;
use App\Http\Controllers\TagihanSantriController;
use App\Http\Controllers\BukuKasController;
use App\Http\Controllers\PembayaranController;
use App\Http\Controllers\TransaksiKasController;
use App\Http\Controllers\WalletController;
use App\Http\Controllers\RfidTagController;
use App\Http\Controllers\EposController;

// Authentication routes (public)
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    // Admin: manage users
    Route::get('/v1/users', [\App\Http\Controllers\UserController::class, 'index']);
    Route::put('/v1/users/{id}', [\App\Http\Controllers\UserController::class, 'update']);
    Route::delete('/v1/users/{id}', [\App\Http\Controllers\UserController::class, 'destroy']);

// API v1 endpoints untuk modul Kesantrian (Santri)
Route::prefix('v1/kesantrian')->group(function () {
    Route::apiResource('santri', SantriController::class);
});

// API v1 endpoints untuk modul Keuangan
Route::prefix('v1/keuangan')->group(function () {
    Route::apiResource('jenis-tagihan', JenisTagihanController::class);
    Route::apiResource('buku-kas', BukuKasController::class);
    
    // Tagihan Santri
    Route::post('tagihan-santri/generate', [TagihanSantriController::class, 'generate']);
    Route::post('tagihan-santri/tunggakan', [TagihanSantriController::class, 'createTunggakan']);
    Route::apiResource('tagihan-santri', TagihanSantriController::class);
    Route::get('tagihan-santri/santri/{santriId}', [TagihanSantriController::class, 'getBySantri']);
    
    // Pembayaran
    Route::get('pembayaran/santri/{santriId}/history', [PembayaranController::class, 'history']);
    Route::get('pembayaran/santri/{santriId}/tagihan', [PembayaranController::class, 'getTagihanBySantri']);
    Route::apiResource('pembayaran', PembayaranController::class);
    
    // Transaksi Kas (Laporan)
    Route::apiResource('transaksi-kas', TransaksiKasController::class);
});

// API v1 endpoints untuk Dompet Digital / Wallets
// Admin-protected wallet management (requires authentication)
Route::prefix('v1/wallets')->middleware('auth:sanctum')->group(function () {
    // Wallet management per-santri
    Route::get('/', [WalletController::class, 'index']);
    Route::get('/{santriId}', [WalletController::class, 'show']);
    Route::post('/{santriId}/topup', [WalletController::class, 'topup']);
    Route::post('/{santriId}/debit', [WalletController::class, 'debit']);
    Route::get('/{santriId}/transactions', [WalletController::class, 'transactions']);
    // Admin-only transaction management
    Route::put('/transactions/{id}', [WalletController::class, 'updateTransaction']);
    Route::delete('/transactions/{id}', [WalletController::class, 'voidTransaction']);
    Route::get('/transactions', [WalletController::class, 'allTransactions']);

    // RFID mapping
    Route::get('rfid', [RfidTagController::class, 'index']);
    Route::post('rfid', [RfidTagController::class, 'store']);
    Route::put('rfid/{id}', [RfidTagController::class, 'update']);
    Route::delete('rfid/{id}', [RfidTagController::class, 'destroy']);

    // note: ePOS endpoints are public (for terminals) — add outside protected group
});

// Public ePOS endpoints (keep outside auth middleware so terminals can call them for now)
Route::prefix('v1/wallets')->group(function () {
    Route::post('epos/transaction', [EposController::class, 'transaction']);
    Route::get('epos/pool', [EposController::class, 'pool']);
    Route::post('withdrawals', [EposController::class, 'createWithdrawal']);
    Route::get('withdrawals', [EposController::class, 'listWithdrawals']);
});
});

// API v1 endpoints untuk modul Akademik
Route::prefix('v1/akademik')->group(function () {
    Route::apiResource('tahun-ajaran', TahunAjaranController::class);
});

// Modul Kelas
// Backward-compatible routes: /api/kelas
Route::prefix('kelas')->group(function () {
    Route::get('/', [KelasController::class, 'index']);
    Route::post('/', [KelasController::class, 'store']);
    Route::put('/{id}', [KelasController::class, 'update']);
    Route::delete('/{id}', [KelasController::class, 'destroy']);
    Route::post('/{kelas}/add-member/{santri}', [KelasController::class, 'addMember']);
    Route::post('/{kelas}/remove-member/{santri}', [KelasController::class, 'removeMember']);
    // Persiapan fitur Naik Kelas
    Route::post('/promote', [KelasController::class, 'promote']);
});

// Namespaced routes for Kesantrian module: /api/v1/kesantrian/kelas
Route::prefix('v1/kesantrian')->group(function () {
    Route::prefix('kelas')->group(function () {
        Route::get('/', [KelasController::class, 'index']);
        Route::post('/', [KelasController::class, 'store']);
        Route::put('/{id}', [KelasController::class, 'update']);
        Route::delete('/{id}', [KelasController::class, 'destroy']);
        // Backward-compatible endpoints
        Route::post('/{kelas}/add-member/{santri}', [KelasController::class, 'addMember']);
        Route::post('/{kelas}/remove-member/{santri}', [KelasController::class, 'removeMember']);
        // Endpoints baru sesuai spesifikasi
        Route::post('/{kelas}/anggota', [KelasController::class, 'tambahAnggota']);
        Route::delete('/{kelas}/anggota/{santri}', [KelasController::class, 'keluarkanAnggota']);
        Route::post('/promote', [KelasController::class, 'promote']);
    });
    // Modul Asrama
    Route::apiResource('asrama', AsramaController::class);
    Route::post('asrama/{id}/anggota', [AsramaController::class, 'tambahAnggota']);
    Route::delete('asrama/{id}/anggota/{santri_id}', [AsramaController::class, 'keluarkanAnggota']);
    // Mutasi Keluar
    Route::get('mutasi-keluar', [\App\Http\Controllers\Kesantrian\MutasiKeluarController::class, 'index']);
    Route::post('mutasi-keluar', [\App\Http\Controllers\Kesantrian\MutasiKeluarController::class, 'store']);
});