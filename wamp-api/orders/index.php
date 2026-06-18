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
        $adminEmail = defined('ADMIN_EMAIL') ? ADMIN_EMAIL : 'admin@nsaibia.com';
        $isAdmin = $user && strtolower(trim($user['email'])) === strtolower(trim($adminEmail));
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
        
        // Get order items with artwork titles and images
        $itemStmt = $pdo->prepare('
            SELECT 
                oi.id,
                oi.artwork_id AS product_id,
                oi.quantity,
                oi.frame_type,
                oi.unit_price,
                (oi.unit_price * oi.quantity) AS subtotal,
                a.title_ar AS product_title_ar,
                a.title_en AS product_title_en,
                a.image AS image,
                o.order_number,
                o.created_at,
                o.customer_name,
                o.customer_email,
                o.customer_phone,
                o.shipping_address,
                o.user_id,
                u.name AS client_name,
                u.email AS client_email
            FROM order_items oi
            INNER JOIN orders o ON o.id = oi.order_id
            LEFT JOIN users u ON u.id = o.user_id
            LEFT JOIN artworks a ON a.id = oi.artwork_id
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
        $adminEmail = defined('ADMIN_EMAIL') ? ADMIN_EMAIL : 'admin@nsaibia.com';
        if (!$user || strtolower(trim($user['email'])) !== strtolower(trim($adminEmail))) {
            json_response(['ok' => false, 'error' => 'unauthorized'], 403);
        }

        $limit = isset($_GET['limit']) ? max(1, min(100, (int)$_GET['limit'])) : 50;
        $offset = isset($_GET['offset']) ? max(0, (int)$_GET['offset']) : 0;

        // Count total orders
        $countStmt = $pdo->query('SELECT COUNT(*) FROM orders');
        $total = (int)$countStmt->fetchColumn();

        // Fetch orders with pagination
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
            ORDER BY o.created_at DESC
            LIMIT :limit OFFSET :offset
        ');
        $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue('offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Attach items to each order
        foreach ($orders as &$ord) {
            $itemStmt = $pdo->prepare('
                SELECT
                    oi.id,
                    oi.artwork_id AS product_id,
                    oi.quantity,
                    oi.frame_type,
                    oi.unit_price,
                    (oi.unit_price * oi.quantity) AS subtotal,
                    a.title_ar AS product_title_ar,
                    a.title_en AS product_title_en,
                    a.image AS image
                FROM order_items oi
                LEFT JOIN artworks a ON a.id = oi.artwork_id
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
    error_log('Orders fetch error: ' . $e->getMessage());
    json_response(['ok' => false, 'error' => 'server_error', 'message' => 'An unexpected server error occurred.'], 500);
}
?>
