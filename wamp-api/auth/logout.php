<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../cors.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['ok' => false, 'error' => 'method_not_allowed'], 405);
}

$token = get_bearer_token();
if ($token) {
    $pdo = db();
    $stmt = $pdo->prepare('DELETE FROM user_sessions WHERE token = :token');
    $stmt->execute(['token' => $token]);
}

json_response(['ok' => true]);
