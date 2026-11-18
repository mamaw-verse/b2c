<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Order;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class SellerReturnRequestedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Order $order, public string $reason) {}

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
            'type' => 'order',
            'workspace' => 'seller',
            'shop_id' => $this->order->shop_id,
            'order_id' => $this->order->id,
            'title' => 'Return/refund requested',
            'text' => "A return/refund was requested for order {$this->order->referenceNumber()}.",
            'url' => route('seller.orders.show', $this->order),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        assert($notifiable instanceof User);

        $truncatedReason = mb_strlen($this->reason) > 200
            ? mb_substr($this->reason, 0, 200).'…'
            : $this->reason;

        return (new MailMessage)
            ->subject('Return/refund requested')
            ->greeting("Hi {$notifiable->name},")
            ->line("A customer has requested a return/refund for order {$this->order->referenceNumber()}.")
            ->line("Reason: {$truncatedReason}")
            ->action('Review request', route('seller.orders.show', $this->order));
    }
}
