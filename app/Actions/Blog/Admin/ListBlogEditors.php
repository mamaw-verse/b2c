<?php

declare(strict_types=1);

namespace App\Actions\Blog\Admin;

use App\Models\BlogAuthor;
use App\Models\BlogEditorInvitation;
use App\Models\User;

final readonly class ListBlogEditors
{
    /**
     * @return array<string, mixed>
     */
    public function handle(): array
    {
        $editors = User::query()
            ->where('role', 'editor')
            ->orderBy('name')
            ->get();

        $authors = BlogAuthor::query()
            ->whereIn('user_id', $editors->pluck('id'))
            ->withCount('posts')
            ->get()
            ->keyBy('user_id');

        $invitations = BlogEditorInvitation::query()
            ->whereNull('accepted_at')
            ->whereNull('revoked_at')
            ->with('invitedBy:id,name')
            ->latest()
            ->get();

        return [
            'max_pending' => (int) config('blog.editors.max_pending', 25),
            'editors' => $editors->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'author_id' => $authors[$user->id]->id ?? null,
                'posts_count' => $authors[$user->id]->posts_count ?? 0,
                'since' => $user->updated_at?->toIso8601String(),
            ])->values(),
            'invitations' => $invitations->map(fn (BlogEditorInvitation $invitation) => [
                'id' => $invitation->id,
                'email' => $invitation->email,
                'invited_by' => $invitation->invitedBy?->name,
                'invited_at' => $invitation->created_at?->toIso8601String(),
                'expires_at' => $invitation->expires_at->toIso8601String(),
                'expired' => $invitation->expires_at->isPast(),
            ])->values(),
        ];
    }
}
