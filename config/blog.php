<?php

declare(strict_types=1);

/*
 * Blog configuration (docs/planning/15-blog.md §10).
 *
 * The blog ships dark: `enabled` is false until launch, and every public
 * blog route, sitemap entry, llms.txt section and footer link reads it.
 */
return [

    'enabled' => (bool) env('BLOG_ENABLED', false),

    'title' => env('BLOG_TITLE', 'HalalBenta Blog'),

    /* Index standfirst. Empty hides the block (no unbacked placeholder copy). */
    'intro' => env('BLOG_INTRO', ''),

    'per_page' => (int) env('BLOG_PER_PAGE', 12),
    'hero_count' => 5,
    'popular_count' => 5,

    /* Popular rail ranks by views in the last N days; older per-day rows are pruned after `daily_views_keep_days`. */
    'popular_window_days' => 30,
    'daily_views_keep_days' => 90,
    'related_count' => 3,

    'house_author_name' => env('BLOG_HOUSE_AUTHOR', 'HalalBenta Editorial'),

    'nofollow_external' => (bool) env('BLOG_NOFOLLOW_EXTERNAL', true),

    /* Slugs that would collide with /blog/{category|tag|author|feed.xml}. */
    'reserved_slugs' => ['category', 'tag', 'author', 'feed.xml', 'search', 'page'],

    /* Publish-checklist warnings only (never blocking): health / certification red flags. */
    'flagged_phrases' => [
        'cures',
        'cure for',
        'guaranteed halal',
        'certified halal by',
        'clinically proven',
        'treats diabetes',
        'miracle',
    ],

    'editors' => [
        'max_pending' => 25,
        'invitation_ttl_days' => (int) env('BLOG_INVITATION_TTL_DAYS', 7),
    ],

    'images' => [
        'disk' => env('BLOG_IMAGE_DISK', 'public'),
        'max_kb' => 3072,
        'max_dimension' => 6000,
        'max_pixels' => 25_000_000,
        'cover_min' => '1200x630',
        'per_post_max' => 30,
        'orphan_days' => 7,
    ],

    /*
     * Consent copy version (Appendix A of the plan). Bumping it changes the copy
     * shown to new acceptances only; it never blocks existing posts.
     */
    'consent_version' => 'v1',

];
