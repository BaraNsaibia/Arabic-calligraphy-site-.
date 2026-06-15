<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../cors.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['ok' => false, 'error' => 'method_not_allowed'], 405);
}

$pdo = db();

try {
    // Get order ID from query parameter (optional)
    $orderId = isset($_GET['id']) ? (int)$_GET['id'] : null;
    
    if ($orderId) {
        // Get single order with all details
        $stmt = $pdo->prepare('
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
                o.user_id,
                o.guest_token,
                u.name AS client_name,
                u.email AS client_email
            FROM orders o
            LEFT JOIN users u ON u.id = o.user_id
            WHERE o.id = :id
        ');
        $stmt->execute(['id' => $orderId]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$order) {
            json_response(['ok' => false, 'error' => 'order_not_found'], 404);
        }

        // Secure with admin or owner check
        $user = current_user($pdo);
        $isAdmin = $user && strtolower(trim($user['email'])) === 'admin@nsaibia.com';
        $guestToken = $_GET['guest_token'] ?? $_SERVER['HTTP_X_GUEST_TOKEN'] ?? null;

        if (!$isAdmin) {
            $isOwner = false;
            if ($user && $order['user_id'] !== null && (int)$order['user_id'] === (int)$user['id']) {
                $isOwner = true;
            } elseif ($order['user_id'] === null && $guestToken !== null && $order['guest_token'] === $guestToken) {
                $isOwner = true;
            }

            if (!$isOwner) {
                json_response(['ok' => false, 'error' => 'forbidden'], 403);
            }
        }
        
        // Get order items
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
                o.total_amount,
                o.user_id,
                u.name AS client_name,
                u.email AS client_email
            FROM order_items oi
            INNER JOIN orders o ON o.id = oi.order_id
            LEFT JOIN users u ON u.id = o.user_id
            WHERE oi.order_id = :order_id
            ORDER BY oi.id ASC
        ');
        $itemStmt->execute(['order_id' => $orderId]);
        $items = $itemStmt->fetchAll(PDO::FETCH_ASSOC);

        $order['items'] = $items;

        json_response(['ok' => true, 'order' => $order]);

    } else {
        // Get all orders (paginated) - secure with admin check
        $user = current_user($pdo);
        if (!$user || strtolower(trim($user['email'])) !== 'admin@nsaibia.com') {
            json_response(['ok' => false, 'error' => 'unauthorized'], 403);
        }

        $limit = min((int)($_GET['limit'] ?? 50), 500);
        $offset = max((int)($_GET['offset'] ?? 0), 0);
        
        // Get total count
        $countStmt = $pdo->query('SELECT COUNT(*) as total FROM orders');
        $countRow = $countStmt->fetch(PDO::FETCH_ASSOC);
        $total = (int)$countRow['total'];
        
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
        
        json_response([
            'ok' => true,
            'orders' => $orders,
            'pagination' => [
                'total' => $total,
                'limit' => $limit,
                'offset' => $offset,
                'pages' => ceil($total / $limit)
            ]
        ]);
    }
} catch (Throwable $e) {
    json_response(['ok' => false, 'error' => 'server_error', 'message' => $e->getMessage()], 500);
}
?>
