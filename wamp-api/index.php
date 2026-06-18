<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/cors.php';

$db_status = 'Disconnected';

try {
    db();
    $db_status = 'Connected';
} catch (PDOException $e) {
    $db_status = 'Error';
}

json_response([
    'ok' => true,
    'message' => 'Mohsen Nsaibia Gallery API',
    'database' => [
        'status' => $db_status,
    ],
]);
