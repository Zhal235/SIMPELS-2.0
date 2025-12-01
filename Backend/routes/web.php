<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Response;

Route::get('/', function () {
    return view('welcome');
});

// OPTIONS handler for CORS preflight
Route::options('/storage/{path}', function () {
    return Response::make('', 200, [
        'Access-Control-Allow-Origin' => '*',
        'Access-Control-Allow-Methods' => 'GET, OPTIONS',
        'Access-Control-Allow-Headers' => '*',
    ]);
})->where('path', '.*');

// Route untuk serve storage files dengan CORS headers (must be BEFORE default storage link)
Route::get('/storage/{path}', function ($path) {
    $filePath = storage_path('app/public/' . $path);
    
    if (!file_exists($filePath)) {
        abort(404, 'File not found');
    }
    
    $type = mime_content_type($filePath);
    
    return Response::file($filePath, [
        'Content-Type' => $type,
        'Access-Control-Allow-Origin' => '*',
        'Access-Control-Allow-Methods' => 'GET, OPTIONS',
        'Access-Control-Allow-Headers' => '*',
        'Cache-Control' => 'public, max-age=86400',
    ]);
})->where('path', '.*');

// Also handle public-storage for backward compatibility (direct serve, no redirect)
Route::get('/public-storage/{path}', function ($path) {
    $filePath = storage_path('app/public/' . $path);
    
    if (!file_exists($filePath)) {
        abort(404, 'File not found');
    }
    
    $file = file_get_contents($filePath);
    $type = mime_content_type($filePath);
    
    return Response::make($file, 200, [
        'Content-Type' => $type,
        'Access-Control-Allow-Origin' => '*',
        'Access-Control-Allow-Methods' => 'GET, OPTIONS',
        'Access-Control-Allow-Headers' => '*',
        'Cache-Control' => 'public, max-age=86400',
    ]);
})->where('path', '.*');

// Pindahkan semua route API ke routes/api.php agar stateless dan tanpa CSRF

