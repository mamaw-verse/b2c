<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Storefront chrome content
    |--------------------------------------------------------------------------
    |
    | Customer-facing copy and link lists rendered by the site header, footer
    | and trust strip. {brand} in labels/hrefs is replaced with
    | config('app.name'). Empty values hide the matching UI block — nothing
    | renders a placeholder or an unbacked claim.
    |
    */

    'tagline' => env('MARKETPLACE_TAGLINE', 'Every halal claim verified, delivered across the Philippines.'),

    'support' => [
        'email' => env('MARKETPLACE_SUPPORT_EMAIL'),
        'hours' => env('MARKETPLACE_SUPPORT_HOURS'),
    ],

    'registration' => env('MARKETPLACE_REGISTRATION'),

    'payments' => array_values(array_filter(explode(',', (string) env('MARKETPLACE_PAYMENTS')))),

    'couriers' => array_values(array_filter(explode(',', (string) env('MARKETPLACE_COURIERS')))),

    'nav' => [
        'sell' => env('MARKETPLACE_NAV_SELL_URL', '/seller/dashboard'),
        'help' => env('MARKETPLACE_NAV_HELP_URL'),
    ],

    'claims' => [
        'halal_verification' => (bool) env('MARKETPLACE_CLAIM_HALAL_VERIFICATION', false),
    ],

    /* Home page trust strip. Each item renders only when enabled; the COD
       item additionally requires COD in `payments`. */
    'trust' => [
        'certificates' => (bool) env('MARKETPLACE_TRUST_CERTIFICATES', false),
        'cold_chain' => (bool) env('MARKETPLACE_TRUST_COLD_CHAIN', true),
        'cod' => (bool) env('MARKETPLACE_TRUST_COD', true),
    ],

    'socials' => array_values(array_filter([
        env('MARKETPLACE_SOCIAL_FACEBOOK') ? ['label' => 'Facebook', 'icon' => 'facebook', 'href' => env('MARKETPLACE_SOCIAL_FACEBOOK')] : null,
        env('MARKETPLACE_SOCIAL_INSTAGRAM') ? ['label' => 'Instagram', 'icon' => 'instagram', 'href' => env('MARKETPLACE_SOCIAL_INSTAGRAM')] : null,
        env('MARKETPLACE_SOCIAL_YOUTUBE') ? ['label' => 'YouTube', 'icon' => 'youtube', 'href' => env('MARKETPLACE_SOCIAL_YOUTUBE')] : null,
    ])),

    /* Seller Terms shown at /seller/terms and versioned on acceptance.
       `draft` stays true until legal review signs the text off. Any value
       left null renders as "[to be confirmed]" on the page. */
    'seller_terms' => [
        'version' => env('SELLER_TERMS_VERSION', '0.1'),
        'updated' => env('SELLER_TERMS_UPDATED', '2026-11-09'),
        'draft' => (bool) env('SELLER_TERMS_DRAFT', true),
        'entity_name' => env('MARKETPLACE_ENTITY_NAME'),
        'commission_rate' => env('MARKETPLACE_COMMISSION_RATE'),
        'payout_schedule' => env('MARKETPLACE_PAYOUT_SCHEDULE'),
        'ship_within_days' => env('MARKETPLACE_SHIP_WITHIN_DAYS'),
        'return_window_days' => env('MARKETPLACE_RETURN_WINDOW_DAYS'),
        'contact_email' => env('MARKETPLACE_SUPPORT_EMAIL'),
        'venue' => env('MARKETPLACE_VENUE'),
    ],

    'footer' => [
        'shop' => [
            ['label' => 'Halal Food', 'href' => '/categories/halal-food'],
            ['label' => 'Meat & Seafood', 'href' => '/categories/meat-seafood'],
            ['label' => 'Dates & Sweets', 'href' => '/categories/dates-sweets'],
            ['label' => 'Modest Fashion', 'href' => '/categories/modest-fashion'],
            ['label' => 'Prayer Essentials', 'href' => '/categories/prayer-essentials'],
            ['label' => 'Books & Quran', 'href' => '/categories/books-quran'],
            ['label' => 'Vouchers', 'href' => '/categories/vouchers'],
        ],
        'support' => array_values(array_filter([
            env('MARKETPLACE_NAV_HELP_URL') ? ['label' => 'Help centre', 'href' => env('MARKETPLACE_NAV_HELP_URL')] : null,
            ['label' => 'Track order', 'href' => '/account/orders'],
            env('MARKETPLACE_SUPPORT_EMAIL') ? ['label' => 'Contact us', 'href' => 'mailto:'.env('MARKETPLACE_SUPPORT_EMAIL')] : null,
        ])),
        'trust' => [],
        'sell' => [
            ['label' => 'Sell on {brand}', 'href' => '/seller/dashboard'],
            ['label' => 'Seller centre', 'href' => '/seller/dashboard'],
        ],
        'company' => [],
    ],

];
