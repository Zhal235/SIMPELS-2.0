<?php

define('LARAVEL_START', microtime(true));

// Register the Composer autoloader...
require __DIR__.'/vendor/autoload.php';

// Bootstrap Laravel and handle the command...
$app = require_once __DIR__.'/bootstrap/app.php';

echo "=== App checking ===\n";
echo "app is instance of Application: " . ($app instanceof Illuminate\Foundation\Application ? 'YES' : 'NO') . "\n";
echo "env using get(): " . $app->get('env') . "\n";
echo "env using array access: ";
try {
    echo $app['env'];
} catch (Throwable $e) {
    echo "ERROR: " . $e->getMessage();
}
echo "\n";

// Check in instances
$reflection = new ReflectionClass($app);
$instances = $reflection->getProperty('instances');
$instances->setAccessible(true);
$instancesArr = $instances->getValue($app);
echo "env in instances: " . (isset($instancesArr['env']) ? 'YES' : 'NO') . "\n";
