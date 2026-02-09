<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Wali\WaliController;
use App\Http\Controllers\Api\V1\Admin\WalletController;
use App\Http\Controllers\Api\V1\Kesantrian\SantriController;
use App\Http\Controllers\Api\V1\Epos\EposTransactionController;

/*
|--------------------------------------------------------------------------
| API V1 Routes
|--------------------------------------------------------------------------
|
| Clean Architecture & Versioned Routes
| Namespace: App\Http\Controllers\Api\V1
|
*/

// Public Routes
Route::prefix('auth')->group(function () {
    Route::post('login', [WaliController::class, 'login']); 
});

// Wali Santri Routes
Route::prefix('wali')->middleware('auth:sanctum')->group(function () {
    Route::post('change-password', [WaliController::class, 'changePassword']);
    Route::get('santri', [WaliController::class, 'getSantri']);
    Route::get('santri/{santri_id}/detail', [WaliController::class, 'getSantriDetail']);
    Route::post('santri/{santri_id}/correction', [WaliController::class, 'submitDataCorrection']);
    
    // Wallet
    Route::get('wallet/{santri_id}', [WaliController::class, 'getWallet']);
    Route::put('wallet/{santri_id}/limit', [WaliController::class, 'setSantriDailyLimit']);
    
    // Keuangan
    Route::get('tagihan/{santri_id}', [WaliController::class, 'getAllTagihan']);
    Route::get('pembayaran/{santri_id}', [WaliController::class, 'getPembayaran']);
    Route::get('tunggakan/{santri_id}', [WaliController::class, 'getTunggakan']);
    Route::post('bayar/{santri_id}', [WaliController::class, 'submitPayment']);
    
    // Bank Accounts
    Route::get('bank-accounts', [WaliController::class, 'getBankAccounts']);
    
    // Bukti Transfer
    Route::post('upload-bukti/{santri_id}', [WaliController::class, 'uploadBukti']);
    Route::post('upload-bukti-topup/{santri_id}', [WaliController::class, 'uploadBuktiTopup']);
    Route::get('bukti-history/{santri_id}', [WaliController::class, 'getBuktiHistory']);

    // Notifications
    Route::get('notifications/{santri_id}', [\App\Http\Controllers\Api\NotificationController::class, 'getWaliNotifications']);
    Route::post('notifications/{id}/read', [\App\Http\Controllers\Api\NotificationController::class, 'markAsRead']);
    Route::post('notifications/{santri_id}/read-all', [\App\Http\Controllers\Api\NotificationController::class, 'markAllAsRead']);
    Route::get('notifications/{santri_id}/unread-count', [\App\Http\Controllers\Api\NotificationController::class, 'getUnreadCount']);

    // Announcements
    Route::get('announcements', [\App\Http\Controllers\Api\AnnouncementController::class, 'index']);
    Route::get('announcements/unread-count', [\App\Http\Controllers\Api\AnnouncementController::class, 'unreadCount']);
    Route::get('announcements/{id}', [\App\Http\Controllers\Api\AnnouncementController::class, 'show']);
    Route::post('announcements/{id}/mark-read', [\App\Http\Controllers\Api\AnnouncementController::class, 'markAsRead']);
});

// Admin Routes
Route::prefix('admin')->middleware(['auth:sanctum', 'role:admin'])->group(function () {
    
    // Wallet Management
    Route::prefix('wallet')->group(function () {
        Route::get('balances', [WalletController::class, 'getBalances']); // Uses the new Controller
        // Route::post('topup', [WalletController::class, 'topup']);
    });
    
    // Kesantrian
    // Route::apiResource('santri', SantriController::class);
});

// Epos Routes (Protected by token/auth)
Route::prefix('epos')->group(function () {
    // Route::post('transaction', [EposTransactionController::class, 'store']);
});
