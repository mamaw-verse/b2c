<?php

declare(strict_types=1);

namespace App\Actions\Notification;

use App\Models\User;
use Illuminate\Notifications\DatabaseNotificationCollection;

final readonly class GetNotifications
{
    /**
     * @return DatabaseNotificationCollection<int, \Illuminate\Notifications\DatabaseNotification>
     */
    public function handle(User $user): DatabaseNotificationCollection
    {
        return $user->notifications()->latest()->get();
    }
}
