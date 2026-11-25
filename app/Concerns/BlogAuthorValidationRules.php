<?php

declare(strict_types=1);

namespace App\Concerns;

use App\Models\BlogAuthor;
use App\Support\Blog\BlogSlug;
use Illuminate\Validation\Rule;

trait BlogAuthorValidationRules
{
    /**
     * @return array<string, mixed>
     */
    protected function authorContentRules(?string $avatarUploaderId = null): array
    {
        return [
            'job_title' => ['nullable', 'string', 'max:80'],
            'bio' => ['nullable', 'string', 'max:600'],
            'avatar_image_id' => [
                'nullable',
                Rule::exists('blog_images', 'id')
                    ->where('purpose', 'avatar')
                    ->when($avatarUploaderId !== null, fn ($rule) => $rule->where('uploaded_by_id', $avatarUploaderId)),
            ],
            'links' => ['nullable', 'array', 'max:4'],
            'links.*.label' => ['required', 'string', 'max:40'],
            'links.*.url' => ['required', 'string', 'url:https', 'max:255'],
        ];
    }

    /**
     * @return list<mixed>
     */
    protected function authorSlugRules(?BlogAuthor $ignore = null): array
    {
        return [
            'nullable',
            'string',
            'max:100',
            'regex:'.BlogSlug::FORMAT,
            Rule::notIn((array) config('blog.reserved_slugs', [])),
            Rule::unique('blog_authors', 'slug')->ignore($ignore?->id),
        ];
    }
}
