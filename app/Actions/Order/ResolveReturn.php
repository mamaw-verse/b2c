<?php

declare(strict_types=1);

namespace App\Actions\Order;

use App\Enums\AffiliateEarningStatus;
use App\Enums\LedgerEntryType;
use App\Enums\OrderStatus;
use App\Models\AffiliateEarning;
use App\Models\Order;
use App\Models\OrderEvent;
use App\Models\OrderRefund;
use App\Models\OrderRefundItem;
use App\Models\User;
use App\Notifications\OrderStatusNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final readonly class ResolveReturn
{
    /** @param array<int, array{order_item_id: string, qty: int}> $items */
    public function handle(User $seller, Order $order, string $decision, ?string $note = null, array $items = []): void
    {
        DB::transaction(function () use ($seller, $order, $decision, $note, $items) {
            $order = Order::query()->lockForUpdate()->with('items.refundItems')->findOrFail($order->id);

            if ($order->status !== OrderStatus::ReturnRefund) {
                return;
            }

            if ($decision === 'approve') {
                $selectedItems = collect($items)->map(function (array $item) use ($order): array {
                    $orderItem = $order->items->firstWhere('id', $item['order_item_id']);
                    $remaining = $orderItem === null ? 0 : $orderItem->qty - $orderItem->refundedUnits();

                    if ($orderItem === null || $item['qty'] > $remaining) {
                        throw ValidationException::withMessages(['items' => 'The selected refund quantity is no longer available.']);
                    }

                    return ['order_item' => $orderItem, 'qty' => $item['qty']];
                });

                $gross = (int) $selectedItems->sum(fn (array $item): int => $item['order_item']->unit_price * $item['qty']);
                $previousGross = (int) OrderRefundItem::query()
                    ->whereHas('refund', fn ($refunds) => $refunds->where('order_id', $order->id))
                    ->with('orderItem')
                    ->get()
                    ->sum(fn (OrderRefundItem $item): int => $item->orderItem->unit_price * $item->qty);
                $previousNet = (int) $order->refunds()->sum('amount');
                $previousDiscount = $previousGross - $previousNet;
                $cumulativeGross = $previousGross + $gross;
                $cumulativeDiscount = $order->subtotal > 0
                    ? intdiv(($order->voucher_discount * $cumulativeGross) + intdiv($order->subtotal, 2), $order->subtotal)
                    : 0;
                $amount = $gross - ($cumulativeDiscount - $previousDiscount);

                $refund = OrderRefund::create([
                    'order_id' => $order->id,
                    'amount' => $amount,
                    'reason' => $note,
                    'resolved_by' => $seller->id,
                ]);

                foreach ($selectedItems as $item) {
                    OrderRefundItem::create([
                        'order_refund_id' => $refund->id,
                        'order_item_id' => $item['order_item']->id,
                        'qty' => $item['qty'],
                    ]);
                }

                $refund->ledgerEntry()->create([
                    'shop_id' => $order->shop_id,
                    'order_id' => $order->id,
                    'type' => LedgerEntryType::Refund,
                    'amount' => -$amount,
                    'available_at' => now(),
                    'metadata' => ['order_id' => $order->id],
                ]);

                $affiliateReversalTotal = (int) $selectedItems->sum(function (array $item): int {
                    $orderItem = $item['order_item'];
                    if ($orderItem->affiliate_amount > 0 && $orderItem->qty > 0) {
                        return (int) round(($item['qty'] / $orderItem->qty) * $orderItem->affiliate_amount);
                    }

                    return 0;
                });

                if ($affiliateReversalTotal > 0) {
                    $order->ledgerEntries()->create([
                        'shop_id' => $order->shop_id,
                        'type' => LedgerEntryType::Adjustment,
                        'amount' => $affiliateReversalTotal,
                        'available_at' => now(),
                        'metadata' => [
                            'order_id' => $order->id,
                            'order_refund_id' => $refund->id,
                            'reason' => 'Affiliate commission reversal on refund',
                        ],
                    ]);

                    foreach ($selectedItems as $item) {
                        $orderItem = $item['order_item'];
                        if ($orderItem->affiliate_profile_id !== null && $orderItem->affiliate_amount > 0 && $orderItem->qty > 0) {
                            $reversal = (int) round(($item['qty'] / $orderItem->qty) * $orderItem->affiliate_amount);
                            if ($reversal > 0) {
                                AffiliateEarning::create([
                                    'affiliate_profile_id' => $orderItem->affiliate_profile_id,
                                    'order_id' => $order->id,
                                    'order_item_id' => $orderItem->id,
                                    'amount' => -$reversal,
                                    'status' => AffiliateEarningStatus::Cancelled,
                                    'available_at' => now(),
                                ]);
                            }
                        }
                    }
                }

                $fullyRefunded = $order->items->every(fn ($item) => $item->refundedUnits() + $selectedItems->where('order_item.id', $item->id)->sum('qty') >= $item->qty);
                $order->update(['status' => $fullyRefunded ? OrderStatus::Refunded : OrderStatus::Completed]);

                OrderEvent::create([
                    'order_id' => $order->id,
                    'title' => $fullyRefunded ? 'Refund approved' : 'Partial refund approved',
                    'detail' => 'The seller approved a refund of '.\App\Support\Money::format($amount).'.',
                    'metadata' => ['refund_id' => $refund->id, 'amount' => $amount],
                ]);

                DB::afterCommit(fn () => $order->user->notify(new OrderStatusNotification(
                    $order,
                    $fullyRefunded ? 'Refund approved' : 'Partial refund approved',
                    'Your refund of '.\App\Support\Money::format($amount)." for order {$order->referenceNumber()} has been approved.",
                )));
            } else {
                $order->update(['status' => OrderStatus::Completed]);

                OrderEvent::create([
                    'order_id' => $order->id,
                    'title' => 'Return/refund declined',
                    'detail' => $note,
                ]);

                DB::afterCommit(fn () => $order->user->notify(new OrderStatusNotification(
                    $order,
                    'Return/refund declined',
                    "Your return/refund request for order {$order->referenceNumber()} was declined. Reason: {$note}",
                )));
            }
        });
    }
}
