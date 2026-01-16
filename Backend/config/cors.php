<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'storage/*'],
    'allowed_methods' => ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    'allowed_origins' => [
        'https://simpels.saza.sch.id',
        'https://api.saza.sch.id',
        'https://mobile.saza.sch.id',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:54475',
        'http://localhost:8888',
        'http://127.0.0.1:8888',
        'http://localhost:8001',
        'http://127.0.0.1:8001',
        'http://localhost:8002',
        'http://127.0.0.1:8002',
    ],
    'allowed_origins_patterns' => [
        '/^http:\/\/localhost:\\d+$/',
        '/^http:\/\/127\\.0\\.0\\.1:\\d+$/',
        '/^https:\/\/.*\.saza\.sch\.id$/',
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => ['X-Total-Count', 'X-Page-Count'],
    'max_age' => 0,
    'supports_credentials' => true,
];