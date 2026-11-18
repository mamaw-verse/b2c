<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Order;
use App\Models\User;
use App\Support\Money;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class RefundDecisionNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param  'approved'|'partially_approved'|'declined'  $outcome
     */
    public function __construct(
        public Order $order,
        public string $outcome,
        public ?int $amount = null,
        public ?string $note = null,
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
        [$title, $text] = $this->copy();

        return [
            'type' => 'order',
            'workspace' => 'buyer',
            'order_id' => $this->order->id,
            'title' => $title,
            'text' => $text,
            'url' => route('orders.show', $this->order),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        assert($notifiable instanceof User);

        [$title, $text] = $this->copy();

        $mail = (new MailMessage)
            ->subject($title)
            ->greeting("Hi {$notifiable->name},")
            ->line($text);

        if ($this->outcome === 'declined' && $this->note !== null) {
            $mail->line("Reason: {$this->note}");
        }

        return $mail->action('View order', route('orders.show', $this->order));
    }

    /**
     * @return array{string, string}
     */
    private function copy(): array
    {
        return match ($this->outcome) {
            'approved' => [
                'Refund approved',
                'Your refund of '.Money::format((int) $this->amount)." for order {$this->order->referenceNumber()} has been approved.",
            ],
            'partially_approved' => [
                'Partial refund approved',
                'Your partial refund of '.Money::format((int) $this->amount)." for order {$this->order->referenceNumber()} has been approved.",
            ],
            default => [
                'Return/refund declined',
                "Your return/refund request for order {$this->order->referenceNumber()} was declined.",
            ],
        };
    }
}
