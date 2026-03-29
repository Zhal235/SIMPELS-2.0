<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Wali\WaliController;
use App\Http\Controllers\Api\V1\Admin\WalletController;
use App\Http\Controllers\Api\V1\Kesantrian\SantriController;
use App\Http\Controllers\Api\V1\Epos\EposTransactionController;
use App\Http\Controllers\Api\V1\Epos\KebutuhanOrderController;

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
    Route::get('wallet/{santri_id}/history', [WaliController::class, 'getSantriWalletHistory']);
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

    // FCM Push Notification
    Route::post('fcm-token', [\App\Http\Controllers\Api\V1\Wali\FCMController::class, 'register']);
    Route::delete('fcm-token', [\App\Http\Controllers\Api\V1\Wali\FCMController::class, 'unregister']);

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

    // Tabungan (read-only untuk wali)
    Route::get('tabungan/{santri_id}', [\App\Http\Controllers\TabunganController::class, 'show']);
    Route::get('tabungan/{santri_id}/history', [\App\Http\Controllers\TabunganController::class, 'history']);
});

// Admin Routes
Route::prefix('admin')->middleware(['auth:sanctum', 'role:admin'])->group(function () {
    
    // Wallet Management
    Route::prefix('wallet')->group(function () {
        Route::get('balances', [WalletController::class, 'getBalances']);
    });
    
    // Kesantrian
    // Route::apiResource('santri', SantriController::class);

    // WA Gateway
    Route::prefix('wa')->group(function () {
        Route::get('status', [\App\Http\Controllers\Admin\WaGatewayController::class, 'status']);
        Route::get('qr', [\App\Http\Controllers\Admin\WaGatewayController::class, 'qr']);
        Route::get('logs', [\App\Http\Controllers\Admin\WaGatewayController::class, 'logs']);
        Route::post('logs/{id}/retry', [\App\Http\Controllers\Admin\WaGatewayController::class, 'retry']);
        Route::post('blast/pengumuman', [\App\Http\Controllers\Admin\WaGatewayController::class, 'blastPengumuman']);
        Route::post('blast/tagihan-detail', [\App\Http\Controllers\Admin\WaGatewayController::class, 'blastTagihanDetail']);
        Route::post('blast/reminder', [\App\Http\Controllers\Admin\WaGatewayController::class, 'blastReminder']);
        Route::post('blast/rekap-tunggakan', [\App\Http\Controllers\Admin\WaGatewayController::class, 'blastRekapTunggakan']);
        Route::get('phonebook', [\App\Http\Controllers\Admin\WaGatewayController::class, 'phonebook']);
        Route::patch('phonebook/{id}', [\App\Http\Controllers\Admin\WaGatewayController::class, 'updateHp']);
        Route::post('preview', [\App\Http\Controllers\Admin\WaGatewayController::class, 'previewBlast']);
        Route::post('send-test', [\App\Http\Controllers\Admin\WaGatewayController::class, 'sendTest']);
        Route::get('schedules', [\App\Http\Controllers\Admin\WaGatewayController::class, 'getSchedules']);
        Route::put('schedules/{type}', [\App\Http\Controllers\Admin\WaGatewayController::class, 'updateSchedule']);
        Route::get('templates', [\App\Http\Controllers\Admin\WaGatewayController::class, 'getTemplates']);
        Route::put('templates/{type}', [\App\Http\Controllers\Admin\WaGatewayController::class, 'updateTemplate']);
    });
});

// WA Gateway Callback — tidak butuh auth sanctum, pakai secret header
Route::post('wa/callback', [\App\Http\Controllers\Admin\WaGatewayController::class, 'callback']);

// Epos Routes (Protected by token/auth)
Route::prefix('epos')->group(function () {
    // Route::post('transaction', [EposTransactionController::class, 'store']);

    // Pesanan Kebutuhan (public, sama pola dengan epos/transaction)
    Route::post('kebutuhan-order', [KebutuhanOrderController::class, 'store']);
    Route::get('kebutuhan-order/santri/{santriId}/pending', [KebutuhanOrderController::class, 'pendingForSantri']);
});

// Kebutuhan Orders — Wali (mobile)
Route::prefix('wali')->middleware('auth:sanctum')->group(function () {
    Route::get('kebutuhan-orders/{santriId}', [KebutuhanOrderController::class, 'indexForWali']);
    Route::post('kebutuhan-orders/{orderId}/respond', [KebutuhanOrderController::class, 'respondByWali']);
});

// Kebutuhan Orders — Admin (frontend)
Route::prefix('admin')->middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('kebutuhan-orders', [KebutuhanOrderController::class, 'indexForAdmin']);
    Route::post('kebutuhan-orders/{orderId}/confirm', [KebutuhanOrderController::class, 'confirmByAdmin']);
    Route::post('kebutuhan-orders/{orderId}/reject', [KebutuhanOrderController::class, 'rejectByAdmin']);
});
