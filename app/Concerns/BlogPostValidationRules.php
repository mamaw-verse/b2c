<?php

declare(strict_types=1);

namespace App\Concerns;

use App\Models\BlogAuthor;
use App\Models\BlogPost;
use App\Support\Blog\BlogFaqs;
use App\Support\Blog\BlogSlug;
use Illuminate\Validation\Rule;

trait BlogPostValidationRules
{
    /**
     * @return array<string, mixed>
     */
    public function postData(): array
    {
        return $this->validated();
    }

    /**
     * Drafts may be incomplete (excerpt and body can be empty); the publish gate is stricter.
     *
     * @return array<string, mixed>
     */
    protected function postRules(?BlogPost $post = null): array
    {
        return [
            'title' => ['required', 'string', 'max:160'],
            'slug' => [
                'nullable', 'string', 'max:160', 'regex:'.BlogSlug::FORMAT,
                Rule::notIn((array) config('blog.reserved_slugs', [])),
                Rule::unique('blog_posts', 'slug')->ignore($post?->id),
                Rule::unique('blog_post_slug_histories', 'slug')
                    ->where(fn ($query) => $post === null ? $query : $query->where('blog_post_id', '!=', $post->id)),
            ],
            'excerpt' => ['nullable', 'string', 'max:300'],
            'body_markdown' => ['nullable', 'string', 'max:200000'],
            'blog_category_id' => ['required', Rule::exists('blog_categories', 'id')],
            'blog_author_id' => ['required', Rule::exists('blog_authors', 'id')],
            'cover_image_id' => ['nullable', Rule::exists('blog_images', 'id')->where('purpose', 'cover')],
            'thumbnail_image_id' => ['nullable', Rule::exists('blog_images', 'id')->where('purpose', 'thumbnail')],
            'tags' => ['nullable', 'array', 'max:10'],
            'tags.*' => ['string', 'max:60'],
            'seo_title' => ['nullable', 'string', 'max:70'],
            'seo_description' => ['nullable', 'string', 'max:170'],
            // FAQ (B3.6): complete question + answer pairs only, plain text, distinct questions.
            'faqs' => ['nullable', 'array', 'max:'.BlogFaqs::MAX_ENTRIES],
            'faqs.*' => ['array'],
            'faqs.*.question' => ['required_with:faqs.*.answer', 'nullable', 'string', 'max:'.BlogFaqs::QUESTION_MAX, 'distinct:ignore_case'],
            'faqs.*.answer' => ['required_with:faqs.*.question', 'nullable', 'string', 'max:'.BlogFaqs::ANSWER_MAX],
        ];
    }

    /** Writing for yourself is the default: fall back to the user's own author profile. */
    protected function defaultAuthorToOwnProfile(): void
    {
        $user = $this->user();
        if ($user === null || $this->filled('blog_author_id')) {
            return;
        }

        $own = BlogAuthor::query()->where('user_id', $user->id)->value('id');
        if ($own !== null) {
            $this->merge(['blog_author_id' => $own]);
        }
    }
}
