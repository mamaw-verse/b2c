<?php

declare(strict_types=1);

namespace App\Actions\Blog\Admin;

use App\Actions\Admin\RecordAuditLog;
use App\Models\BlogAuthor;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class ReactivateBlogAuthor
{
    public function __construct(private RecordAuditLog $audit) {}

    public function handle(BlogAuthor $author, User $admin, ?string $ip = null): void
    {
        DB::transaction(function () use ($author, $admin, $ip): void {
            $author->update(['is_active' => true]);

            $this->audit->handle($admin, 'blog.author.updated', $author, ['fields' => ['is_active'], 'is_active' => true], $ip);
        });
    }
}
