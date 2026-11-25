<?php

declare(strict_types=1);

namespace App\Actions\Blog\Admin;

use App\Actions\Admin\RecordAuditLog;
use App\Models\BlogAuthor;
use App\Models\User;
use App\Support\Blog\BlogSlug;
use Illuminate\Support\Facades\DB;

/**
 * "Create my author profile" (plan §14 #14): created on demand for an admin who wants to write
 * under their own name, with their own consent recorded. Nothing is auto-created for admins.
 */
final readonly class CreateOwnBlogAuthorProfile
{
    public function __construct(private RecordAuditLog $audit) {}

    public function handle(User $user, ?string $ip = null): BlogAuthor
    {
        return DB::transaction(function () use ($user, $ip): BlogAuthor {
            $author = BlogAuthor::query()->create([
                'user_id' => $user->id,
                'display_name' => $user->name,
                'slug' => BlogSlug::unique($user->name, 'blog_authors', fallback: 'author'),
                'is_house' => false,
                'is_active' => true,
                'consent_confirmed_at' => now(),
                'consent_confirmed_by_id' => $user->id,
                'consent_version' => (string) config('blog.consent_version', 'v1'),
            ]);

            $this->audit->handle($user, 'blog.author.created', $author, ['via' => 'self'], $ip);

            return $author;
        });
    }
}
