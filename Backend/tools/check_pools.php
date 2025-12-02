<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../database/database.sqlite');
$pools = $pdo->query('SELECT * FROM epos_pools')->fetchAll(PDO::FETCH_OBJ);
echo "EPOS Pools:\n";
foreach($pools as $p) {
    echo "ID: {$p->id}, Name: {$p->name}, Balance: {$p->balance}\n";
}
