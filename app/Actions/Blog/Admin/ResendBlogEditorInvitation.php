<?php

declare(strict_types=1);

namespace App\Actions\Blog\Admin;

use App\Actions\Admin\RecordAuditLog;
use App\Models\BlogEditorInvitation;
use App\Models\User;
use App\Notifications\BlogEditorInvitationNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

/**
 * Sends the same link again and restarts its expiry window.
 */
final readonly class ResendBlogEditorInvitation
{
    public function __construct(private RecordAuditLog $audit) {}

    public function handle(BlogEditorInvitation $invitation, User $admin, ?string $ip = null): BlogEditorInvitation
    {
        DB::transaction(function () use ($invitation, $admin, $ip): void {
            $invitation->update(['expires_at' => now()->addDays((int) config('blog.editors.invitation_ttl_days', 7))]);

            $this->audit->handle($admin, 'blog.editor.invited', $invitation, ['email' => $invitation->email, 'resent' => true], $ip);
        });

        Notification::route('mail', $invitation->email)->notify(new BlogEditorInvitationNotification($invitation));

        return $invitation;
    }
}
