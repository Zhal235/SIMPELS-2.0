<?php

/**
 * Fix wallet_withdrawals table structure - make pool_id nullable for cash withdrawals
 */

echo "=== Fix wallet_withdrawals Table Structure ===\n\n";

$dbPath = __DIR__ . '/../database/database.sqlite';

if (!file_exists($dbPath)) {
    die("❌ Database file not found: $dbPath\n");
}

try {
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✅ Connected to database\n\n";
    
    echo "Step 1: Recreating wallet_withdrawals table with nullable pool_id...\n";
    
    $pdo->beginTransaction();
    
    // 1. Rename old table
    $pdo->exec("ALTER TABLE wallet_withdrawals RENAME TO wallet_withdrawals_old");
    
    // 2. Create new table with nullable pool_id
    $pdo->exec("
        CREATE TABLE wallet_withdrawals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pool_id INTEGER NULL,
            amount DECIMAL(15, 2) NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'done')),
            requested_by INTEGER NULL,
            processed_by INTEGER NULL,
            epos_ref TEXT NULL,
            notes TEXT NULL,
            created_at DATETIME NULL,
            updated_at DATETIME NULL,
            FOREIGN KEY (pool_id) REFERENCES epos_pools(id) ON DELETE CASCADE,
            FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL,
            FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
        )
    ");
    
    // 3. Copy data from old table
    $pdo->exec("
        INSERT INTO wallet_withdrawals 
        SELECT * FROM wallet_withdrawals_old
    ");
    
    // 4. Drop old table
    $pdo->exec("DROP TABLE wallet_withdrawals_old");
    
    // 5. Create indexes
    $pdo->exec("CREATE INDEX idx_wallet_withdrawals_pool_status ON wallet_withdrawals(pool_id, status)");
    
    $pdo->commit();
    
    echo "✅ Table structure updated successfully!\n";
    echo "\npool_id is now nullable for cash withdrawals.\n";
    
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
