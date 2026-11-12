<?php

declare(strict_types=1);

namespace App\Actions\Order;

use App\Enums\LedgerEntryType;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderEvent;
use App\Models\User;
use App\Notifications\OrderStatusNotification;
use Illuminate\Support\Facades\DB;

final readonly class ResolveReturn
{
    public function handle(User $seller, Order $order, string $decision, ?string $note = null): void
    {
        DB::transaction(function () use ($seller, $order, $decision, $note) {
            $order = Order::query()->lockForUpdate()->findOrFail($order->id);

            if ($order->shop_id !== $seller->shop?->id) {
                abort(403);
            }

            if ($order->status !== OrderStatus::ReturnRefund) {
                abort(422, 'Order is not in return/refund status.');
            }

            if ($decision === 'approve') {
                $order->update(['status' => OrderStatus::Refunded]);

                $order->ledgerEntries()->create([
                    'shop_id' => $order->shop_id,
                    'type' => LedgerEntryType::Refund,
                    'amount' => -(int) ($order->subtotal - $order->voucher_discount),
                    'available_at' => now(),
                ]);

                OrderEvent::create([
                    'order_id' => $order->id,
                    'title' => 'Refund approved',
                    'detail' => 'The seller approved your return/refund request.',
                ]);

                $order->user->notify(new OrderStatusNotification(
                    $order,
                    'Refund approved',
                    "Your return/refund request for order {$order->referenceNumber()} has been approved.",
                ));
            } else {
                $order->update(['status' => OrderStatus::Completed]);

                OrderEvent::create([
                    'order_id' => $order->id,
                    'title' => 'Return/refund declined',
                    'detail' => $note,
                ]);

                $order->user->notify(new OrderStatusNotification(
                    $order,
                    'Return/refund declined',
                    "Your return/refund request for order {$order->referenceNumber()} was declined. Reason: {$note}",
                ));
            }
        });
    }
}
