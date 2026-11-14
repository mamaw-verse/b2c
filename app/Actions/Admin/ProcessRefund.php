<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\OrderEvent;
use App\Models\OrderRefund;
use App\Models\User;
use App\Notifications\OrderStatusNotification;
use App\Support\Money;
use Illuminate\Support\Facades\DB;

final readonly class ProcessRefund
{
    public function __construct(private RecordAuditLog $audit) {}

    public function handle(OrderRefund $refund, User $admin, string $reference, ?string $ip = null): OrderRefund
    {
        return DB::transaction(function () use ($refund, $admin, $reference, $ip) {
            $refund = OrderRefund::query()->lockForUpdate()->findOrFail($refund->id);

            if ($refund->processed_at !== null) {
                return $refund;
            }

            $refund->update([
                'processed_at' => now(),
                'processed_by' => $admin->id,
                'reference' => $reference,
            ]);

            OrderEvent::create([
                'order_id' => $refund->order_id,
                'title' => 'Refund processed',
                'detail' => 'Refund of '.Money::format($refund->amount).'. Reference: '.$reference.'.',
                'metadata' => [
                    'refund_id' => $refund->id,
                    'amount' => $refund->amount,
                    'reference' => $reference,
                    'processed_by' => $admin->id,
                ],
            ]);

            $this->audit->handle($admin, 'refund.processed', $refund, [
                'order_id' => $refund->order_id,
                'amount' => $refund->amount,
                'reference' => $reference,
            ], $ip);

            DB::afterCommit(fn () => $refund->order->user->notify(new OrderStatusNotification(
                $refund->order,
                'Refund processed',
                'Your refund of '.Money::format($refund->amount)." for order {$refund->order->referenceNumber()} has been sent. Reference: {$reference}.",
            )));

            return $refund;
        });
    }
}
