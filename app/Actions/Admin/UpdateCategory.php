<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\Category;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class UpdateCategory
{
    public function __construct(private RecordAuditLog $audit) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(Category $category, array $data, User $admin, ?string $ip = null): Category
    {
        return DB::transaction(function () use ($category, $data, $admin, $ip) {
            $category->update($data);

            $this->audit->handle($admin, 'category.updated', $category, $category->getChanges(), $ip);

            return $category;
        });
    }
}
