<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../cors.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['ok' => false, 'error' => 'method_not_allowed'], 405);
}

// Rate limiting: max 5 login attempts per 5 minutes per IP
if (check_rate_limit('login', 5, 300)) {
    json_response(['ok' => false, 'error' => 'rate_limited', 'message' => 'Too many login attempts. Please try again later.'], 429);
}

$body = read_json_body();
$email = strtolower(trim((string)($body['email'] ?? '')));
$password = (string)($body['password'] ?? '');

if ($email === '' || $password === '') {
    json_response(['ok' => false, 'error' => 'invalid_input'], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(['ok' => false, 'error' => 'invalid_email_format'], 400);
}

try {
    $pdo = db();
    $stmt = $pdo->prepare('SELECT id, name, email, password_hash FROM users WHERE email = :email LIMIT 1');
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        json_response(['ok' => false, 'error' => 'invalid'], 401);
    }

    $token = bin2hex(random_bytes(32));
    $session = $pdo->prepare(
        'INSERT INTO user_sessions (user_id, token, expires_at) VALUES (:user_id, :token, DATE_ADD(NOW(), INTERVAL 30 DAY))'
    );
    $session->execute(['user_id' => $user['id'], 'token' => $token]);

    json_response([
        'ok' => true,
        'user' => ['name' => $user['name'], 'email' => $user['email']],
        'token' => $token,
    ]);
} catch (Throwable $err) {
    error_log('Login error: ' . $err->getMessage());
    json_response(['ok' => false, 'error' => 'server_error', 'message' => 'An unexpected server error occurred.'], 500);
}
