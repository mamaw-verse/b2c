<?php

declare(strict_types=1);

namespace App\Actions\Blog;

use App\Models\BlogPost;
use App\Models\BlogTag;

final readonly class ListBlogTagPosts
{
    public function __construct(private PaginateLiveBlogPosts $paginate) {}

    /**
     * @return array{data: list<array<string, mixed>>, meta: array<string, int>}
     */
    public function handle(BlogTag $tag): array
    {
        return $this->paginate->handle(
            BlogPost::query()->whereHas('tags', fn ($query) => $query->whereKey($tag->getKey()))
        );
    }
}
