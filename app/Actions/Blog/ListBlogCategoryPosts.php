<?php

declare(strict_types=1);

namespace App\Actions\Blog;

use App\Models\BlogCategory;
use App\Models\BlogPost;

final readonly class ListBlogCategoryPosts
{
    public function __construct(private PaginateLiveBlogPosts $paginate) {}

    /**
     * @return array{data: list<array<string, mixed>>, meta: array<string, int>}
     */
    public function handle(BlogCategory $category): array
    {
        return $this->paginate->handle(BlogPost::query()->inCategory($category));
    }
}
