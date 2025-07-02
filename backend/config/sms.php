<?php

return [
    'bulk_sms_bd' => [
        'api_key' => env('BULK_SMS_API_KEY', 'SqHmh5ThEGi7XWa0dMG'),
        'sender_id' => env('BULK_SMS_SENDER_ID', '8809617621440'),
        'base_url' => env('BULK_SMS_BASE_URL', 'http://bulksmsbd.net/api/smsapi'),
    ],
];