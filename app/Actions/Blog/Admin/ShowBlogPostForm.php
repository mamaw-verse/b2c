<?php

declare(strict_types=1);

namespace App\Actions\Blog\Admin;

use App\Enums\BlogPostStatus;
use App\Models\BlogAuthor;
use App\Models\BlogCategory;
use App\Models\BlogPost;
use App\Models\User;
use App\Support\Blog\BlogAuthorPayload;
use App\Support\Blog\BlogFacts;
use App\Support\Blog\BlogFaqs;
use App\Support\Blog\BlogImagePayload;

/**
 * Props for the create and edit screens: the post (or empty defaults), the lists the selects
 * need, what this user may do, and the live publish checklist.
 */
final readonly class ShowBlogPostForm
{
    public function __construct(private ValidateBlogPostForPublish $check) {}

    /**
     * @return array<string, mixed>
     */
    public function handle(User $viewer, ?BlogPost $post = null): array
    {
        $own = BlogAuthor::query()->where('user_id', $viewer->id)->first();

        $authors = BlogAuthor::query()
            ->with('avatar')
            ->where(fn ($query) => $query->where('is_active', true)->when($post !== null, fn ($q) => $q->orWhere('id', $post?->blog_author_id)))
            ->orderByDesc('is_house')
            ->orderBy('display_name')
            ->get();

        $post?->load(['tags:id,name', 'coverImage', 'thumbnailImage']);

        $published = $post !== null && $post->status !== BlogPostStatus::Draft;

        return [
            'post' => $post === null ? null : [
                'id' => $post->id,
                'title' => $post->title,
                'slug' => $post->slug,
                'excerpt' => $post->excerpt,
                'body_markdown' => $post->body_markdown,
                'blog_category_id' => $post->blog_category_id,
                'blog_author_id' => $post->blog_author_id,
                'cover' => $post->coverImage === null ? null : BlogImagePayload::from($post->coverImage),
                'thumbnail' => $post->thumbnailImage === null ? null : BlogImagePayload::from($post->thumbnailImage),
                'tags' => $post->tags->pluck('name')->values(),
                'faqs' => BlogFaqs::for($post),
                'seo_title' => $post->seo_title,
                'seo_description' => $post->seo_description,
                'status' => $post->status->value,
                'published_at' => $post->published_at?->toIso8601String(),
                'is_scheduled' => $post->isScheduled(),
                'is_live' => $post->isLive(),
                'is_featured' => $post->is_featured,
                'word_count' => $post->word_count,
                'reading_minutes' => $post->reading_minutes,
            ],
            'categories' => BlogCategory::query()->orderBy('sort_order')->orderBy('name')->get(['id', 'name'])
                ->map(fn (BlogCategory $category) => ['id' => $category->id, 'name' => $category->name])->values(),
            'authors' => $authors->map(fn (BlogAuthor $author) => BlogAuthorPayload::from($author))->values(),
            'default_author_id' => $own?->id,
            'can' => [
                'feature' => $viewer->isAdmin(),
                // Editors may re-credit a draft; after publishing only an admin may (plan §4.7 #2).
                'change_author' => $viewer->isAdmin() || ! $published,
                'delete' => $post !== null && $viewer->canDeleteBlogPost($post),
                'create_own_profile' => $own === null,
            ],
            'publish_check' => $post === null ? null : $this->check->handle($post)->toArray(),
            'limits' => [
                'cover_min' => (string) config('blog.images.cover_min', '1200x630'),
                'excerpt_min' => 50,
                'excerpt_max' => 300,
                'min_words' => 150,
                'faq_max' => BlogFaqs::MAX_ENTRIES,
                'faq_question_max' => BlogFaqs::QUESTION_MAX,
                'faq_answer_max' => BlogFaqs::ANSWER_MAX,
                'fact_keys' => BlogFacts::keys(),
            ],
        ];
    }
}
