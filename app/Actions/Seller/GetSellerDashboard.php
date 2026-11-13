<?php

declare(strict_types=1);

namespace App\Actions\Seller;

use App\Enums\HalalStatus;
use App\Enums\OrderStatus;
use App\Models\Shop;
use App\Support\Money;
use Illuminate\Support\Carbon;

final readonly class GetSellerDashboard
{
    /**
     * @return array<string, mixed>
     */
    public function handle(Shop $shop, string $period = '7D'): array
    {
        $today = Carbon::today();

        // 1. Certificate-expiry signal
        $expiringCertProduct = $shop->products()
            ->whereHas('halalCertification', function ($query) {
                $query->where('valid_until', '<=', now()->addDays(30));
            })
            ->with('halalCertification')
            ->first();

        $expiryWarning = null;
        if ($expiringCertProduct && $expiringCertProduct->halalCertification) {
            $validUntil = $expiringCertProduct->halalCertification->valid_until;
            $daysLeft = (int) now()->startOfDay()->diffInDays($validUntil->copy()->startOfDay(), false);
            $atRiskCount = $shop->products()
                ->where('halal_status', HalalStatus::Certified)
                ->count();

            $expiryWarning = [
                'days_left' => max(0, $daysLeft),
                'is_expired' => $daysLeft < 0,
                'listings_count' => $atRiskCount,
                'certifying_body' => $expiringCertProduct->halalCertification->certifying_body,
                'valid_until' => $validUntil->toDateString(),
                'product' => $expiringCertProduct->name,
                'product_id' => $expiringCertProduct->id,
                'edit_url' => route('seller.products.edit', $expiringCertProduct),
            ];
        }

        // 2. To-do task counts
        $toShipCount = $shop->orders()->where('status', OrderStatus::ToShip)->count();
        $shipTodayCount = $shop->orders()
            ->where('status', OrderStatus::ToShip)
            ->whereDate('created_at', '<=', $today)
            ->count();
        $returnRequestsCount = $shop->orders()->where('status', OrderStatus::ReturnRefund)->count();
        $unreadChatsCount = $shop->conversations()
            ->whereHas('messages', fn ($q) => $q->whereNull('read_at')->where('sender_id', '!=', $shop->user_id))
            ->count();
        $needsChangesCount = $shop->products()->where('halal_status', HalalStatus::Review)->count();
        $lowStockCount = $shop->products()->where('stock', '<=', 10)->count();

        $tasks = [
            ['count' => $toShipCount, 'label' => 'To ship', 'ic' => 'package', 'href' => route('seller.orders.index', ['status' => 'to_ship'])],
            ['count' => $shipTodayCount, 'label' => 'Ship today', 'ic' => 'alarm-clock', 'urgent' => true, 'href' => route('seller.orders.index', ['status' => 'to_ship'])],
            ['count' => $returnRequestsCount, 'label' => 'Return requests', 'ic' => 'undo-2', 'href' => route('seller.orders.index', ['status' => 'return_refund'])],
            ['count' => $unreadChatsCount, 'label' => 'Unread chats', 'ic' => 'message-circle', 'href' => route('seller.chat.index')],
            ['count' => $needsChangesCount, 'label' => 'Needs changes', 'ic' => 'triangle-alert', 'urgent' => $needsChangesCount > 0, 'href' => route('seller.products.index', ['status' => 'review'])],
            ['count' => $lowStockCount, 'label' => 'Low stock', 'ic' => 'boxes', 'href' => route('seller.products.index', ['stock' => 'low'])],
        ];

        // 3. Sales snapshot metrics
        $salesToday = (int) $shop->orders()
            ->whereDate('created_at', $today)
            ->whereNotIn('status', [OrderStatus::Cancelled])
            ->sum('total');

        $ordersToday = $shop->orders()
            ->whereDate('created_at', $today)
            ->whereNotIn('status', [OrderStatus::Cancelled])
            ->count();

        $yesterday = $today->copy()->subDay();

        $salesYesterday = (int) $shop->orders()
            ->whereDate('created_at', $yesterday)
            ->whereNotIn('status', [OrderStatus::Cancelled])
            ->sum('total');

        $ordersYesterday = $shop->orders()
            ->whereDate('created_at', $yesterday)
            ->whereNotIn('status', [OrderStatus::Cancelled])
            ->count();

        $averageToday = $ordersToday > 0 ? intdiv($salesToday, $ordersToday) : 0;
        $averageYesterday = $ordersYesterday > 0 ? intdiv($salesYesterday, $ordersYesterday) : 0;

        $delta = function (float $current, float $previous): array {
            if ($previous <= 0.0) {
                return [];
            }

            $change = (int) round((($current - $previous) / $previous) * 100);

            return [
                'delta' => ($change >= 0 ? '+' : '').$change.'%',
                'up' => $change >= 0,
                'hint' => 'vs yesterday',
            ];
        };

        $metrics = [
            [
                'label' => 'Sales today',
                'value' => Money::format($salesToday),
                'ic' => 'tag',
                ...$delta($salesToday, $salesYesterday),
            ],
            [
                'label' => 'Orders today',
                'value' => (string) $ordersToday,
                'ic' => 'package',
                ...$delta((float) $ordersToday, (float) $ordersYesterday),
            ],
            [
                'label' => 'Avg. order value',
                'value' => Money::format($averageToday),
                'ic' => 'shopping-bag',
                ...$delta($averageToday, $averageYesterday),
            ],
        ];

        // 4. Sales chart data
        $daysCount = match ($period) {
            '30D' => 30,
            '90D' => 90,
            default => 7,
        };

        $chartData = [];
        $totalSales = 0;
        $maxSales = 0;
        $bestDay = null;

        for ($i = $daysCount - 1; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $dayLabel = $daysCount === 7 ? $date->format('D') : $date->format('M d');
            $daySales = (int) $shop->orders()
                ->whereDate('created_at', $date)
                ->whereNotIn('status', [OrderStatus::Cancelled])
                ->sum('total');

            $chartData[] = [$dayLabel, $daySales];
            $totalSales += $daySales;

            if ($daySales > $maxSales) {
                $maxSales = $daySales;
                $bestDay = $dayLabel;
            }
        }

        // 5. Orders to ship list
        $recentOrders = $shop->orders()
            ->where('status', OrderStatus::ToShip)
            ->with(['items.product.images', 'user'])
            ->latest()
            ->take(5)
            ->get()
            ->map(fn ($order) => [
                'id' => '#'.mb_strtoupper(mb_substr($order->id, -11)),
                'buyer' => $order->user->name,
                'items' => $order->items->sum('qty'),
                'total' => $order->total,
                'status' => $order->status->label(),
                'due' => null,
                'urgent' => $order->created_at?->isToday() === true,
                'pay' => mb_strtoupper($order->payment_method->value),
                'thumbnail_icon' => $order->items->first()?->product?->images?->first()->icon ?? 'package',
                'thumbnail' => $order->items->first()?->product?->thumbnailUrl(),
                'detail_url' => route('seller.orders.show', $order),
            ]);

        return [
            'shop' => [
                'id' => $shop->id,
                'name' => $shop->name,
                'slug' => $shop->slug,
                'location' => $shop->location,
                'rating' => $shop->rating,
                'followers_count' => $shop->followers_count,
            ],
            'expiry_warning' => $expiryWarning,
            'tasks' => $tasks,
            'metrics' => $metrics,
            'sales_chart' => [
                'period' => $period,
                'data' => $chartData,
                'total' => $totalSales,
                'best_day' => $bestDay,
            ],
            'recent_orders' => $recentOrders,
        ];
    }
}
