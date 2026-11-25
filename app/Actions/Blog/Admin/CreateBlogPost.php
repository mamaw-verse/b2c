<?php

declare(strict_types=1);

namespace App\Actions\Blog\Admin;

use App\Actions\Admin\RecordAuditLog;
use App\Actions\Blog\RenderBlogBody;
use App\Actions\Blog\SyncBlogPostRelations;
use App\Enums\BlogPostStatus;
use App\Models\BlogPost;
use App\Models\User;
use App\Support\Blog\BlogSlug;
use Illuminate\Support\Facades\DB;

final readonly class CreateBlogPost
{
    public function __construct(
        private RenderBlogBody $renderer,
        private SyncBlogPostRelations $relations,
        private RecordAuditLog $audit,
    ) {}

    /**
     * Posts are always created as drafts. The public byline is `blog_author_id`; the creating
     * user is stored separately and never changes (plan §4.7).
     *
     * @param  array<string, mixed>  $data
     */
    public function handle(User $user, array $data, ?string $ip = null): BlogPost
    {
        return DB::transaction(function () use ($user, $data, $ip): BlogPost {
            $body = $this->renderer->handle((string) ($data['body_markdown'] ?? ''));
            $title = (string) $data['title'];

            $post = BlogPost::query()->create([
                'blog_category_id' => $data['blog_category_id'],
                'blog_author_id' => $data['blog_author_id'],
                'created_by_id' => $user->id,
                'title' => $title,
                'slug' => ($data['slug'] ?? null) ?: BlogSlug::unique($title, 'blog_posts', alsoTaken: [['blog_post_slug_histories', 'slug']]),
                'excerpt' => (string) ($data['excerpt'] ?? ''),
                'body_markdown' => (string) ($data['body_markdown'] ?? ''),
                'body_html' => $body->html,
                'toc' => $body->toc === [] ? null : $body->toc,
                'word_count' => $body->wordCount,
                'reading_minutes' => $body->readingMinutes,
                'cover_image_id' => $data['cover_image_id'] ?? null,
                'thumbnail_image_id' => $data['thumbnail_image_id'] ?? null,
                'status' => BlogPostStatus::Draft,
                'published_at' => null,
                'is_featured' => false,
                'view_count' => 0,
                'seo_title' => ($data['seo_title'] ?? null) ?: null,
                'seo_description' => ($data['seo_description'] ?? null) ?: null,
            ]);

            $this->relations->handle($post, $body, array_values((array) ($data['tags'] ?? [])));

            $this->audit->handle($user, 'blog.post.created', $post, [
                'title' => $post->title,
                'author_id' => $post->blog_author_id,
                'created_by_id' => $user->id,
            ], $ip);

            return $post;
        });
    }
}
