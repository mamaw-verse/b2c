<?php

declare(strict_types=1);

namespace App\Actions\Blog\Admin;

use App\Actions\Admin\RecordAuditLog;
use App\Models\BlogAuthor;
use App\Models\User;
use App\Support\Blog\BlogSlug;
use Illuminate\Support\Facades\DB;

final readonly class CreateBlogAuthor
{
    public function __construct(private RecordAuditLog $audit) {}

    /**
     * @param  array{display_name: string, slug?: string|null, job_title?: string|null, bio?: string|null, avatar_image_id?: string|null, links?: array<int, array{label: string, url: string}>|null, user_id?: string|null}  $data
     * @param  bool  $consent  an admin ticked "this person agreed to be credited" (plan §4.7 #3)
     */
    public function handle(User $admin, array $data, bool $consent, ?string $ip = null): BlogAuthor
    {
        return DB::transaction(function () use ($admin, $data, $consent, $ip): BlogAuthor {
            $author = BlogAuthor::query()->create([
                'user_id' => $data['user_id'] ?? null,
                'display_name' => $data['display_name'],
                'slug' => ($data['slug'] ?? null) ?: BlogSlug::unique($data['display_name'], 'blog_authors', fallback: 'author'),
                'job_title' => $data['job_title'] ?? null,
                'bio' => $data['bio'] ?? null,
                'avatar_image_id' => $data['avatar_image_id'] ?? null,
                'links' => ($data['links'] ?? null) ?: null,
                'is_house' => false,
                'is_active' => true,
                'consent_confirmed_at' => $consent ? now() : null,
                'consent_confirmed_by_id' => $consent ? $admin->id : null,
                'consent_version' => $consent ? (string) config('blog.consent_version', 'v1') : null,
            ]);

            $this->audit->handle($admin, 'blog.author.created', $author, [
                'display_name' => $author->display_name,
                'consent_recorded' => $consent,
            ], $ip);

            return $author;
        });
    }
}
