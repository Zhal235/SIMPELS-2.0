<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../database/database.sqlite');
$pdo->exec("INSERT INTO migrations (migration, batch) VALUES ('2025_12_02_000002_add_payment_method_to_epos_withdrawals', 2)");
echo "✅ Migration marked as done\n";
