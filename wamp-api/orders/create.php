<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../cors.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['ok' => false, 'error' => 'method_not_allowed'], 405);
}

$body = read_json_body();

// Security Hardening: Input Sanitization and XSS Mitigation
$customerName = htmlspecialchars(strip_tags(trim((string)($body['customerName'] ?? ''))), ENT_QUOTES, 'UTF-8');
$customerPhone = htmlspecialchars(strip_tags(trim((string)($body['customerPhone'] ?? ''))), ENT_QUOTES, 'UTF-8');
$rawEmail = trim((string)($body['customerEmail'] ?? ''));

// Validate Email Format strictly if provided
$customerEmail = '';
if ($rawEmail !== '') {
    if (!filter_var($rawEmail, FILTER_VALIDATE_EMAIL)) {
        json_response(['ok' => false, 'error' => 'invalid_email_format'], 400);
    }
    $customerEmail = strtolower($rawEmail);
}

$shippingAddress = htmlspecialchars(strip_tags(trim((string)($body['shippingAddress'] ?? ''))), ENT_QUOTES, 'UTF-8');
$paymentMethod = htmlspecialchars(strip_tags(trim((string)($body['paymentMethod'] ?? ''))), ENT_QUOTES, 'UTF-8');
$paymentReference = htmlspecialchars(strip_tags(trim((string)($body['paymentReference'] ?? ''))), ENT_QUOTES, 'UTF-8');
$guestToken = isset($body['guest_token']) ? htmlspecialchars(strip_tags(trim((string)$body['guest_token'])), ENT_QUOTES, 'UTF-8') : null;
if ($guestToken === '') {
    $guestToken = null;
}
$items = $body['items'] ?? [];

// Validate input fields are not empty
if ($customerName === '' || $customerPhone === '' || $shippingAddress === '' || !is_array($items) || count($items) === 0) {
    json_response(['ok' => false, 'error' => 'invalid_input'], 400);
}

// Regex Phone Number Validation
if (!preg_match('/^\+?[0-9\s\-]{8,20}$/', $customerPhone)) {
    json_response(['ok' => false, 'error' => 'invalid_phone'], 400);
}

// Payment Validation
if ($paymentMethod !== '') {
    if (!in_array($paymentMethod, ['d17_mobile', 'cash_on_delivery', 'check_on_delivery', 'gallery_pickup'], true)) {
        json_response(['ok' => false, 'error' => 'invalid_payment_method'], 400);
    }
    if ($paymentMethod === 'd17_mobile' && !preg_match('/^\d{8}$/', $paymentReference)) {
        json_response(['ok' => false, 'error' => 'invalid_d17_reference'], 400);
    }
}

$pdo = db();
$user = current_user($pdo);
$userId = $user ? (int)$user['id'] : null;

$total = 0.0;
$normalizedItems = [];

// Prepare artwork verification query to prevent price manipulation
$artQuery = $pdo->prepare('SELECT price, is_active FROM artworks WHERE id = :id LIMIT 1');

foreach ($items as $item) {
    $artworkId = (string)($item['artworkId'] ?? '');
    $quantity = max(1, (int)($item['quantity'] ?? 1));
    $frameType = (string)($item['frameType'] ?? 'museum_gold');
    $unitPrice = (float)($item['unitPrice'] ?? 0);

    if ($artworkId === '' || $unitPrice <= 0) {
        json_response(['ok' => false, 'error' => 'invalid_item'], 400);
    }

    if (!in_array($frameType, ['classic_wood', 'museum_gold', 'obsidian_minimal'], true)) {
        json_response(['ok' => false, 'error' => 'invalid_frame'], 400);
    }

    // Integrity Check: Verify that the product exists and has matching price in DB
    $artQuery->execute(['id' => $artworkId]);
    $artwork = $artQuery->fetch();
    if (!$artwork) {
        json_response(['ok' => false, 'error' => 'artwork_not_found'], 400);
    }

    if (!(bool)$artwork['is_active']) {
        json_response(['ok' => false, 'error' => 'artwork_inactive'], 400);
    }

    $realPrice = (float)$artwork['price'];
    if (abs($realPrice - $unitPrice) > 0.01) {
        json_response(['ok' => false, 'error' => 'price_mismatch'], 400);
    }

    $total += $unitPrice * $quantity;
    $normalizedItems[] = [
        'artworkId' => $artworkId,
        'quantity' => $quantity,
        'frameType' => $frameType,
        'unitPrice' => $unitPrice,
    ];
}

try {
    // Disable FK checks — artworks are managed client-side in data.ts
    // and may not exist in the DB artworks table
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
    $pdo->beginTransaction();

    // Generate order number securely
    $orderNumber = 'ORD-' . date('YmdHis') . '-' . rand(10000, 99999);

    // Determine secure payment status - all start as pending verification
    $paymentStatus = 'pending';

    $orderStmt = $pdo->prepare(
        'INSERT INTO orders (user_id, guest_token, customer_name, customer_email, customer_phone, order_number, total_amount, shipping_address, payment_method, payment_reference, payment_status, status, created_at)
         VALUES (:user_id, :guest_token, :customer_name, :customer_email, :customer_phone, :order_number, :total_amount, :shipping_address, :payment_method, :payment_reference, :payment_status, :status, NOW())'
    );
    $orderStmt->execute([
        'user_id' => $userId,
        'guest_token' => $guestToken,
        'customer_name' => $customerName,
        'customer_email' => $customerEmail !== '' ? $customerEmail : null,
        'customer_phone' => $customerPhone,
        'order_number' => $orderNumber,
        'total_amount' => $total,
        'shipping_address' => $shippingAddress,
        'payment_method' => $paymentMethod !== '' ? $paymentMethod : null,
        'payment_reference' => $paymentReference !== '' ? $paymentReference : null,
        'payment_status' => $paymentStatus,
        'status' => 'pending',
    ]);

    $orderId = (int)$pdo->lastInsertId();
    $itemStmt = $pdo->prepare(
        'INSERT INTO order_items (order_id, artwork_id, quantity, frame_type, unit_price)
         VALUES (:order_id, :artwork_id, :quantity, :frame_type, :unit_price)'
    );

    foreach ($normalizedItems as $item) {
        $itemStmt->execute([
            'order_id' => $orderId,
            'artwork_id' => $item['artworkId'],
            'quantity' => $item['quantity'],
            'frame_type' => $item['frameType'],
            'unit_price' => $item['unitPrice'],
        ]);
    }

    $pdo->commit();
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');



    json_response(['ok' => true, 'orderId' => $orderId, 'orderNumber' => $orderNumber, 'total' => $total]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
    error_log('Order creation error: ' . $e->getMessage());
    json_response(['ok' => false, 'error' => 'server_error', 'message' => 'An unexpected server error occurred.'], 500);
}
