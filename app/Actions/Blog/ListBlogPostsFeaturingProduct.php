<?php

declare(strict_types=1);

namespace App\Actions\Blog;

use App\Models\BlogPost;
use App\Models\Product;
use App\Support\Blog\BlogCard;

/**
 * Live posts that embed a product, for the "Featured in" block on the product page
 * (docs/planning/15-blog.md B4.3). Driven by `blog_post_products`, which `SyncBlogPostRelations`
 * rebuilds on every save. Empty while the blog is off, so the block simply does not render.
 */
final readonly class ListBlogPostsFeaturingProduct
{
    public const int LIMIT = 3;

    /** @return list<array<string, mixed>> */
    public function handle(Product $product): array
    {
        if (! config()->boolean('blog.enabled')) {
            return [];
        }

        return BlogCard::many(
            BlogPost::query()
                ->live()
                ->whereHas('products', fn ($query) => $query->whereKey($product->getKey()))
                ->select(BlogCard::COLUMNS)
                ->with(BlogCard::RELATIONS)
                ->orderByDesc('published_at')
                ->orderByDesc('id')
                ->limit(self::LIMIT)
                ->get()
        );
    }
}
