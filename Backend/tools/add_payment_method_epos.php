<?php

/**
 * Add payment_method column to epos_withdrawals table
 */

echo "=== Add payment_method to epos_withdrawals ===\n\n";

$dbPath = __DIR__ . '/../database/database.sqlite';

if (!file_exists($dbPath)) {
    die("❌ Database file not found: $dbPath\n");
}

try {
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✅ Connected to database\n\n";
    
    // Check if column already exists
    $stmt = $pdo->query("PRAGMA table_info(epos_withdrawals)");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $hasPaymentMethod = false;
    
    foreach ($columns as $col) {
        if ($col['name'] === 'payment_method') {
            $hasPaymentMethod = true;
            break;
        }
    }
    
    if ($hasPaymentMethod) {
        echo "✅ Column 'payment_method' already exists!\n";
        exit(0);
    }
    
    echo "Step 1: Adding payment_method column...\n";
    
    $pdo->beginTransaction();
    
    // Add column
    $pdo->exec("ALTER TABLE epos_withdrawals ADD COLUMN payment_method TEXT NULL");
    
    $pdo->commit();
    
    echo "✅ Column added successfully!\n";
    
    echo "\n✅ Done!\n";
    
} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "\n❌ Database Error: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "\n❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
