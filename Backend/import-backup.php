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
    
    // Use file from command line argument or default
    $sqlFile = $argv[1] ?? __DIR__ . '/backup_20260428_020206.sql';
    
    // If relative path, make it absolute
    if (!file_exists($sqlFile)) {
        $sqlFile = __DIR__ . '/' . $sqlFile;
    }
    
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
    $pdo->exec("SET SQL_MODE='NO_AUTO_VALUE_ON_ZERO'");
    
    echo "Parsing SQL file...\n";
    
    // Split into statements by semicolon at end of line
    $statements = [];
    $buffer = '';
    $lines = explode("\n", $sql);
    
    foreach ($lines as $line) {
        $line = trim($line);
        
        // Skip comments and empty lines
        if (empty($line) || substr($line, 0, 2) === '--' || substr($line, 0, 2) === '/*') {
            continue;
        }
        
        $buffer .= $line . ' ';
        
        // Check if statement is complete (ends with semicolon)
        if (substr($line, -1) === ';') {
            $statements[] = trim($buffer);
            $buffer = '';
        }
    }
    
    $total = count($statements);
    echo "Found $total SQL statements\n";
    echo "Importing data (this may take a while)...\n\n";
    
    // Execute each statement
    $success = 0;
    $failed = 0;
    $errors = [];
    
    foreach ($statements as $index => $statement) {
        if (empty($statement)) continue;
        
        try {
            $pdo->exec($statement);
            $success++;
            
            // Show progress every 50 statements
            if ($success % 50 === 0) {
                echo "\rProgress: $success/$total executed...";
            }
        } catch (PDOException $e) {
            $failed++;
            
            // Store first 5 errors for debugging
            if ($failed <= 5) {
                $errors[] = substr($e->getMessage(), 0, 150);
            }
        }
    }
    
    echo "\n\n";
    
    if (!empty($errors)) {
        echo "Sample errors:\n";
        foreach ($errors as $err) {
            echo "  - $err\n";
        }
        echo "\n";
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

