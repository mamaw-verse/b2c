<?php

declare(strict_types=1);

namespace App\Actions\Blog;

use App\Actions\Seo\BuildLlmsTxt;
use Illuminate\Support\Facades\Cache;

/**
 * Clears everything derived from blog content. Plain keys, not tags: the default cache
 * store (`database`) has no tag support (docs/planning/15-blog.md §6.3).
 */
final readonly class InvalidateBlogCache
{
    public const INDEX_KEYS = [
        'blog:index:hero',
        'blog:index:chips',
        'blog:index:popular',
        ListHomeBlogStrip::CACHE_KEY,
        BuildBlogFeed::CACHE_KEY,
    ];

    public function handle(): void
    {
        foreach (self::INDEX_KEYS as $key) {
            Cache::forget($key);
        }

        Cache::forget('sitemap:blog');
        Cache::forget('sitemap:index');
        Cache::forget(BuildLlmsTxt::CACHE_KEY);
    }
}
