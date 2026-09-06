<?php

return [
    // real SMS only when true and APP_ENV is production
    'enabled' => (bool) env('SMS_ENABLED', true),

    'bulk_sms_bd' => [
        'api_key' => env('BULK_SMS_API_KEY'),
        'sender_id' => env('BULK_SMS_SENDER_ID'),
        'base_url' => env('BULK_SMS_BASE_URL', 'http://bulksmsbd.net/api/smsapi'),
    ],
];