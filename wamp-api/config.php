<?php
declare(strict_types=1);

// Ensure PHP errors are not sent to the HTTP response (which would break JSON)
// but are logged to a file for debugging on the server.
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);
if (!ini_get('error_log')) {
    ini_set('error_log', __DIR__ . '/php-error.log');
}

// Check if a local/production configuration file exists to override credentials
if (file_exists(__DIR__ . '/db_config.local.php')) {
    include_once __DIR__ . '/db_config.local.php';
}

// Support for standard environment variables (e.g., set by hosting platforms)
if (!defined('DB_HOST')) {
    define('DB_HOST', getenv('DB_HOST') ?: $_ENV['DB_HOST'] ?? $_SERVER['DB_HOST'] ?? 'localhost');
}
if (!defined('DB_NAME')) {
    define('DB_NAME', getenv('DB_NAME') ?: $_ENV['DB_NAME'] ?? $_SERVER['DB_NAME'] ?? 'nsaibia_gallery');
}
if (!defined('DB_USER')) {
    define('DB_USER', getenv('DB_USER') ?: $_ENV['DB_USER'] ?? $_SERVER['DB_USER'] ?? 'root');
}
if (!defined('DB_PASS')) {
    define('DB_PASS', getenv('DB_PASS') !== false ? getenv('DB_PASS') : ($_ENV['DB_PASS'] ?? $_SERVER['DB_PASS'] ?? ''));
}
if (!defined('DB_CHARSET')) {
    define('DB_CHARSET', getenv('DB_CHARSET') ?: $_ENV['DB_CHARSET'] ?? $_SERVER['DB_CHARSET'] ?? 'utf8mb4');
}
if (!defined('ADMIN_EMAIL')) {
    define('ADMIN_EMAIL', getenv('ADMIN_EMAIL') ?: $_ENV['ADMIN_EMAIL'] ?? $_SERVER['ADMIN_EMAIL'] ?? 'admin@nsaibia.com');
}

function db(): PDO
{
    static $pdo = null;

    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
        } catch (PDOException $e) {
            // Provide a clear database error message
            header('Content-Type: application/json; charset=utf-8');
            http_response_code(500);
            echo json_encode([
                'ok' => false,
                'error' => 'database_connection_failed',
                'message' => 'Database connection failed. Please check db_config.local.php settings.',
                'details' => $e->getMessage()
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    return $pdo;
}
