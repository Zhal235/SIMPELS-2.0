<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use PDO;

$backupFile = __DIR__ . '/backup_20260509_020210.sql';

if (!file_exists($backupFile)) {
    echo "❌ File backup tidak ditemukan: $backupFile\n";
    exit(1);
}

echo "📂 Membaca file backup: " . basename($backupFile) . "\n";
$sqlContent = file_get_contents($backupFile);

// Disable foreign key checks
try {
    DB::statement('SET FOREIGN_KEY_CHECKS=0');
    echo "✓ Foreign key checks disabled\n";
} catch (\Exception $e) {
    echo "⚠️  " . $e->getMessage() . "\n";
}

// Split SQL statements more carefully
$statements = [];
$currentStatement = '';
$inString = false;
$stringChar = '';

$lines = explode("\n", $sqlContent);
foreach ($lines as $line) {
    $line = rtrim($line);
    
    // Skip comments and empty lines
    if (empty($line) || substr(ltrim($line), 0, 2) === '--') {
        continue;
    }
    
    $currentStatement .= $line . "\n";
    
    // Check if line ends with semicolon (not in string)
    if (substr(rtrim($line), -1) === ';') {
        $statements[] = trim(substr($currentStatement, 0, -1));
        $currentStatement = '';
    }
}

$count = 0;
$errors = 0;
$skipped = 0;

foreach ($statements as $statement) {
    if (empty($statement)) {
        continue;
    }
    
    // Skip SET statements that are not critical
    if (strpos($statement, 'SET FOREIGN_KEY_CHECKS') === 0 || 
        strpos($statement, 'SET SQL_MODE') === 0) {
        $skipped++;
        continue;
    }
    
    try {
        DB::statement($statement);
        $count++;
        if ($count % 50 === 0) {
            echo "✓ Dijalankan: $count statements\n";
        }
    } catch (\Exception $e) {
        $errors++;
        if ($errors <= 10) { // Show first 10 errors only
            echo "⚠️  Error: " . substr($e->getMessage(), 0, 100) . "\n";
        }
    }
}

// Re-enable foreign key checks
try {
    DB::statement('SET FOREIGN_KEY_CHECKS=1');
    echo "✓ Foreign key checks re-enabled\n";
} catch (\Exception $e) {
    echo "⚠️  " . $e->getMessage() . "\n";
}

echo "\n✅ Restore selesai!\n";
echo "   Total statements berhasil: $count\n";
echo "   Total errors: $errors\n";
echo "   Total skipped: $skipped\n";
echo "   Database: " . DB::connection()->getDatabaseName() . "\n";
