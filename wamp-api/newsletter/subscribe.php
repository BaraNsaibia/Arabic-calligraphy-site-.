<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../cors.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['ok' => false, 'error' => 'method_not_allowed'], 405);
}

$body = read_json_body();
$email = strtolower(trim((string)($body['email'] ?? '')));
$language = ($body['language'] ?? 'ar') === 'en' ? 'en' : 'ar';

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(['ok' => false, 'error' => 'invalid_email'], 400);
}

$pdo = db();
$stmt = $pdo->prepare(
    'INSERT INTO newsletter_subscribers (email, language)
     VALUES (:email, :language)
     ON DUPLICATE KEY UPDATE language = VALUES(language)'
);
$stmt->execute(['email' => $email, 'language' => $language]);

json_response(['ok' => true]);
