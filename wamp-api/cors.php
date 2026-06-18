<?php
declare(strict_types=1);

// CORS Whitelisting
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = false;
$allowed_origins = [
    'https://bara.gamer.free',
    'https://nsaibia.com',
];

if ($origin !== '') {
    $parsed_url = parse_url($origin);
    $host = $parsed_url['host'] ?? '';
    
    // Allow localhost & 127.0.0.1 for local dev
    if ($host === 'localhost' || $host === '127.0.0.1') {
        $allowed = true;
    } 
    // Allow Render preview/production domains
    elseif (preg_match('/\.onrender\.com$/i', $host)) {
        $allowed = true;
    } 
    // Check custom whitelist
    else {
        foreach ($allowed_origins as $allowed_origin) {
            if (strcasecmp($origin, $allowed_origin) === 0) {
                $allowed = true;
                break;
            }
        }
    }
}

if ($allowed) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
} else {
    // Default fallback to first production origin
    header('Access-Control-Allow-Origin: https://bara.gamer.free');
}

header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Authorization, X-Guest-Token, X-Auth-Token');
header('Content-Type: application/json; charset=utf-8');

// Security Hardening Headers
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('X-XSS-Protection: 1; mode=block');
header('Strict-Transport-Security: max-age=31536000; includeSubDomains');

if (function_exists('opcache_invalidate')) {
    opcache_invalidate(__DIR__ . '/auth/register.php', true);
    opcache_invalidate(__DIR__ . '/auth/login.php', true);
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function json_response(array $data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if (!$raw) {
        return [];
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function get_bearer_token(): ?string
{
    // Try standard Authorization header
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    
    // Try custom X-Authorization header
    if (empty($header)) {
        $header = $_SERVER['HTTP_X_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_X_AUTHORIZATION'] ?? '';
    }

    // Try custom X-Auth-Token header
    if (empty($header)) {
        $header = $_SERVER['HTTP_X_AUTH_TOKEN'] ?? $_SERVER['REDIRECT_HTTP_X_AUTH_TOKEN'] ?? '';
    }
    
    if (empty($header) && function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
        if (isset($requestHeaders['Authorization'])) {
            $header = trim($requestHeaders['Authorization']);
        } elseif (isset($requestHeaders['X-Authorization'])) {
            $header = trim($requestHeaders['X-Authorization']);
        } elseif (isset($requestHeaders['X-Auth-Token'])) {
            $header = trim($requestHeaders['X-Auth-Token']);
        }
    }

    // Final fallback: query parameter
    if (empty($header) && isset($_GET['token'])) {
        $header = 'Bearer ' . trim($_GET['token']);
    }
    
    if (preg_match('/Bearer\s+(\S+)/i', $header, $matches)) {
        return $matches[1];
    }
    return null;
}

function current_user(PDO $pdo): ?array
{
    $token = get_bearer_token();
    if (!$token) {
        return null;
    }

    $stmt = $pdo->prepare(
        'SELECT u.id, u.name, u.email
         FROM user_sessions s
         INNER JOIN users u ON u.id = s.user_id
         WHERE s.token = :token AND s.expires_at > NOW()
         LIMIT 1'
    );
    $stmt->execute(['token' => $token]);
    $user = $stmt->fetch();

    return $user ?: null;
}
