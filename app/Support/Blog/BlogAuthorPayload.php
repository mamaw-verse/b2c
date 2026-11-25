<?php

declare(strict_types=1);

namespace App\Support\Blog;

use App\Models\BlogAuthor;

/** Author shape shared by the admin screens and the post form's author select. */
final class BlogAuthorPayload
{
    /**
     * @return array<string, mixed>
     */
    public static function from(BlogAuthor $author): array
    {
        return [
            'id' => $author->id,
            'user_id' => $author->user_id,
            'display_name' => $author->display_name,
            'slug' => $author->slug,
            'job_title' => $author->job_title,
            'bio' => $author->bio,
            'links' => $author->links ?? [],
            'is_house' => $author->is_house,
            'is_active' => $author->is_active,
            'consented' => $author->is_house || $author->consent_confirmed_at !== null,
            'consent_confirmed_at' => $author->consent_confirmed_at?->toIso8601String(),
            'consent_version' => $author->consent_version,
            'avatar' => $author->avatar === null ? null : BlogImagePayload::from($author->avatar),
            'posts_count' => $author->getAttribute('posts_count'),
            'user_email' => $author->user?->email,
        ];
    }
}
