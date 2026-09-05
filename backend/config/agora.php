<?php

// Agora RTC credentials. Read only through config() so config:cache does not break them.
// The App ID ships in every client bundle; the certificate is a secret and stays in .env.
return [
    'app_id' => env('AGORA_APP_ID'),
    'app_certificate' => env('AGORA_APP_CERTIFICATE'),
    // seconds a token stays valid; a consultation slot is well inside this
    'token_ttl' => (int) env('AGORA_TOKEN_TTL', 7200),
];
