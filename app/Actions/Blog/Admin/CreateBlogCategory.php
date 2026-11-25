<?php

declare(strict_types=1);

namespace App\Actions\Blog\Admin;

use App\Actions\Admin\RecordAuditLog;
use App\Models\BlogCategory;
use App\Models\User;
use App\Support\Blog\BlogSlug;
use Illuminate\Support\Facades\DB;

final readonly class CreateBlogCategory
{
    public function __construct(private RecordAuditLog $audit) {}

    /**
     * @param  array{name: string, slug?: string|null, description?: string|null, sort_order?: int|null, shop_category_id?: string|null}  $data
     */
    public function handle(User $admin, array $data, ?string $ip = null): BlogCategory
    {
        return DB::transaction(function () use ($admin, $data, $ip): BlogCategory {
            $category = BlogCategory::query()->create([
                'name' => $data['name'],
                'slug' => ($data['slug'] ?? null) ?: BlogSlug::unique($data['name'], 'blog_categories', fallback: 'category'),
                'description' => ($data['description'] ?? null) ?: null,
                'sort_order' => $data['sort_order'] ?? 0,
                'is_system' => false,
                'shop_category_id' => ($data['shop_category_id'] ?? null) ?: null,
            ]);

            $this->audit->handle($admin, 'blog.category.created', $category, ['name' => $category->name, 'slug' => $category->slug], $ip);

            return $category;
        });
    }
}
