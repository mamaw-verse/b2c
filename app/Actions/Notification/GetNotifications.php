<?php

declare(strict_types=1);

namespace App\Actions\Notification;

use App\Enums\Workspace;
use App\Models\User;
use App\Support\NotificationScope;
use Illuminate\Notifications\DatabaseNotificationCollection;

final readonly class GetNotifications
{
    /**
     * Notifications are scoped to the workspace they concern: a
     * notification without a `workspace` key in its payload belongs to the
     * buyer account, and seller notifications are further scoped to the
     * user's active shop (see NotificationScope).
     *
     * @return DatabaseNotificationCollection<int, \Illuminate\Notifications\DatabaseNotification>
     */
    public function handle(User $user, Workspace $workspace = Workspace::Buyer): DatabaseNotificationCollection
    {
        return NotificationScope::apply($user->notifications(), $workspace, $user->operatedShop())
            ->latest()
            ->get();
    }
}
