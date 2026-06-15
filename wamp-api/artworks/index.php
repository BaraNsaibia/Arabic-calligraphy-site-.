<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../cors.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['ok' => false, 'error' => 'method_not_allowed'], 405);
}

$pdo = db();
$stmt = $pdo->query(
    'SELECT id, title_ar AS titleAr, title_en AS titleEn,
            subtitle_ar AS subtitleAr, subtitle_en AS subtitleEn,
            price, image, category, size,
            limited_edition AS limitedEdition,
            description_ar AS descriptionAr, description_en AS descriptionEn,
            essay_title_ar AS essayTitleAr, essay_title_en AS essayTitleEn,
            spiritual_ar AS spiritualAr, spiritual_en AS spiritualEn,
            geometric_ar AS geometricAr, geometric_en AS geometricEn
     FROM artworks
     WHERE is_active = 1
     ORDER BY id'
);
$rows = $stmt->fetchAll();

foreach ($rows as &$row) {
    $row['price'] = (float)$row['price'];
    $row['limitedEdition'] = (bool)$row['limitedEdition'];
}
unset($row);

json_response(['ok' => true, 'artworks' => $rows]);
