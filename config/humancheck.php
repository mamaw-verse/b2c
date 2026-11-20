<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Human Check Enabled
    |--------------------------------------------------------------------------
    |
    | Kill switch for every Turnstile check (auth forms and the human pass).
    |
    */
    'enabled' => (bool) env('HUMANCHECK_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | Human Pass Cookie Lifetime (seconds)
    |--------------------------------------------------------------------------
    */
    'ttl' => (int) env('HUMANCHECK_TTL', 1200),

    /*
    |--------------------------------------------------------------------------
    | Bind Human Pass to IP Address
    |--------------------------------------------------------------------------
    |
    | Off by default: mobile networks change IP addresses mid-session.
    |
    */
    'bind_ip' => (bool) env('HUMANCHECK_BIND_IP', false),

    /*
    |--------------------------------------------------------------------------
    | Expected Hostname & Action
    |--------------------------------------------------------------------------
    |
    | Optionally require Cloudflare's siteverify response to match these.
    |
    */
    'expected_hostname' => env('TURNSTILE_EXPECTED_HOSTNAME'),
    'expected_action' => env('TURNSTILE_EXPECTED_ACTION'),
];
