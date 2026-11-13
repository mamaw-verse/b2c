<?php

declare(strict_types=1);

namespace App\Actions\Order;

use App\Actions\Finance\CreditSellerLedger;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderEvent;
use App\Notifications\OrderStatusNotification;
use App\Notifications\SellerOrderNotification;
use Illuminate\Support\Facades\DB;

final readonly class CompleteOrder
{
    public function __construct(private CreditSellerLedger $ledger) {}

    public function handle(Order $order, string $title = 'Order received', string $detail = 'Confirmed by buyer.'): void
    {
        DB::transaction(function () use ($order, $title, $detail) {
            $order = Order::query()->lockForUpdate()->findOrFail($order->id);

            if ($order->status !== OrderStatus::ToReceive) {
                return;
            }

            $order->update(['status' => OrderStatus::Completed]);
            $order->fulfillments()->where('status', 'shipped')->update(['status' => 'delivered', 'delivered_at' => now()]);

            OrderEvent::create(['order_id' => $order->id, 'title' => $title, 'detail' => $detail]);

            $this->ledger->handle($order);

            DB::afterCommit(fn () => $order->shop->owner?->notify(new SellerOrderNotification($order, 'completed')));

            $order->user->notify(new OrderStatusNotification(
                $order,
                'Order completed',
                "Order {$order->referenceNumber()} is completed. Thank you for your purchase!",
            ));
        });
    }
}
