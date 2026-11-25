<?php

declare(strict_types=1);

namespace App\Actions\Blog;

use App\Models\BlogCategory;
use Illuminate\Support\Facades\Cache;

/**
 * The category chip row: only categories with at least one live post, in `sort_order`.
 * Cached for 5 minutes (cleared by `InvalidateBlogCache`).
 */
final readonly class ListBlogCategoryChips
{
    /**
     * @return list<array{name: string, slug: string}>
     */
    public function handle(): array
    {
        return Cache::remember('blog:index:chips', 300, fn (): array => BlogCategory::query()
            ->whereHas('posts', fn ($query) => $query->live())
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'slug'])
            ->map(fn (BlogCategory $category): array => ['name' => $category->name, 'slug' => $category->slug])
            ->all());
    }
}
