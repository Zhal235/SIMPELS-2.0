<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../database/database.sqlite');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

try {
    // Check if column exists
    $stmt = $pdo->query("PRAGMA table_info(epos_withdrawals)");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($columns as $col) {
        if ($col['name'] === 'payment_method') {
            echo "✅ Column 'payment_method' already exists!\n";
            exit(0);
        }
    }
    
    // Add column
    $pdo->exec("ALTER TABLE epos_withdrawals ADD COLUMN payment_method TEXT NULL");
    echo "✅ Column 'payment_method' added successfully!\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
