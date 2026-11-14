<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\ShopStaff;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class ShopStaffInvitationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public ShopStaff $staff,
        public string $invitationUrl
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $shop = $this->staff->shop;
        $appName = (string) config('app.name');

        return (new MailMessage)
            ->subject("You've been invited to join {$shop->name} on {$appName}")
            ->greeting('Hello!')
            ->line("You have been invited to join **{$shop->name}** as a shop staff member on {$appName}.")
            ->line('As shop staff, you will be able to manage products, process orders, and communicate with customers.')
            ->action('View Invitation', $this->invitationUrl)
            ->line('This invitation link will expire in 7 days.')
            ->line('If you did not expect this invitation, you can ignore this email or decline it.');
    }
}
