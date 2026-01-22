<?php

define('LARAVEL_START', microtime(true));

// Register the Composer autoloader...
require __DIR__.'/vendor/autoload.php';

// Bootstrap Laravel and handle the command...
try {
    $app = require_once __DIR__.'/bootstrap/app.php';
    var_dump($app);
    var_dump($app instanceof Illuminate\Foundation\Application);
    var_dump(isset($app['env']));
    var_dump(isset($app['events']));
} catch (\Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "Stack trace:\n";
    echo $e->getTraceAsString();
}
