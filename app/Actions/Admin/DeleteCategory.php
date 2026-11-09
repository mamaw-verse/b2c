<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\Category;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class DeleteCategory
{
    public function __construct(private RecordAuditLog $audit) {}

    public function handle(Category $category, User $admin, ?string $ip = null): void
    {
        DB::transaction(function () use ($category, $admin, $ip) {
            $this->audit->handle($admin, 'category.deleted', $category, [
                'name' => $category->name,
                'slug' => $category->slug,
            ], $ip);

            $category->delete();
        });
    }
}
