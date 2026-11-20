<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI', rtrim((string) env('APP_URL', 'http://localhost'), '/').'/auth/google/callback'),
    ],

    // Cloudflare Turnstile. Outside production the public always-pass dummy
    // keys are used so local development works without a Cloudflare account.
    'turnstile' => [
        'key' => env('TURNSTILE_SITE_KEY', env('APP_ENV') === 'production' ? null : '1x00000000000000000000AA'),
        'secret' => env('TURNSTILE_SECRET_KEY', env('APP_ENV') === 'production' ? null : '1x0000000000000000000000000000000AA'),
    ],

    'google_analytics' => [
        // GA4 web measurement ID (G-XXXXXXXXXX) for the gtag.js snippet.
        'measurement_id' => env('GOOGLE_ANALYTICS_ID'),
        // GA4 Data API (admin dashboard): numeric property ID + service-account key file.
        'property_id' => env('GA4_PROPERTY_ID'),
        'credentials' => env('GOOGLE_ANALYTICS_CREDENTIALS'),
    ],

    'halal_certification' => [
        'url' => env('HALAL_CERTIFICATION_URL'),
    ],

    'b2b' => [
        'url' => env('B2B_URL'),
    ],

];
