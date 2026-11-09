<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\Category;

final readonly class ListAdminCategories
{
    /**
     * @return array<string, mixed>
     */
    public function handle(): array
    {
        return [
            'categories' => Category::query()
                ->with('parent:id,name')
                ->withCount(['products', 'children'])
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get()
                ->map(fn (Category $category) => [
                    'id' => $category->id,
                    'parent_id' => $category->parent_id,
                    'parent_name' => $category->parent?->name,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'icon' => $category->icon,
                    'sort_order' => $category->sort_order,
                    'commission_bps' => $category->commission_bps,
                    'requires_certification' => $category->requires_certification,
                    'products_count' => $category->products_count,
                    'children_count' => $category->children_count,
                ]),
        ];
    }
}
