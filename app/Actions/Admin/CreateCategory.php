<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\Category;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class CreateCategory
{
    public function __construct(private RecordAuditLog $audit) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(User $admin, array $data, ?string $ip = null): Category
    {
        return DB::transaction(function () use ($admin, $data, $ip) {
            $category = Category::query()->create($data);

            $this->audit->handle($admin, 'category.created', $category, $data, $ip);

            return $category;
        });
    }
}
