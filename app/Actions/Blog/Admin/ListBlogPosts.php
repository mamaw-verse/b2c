<?php

declare(strict_types=1);

namespace App\Actions\Blog\Admin;

use App\Enums\BlogPostStatus;
use App\Models\BlogAuthor;
use App\Models\BlogCategory;
use App\Models\BlogPost;
use App\Models\User;

final readonly class ListBlogPosts
{
    /**
     * Editors only ever see posts they created; admins see everything (plan §4.4).
     *
     * @param  array{status: ?string, category: ?string, author: ?string, q: ?string}  $filters
     * @return array<string, mixed>
     */
    public function handle(User $viewer, array $filters): array
    {
        $posts = BlogPost::query()
            ->with(['category:id,name', 'author:id,display_name', 'creator:id,name'])
            ->when(! $viewer->isAdmin(), fn ($query) => $query->where('created_by_id', $viewer->id))
            ->when($filters['status'] !== null, fn ($query) => match ($filters['status']) {
                'draft' => $query->where('status', BlogPostStatus::Draft->value),
                'archived' => $query->where('status', BlogPostStatus::Archived->value),
                'scheduled' => $query->where('status', BlogPostStatus::Published->value)->where('published_at', '>', now()),
                'published' => $query->live(),
                default => $query,
            })
            ->when($filters['category'] !== null, fn ($query) => $query->where('blog_category_id', $filters['category']))
            ->when($filters['author'] !== null, fn ($query) => $query->where('blog_author_id', $filters['author']))
            ->when($filters['q'] !== null && $filters['q'] !== '', fn ($query) => $query->search((string) $filters['q']))
            ->latest('updated_at')
            ->paginate(20)
            ->withQueryString();

        return [
            'filters' => $filters,
            'is_admin' => $viewer->isAdmin(),
            'posts' => [
                'data' => $posts->getCollection()->map(fn (BlogPost $post) => [
                    'id' => $post->id,
                    'title' => $post->title,
                    'slug' => $post->slug,
                    'status' => $post->status->value,
                    'status_label' => $post->isScheduled() ? 'Scheduled' : ($post->isLive() ? 'Published' : $post->status->label()),
                    'scheduled_for' => $post->isScheduled() ? $post->published_at?->toIso8601String() : null,
                    'published_at' => $post->published_at?->toIso8601String(),
                    'category' => $post->category?->name,
                    'author' => $post->author?->display_name,
                    'created_by' => $post->creator?->name,
                    'views' => $post->view_count,
                    'is_featured' => $post->is_featured,
                    'can_delete' => $viewer->canDeleteBlogPost($post),
                ])->values(),
                'meta' => [
                    'current_page' => $posts->currentPage(),
                    'last_page' => $posts->lastPage(),
                    'total' => $posts->total(),
                ],
            ],
            'categories' => BlogCategory::query()->orderBy('sort_order')->orderBy('name')->get(['id', 'name'])
                ->map(fn (BlogCategory $category) => ['id' => $category->id, 'name' => $category->name])->values(),
            'authors' => BlogAuthor::query()->orderBy('display_name')->get(['id', 'display_name'])
                ->map(fn (BlogAuthor $author) => ['id' => $author->id, 'name' => $author->display_name])->values(),
        ];
    }
}
