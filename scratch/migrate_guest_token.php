<?php
declare(strict_types=1);

require_once __DIR__ . '/../wamp-api/config.php';

try {
    $pdo = db();
    
    // Check if column already exists
    $stmt = $pdo->query("SHOW COLUMNS FROM orders LIKE 'guest_token'");
    $columnExists = $stmt->fetch();
    
    if (!$columnExists) {
        $pdo->exec("ALTER TABLE orders ADD COLUMN guest_token VARCHAR(64) DEFAULT NULL AFTER user_id");
        echo "Migration successful: Column 'guest_token' added to 'orders' table.\n";
    } else {
        echo "Migration skipped: Column 'guest_token' already exists in 'orders' table.\n";
    }
} catch (Throwable $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
