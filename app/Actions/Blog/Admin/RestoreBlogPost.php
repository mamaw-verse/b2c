<?php

declare(strict_types=1);

namespace App\Actions\Blog\Admin;

use App\Actions\Admin\RecordAuditLog;
use App\Enums\BlogPostStatus;
use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/** Archived back to draft; it has to be published again to go live. */
final readonly class RestoreBlogPost
{
    public function __construct(private RecordAuditLog $audit) {}

    public function handle(BlogPost $post, User $user, ?string $ip = null): BlogPost
    {
        return DB::transaction(function () use ($post, $user, $ip): BlogPost {
            $post->update(['status' => BlogPostStatus::Draft]);

            $this->audit->handle($user, 'blog.post.updated', $post, [
                'title' => $post->title,
                'author_id' => $post->blog_author_id,
                'created_by_id' => $post->created_by_id,
                'restored_from_archive' => true,
            ], $ip);

            return $post;
        });
    }
}
