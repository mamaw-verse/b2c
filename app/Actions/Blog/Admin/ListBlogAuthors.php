<?php

declare(strict_types=1);

namespace App\Actions\Blog\Admin;

use App\Models\BlogAuthor;
use App\Models\User;
use App\Support\Blog\BlogAuthorPayload;
use App\Support\Blog\BlogConsentCopy;

final readonly class ListBlogAuthors
{
    /**
     * @return array<string, mixed>
     */
    public function handle(): array
    {
        $authors = BlogAuthor::query()
            ->with(['avatar', 'user:id,email'])
            ->withCount('posts')
            ->orderByDesc('is_house')
            ->orderBy('display_name')
            ->get();

        $linkable = User::query()
            ->whereIn('role', ['admin', 'editor'])
            ->whereNotIn('id', $authors->pluck('user_id')->filter())
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        return [
            'authors' => $authors->map(fn (BlogAuthor $author) => BlogAuthorPayload::from($author))->values(),
            'linkable_users' => $linkable->map(fn (User $user) => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email])->values(),
            'consent' => ['guest' => BlogConsentCopy::guestAuthor(), 'version' => BlogConsentCopy::version()],
        ];
    }
}
