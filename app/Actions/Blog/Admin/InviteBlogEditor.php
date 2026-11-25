<?php

declare(strict_types=1);

namespace App\Actions\Blog\Admin;

use App\Actions\Admin\RecordAuditLog;
use App\Models\BlogEditorInvitation;
use App\Models\User;
use App\Notifications\BlogEditorInvitationNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

final readonly class InviteBlogEditor
{
    public function __construct(private RecordAuditLog $audit) {}

    public function handle(User $admin, string $email, ?string $ip = null): BlogEditorInvitation
    {
        $normalized = mb_strtolower(mb_trim($email));

        $invitation = DB::transaction(function () use ($admin, $normalized, $ip): BlogEditorInvitation {
            $invitation = BlogEditorInvitation::query()->create([
                'email' => $normalized,
                'invited_by_id' => $admin->id,
                'user_id' => User::query()->whereRaw('LOWER(email) = ?', [$normalized])->value('id'),
                'expires_at' => now()->addDays((int) config('blog.editors.invitation_ttl_days', 7)),
            ]);

            $this->audit->handle($admin, 'blog.editor.invited', $invitation, ['email' => $normalized], $ip);

            return $invitation;
        });

        Notification::route('mail', $normalized)->notify(new BlogEditorInvitationNotification($invitation));

        return $invitation;
    }
}
