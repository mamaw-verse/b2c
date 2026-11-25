<?php

declare(strict_types=1);

namespace App\Actions\Blog\Admin;

use App\Actions\Admin\RecordAuditLog;
use App\Enums\BlogPostStatus;
use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

final readonly class PublishBlogPost
{
    public function __construct(private RecordAuditLog $audit) {}

    /**
     * Publishing with a future `published_at` schedules the post: it is `published` but not live
     * until that moment (plan §4.5). The publish gate is checked by the form request.
     */
    public function handle(BlogPost $post, User $user, ?Carbon $publishedAt = null, ?string $ip = null): BlogPost
    {
        return DB::transaction(function () use ($post, $user, $publishedAt, $ip): BlogPost {
            $when = $publishedAt ?? $post->published_at ?? now();

            $post->update(['status' => BlogPostStatus::Published, 'published_at' => $when]);

            $this->audit->handle($user, 'blog.post.published', $post, [
                'title' => $post->title,
                'author_id' => $post->blog_author_id,
                'created_by_id' => $post->created_by_id,
                'published_at' => $when->toIso8601String(),
                'scheduled' => $when->isFuture(),
            ], $ip);

            return $post;
        });
    }
}
