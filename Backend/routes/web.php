<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Pindahkan semua route API ke routes/api.php agar stateless dan tanpa CSRF
