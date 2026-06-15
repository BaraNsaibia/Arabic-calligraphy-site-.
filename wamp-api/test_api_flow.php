<?php
$api_base = 'http://localhost:8000';

// 1. Login
$ch = curl_init("$api_base/auth/login.php");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['email' => 'admin@nsaibia.com', 'password' => 'admin']));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
if (!$data || empty($data['token'])) {
    die("Login failed: $response\n");
}
$token = $data['token'];
echo "Logged in successfully. Token: $token\n";

// 2. Fetch Orders
$ch = curl_init("$api_base/orders/index.php");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer $token",
    "Content-Type: application/json"
]);
$response = curl_exec($ch);
curl_close($ch);

echo "Orders response:\n$response\n";
