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
    // Route::post('login', [AuthController::class, 'login']); 
    // Uncomment above when AuthController is moved to V1
});

// Wali Santri Routes
Route::prefix('wali')->middleware('auth:sanctum')->group(function () {
    // Wallet
    // Route::get('wallet/{santri}', [WaliController::class, 'getWallet']);
    // Route::get('tagihan/{santri}', [WaliController::class, 'getTagihan']);
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
