<?php

declare(strict_types=1);

namespace App\Actions\Notification;

use App\Enums\Workspace;
use App\Models\User;
use Illuminate\Notifications\DatabaseNotificationCollection;

final readonly class GetNotifications
{
    /**
     * Notifications are scoped to the workspace they concern: a
     * notification without a `workspace` key in its payload belongs to the
     * buyer account.
     *
     * @return DatabaseNotificationCollection<int, \Illuminate\Notifications\DatabaseNotification>
     */
    public function handle(User $user, Workspace $workspace = Workspace::Buyer): DatabaseNotificationCollection
    {
        return $user->notifications()
            ->whereRaw("COALESCE(data::jsonb->>'workspace', 'buyer') = ?", [$workspace->value])
            ->latest()
            ->get();
    }
}
