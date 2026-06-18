<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/cors.php';

$db_status = 'Disconnected';
$db_error = null;

try {
    db();
    $db_status = 'Connected Successfully';
} catch (PDOException $e) {
    $db_status = 'Connection Failed';
    $db_error = 'Database connection error';
}

json_response([
    'ok' => true,
    'message' => 'Mohsen Nsaibia Gallery API',
    'database' => [
        'name' => DB_NAME,
        'status' => $db_status,
        'error' => $db_error,
    ],
]);
