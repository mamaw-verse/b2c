<?php

declare(strict_types=1);

namespace App\Actions\Blog\Admin;

use App\Actions\Admin\RecordAuditLog;
use App\Models\BlogAuthor;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Hides the profile page and author box but keeps existing posts credited (plan §4.7 #5).
 */
final readonly class DeactivateBlogAuthor
{
    public function __construct(private RecordAuditLog $audit) {}

    public function handle(BlogAuthor $author, User $admin, ?string $ip = null): void
    {
        DB::transaction(function () use ($author, $admin, $ip): void {
            $author->update(['is_active' => false]);

            $this->audit->handle($admin, 'blog.author.deactivated', $author, ['display_name' => $author->display_name], $ip);
        });
    }
}
