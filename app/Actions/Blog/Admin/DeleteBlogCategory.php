<?php

declare(strict_types=1);

namespace App\Actions\Blog\Admin;

use App\Actions\Admin\RecordAuditLog;
use App\Models\BlogCategory;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class DeleteBlogCategory
{
    public function __construct(private RecordAuditLog $audit) {}

    public function handle(BlogCategory $category, User $admin, ?string $ip = null): void
    {
        DB::transaction(function () use ($category, $admin, $ip): void {
            $this->audit->handle($admin, 'blog.category.deleted', $category, ['name' => $category->name, 'slug' => $category->slug], $ip);

            $category->delete();
        });
    }
}
