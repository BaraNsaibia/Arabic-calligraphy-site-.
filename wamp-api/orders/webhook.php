<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../cors.php';

// Webhook confirmation via WhatsApp "ok" is disabled.
json_response(['ok' => false, 'error' => 'disabled'], 410);
