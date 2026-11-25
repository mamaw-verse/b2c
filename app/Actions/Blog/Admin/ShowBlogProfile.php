<?php

declare(strict_types=1);

namespace App\Actions\Blog\Admin;

use App\Models\BlogAuthor;
use App\Models\User;
use App\Support\Blog\BlogAuthorPayload;
use App\Support\Blog\BlogConsentCopy;

final readonly class ShowBlogProfile
{
    /**
     * @return array<string, mixed>
     */
    public function handle(User $user): array
    {
        $author = BlogAuthor::query()->with('avatar')->where('user_id', $user->id)->first();

        return [
            'author' => $author === null ? null : BlogAuthorPayload::from($author),
            'consent' => ['self' => BlogConsentCopy::adminSelf(), 'version' => BlogConsentCopy::version()],
        ];
    }
}
