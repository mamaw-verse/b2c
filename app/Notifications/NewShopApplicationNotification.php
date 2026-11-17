<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Shop;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class NewShopApplicationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Shop $shop) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        assert($notifiable instanceof User);
        $appName = (string) config('app.name');

        return (new MailMessage)
            ->subject("New shop application on {$appName}")
            ->greeting("Hi {$notifiable->name},")
            ->line("A new seller application has been submitted by **{$this->shop->owner?->name}** for shop **{$this->shop->name}**.")
            ->line('Please review it in the moderation queue at your earliest convenience.')
            ->action('Review application', route('admin.moderation.index', ['type' => 'shop_application']));
    }
}
