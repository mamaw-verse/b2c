<?php

declare(strict_types=1);

namespace App\Actions\Notification;

use App\Enums\Workspace;
use App\Models\Shop;
use App\Models\User;
use App\Support\NotificationScope;

final readonly class MarkNotificationRead
{
    /**
     * Mark notifications read within one workspace. Seller notifications
     * are limited to the active shop, so reading one shop's alerts never
     * clears another shop's (or the buyer inbox). A single id outside the
     * scope is a no-op.
     */
    public function handle(
        User $user,
        ?string $notificationId = null,
        Workspace $workspace = Workspace::Buyer,
        ?Shop $activeShop = null,
    ): void {
        $query = NotificationScope::apply($user->unreadNotifications(), $workspace, $activeShop);

        if ($notificationId !== null) {
            $query->where('id', $notificationId);
        }

        $query->update(['read_at' => now()]);
    }
}
