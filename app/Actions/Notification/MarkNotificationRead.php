<?php

declare(strict_types=1);

namespace App\Actions\Notification;

use App\Models\User;

final readonly class MarkNotificationRead
{
    public function handle(User $user, ?string $notificationId = null): void
    {
        if ($notificationId !== null) {
            $user->unreadNotifications()->where('id', $notificationId)->update(['read_at' => now()]);
        } else {
            $user->unreadNotifications()->update(['read_at' => now()]);
        }
    }
}
