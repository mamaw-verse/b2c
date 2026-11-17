<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Fulfillment;
use App\Models\Order;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class OrderFulfilledNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Order $order,
        public Fulfillment $fulfillment,
        public bool $fullyFulfilled,
    ) {}

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
            'workspace' => 'buyer',
            'order_id' => $this->order->id,
            'title' => $this->fullyFulfilled ? 'Order shipped' : 'Part of your order shipped',
            'text' => "Order {$this->order->referenceNumber()} has a parcel on the way with {$this->fulfillment->courier_name}.",
            'url' => route('orders.show', $this->order),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        assert($notifiable instanceof User);

        $subject = $this->fullyFulfilled
            ? "Your order {$this->order->referenceNumber()} has shipped"
            : "Part of your order {$this->order->referenceNumber()} has shipped";

        $mail = (new MailMessage)
            ->subject($subject)
            ->greeting("Hi {$notifiable->name},")
            ->line($this->fullyFulfilled
                ? "Great news! Your order {$this->order->referenceNumber()} has been shipped."
                : "Part of your order {$this->order->referenceNumber()} has been shipped.")
            ->line("Courier: {$this->fulfillment->courier_name}")
            ->line("Tracking number: {$this->fulfillment->tracking_number}");

        if ($this->fulfillment->tracking_url !== null) {
            $mail->action('Track your order', $this->fulfillment->tracking_url);
        } else {
            $mail->action('View order', route('orders.show', $this->order));
        }

        return $mail;
    }
}
