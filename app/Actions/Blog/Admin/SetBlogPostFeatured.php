<?php

declare(strict_types=1);

namespace App\Actions\Blog\Admin;

use App\Actions\Admin\RecordAuditLog;
use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class SetBlogPostFeatured
{
    public function __construct(private RecordAuditLog $audit) {}

    public function handle(BlogPost $post, User $admin, bool $featured, ?string $ip = null): BlogPost
    {
        return DB::transaction(function () use ($post, $admin, $featured, $ip): BlogPost {
            $post->update(['is_featured' => $featured]);

            $this->audit->handle($admin, 'blog.post.featured', $post, [
                'title' => $post->title,
                'featured' => $featured,
            ], $ip);

            return $post;
        });
    }
}
