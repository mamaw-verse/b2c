<?php

declare(strict_types=1);

namespace App\Actions\Blog;

use App\Models\BlogPost;
use App\Support\Blog\BlogCard;

/**
 * Related reads: same category first, then posts that share a tag, newest first (plan §4.3).
 */
final readonly class ListRelatedPosts
{
    /**
     * @return list<array<string, mixed>>
     */
    public function handle(BlogPost $post, ?int $limit = null): array
    {
        $limit ??= max(1, config()->integer('blog.related_count', 3));
        $tagIds = $post->tags->modelKeys();

        $related = BlogPost::query()
            ->live()
            ->whereKeyNot($post->getKey())
            ->where(function ($query) use ($post, $tagIds): void {
                $query->where('blog_category_id', $post->blog_category_id);
                if ($tagIds !== []) {
                    $query->orWhereHas('tags', fn ($tags) => $tags->whereIn('blog_tags.id', $tagIds));
                }
            })
            ->select(BlogCard::COLUMNS)
            ->with(BlogCard::RELATIONS)
            ->orderByRaw('CASE WHEN blog_category_id = ? THEN 0 ELSE 1 END', [$post->blog_category_id])
            ->orderByDesc('published_at')
            ->limit($limit)
            ->get();

        return BlogCard::many($related);
    }
}
