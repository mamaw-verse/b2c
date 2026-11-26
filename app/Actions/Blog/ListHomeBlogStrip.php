<?php

declare(strict_types=1);

namespace App\Actions\Blog;

use App\Models\BlogPost;
use App\Support\Blog\BlogCard;
use Illuminate\Support\Facades\Cache;

/**
 * The "From the blog" strip on the storefront home page (plan §4.3): the latest posts, shown only
 * while the blog is enabled and at least `MIN_POSTS` are live, so the strip never looks half empty.
 * Cached for 5 minutes under a plain key that `InvalidateBlogCache` clears.
 */
final readonly class ListHomeBlogStrip
{
    public const string CACHE_KEY = 'blog:home:latest';

    public const int MIN_POSTS = 3;

    private const int TTL_SECONDS = 300;

    /**
     * @return list<array<string, mixed>> blog cards, or an empty list when the strip is hidden
     */
    public function handle(): array
    {
        if (! config()->boolean('blog.enabled', false)) {
            return [];
        }

        return Cache::remember(self::CACHE_KEY, self::TTL_SECONDS, function (): array {
            $posts = BlogPost::query()
                ->live()
                ->select(BlogCard::COLUMNS)
                ->with(BlogCard::RELATIONS)
                ->orderByDesc('published_at')
                ->orderByDesc('id')
                ->limit(self::MIN_POSTS)
                ->get();

            return $posts->count() < self::MIN_POSTS ? [] : BlogCard::many($posts);
        });
    }
}
