<?php

declare(strict_types=1);

namespace App\Support\Blog;

use App\Models\BlogPost;

/**
 * The card shape shared by every blog listing (index, hero, popular, category, tag, author, related).
 * Cards never carry the body, so listings select only card columns and eager load `CARD_RELATIONS`.
 */
final class BlogCard
{
    /** Columns a listing query must select to build a card (never `body_*`). */
    public const COLUMNS = [
        'id', 'blog_category_id', 'title', 'slug', 'excerpt', 'published_at',
        'reading_minutes', 'thumbnail_image_id', 'cover_image_id',
    ];

    /** @var list<string> */
    public const RELATIONS = ['category:id,name,slug', 'thumbnailImage', 'coverImage'];

    /**
     * @return array{
     *     id: string, title: string, slug: string, excerpt: string, published_at: string|null,
     *     reading_minutes: int, category: array{name: string, slug: string}|null,
     *     image: array{src: string, srcset: string|null, width: int, height: int, alt: string}|null
     * }
     */
    public static function from(BlogPost $post): array
    {
        // Cards use the thumbnail, falling back to the cover (plan §4.3). A thumbnail may be decorative (empty alt).
        $image = $post->thumbnailImage ?? $post->coverImage;

        return [
            'id' => $post->id,
            'title' => $post->title,
            'slug' => $post->slug,
            'excerpt' => $post->excerpt,
            'published_at' => $post->published_at?->toIso8601String(),
            'reading_minutes' => $post->reading_minutes,
            'category' => $post->category === null ? null : ['name' => $post->category->name, 'slug' => $post->category->slug],
            'image' => $image === null ? null : BlogImageData::for($image, 'medium'),
        ];
    }

    /**
     * @param  iterable<int, BlogPost>  $posts
     * @return list<array<string, mixed>>
     */
    public static function many(iterable $posts): array
    {
        $cards = [];
        foreach ($posts as $post) {
            $cards[] = self::from($post);
        }

        return $cards;
    }
}
