<?php

declare(strict_types=1);

namespace App\Actions\Blog;

use App\Models\BlogPost;
use App\Support\Blog\BlogImageData;

/**
 * Props for the public post page. The public byline is always the author profile, never the
 * internal creator (plan §4.7), and the house author never gets a profile link or author box.
 */
final readonly class ShowBlogPost
{
    public function __construct(private ListRelatedPosts $related) {}

    /**
     * @return array<string, mixed>
     */
    public function handle(BlogPost $post): array
    {
        $post->load(['category.shopCategory:id,name,slug', 'author.avatar', 'coverImage', 'tags:id,name,slug']);

        $author = $post->author;
        $hasProfile = ! $author->is_house && $author->is_active;

        $modified = $post->published_at !== null
            && $post->updated_at->gt($post->published_at->addDay());

        $toc = $post->toc ?? [];
        $shopCategory = $post->category->shopCategory;

        return [
            'post' => [
                'id' => $post->id,
                'title' => $post->title,
                'slug' => $post->slug,
                'excerpt' => $post->excerpt,
                'published_at' => $post->published_at?->toIso8601String(),
                // "Updated" is shown only when materially later than published.
                'updated_at' => $modified ? $post->updated_at->toIso8601String() : null,
                'reading_minutes' => $post->reading_minutes,
                'category' => ['name' => $post->category->name, 'slug' => $post->category->slug],
                'cover' => $post->coverImage === null ? null : BlogImageData::for($post->coverImage, 'large'),
                'html' => $post->body_html,
                // The table of contents only appears with at least three headings.
                'toc' => count($toc) >= 3 ? array_values($toc) : [],
                'tags' => $post->tags->map(fn ($tag): array => ['name' => $tag->name, 'slug' => $tag->slug])->values()->all(),
            ],
            'author' => $author->is_house
                ? ['name' => $author->display_name, 'is_house' => true, 'has_profile' => false]
                : ShowBlogAuthor::present($author) + ['is_house' => false, 'has_profile' => $hasProfile],
            'related' => $this->related->handle($post),
            'cta' => $shopCategory === null ? null : ['label' => 'Shop '.$shopCategory->name, 'category_slug' => $shopCategory->slug],
        ];
    }
}
