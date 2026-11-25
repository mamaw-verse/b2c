<?php

declare(strict_types=1);

namespace App\Actions\Blog\Admin;

use App\Actions\Admin\RecordAuditLog;
use App\Models\BlogEditorInvitation;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class RevokeBlogEditorInvitation
{
    public function __construct(private RecordAuditLog $audit) {}

    public function handle(BlogEditorInvitation $invitation, User $admin, ?string $ip = null): void
    {
        DB::transaction(function () use ($invitation, $admin, $ip): void {
            $invitation->update(['revoked_at' => now()]);

            $this->audit->handle($admin, 'blog.editor.revoked', $invitation, ['email' => $invitation->email], $ip);
        });
    }
}
