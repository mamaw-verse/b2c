<?php

declare(strict_types=1);

namespace App\Actions\Blog\Admin;

use App\Actions\Admin\RecordAuditLog;
use App\Models\BlogAuthor;
use App\Models\BlogEditorInvitation;
use App\Models\User;
use App\Support\Blog\BlogSlug;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Accepting an invitation makes the user an editor, records their consent to be credited
 * publicly (plan §4.7) and creates or re-links their author profile.
 *
 * Eligibility (email match, not an admin/editor, not suspended, not expired) is checked by
 * `UpdateBlogEditorInvitationRequest`; this action re-checks only that the invitation is still
 * pending once the row is locked, so two concurrent accepts cannot both succeed.
 */
final readonly class AcceptBlogEditorInvitation
{
    public function __construct(private RecordAuditLog $audit) {}

    public function handle(BlogEditorInvitation $invitation, User $user, ?string $ip = null): BlogAuthor
    {
        return DB::transaction(function () use ($invitation, $user, $ip): BlogAuthor {
            $locked = BlogEditorInvitation::query()->lockForUpdate()->findOrFail($invitation->id);

            if (! $locked->isPending()) {
                throw ValidationException::withMessages(['invitation' => 'This invitation is no longer valid.']);
            }

            $locked->update(['user_id' => $user->id, 'accepted_at' => now()]);
            $user->update(['role' => 'editor']);

            $consent = [
                'is_active' => true,
                'consent_confirmed_at' => now(),
                'consent_confirmed_by_id' => $user->id,
                'consent_version' => (string) config('blog.consent_version', 'v1'),
            ];

            $author = BlogAuthor::query()->where('user_id', $user->id)->first();
            if ($author === null) {
                $author = BlogAuthor::query()->create([
                    'user_id' => $user->id,
                    'display_name' => $user->name,
                    'slug' => BlogSlug::unique($user->name, 'blog_authors', fallback: 'author'),
                    'is_house' => false,
                    ...$consent,
                ]);
                $this->audit->handle($user, 'blog.author.created', $author, ['via' => 'editor_invitation'], $ip);
            } else {
                $author->update($consent);
            }

            $this->audit->handle($user, 'blog.editor.accepted', $locked, [
                'email' => $locked->email,
                'author_id' => $author->id,
                'consent_version' => $consent['consent_version'],
            ], $ip);

            return $author;
        });
    }
}
