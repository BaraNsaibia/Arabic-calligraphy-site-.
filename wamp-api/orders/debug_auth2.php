<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../cors.php';

$headers = [];
if (function_exists('apache_request_headers')) {
    $headers = apache_request_headers();
}
$token = get_bearer_token();
json_response([
    'headers' => $headers,
    'server_auth' => $_SERVER['HTTP_AUTHORIZATION'] ?? null,
    'redirect_auth' => $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null,
    'token' => $token,
    'user' => current_user(db())
]);
