<?php
// Simple route to test file access
header('Content-Type: application/json');

$filename = 'VnnfwFOmNmJ3ckpwEzeb56U3zcLvzBqJwchUeACc.jpg';
$paths = [
    'public/storage/foto-santri/' . $filename,
    'storage/app/public/foto-santri/' . $filename,
];

$result = [
    'paths_checked' => [],
];

foreach ($paths as $path) {
    $exists = file_exists($path);
    $readable = $exists ? is_readable($path) : false;
    $size = $exists ? filesize($path) : 0;
    
    $result['paths_checked'][$path] = [
        'exists' => $exists,
        'readable' => $readable,
        'size' => $size,
    ];
}

// Also test symlink
$result['symlink_public_storage'] = [
    'is_link' => is_link('public/storage'),
    'is_dir' => is_dir('public/storage'),
];

echo json_encode($result, JSON_PRETTY_PRINT);
