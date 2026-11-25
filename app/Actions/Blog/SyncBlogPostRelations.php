<?php

declare(strict_types=1);

namespace App\Actions\Blog;

use App\Models\BlogImage;
use App\Models\BlogPost;
use App\Models\BlogTag;
use App\Models\Product;
use App\Support\Blog\RenderedBlogBody;
use Illuminate\Support\Str;

/**
 * Rebuilds the pivots that are derived from a post's content on every save:
 * tags, `blog_post_products` (from `[[product:slug]]` lines) and `blog_post_images`
 * (cover, thumbnail and `blog-image:` references). Slug history is handled by `UpdateBlogPost`.
 */
final readonly class SyncBlogPostRelations
{
    /**
     * @param  list<string>  $tagNames
     */
    public function handle(BlogPost $post, RenderedBlogBody $body, array $tagNames): void
    {
        $this->syncTags($post, $tagNames);
        $this->syncProducts($post, $body->productSlugs);
        $this->syncImages($post, $body->imageIds);
    }

    /**
     * @param  list<string>  $names
     */
    private function syncTags(BlogPost $post, array $names): void
    {
        $ids = [];
        foreach ($names as $name) {
            $name = Str::limit(mb_trim((string) $name), 60, '');
            $slug = Str::limit(Str::slug($name), 80, '');
            if ($name === '' || $slug === '' || isset($ids[$slug])) {
                continue;
            }

            $ids[$slug] = BlogTag::query()->firstOrCreate(['slug' => $slug], ['name' => $name])->id;
        }

        $post->tags()->sync(array_values($ids));
    }

    /**
     * @param  list<string>  $slugs
     */
    private function syncProducts(BlogPost $post, array $slugs): void
    {
        $bySlug = $slugs === [] ? [] : Product::query()->whereIn('slug', $slugs)->pluck('id', 'slug')->all();

        $sync = [];
        $order = 0;
        foreach ($slugs as $slug) {
            if (isset($bySlug[$slug])) {
                $sync[$bySlug[$slug]] = ['sort_order' => $order++];
            }
        }

        $post->products()->sync($sync);
    }

    /**
     * @param  list<string>  $bodyImageIds
     */
    private function syncImages(BlogPost $post, array $bodyImageIds): void
    {
        $ids = array_values(array_unique(array_filter([
            $post->cover_image_id,
            $post->thumbnail_image_id,
            ...$bodyImageIds,
        ])));

        // Unknown ids in the body are a publish error; they must not break the pivot's foreign key.
        $existing = $ids === [] ? [] : BlogImage::query()->whereIn('id', $ids)->pluck('id')->all();

        $post->images()->sync($existing);
    }
}
