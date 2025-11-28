<?php
// Serve test image with proper headers
$filename = 'VnnfwFOmNmJ3ckpwEzeb56U3zcLvzBqJwchUeACc.jpg';
$filepath = 'public/storage/foto-santri/' . $filename;

if (!file_exists($filepath)) {
    http_response_code(404);
    echo json_encode(['error' => 'File not found']);
    exit;
}

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime_type = finfo_file($finfo, $filepath);
finfo_close($finfo);

header('Content-Type: ' . $mime_type);
header('Content-Length: ' . filesize($filepath));
header('Cache-Control: public, max-age=3600');
header('Access-Control-Allow-Origin: *');

readfile($filepath);
