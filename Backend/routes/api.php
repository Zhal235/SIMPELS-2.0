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
use App\Http\Controllers\WalletSettingsController;
use App\Http\Controllers\Api\WaliController;

// Authentication routes (public)
Route::post('/login', [AuthController::class, 'login']);

// Wali Santri Mobile App routes
Route::prefix('auth')->group(function () {
    Route::post('login', [WaliController::class, 'login']);
});

Route::middleware('auth:sanctum')->prefix('wali')->group(function () {
    Route::get('santri', [WaliController::class, 'getSantri']);
    Route::get('wallet/{santri_id}', [WaliController::class, 'getWallet']);
    Route::get('tagihan/{santri_id}', [WaliController::class, 'getAllTagihan']);
    Route::get('pembayaran/{santri_id}', [WaliController::class, 'getPembayaran']);
    Route::get('tunggakan/{santri_id}', [WaliController::class, 'getTunggakan']);
    Route::post('bayar/{santri_id}', [WaliController::class, 'submitPayment']);
    
    // Bukti Transfer
    Route::post('upload-bukti/{santri_id}', [WaliController::class, 'uploadBukti']);
    Route::get('bukti-history/{santri_id}', [WaliController::class, 'getBuktiHistory']);
});

// Admin Bukti Transfer routes
Route::middleware('auth:sanctum')->prefix('admin/bukti-transfer')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\AdminBuktiTransferController::class, 'index']);
    Route::post('/{id}/approve', [\App\Http\Controllers\Api\AdminBuktiTransferController::class, 'approve']);
    Route::post('/{id}/reject', [\App\Http\Controllers\Api\AdminBuktiTransferController::class, 'reject']);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    // Admin: manage users
    Route::get('/v1/users', [\App\Http\Controllers\UserController::class, 'index']);
    Route::post('/v1/users', [\App\Http\Controllers\UserController::class, 'store']);
    Route::put('/v1/users/{id}', [\App\Http\Controllers\UserController::class, 'update']);
    Route::delete('/v1/users/{id}', [\App\Http\Controllers\UserController::class, 'destroy']);
    // Roles management (admin only)
    Route::get('/v1/roles', [\App\Http\Controllers\RoleController::class, 'index']);
    Route::post('/v1/roles', [\App\Http\Controllers\RoleController::class, 'store']);
    Route::put('/v1/roles/{id}', [\App\Http\Controllers\RoleController::class, 'update']);
    Route::delete('/v1/roles/{id}', [\App\Http\Controllers\RoleController::class, 'destroy']);

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
        // Report endpoints (basic)
        Route::get('reports/summary', [\App\Http\Controllers\Keuangan\ReportsController::class, 'summary']);
        Route::get('reports/expenses-by-category', [\App\Http\Controllers\Keuangan\ReportsController::class, 'expensesByCategory']);
        // Kategori Pengeluaran (CRUD + search)
        Route::apiResource('kategori-pengeluaran', \App\Http\Controllers\KategoriPengeluaranController::class)->except(['show']);
    });

    // API v1 endpoints untuk Dompet Digital / Wallets (protected)
    Route::prefix('v1/wallets')->group(function () {
        // Wallet Settings (admin only) - MUST BE BEFORE /{santriId} route
        Route::get('settings', [WalletSettingsController::class, 'index']);
        Route::put('settings/global', [WalletSettingsController::class, 'updateGlobalSettings']);
        Route::get('settings/santri/all', [WalletSettingsController::class, 'allSantriWithLimits']);
        Route::put('settings/santri/bulk', [WalletSettingsController::class, 'bulkUpdateSantriLimits']);
        Route::put('settings/santri/{santriId}', [WalletSettingsController::class, 'setSantriLimit']);
        Route::delete('settings/santri/{santriId}', [WalletSettingsController::class, 'deleteSantriLimit']);

        // RFID mapping
        Route::get('rfid', [RfidTagController::class, 'index']);
        Route::post('rfid', [RfidTagController::class, 'store']);
        Route::put('rfid/{id}', [RfidTagController::class, 'update']);
        Route::delete('rfid/{id}', [RfidTagController::class, 'destroy']);

        // Admin-only transaction management
        Route::put('transactions/{id}', [WalletController::class, 'updateTransaction']);
        Route::delete('transactions/{id}', [WalletController::class, 'voidTransaction']);
        Route::get('transactions', [WalletController::class, 'allTransactions']);

        // Cash withdrawal (tarik dana dari bank ke cash)
        Route::post('cash-withdrawal', [WalletController::class, 'cashWithdrawal']);

        // Wallet management per-santri - MUST BE AFTER specific routes to avoid conflicts
        Route::get('/', [WalletController::class, 'index']);
        // santriId is a UUID — constrain to avoid catching static paths like /ping
        $uuidConstraint = '[0-9a-fA-F\-]{36}';
        Route::get('/{santriId}', [WalletController::class, 'show'])->where('santriId', $uuidConstraint);
        Route::post('/{santriId}/topup', [WalletController::class, 'topup'])->where('santriId', $uuidConstraint);
        Route::post('/{santriId}/debit', [WalletController::class, 'debit'])->where('santriId', $uuidConstraint);
        Route::get('/{santriId}/transactions', [WalletController::class, 'transactions'])->where('santriId', $uuidConstraint);
    });
});



// Public ePOS endpoints (keep outside auth middleware so terminals can call them for now)
Route::prefix('v1/wallets')->group(function () {
    // Health check / connection test
    Route::get('ping', [WalletController::class, 'ping']);
    
    // RFID lookup by UID (for EPOS integration) - public endpoint
    Route::get('rfid/uid/{uid}', [RfidTagController::class, 'getByUid']);
    
    Route::post('epos/transaction', [EposController::class, 'transaction']);
    Route::get('epos/pool', [EposController::class, 'pool']);
    Route::post('withdrawals', [EposController::class, 'createWithdrawal']);
    Route::get('withdrawals', [EposController::class, 'listWithdrawals']);
    
    // EPOS withdrawal endpoints
    Route::post('epos/withdrawal', [WalletController::class, 'createEposWithdrawal']);
    Route::get('epos/withdrawal/{withdrawalNumber}/status', [WalletController::class, 'getEposWithdrawalStatus']);
    Route::put('epos/withdrawal/{id}/approve', [WalletController::class, 'approveEposWithdrawal']);
    Route::put('epos/withdrawal/{id}/reject', [WalletController::class, 'rejectEposWithdrawal']);
    Route::post('epos/withdrawal/{withdrawalNumber}/reject', [WalletController::class, 'rejectEposWithdrawalByNumber']);
    Route::get('epos/withdrawals', [WalletController::class, 'listEposWithdrawals']);
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