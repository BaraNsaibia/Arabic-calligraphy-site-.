<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/cors.php';

json_response([
    'ok' => true,
    'message' => 'Mohsen Nsaibia Gallery API',
    'database' => DB_NAME,
]);
