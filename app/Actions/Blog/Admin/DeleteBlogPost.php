<?php

declare(strict_types=1);

namespace App\Actions\Blog\Admin;

use App\Actions\Admin\RecordAuditLog;
use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class DeleteBlogPost
{
    public function __construct(private RecordAuditLog $audit) {}

    public function handle(BlogPost $post, User $user, ?string $ip = null): void
    {
        DB::transaction(function () use ($post, $user, $ip): void {
            $this->audit->handle($user, 'blog.post.deleted', $post, [
                'title' => $post->title,
                'slug' => $post->slug,
                'author_id' => $post->blog_author_id,
                'created_by_id' => $post->created_by_id,
            ], $ip);

            $post->delete();
        });
    }
}
