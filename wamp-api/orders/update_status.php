<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../cors.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['ok' => false, 'error' => 'method_not_allowed'], 405);
}

$pdo = db();
$user = current_user($pdo);

// Check if user is logged in and is admin (email: admin@nsaibia.com)
if (!$user || strtolower(trim($user['email'])) !== 'admin@nsaibia.com') {
    json_response(['ok' => false, 'error' => 'unauthorized'], 403);
}

$body = read_json_body();
$orderId = isset($body['orderId']) ? (int)$body['orderId'] : null;
$status = isset($body['status']) ? trim((string)$body['status']) : '';

if (!$orderId || $status === '') {
    json_response(['ok' => false, 'error' => 'invalid_input'], 400);
}

if (!in_array($status, ['pending', 'confirmed', 'shipped', 'cancelled'], true)) {
    json_response(['ok' => false, 'error' => 'invalid_status'], 400);
}

try {
    // Check if order exists
    $stmt = $pdo->prepare('SELECT id FROM orders WHERE id = :id');
    $stmt->execute(['id' => $orderId]);
    if (!$stmt->fetch()) {
        json_response(['ok' => false, 'error' => 'order_not_found'], 404);
    }
    
    // Update order status. If status is 'confirmed', also set payment_status to 'verified'
    if ($status === 'confirmed') {
        $updateStmt = $pdo->prepare('
            UPDATE orders 
            SET status = :status, payment_status = "verified"
            WHERE id = :id
        ');
    } else {
        $updateStmt = $pdo->prepare('
            UPDATE orders 
            SET status = :status
            WHERE id = :id
        ');
    }
    
    $updateStmt->execute([
        'status' => $status,
        'id' => $orderId
    ]);
    
    json_response(['ok' => true, 'message' => 'Order status updated successfully']);
} catch (Throwable $e) {
    json_response(['ok' => false, 'error' => 'server_error', 'message' => $e->getMessage()], 500);
}
