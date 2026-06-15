<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../cors.php';

try {
    echo "Attempting DB connection...\n";
    $pdo = db();
    echo "Connection successful!\n";
    
    echo "Checking users table...\n";
    $stmt = $pdo->query("SELECT COUNT(*) FROM users");
    echo "Users count: " . $stmt->fetchColumn() . "\n";
} catch (Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
