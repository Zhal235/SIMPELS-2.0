<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'storage/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'https://simpels.saza.sch.id',
        'https://api.saza.sch.id',
        'https://mobile.saza.sch.id',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:54475',
        'http://localhost:8888',
        'http://127.0.0.1:8888',
    ],
    'allowed_origins_patterns' => [
        '/^http:\/\/localhost:\\d+$/',
        '/^http:\/\/127\\.0\\.0\\.1:\\d+$/',
        '/^https:\/\/.*\.saza\.sch\.id$/',
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];