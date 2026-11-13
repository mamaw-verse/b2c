<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Shop;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class ShopApplicationReviewedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Shop $shop, public string $outcome, public ?string $reason) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'shop_application',
            'workspace' => 'buyer',
            'title' => $this->outcome === 'rejected' ? 'Application rejected' : 'Changes requested on your application',
            'text' => $this->reason,
            'url' => route('seller.register'),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        assert($notifiable instanceof User);
        $rejected = $this->outcome === 'rejected';

        $mail = (new MailMessage)
            ->subject($rejected ? 'Your shop application was rejected' : 'Changes requested on your shop application')
            ->greeting("Hi {$notifiable->name},")
            ->line($rejected ? 'Your shop application was rejected.' : 'Please update your shop application.');

        if ($this->reason !== null) {
            $mail->line("Admin's note: {$this->reason}");
        }

        return $mail->action('Update your application', route('seller.register'));
    }
}
