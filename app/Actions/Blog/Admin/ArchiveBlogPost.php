<?php

declare(strict_types=1);

namespace App\Actions\Blog\Admin;

use App\Actions\Admin\RecordAuditLog;
use App\Enums\BlogPostStatus;
use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class ArchiveBlogPost
{
    public function __construct(private RecordAuditLog $audit) {}

    public function handle(BlogPost $post, User $user, ?string $ip = null): BlogPost
    {
        return DB::transaction(function () use ($post, $user, $ip): BlogPost {
            // An archived post is never featured: it would linger in the hero slot list otherwise.
            $post->update(['status' => BlogPostStatus::Archived, 'is_featured' => false]);

            $this->audit->handle($user, 'blog.post.archived', $post, [
                'title' => $post->title,
                'author_id' => $post->blog_author_id,
                'created_by_id' => $post->created_by_id,
            ], $ip);

            return $post;
        });
    }
}
