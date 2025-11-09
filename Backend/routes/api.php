<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Kesantrian\SantriController;

// API v1 endpoints untuk modul Kesantrian (Santri)
Route::prefix('v1/kesantrian')->group(function () {
    Route::apiResource('santri', SantriController::class);
});