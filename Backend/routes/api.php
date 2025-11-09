<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Kesantrian\SantriController;
use App\Http\Controllers\Kesantrian\AsramaController;
use App\Http\Controllers\KelasController;

// API v1 endpoints untuk modul Kesantrian (Santri)
Route::prefix('v1/kesantrian')->group(function () {
    Route::apiResource('santri', SantriController::class);
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
});