<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Storefront chrome content
    |--------------------------------------------------------------------------
    |
    | Customer-facing copy and link lists rendered by the site footer and
    | trust strip. {brand} in labels/hrefs is replaced with config('app.name').
    |
    */

    'tagline' => env('MARKETPLACE_TAGLINE', 'Every halal claim verified, delivered across the Philippines.'),

    'support' => [
        'email' => env('MARKETPLACE_SUPPORT_EMAIL', 'support@example.com'),
        'hours' => env('MARKETPLACE_SUPPORT_HOURS', 'Mon–Sat, 9:00–18:00 (PHT)'),
    ],

    'registration' => env('MARKETPLACE_REGISTRATION', 'DTI Business Name Reg. No. 0000-0000'),

    'payments' => ['COD', 'GCash', 'Maya', 'Cards', 'Bank transfer'],

    'couriers' => ['J&T Express', 'Lalamove', 'Ninja Van'],

    'socials' => [
        ['label' => 'Facebook', 'icon' => 'facebook', 'href' => '#'],
        ['label' => 'Instagram', 'icon' => 'instagram', 'href' => '#'],
        ['label' => 'YouTube', 'icon' => 'youtube', 'href' => '#'],
    ],

    'footer' => [
        'shop' => [
            ['label' => 'Categories', 'href' => '/categories/halal-food'],
            ['label' => 'Halal Food', 'href' => '/categories/halal-food'],
            ['label' => 'Meat & Seafood', 'href' => '/categories/meat-seafood'],
            ['label' => 'Dates & Sweets', 'href' => '/categories/dates-sweets'],
            ['label' => 'Modest Fashion', 'href' => '/categories/modest-fashion'],
            ['label' => 'Prayer Essentials', 'href' => '/categories/prayer-essentials'],
            ['label' => 'Books & Quran', 'href' => '/categories/books-quran'],
            ['label' => 'Vouchers', 'href' => '/categories/vouchers'],
        ],
        'support' => [
            ['label' => 'Help centre', 'href' => '#'],
            ['label' => 'Track order', 'href' => '/account/orders'],
            ['label' => 'Returns & refunds', 'href' => '#'],
            ['label' => 'Contact us', 'href' => 'mailto:'.env('MARKETPLACE_SUPPORT_EMAIL', 'support@example.com')],
            ['label' => 'Report a listing', 'href' => '#'],
        ],
        'trust' => [
            ['label' => 'Halal verification policy', 'href' => '#'],
            ['label' => 'How we verify sellers', 'href' => '#'],
            ['label' => 'Certifier list', 'href' => '#'],
            ['label' => 'Community review of religious items', 'href' => '#'],
        ],
        'sell' => [
            ['label' => 'Sell on {brand}', 'href' => '#'],
            ['label' => 'Seller centre', 'href' => '/seller/dashboard'],
            ['label' => 'Onboarding guide', 'href' => '#'],
            ['label' => 'Halal certification guide', 'href' => '#'],
        ],
        'company' => [
            ['label' => 'About', 'href' => '#'],
            ['label' => 'Terms', 'href' => '#'],
            ['label' => 'Privacy (Data Privacy Act notice)', 'href' => '#'],
            ['label' => 'Cookies', 'href' => '#'],
        ],
    ],

];
