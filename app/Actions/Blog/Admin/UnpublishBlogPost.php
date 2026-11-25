<?php

declare(strict_types=1);

namespace App\Actions\Blog\Admin;

use App\Actions\Admin\RecordAuditLog;
use App\Enums\BlogPostStatus;
use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Back to draft. `published_at` is kept for history (plan §4.5).
 */
final readonly class UnpublishBlogPost
{
    public function __construct(private RecordAuditLog $audit) {}

    public function handle(BlogPost $post, User $user, ?string $ip = null): BlogPost
    {
        return DB::transaction(function () use ($post, $user, $ip): BlogPost {
            $post->update(['status' => BlogPostStatus::Draft]);

            $this->audit->handle($user, 'blog.post.unpublished', $post, [
                'title' => $post->title,
                'author_id' => $post->blog_author_id,
                'created_by_id' => $post->created_by_id,
            ], $ip);

            return $post;
        });
    }
}
