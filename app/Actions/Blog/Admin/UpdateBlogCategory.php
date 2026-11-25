<?php

declare(strict_types=1);

namespace App\Actions\Blog\Admin;

use App\Actions\Admin\RecordAuditLog;
use App\Models\BlogCategory;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class UpdateBlogCategory
{
    public function __construct(private RecordAuditLog $audit) {}

    /**
     * The slug is part of public URLs and stays fixed after creation.
     *
     * @param  array{name: string, description?: string|null, sort_order?: int|null, shop_category_id?: string|null}  $data
     */
    public function handle(BlogCategory $category, User $admin, array $data, ?string $ip = null): BlogCategory
    {
        return DB::transaction(function () use ($category, $admin, $data, $ip): BlogCategory {
            $category->update([
                'name' => $data['name'],
                'description' => ($data['description'] ?? null) ?: null,
                'sort_order' => $data['sort_order'] ?? 0,
                'shop_category_id' => ($data['shop_category_id'] ?? null) ?: null,
            ]);

            $this->audit->handle($admin, 'blog.category.updated', $category, ['name' => $category->name], $ip);

            return $category;
        });
    }
}
