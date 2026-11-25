<?php

declare(strict_types=1);

namespace App\Actions\Blog;

use App\Models\BlogPost;
use App\Support\Blog\BlogCard;
use Illuminate\Database\Eloquent\Builder;

/**
 * One paginated, newest-first page of live post cards. Every public listing goes through here so
 * they all select card columns only, eager load the same relations and share the page size.
 */
final readonly class PaginateLiveBlogPosts
{
    /**
     * @param  Builder<BlogPost>  $query
     * @return array{data: list<array<string, mixed>>, meta: array{current_page: int, last_page: int, total: int, per_page: int}}
     */
    public function handle(Builder $query): array
    {
        $paginator = $query
            ->live()
            ->select(BlogCard::COLUMNS)
            ->with(BlogCard::RELATIONS)
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->paginate(max(1, config()->integer('blog.per_page', 12)))
            ->withQueryString();

        return [
            'data' => BlogCard::many($paginator->getCollection()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
                'per_page' => $paginator->perPage(),
            ],
        ];
    }
}
