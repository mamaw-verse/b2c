<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Order;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class SellerOrderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Order $order, public string $event) {}

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
        [$title, $text] = $this->copy();

        return [
            'type' => 'order',
            'workspace' => 'seller',
            'order_id' => $this->order->id,
            'title' => $title,
            'text' => $text,
            'url' => route('seller.orders.show', $this->order),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        assert($notifiable instanceof User);
        [$title, $text] = $this->copy();

        return (new MailMessage)
            ->subject($title)
            ->greeting("Hi {$notifiable->name},")
            ->line($text)
            ->action('View order', route('seller.orders.show', $this->order));
    }

    /**
     * @return array{string, string}
     */
    private function copy(): array
    {
        return match ($this->event) {
            'received' => ['Buyer confirmed receipt', "The buyer confirmed receipt of order {$this->order->referenceNumber()}!"],
            'completed' => ['Order completed', "Order {$this->order->referenceNumber()} is complete."],
            default => ['New order', "You received a new order {$this->order->referenceNumber()}."],
        };
    }
}
