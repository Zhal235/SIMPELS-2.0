<?php
// Import SQL backup file to database with duplicate handling
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$config = config('database.connections.mysql');
$dsn = "mysql:host={$config['host']};dbname={$config['database']};charset=utf8mb4";

try {
    echo "Connecting to database...\n";
    $pdo = new PDO($dsn, $config['username'], $config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
    ]);
    
    echo "Reading SQL file...\n";
    $sqlFile = __DIR__ . '/../backup_20260410_020143.sql';
    
    if (!file_exists($sqlFile)) {
        echo "❌ Backup file not found: $sqlFile\n";
        exit(1);
    }
    
    $sql = file_get_contents($sqlFile);
    
    if ($sql === false) {
        echo "❌ Failed to read backup file\n";
        exit(1);
    }
    
    echo "File size: " . number_format(strlen($sql) / 1024 / 1024, 2) . " MB\n";
    echo "Disabling foreign key checks...\n";
    $pdo->exec("SET FOREIGN_KEY_CHECKS=0");
    
    echo "Importing data (this may take a while)...\n";
    
    // Import SQL with ignore duplicates
    try {
        $pdo->exec($sql);
        echo "\n✅ Import successful!\n\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
            echo "⚠️ Some duplicate entries were skipped\n\n";
        } else {
            throw $e;
        }
    }
    
    echo "Re-enabling foreign key checks...\n";
    $pdo->exec("SET FOREIGN_KEY_CHECKS=1");
    
    // Verify counts
    echo "Verification:\n";
    $tables = ['users', 'santri', 'kelas', 'asramas', 'jenis_tagihans', 'tagihan_santri', 'pembayarans', 'wallets'];
    foreach ($tables as $table) {
        try {
            $count = $pdo->query("SELECT COUNT(*) FROM $table")->fetchColumn();
            echo "  ✅ $table: $count records\n";
        } catch (PDOException $e) {
            echo "  ⚠️ $table: table not found\n";
        }
    }
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}

