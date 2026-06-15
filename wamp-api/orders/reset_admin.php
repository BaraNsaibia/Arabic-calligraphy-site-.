<?php
require_once __DIR__ . '/../config.php';
$pdo = db();
$new_hash = password_hash('admin', PASSWORD_DEFAULT);
$stmt = $pdo->prepare('UPDATE users SET password_hash = :hash WHERE email = :email');
$stmt->execute(['hash' => $new_hash, 'email' => 'admin@nsaibia.com']);
echo "Password for admin@nsaibia.com has been reset to 'admin'\n";
