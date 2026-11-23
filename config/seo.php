<?php

declare(strict_types=1);

/*
 * Single source of truth for SEO / GEO configuration (docs/planning/14).
 *
 * robots.txt, <meta name="robots">, the X-Robots-Tag header, and the JSON-LD
 * entity graph all read from here so they cannot drift apart.
 */
return [

    /* Force `noindex, nofollow` and `Disallow: /` everywhere (staging, previews). */
    'force_noindex' => (bool) env('SEO_FORCE_NOINDEX', false),

    'site_name' => env('SEO_SITE_NAME', 'HalalBenta'),

    /* Open Graph locale (og:locale) and BCP 47 language tag (schema inLanguage / html lang). */
    'locale' => 'en_PH',
    'language' => 'en-PH',

    'slogan' => 'Verified halal marketplace in the Philippines',

    'description' => 'Shop verified halal food, meat & seafood, dates & sweets, modest fashion, prayer essentials and more. Escrow-protected checkout, delivered across the Philippines.',

    /* Paths are relative to the canonical origin (config('app.url')). */
    'default_og_image' => '/social/default-og.jpg',

    /*
     * Social image policy (docs/planning/14 T3.2).
     * If true, og:image / twitter:image prefers the seller's first real photo
     * and only falls back to the generated card when no photo is uploaded.
     */
    'prefer_photo_og' => [
        'product' => (bool) env('SEO_PREFER_PRODUCT_PHOTO_OG', true),
    ],

    /* Organization logo: must be square and >= 112x112 to satisfy Google's logo guidelines. */
    'logo_path' => '/brand/halalbenta-icon-512.png',
    'logo_size' => 512,

    /* Official profiles for Organization.sameAs. Reuses the footer social links. */
    'social_profiles' => array_values(array_filter([
        env('MARKETPLACE_SOCIAL_FACEBOOK'),
        env('MARKETPLACE_SOCIAL_INSTAGRAM'),
        env('MARKETPLACE_SOCIAL_YOUTUBE'),
        env('SEO_SOCIAL_TIKTOK'),
        env('SEO_SOCIAL_LINKEDIN'),
        env('SEO_SOCIAL_GOOGLE_BUSINESS'),
    ])),

    /* Twitter/X handle (without @) for twitter:site. Null = tag omitted. */
    'twitter_handle' => env('SEO_TWITTER_HANDLE'),

    /* Public customer-support contact for Organization.contactPoint. Null values are omitted. */
    'contact' => [
        'email' => env('MARKETPLACE_SUPPORT_EMAIL'),
        'phone' => env('SEO_CONTACT_PHONE'),
    ],

    'area_served' => 'PH',

    'knows_about' => ['Halal food', 'Modest fashion', 'Prayer essentials', 'Halal certification'],

    /*
     * Private paths (Str::is patterns, no leading slash). These are noindex,nofollow
     * in <meta robots> and X-Robots-Tag, and Disallowed in robots.txt.
     */
    'private_path_patterns' => [
        'cart*',
        'checkout*',
        'order-confirmed*',
        'account*',
        'login',
        'register',
        'forgot-password',
        'reset-password*',
        'two-factor*',
        'password*',
        'confirm-password',
        'verify-email*',
        'seller/*',
        'admin*',
        'api*',
        'orders*',
        'reports*',
        'staff-invitations*',
    ],

    /* Paths that match a private pattern but are public (robots Allow + indexable). */
    'public_path_exceptions' => [
        'seller/terms',
    ],

    /* Public but thin/duplicate: `noindex, follow` and Disallowed in robots.txt. */
    'noindex_follow_paths' => [
        'search',
    ],

    /* Faceted / sorting query params: Disallowed in robots.txt as `/*?*{param}=`. */
    'disallowed_query_params' => [
        'sort',
        'filter',
        'halal',
        'price_min',
        'price_max',
    ],

    /*
     * AI crawler policy (docs/planning/14 T4.1). Names change over time: re-verify
     * against each vendor's documentation before relying on this list.
     *
     *  - `search`  : answer-engine / user-triggered fetchers. Allowed so the marketplace can be cited.
     *  - `training`: model-training crawlers. Allowed unless SEO_BLOCK_AI_TRAINING=true.
     *
     * Every named group repeats the private-path Disallows because a named
     * User-agent group replaces the `*` group for that bot.
     */
    'ai_crawlers' => [
        'emit_groups' => (bool) env('SEO_AI_CRAWLER_GROUPS', true),
        'block_training' => (bool) env('SEO_BLOCK_AI_TRAINING', false),
        'search' => [
            'OAI-SearchBot',
            'ChatGPT-User',
            'PerplexityBot',
            'Perplexity-User',
            'Claude-SearchBot',
            'Claude-User',
        ],
        'training' => [
            'GPTBot',
            'ClaudeBot',
            'Google-Extended',
            'CCBot',
            'Applebot-Extended',
            'Bytespider',
        ],
    ],
];
