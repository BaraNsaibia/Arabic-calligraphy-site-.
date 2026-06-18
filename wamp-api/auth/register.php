<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../cors.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['ok' => false, 'error' => 'method_not_allowed'], 405);
}

// Rate limiting: max 5 registration attempts per 10 minutes per IP
if (check_rate_limit('register', 5, 600)) {
    json_response(['ok' => false, 'error' => 'rate_limited', 'message' => 'Too many registration attempts. Please try again later.'], 429);
}

$body = read_json_body();
$name = htmlspecialchars(strip_tags(trim((string)($body['name'] ?? ''))), ENT_QUOTES, 'UTF-8');
$email = strtolower(trim((string)($body['email'] ?? '')));
$password = (string)($body['password'] ?? '');

if ($name === '' || $email === '' || strlen($password) < 8) {
    json_response(['ok' => false, 'error' => 'invalid_input', 'message' => 'Password must be at least 8 characters.'], 400);
}

if (strlen($name) > 120) {
    json_response(['ok' => false, 'error' => 'invalid_input', 'message' => 'Name is too long.'], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(['ok' => false, 'error' => 'invalid_email_format'], 400);
}

// Reject trivially weak passwords
$weakPasswords = ['password', '12345678', '123456789', 'qwerty123', 'admin123', 'password1'];
if (in_array(strtolower($password), $weakPasswords, true)) {
    json_response(['ok' => false, 'error' => 'weak_password', 'message' => 'Password is too common. Please choose a stronger password.'], 400);
}

try {
    $pdo = db();

    $check = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
    $check->execute(['email' => $email]);
    if ($check->fetch()) {
        json_response(['ok' => false, 'error' => 'email_exists'], 409);
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);

    $hasUsernameColumn = false;
    $columnStmt = $pdo->prepare("SHOW COLUMNS FROM users LIKE 'username'");
    $columnStmt->execute();
    if ($columnStmt->fetch()) {
        $hasUsernameColumn = true;
    }

    if ($hasUsernameColumn) {
        $insert = $pdo->prepare(
            'INSERT INTO users (name, email, password_hash, username) VALUES (:name, :email, :hash, :username)'
        );
        $insert->execute([
            'name' => $name,
            'email' => $email,
            'hash' => $hash,
            'username' => $email,
        ]);
    } else {
        $insert = $pdo->prepare('INSERT INTO users (name, email, password_hash) VALUES (:name, :email, :hash)');
        $insert->execute(['name' => $name, 'email' => $email, 'hash' => $hash]);
    }

    $userId = (int)$pdo->lastInsertId();

    $token = bin2hex(random_bytes(32));
    $session = $pdo->prepare(
        'INSERT INTO user_sessions (user_id, token, expires_at) VALUES (:user_id, :token, DATE_ADD(NOW(), INTERVAL 30 DAY))'
    );
    $session->execute(['user_id' => $userId, 'token' => $token]);

    json_response([
        'ok' => true,
        'user' => ['name' => $name, 'email' => $email],
        'token' => $token,
    ]);
} catch (Throwable $err) {
    error_log('Registration error: ' . $err->getMessage());
    json_response(['ok' => false, 'error' => 'server_error', 'message' => 'An unexpected server error occurred.'], 500);
}
