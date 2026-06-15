<?php
require_once __DIR__ . '/wamp-api/config.php';

try {
    $pdo = db();
    
    $limit = 50;
    $offset = 0;
    
    // Get paginated orders
    $stmt = $pdo->query('
        SELECT 
            o.id,
            o.order_number,
            o.customer_name,
            o.customer_email,
            o.customer_phone,
            o.shipping_address,
            o.total_amount,
            o.status,
            o.payment_status,
            o.payment_method,
            o.payment_reference,
            o.created_at,
            o.updated_at,
            o.user_id,
            u.name AS client_name,
            u.email AS client_email
        FROM orders o
        LEFT JOIN users u ON u.id = o.user_id
        ORDER BY o.created_at DESC
        LIMIT ' . $limit . ' OFFSET ' . $offset . '
    ');

    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($orders as &$ord) {
        $itemStmt = $pdo->prepare('
            SELECT
                oi.id,
                oi.artwork_id AS product_id,
                oi.quantity,
                oi.frame_type,
                oi.unit_price,
                (oi.unit_price * oi.quantity) AS subtotal,
                o.order_number,
                o.created_at,
                o.customer_name,
                o.customer_email,
                o.customer_phone,
                o.shipping_address,
                u.name AS client_name,
                u.email AS client_email
            FROM order_items oi
            INNER JOIN orders o ON o.id = oi.order_id
            LEFT JOIN users u ON u.id = o.user_id
            WHERE oi.order_id = :order_id
            ORDER BY oi.id ASC
        ');
        $itemStmt->execute(['order_id' => (int)$ord['id']]);
        $ord['items'] = $itemStmt->fetchAll(PDO::FETCH_ASSOC);
    }
    unset($ord);
    
    echo "SUCCESS: " . count($orders) . " orders fetched.\n";
} catch (Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
