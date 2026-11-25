<?php

declare(strict_types=1);

namespace App\Actions\Blog\Admin;

use App\Actions\Admin\RecordAuditLog;
use App\Actions\Blog\RenderBlogBody;
use App\Actions\Blog\SyncBlogPostRelations;
use App\Models\BlogPost;
use App\Models\BlogPostSlugHistory;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class UpdateBlogPost
{
    public function __construct(
        private RenderBlogBody $renderer,
        private SyncBlogPostRelations $relations,
        private RecordAuditLog $audit,
    ) {}

    /**
     * `created_by_id` is never touched. A changed slug keeps the old one in `blog_post_slug_histories`
     * so old links 301 to the new URL (Phase 2 routing).
     *
     * @param  array<string, mixed>  $data
     */
    public function handle(BlogPost $post, User $user, array $data, ?string $ip = null): BlogPost
    {
        return DB::transaction(function () use ($post, $user, $data, $ip): BlogPost {
            $body = $this->renderer->handle((string) ($data['body_markdown'] ?? ''));

            $oldSlug = $post->slug;
            $oldAuthorId = $post->blog_author_id;
            $newSlug = ($data['slug'] ?? null) ?: $oldSlug;

            $post->update([
                'blog_category_id' => $data['blog_category_id'],
                'blog_author_id' => $data['blog_author_id'],
                'title' => (string) $data['title'],
                'slug' => $newSlug,
                'excerpt' => (string) ($data['excerpt'] ?? ''),
                'body_markdown' => (string) ($data['body_markdown'] ?? ''),
                'body_html' => $body->html,
                'toc' => $body->toc === [] ? null : $body->toc,
                'word_count' => $body->wordCount,
                'reading_minutes' => $body->readingMinutes,
                'cover_image_id' => $data['cover_image_id'] ?? null,
                'thumbnail_image_id' => $data['thumbnail_image_id'] ?? null,
                'seo_title' => ($data['seo_title'] ?? null) ?: null,
                'seo_description' => ($data['seo_description'] ?? null) ?: null,
            ]);

            if ($newSlug !== $oldSlug) {
                BlogPostSlugHistory::query()->firstOrCreate(['slug' => $oldSlug], ['blog_post_id' => $post->id]);
                // Going back to an earlier slug frees it from this post's own history.
                BlogPostSlugHistory::query()->where('blog_post_id', $post->id)->where('slug', $newSlug)->delete();
            }

            $this->relations->handle($post, $body, array_values((array) ($data['tags'] ?? [])));

            $metadata = [
                'title' => $post->title,
                'author_id' => $post->blog_author_id,
                'created_by_id' => $post->created_by_id,
            ];
            if ($newSlug !== $oldSlug) {
                $metadata['slug_changed'] = ['from' => $oldSlug, 'to' => $newSlug];
            }
            if ($post->blog_author_id !== $oldAuthorId) {
                $metadata['author_changed'] = ['from' => $oldAuthorId, 'to' => $post->blog_author_id];
            }

            $this->audit->handle($user, 'blog.post.updated', $post, $metadata, $ip);

            return $post;
        });
    }
}
