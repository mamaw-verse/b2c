<?php

declare(strict_types=1);

namespace App\Actions\Blog\Admin;

use App\Actions\Blog\RenderBlogBody;
use App\Models\BlogPost;
use App\Support\Blog\BlogFacts;
use Illuminate\Support\Facades\Storage;

/**
 * Preview data for any status. It renders the current Markdown through the same
 * `RenderBlogBody` the save path uses, so what the editor sees is what publishing stores.
 */
final readonly class ShowBlogPostPreview
{
    public function __construct(private RenderBlogBody $renderer) {}

    /**
     * @return array<string, mixed>
     */
    public function handle(BlogPost $post): array
    {
        $post->load(['category:id,name', 'author:id,display_name,job_title,bio', 'coverImage']);
        $body = $this->renderer->handle($post->body_markdown);

        return [
            'post' => [
                'id' => $post->id,
                'title' => $post->title,
                'excerpt' => $post->excerpt,
                'category' => $post->category?->name,
                'author' => $post->author?->display_name,
                'author_title' => $post->author?->job_title,
                'status' => $post->status->value,
                'published_at' => $post->published_at?->toIso8601String(),
                'reading_minutes' => $body->readingMinutes,
                'cover_alt' => $post->coverImage?->alt,
                'cover_url' => $post->coverImage === null ? null : $this->coverUrl($post),
                'html' => BlogFacts::resolve($body->html),
                'toc' => $body->toc,
            ],
        ];
    }

    private function coverUrl(BlogPost $post): ?string
    {
        $cover = $post->coverImage;
        if ($cover === null) {
            return null;
        }

        $variant = $cover->variants['large'] ?? $cover->variants['medium'] ?? null;

        return Storage::disk($cover->disk)->url($variant['path'] ?? $cover->original_path);
    }
}
