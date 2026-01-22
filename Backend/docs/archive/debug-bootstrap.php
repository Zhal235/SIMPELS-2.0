<?php
/**
 * Test script to identify root cause of "Call to a member function make() on null"
 * 
 * This script replicates what happens during artisan bootstrap
 */

// Start error buffering
ob_start();
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    echo "Error at $errfile:$errline - $errstr\n";
});

try {
    echo "========================================\n";
    echo "SIMPELS-2.0 Bootstrap Debug\n";
    echo "========================================\n\n";

    // Load Composer autoloader
    echo "[1] Loading Composer autoloader...\n";
    require __DIR__ . '/vendor/autoload.php';
    echo "✓ Autoloader loaded\n\n";

    // Load bootstrap/app.php
    echo "[2] Loading bootstrap/app.php...\n";
    $app = require __DIR__ . '/bootstrap/app.php';
    echo "✓ Bootstrap loaded\n";
    echo "   App instance: " . get_class($app) . "\n";
    echo "   App bound: " . (isset($app) ? 'yes' : 'no') . "\n\n";

    // Check container
    echo "[3] Checking container...\n";
    echo "   Has 'config' binding: " . ($app->bound('config') ? 'yes' : 'no') . "\n";
    echo "   Has 'events' binding: " . ($app->bound('events') ? 'yes' : 'no') . "\n";
    echo "   Has 'cache' binding: " . ($app->bound('cache') ? 'yes' : 'no') . "\n\n";

    // Try to get config
    echo "[4] Getting config...\n";
    $config = $app->make('config');
    echo "✓ Config obtained: " . get_class($config) . "\n\n";

    // Try to get events
    echo "[5] Getting events...\n";
    $events = $app->make('events');
    echo "✓ Events obtained: " . get_class($events) . "\n\n";

    // Try a simple artisan command
    echo "[6] Testing artisan command bootstrap...\n";
    $kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
    echo "✓ Console kernel loaded: " . get_class($kernel) . "\n\n";

    echo "========================================\n";
    echo "✅ ALL TESTS PASSED\n";
    echo "========================================\n";

} catch (\Exception $e) {
    echo "\n❌ ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
    echo "\nStack trace:\n";
    echo $e->getTraceAsString() . "\n";
} finally {
    $output = ob_get_clean();
    echo $output;
}
?>
