<?php

declare(strict_types=1);

namespace App\Actions\Blog\Admin;

use App\Models\BlogCategory;
use App\Models\Category;

final readonly class ListBlogCategories
{
    /**
     * @return array<string, mixed>
     */
    public function handle(): array
    {
        return [
            'categories' => BlogCategory::query()
                ->with('shopCategory:id,name')
                ->withCount('posts')
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get()
                ->map(fn (BlogCategory $category) => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'description' => $category->description,
                    'sort_order' => $category->sort_order,
                    'is_system' => $category->is_system,
                    'shop_category_id' => $category->shop_category_id,
                    'shop_category_name' => $category->shopCategory?->name,
                    'posts_count' => $category->posts_count,
                ])->values(),
            'shop_categories' => Category::query()->orderBy('name')->get(['id', 'name'])
                ->map(fn (Category $category) => ['id' => $category->id, 'name' => $category->name])->values(),
        ];
    }
}
