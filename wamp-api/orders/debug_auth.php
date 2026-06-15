<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../cors.php';
$pdo = db();
$stmt = $pdo->query('SELECT * FROM users');
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);
json_response(['users' => $users]);
