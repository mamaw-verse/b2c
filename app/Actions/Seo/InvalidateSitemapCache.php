<?php

declare(strict_types=1);

namespace App\Actions\Seo;

use Illuminate\Support\Facades\Cache;

final readonly class InvalidateSitemapCache
{
    public function handle(): void
    {
        Cache::forget('sitemap:index');
        Cache::forget('sitemap:pages');
        Cache::forget('sitemap:categories');
        Cache::forget('sitemap:shops');
        Cache::forget(BuildLlmsTxt::CACHE_KEY);

        for ($i = 1; $i <= 50; $i++) {
            Cache::forget("sitemap:products:{$i}");
        }
    }
}
