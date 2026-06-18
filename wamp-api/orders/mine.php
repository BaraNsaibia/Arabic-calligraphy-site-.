<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../cors.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['ok' => false, 'error' => 'method_not_allowed'], 405);
}

$pdo = db();
$user = current_user($pdo);
$guestToken = $_GET['guest_token'] ?? $_SERVER['HTTP_X_GUEST_TOKEN'] ?? null;

if (!$user && !$guestToken) {
    json_response(['ok' => false, 'error' => 'unauthorized'], 401);
}

try {
    if ($user) {
        $stmt = $pdo->prepare('
            SELECT o.* 
            FROM orders o 
            WHERE o.user_id = :user_id 
            ORDER BY o.created_at DESC
        ');
        $stmt->execute(['user_id' => $user['id']]);
    } else {
        $stmt = $pdo->prepare('
            SELECT o.* 
            FROM orders o 
            WHERE o.user_id IS NULL AND o.guest_token = :guest_token 
            ORDER BY o.created_at DESC
        ');
        $stmt->execute(['guest_token' => $guestToken]);
    }
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format the response to match the frontend expectations
    $formattedOrders = [];
    foreach ($orders as $o) {
        // Fetch order items and join artworks to get titles and images
        $itemStmt = $pdo->prepare('
            SELECT 
                oi.*, 
                a.title_ar AS product_title_ar, 
                a.title_en AS product_title_en, 
                a.image AS image
            FROM order_items oi
            LEFT JOIN artworks a ON a.id = oi.artwork_id
            WHERE oi.order_id = :order_id
        ');
        $itemStmt->execute(['order_id' => $o['id']]);
        $items = $itemStmt->fetchAll(PDO::FETCH_ASSOC);
        
        $formattedItems = array_map(function($item) {
            return [
                'artworkId' => $item['artwork_id'],
                'quantity' => (int)$item['quantity'],
                'frameType' => $item['frame_type'],
                'unitPrice' => (float)$item['unit_price'],
                'titleAr' => $item['product_title_ar'] ?? $item['artwork_id'],
                'titleEn' => $item['product_title_en'] ?? $item['artwork_id'],
                'image' => $item['image'] ?? ''
            ];
        }, $items);

        $formattedOrders[] = [
            'id' => $o['order_number'],
            'internal_id' => $o['id'],
            'items' => $formattedItems,
            'totalPrice' => (float)$o['total_amount'],
            'customerName' => $o['customer_name'],
            'customerPhone' => $o['customer_phone'],
            'customerEmail' => $o['customer_email'],
            'shippingAddress' => $o['shipping_address'],
            'status' => $o['status'],
            'createdAt' => $o['created_at'],
            'paymentMethod' => $o['payment_method'],
            'paymentReference' => $o['payment_reference'],
            'paymentStatus' => $o['payment_status']
        ];
    }

    json_response([
        'ok' => true,
        'orders' => $formattedOrders,
    ]);
} catch (Throwable $e) {
    error_log('Mine orders fetch error: ' . $e->getMessage());
    json_response(['ok' => false, 'error' => 'server_error', 'message' => 'An unexpected server error occurred.'], 500);
}
