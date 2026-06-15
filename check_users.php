<?php
require 'C:/wamp64/www/nsaibia-api/wamp-api/config.php';
$pdo = db();
$stmt = $pdo->query('SELECT * FROM users ORDER BY id DESC LIMIT 5');
$users = $stmt->fetchAll();
echo json_encode($users);
