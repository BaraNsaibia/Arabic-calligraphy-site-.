<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../cors.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['ok' => false, 'error' => 'method_not_allowed'], 405);
}

$pdo = db();
$user = current_user($pdo);

if (!$user) {
    json_response(['ok' => true, 'user' => null]);
}

json_response([
    'ok' => true,
    'user' => ['name' => $user['name'], 'email' => $user['email']],
]);
