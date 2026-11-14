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

    'announcement' => env('MARKETPLACE_ANNOUNCEMENT'),

    'nav' => [
        'sell' => env('MARKETPLACE_NAV_SELL_URL', '/seller/dashboard'),
        'help' => env('MARKETPLACE_NAV_HELP_URL', env('MARKETPLACE_PAGE_HELP') ? '/pages/help' : null),
    ],

    /* In-app content pages served at /pages/{key}. A page renders only when
       enabled; sections are { heading, body } blocks. Enable a page once its
       copy has been reviewed. */
    'pages' => [
        'help' => [
            'enabled' => (bool) env('MARKETPLACE_PAGE_HELP', false),
            'title' => 'Help centre',
            'sections' => [],
        ],
        'returns' => [
            'enabled' => (bool) env('MARKETPLACE_PAGE_RETURNS', true),
            'title' => 'Returns & refunds',
            'sections' => [
                ['heading' => 'Return window', 'body' => 'You can request a return within '.env('MARKETPLACE_RETURN_WINDOW_DAYS', 7).' days after your order is completed.'],
                ['heading' => 'How to request', 'body' => 'Open the order under My purchases and choose Return/Refund. The seller reviews your request and a moderator steps in if it is disputed.'],
                ['heading' => 'Partial refunds', 'body' => 'Choose the item quantities you want reviewed. The seller may approve a partial refund for selected quantities or a full refund for all remaining items. Approved amounts reflect your share of any order voucher discount.'],
                ['heading' => 'Review timeline', 'body' => 'The order timeline records when you submit a request, when the seller reviews it, and the amount approved. A declined request includes the seller’s reason.'],
                ['heading' => 'Disputes', 'body' => 'If you disagree with the seller’s decision, contact support with your order number and the details of your request so our team can review the case.'],
            ],
        ],
        'about' => [
            'enabled' => (bool) env('MARKETPLACE_PAGE_ABOUT', false),
            'title' => 'About us',
            'sections' => [],
        ],
        'terms' => [
            'enabled' => (bool) env('MARKETPLACE_PAGE_TERMS', false),
            'title' => 'Terms of service',
            'sections' => [],
        ],
        'privacy' => [
            'enabled' => (bool) env('MARKETPLACE_PAGE_PRIVACY', false),
            'title' => 'Privacy policy',
            'sections' => [],
        ],
        'halal-verification' => [
            'enabled' => (bool) env('MARKETPLACE_PAGE_HALAL', false),
            'title' => 'Halal verification',
            'sections' => [],
        ],
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

    /* Finance. Commission is in basis points (500 = 5%); a category rate
       overrides this default. Hold days delay a sale's availability for
       payout; auto_confirm_days completes shipped orders the buyer never
       confirmed. */
    'commission' => [
        'default_bps' => (int) round((float) env('MARKETPLACE_COMMISSION_RATE', 0) * 100),
    ],

    'auto_confirm_days' => (int) env('MARKETPLACE_AUTO_CONFIRM_DAYS', 7),

    'return_window_days' => (int) env('MARKETPLACE_RETURN_WINDOW_DAYS', 7),

    'payouts' => [
        'hold_days' => (int) env('MARKETPLACE_PAYOUT_HOLD_DAYS', 7),
        'minimum' => (int) env('MARKETPLACE_PAYOUT_MINIMUM', 50000),
    ],

    'seller' => [
        'max_staff' => (int) env('MARKETPLACE_SELLER_MAX_STAFF', 2),
    ],

    'affiliate' => [
        'default_bps' => (int) env('MARKETPLACE_AFFILIATE_DEFAULT_BPS', 500),
        'min_bps' => (int) env('MARKETPLACE_AFFILIATE_MIN_BPS', 100),
        'max_bps' => (int) env('MARKETPLACE_AFFILIATE_MAX_BPS', 3000),
    ],

    'footer' => [
        'shop' => [
            ['label' => 'Sellers', 'href' => '/sellers'],
            ['label' => 'Halal Food', 'href' => '/categories/halal-food'],
            ['label' => 'Meat & Seafood', 'href' => '/categories/meat-seafood'],
            ['label' => 'Dates & Sweets', 'href' => '/categories/dates-sweets'],
            ['label' => 'Modest Fashion', 'href' => '/categories/modest-fashion'],
            ['label' => 'Prayer Essentials', 'href' => '/categories/prayer-essentials'],
            ['label' => 'Books & Quran', 'href' => '/categories/books-quran'],
        ],
        'support' => array_values(array_filter([
            env('MARKETPLACE_NAV_HELP_URL', env('MARKETPLACE_PAGE_HELP') ? '/pages/help' : null) ? ['label' => 'Help centre', 'href' => env('MARKETPLACE_NAV_HELP_URL', '/pages/help')] : null,
            env('MARKETPLACE_PAGE_RETURNS', true) ? ['label' => 'Returns & refunds', 'href' => '/pages/returns'] : null,
            ['label' => 'Track order', 'href' => '/account/orders'],
            env('MARKETPLACE_SUPPORT_EMAIL') ? ['label' => 'Contact us', 'href' => 'mailto:'.env('MARKETPLACE_SUPPORT_EMAIL')] : null,
        ])),
        'trust' => [
            ['label' => 'Why choose us', 'href' => '/why-choose-us'],
        ],
        'sell' => [
            ['label' => 'Start selling', 'href' => '/seller/dashboard'],
            ['label' => 'Seller centre', 'href' => '/seller/dashboard'],
        ],
        'company' => array_values(array_filter([
            env('MARKETPLACE_PAGE_ABOUT') ? ['label' => 'About us', 'href' => '/pages/about'] : null,
            env('MARKETPLACE_PAGE_HALAL') ? ['label' => 'Halal verification', 'href' => '/pages/halal-verification'] : null,
            env('MARKETPLACE_PAGE_TERMS') ? ['label' => 'Terms of service', 'href' => '/pages/terms'] : null,
            env('MARKETPLACE_PAGE_PRIVACY') ? ['label' => 'Privacy policy', 'href' => '/pages/privacy'] : null,
        ])),
    ],

];
