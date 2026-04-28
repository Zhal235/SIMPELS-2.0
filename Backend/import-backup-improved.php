<?php
/**
 * Import SQL backup file to database - Improved version
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$sqlFile = $argv[1] ?? 'backup_20260428_020206.sql';

if (!file_exists($sqlFile)) {
    echo "Error: File $sqlFile not found!\n";
    exit(1);
}

echo "Reading SQL file: $sqlFile\n";
$sql = file_get_contents($sqlFile);

if ($sql === false) {
    echo "Error: Could not read file!\n";
    exit(1);
}

echo "File size: " . number_format(strlen($sql) / 1024 / 1024, 2) . " MB\n";

// Disable foreign key checks
echo "Disabling foreign key checks...\n";
DB::statement('SET FOREIGN_KEY_CHECKS=0');
DB::statement('SET sql_mode = ""'); // Disable strict mode

// Split SQL by lines and process
echo "Processing SQL statements...\n";
$lines = explode("\n", $sql);
$statement = '';
$totalStatements = 0;
$successCount = 0;
$errorCount = 0;

foreach ($lines as $lineNumber => $line) {
    $line = trim($line);
    
    // Skip comments and empty lines
    if (empty($line) || strpos($line, '--') === 0 || strpos($line, '/*') === 0) {
        continue;
    }
    
    // Build statement
    $statement .= $line . " ";
    
    // Check if statement ends with semicolon
    if (substr($line, -1) === ';') {
        $statement = trim($statement);
        
        if (!empty($statement)) {
            $totalStatements++;
            
            try {
                DB::statement($statement);
                $successCount++;
                
                if ($successCount % 50 === 0) {
                    echo "\rProgress: $successCount/$totalStatements statements executed...";
                }
                
                // Show specific progress for important tables
                if (stripos($statement, 'INSERT INTO `santri`') !== false) {
                    echo "\n[INFO] Importing santri data...\n";
                }
                if (stripos($statement, 'INSERT INTO `users`') !== false) {
                    echo "\n[INFO] Importing users data...\n";
                }
                if (stripos($statement, 'INSERT INTO `wallets`') !== false) {
                    echo "\n[INFO] Importing wallets data...\n";
                }
                
            } catch (\Exception $e) {
                $errorCount++;
                
                // Only show first few errors to avoid spam
                if ($errorCount <= 10) {
                    echo "\n[ERROR] Line $lineNumber: " . substr($e->getMessage(), 0, 100) . "...\n";
                    echo "[SQL] " . substr($statement, 0, 100) . "...\n";
                }
            }
        }
        
        // Reset for next statement
        $statement = '';
    }
}

echo "\n\n";

// Re-enable foreign key checks
echo "Re-enabling foreign key checks...\n";
DB::statement('SET FOREIGN_KEY_CHECKS=1');

echo "\n";
echo "========================================\n";
echo "Import Summary:\n";
echo "========================================\n";
echo "Total statements: $totalStatements\n";
echo "Successful: $successCount\n";
echo "Failed: $errorCount\n";

// Show detailed stats
if ($successCount > 0) {
    echo "\n✓ Database import completed!\n";
    
    echo "\nDatabase Statistics:\n";
    try {
        echo "- Users: " . DB::table('users')->count() . "\n";
    } catch (\Exception $e) { echo "- Users: table not found\n"; }
    
    try {
        echo "- Santri: " . DB::table('santri')->count() . "\n";
    } catch (\Exception $e) { echo "- Santri: table not found\n"; }
    
    try {
        echo "- Wallets: " . DB::table('wallets')->count() . "\n";
    } catch (\Exception $e) { echo "- Wallets: table not found\n"; }
    
    try {
        echo "- Bukti Transfer: " . DB::table('bukti_transfer')->count() . "\n";
    } catch (\Exception $e) { echo "- Bukti Transfer: table not found\n"; }
    
    try {
        echo "- Tagihan: " . DB::table('tagihan')->count() . "\n";
    } catch (\Exception $e) { echo "- Tagihan: table not found\n"; }
    
    try {
        echo "- Jenis Tagihan: " . DB::table('jenis_tagihan')->count() . "\n";
    } catch (\Exception $e) { echo "- Jenis Tagihan: table not found\n"; }
    
} else {
    echo "\n✗ Import failed!\n";
    exit(1);
}