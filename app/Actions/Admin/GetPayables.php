<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Enums\AffiliateEarningStatus;
use App\Models\AffiliateEarning;
use App\Models\AffiliateProfile;
use App\Models\LedgerEntry;
use App\Models\OrderRefund;
use App\Models\Payout;
use App\Models\Shop;
use Illuminate\Support\Carbon;

final readonly class GetPayables
{
    /**
     * @return array{
     *     summary: array{
     *         sellers: array{
     *             owed_to_sellers: int,
     *             owed_by_sellers: int,
     *             available: int,
     *             held: int,
     *             net_total: int
     *         },
     *         customers: array{
     *             total_refunds: int,
     *             pending_count: int
     *         },
     *         affiliates: array{
     *             total_accrued: int,
     *             profiles_count: int
     *         }
     *     },
     *     sellers: array{
     *         shop_balances: array<int, array{
     *             id: string,
     *             name: string,
     *             slug: string,
     *             available: int,
     *             held: int,
     *             total: int,
     *             is_negative: bool
     *         }>,
     *         payout_requests: array<int, array{
     *             id: string,
     *             shop: string,
     *             amount: int,
     *             status: string,
     *             method: string,
     *             account_name: string,
     *             account_number: string,
     *             reference: string|null,
     *             created_at: string|null
     *         }>
     *     },
     *     customers: array{
     *         refunds: array<int, array{
     *             id: string,
     *             order_id: string,
     *             order_reference: string,
     *             buyer: array{
     *                 id: string,
     *                 name: string,
     *                 email: string
     *             },
     *             amount: int,
     *             reason: string|null,
     *             resolved_by: string|null,
     *             created_at: string|null
     *         }>
     *     },
     *     affiliates: array{
     *         profiles: array<int, array{
     *             id: string,
     *             code: string,
     *             user: array{
     *                 id: string,
     *                 name: string,
     *                 email: string
     *             },
     *             total: int,
     *             pending: int,
     *             available: int
     *         }>
     *     }
     * }
     */
    public function handle(): array
    {
        $now = Carbon::now()->toDateTimeString();

        // 1. Sellers: grouped SQL on ledger_entries
        $rawShopBalances = LedgerEntry::query()
            ->selectRaw('
                shop_id,
                SUM(CASE WHEN available_at <= ? THEN amount ELSE 0 END) as available,
                SUM(CASE WHEN available_at > ? THEN amount ELSE 0 END) as held,
                SUM(amount) as total
            ', [$now, $now])
            ->groupBy('shop_id')
            ->toBase()
            ->get();

        $shops = Shop::query()
            ->whereIn('id', $rawShopBalances->pluck('shop_id'))
            ->get()
            ->keyBy('id');

        $owedToSellers = 0;
        $owedBySellers = 0;
        $totalAvailable = 0;
        $totalHeld = 0;
        $netSellerTotal = 0;

        $shopBalances = $rawShopBalances->map(function ($row) use ($shops, &$owedToSellers, &$owedBySellers, &$totalAvailable, &$totalHeld, &$netSellerTotal): array {
            $shop = $shops->get($row->shop_id);
            $available = (int) $row->available;
            $held = (int) $row->held;
            $total = (int) $row->total;
            $isNegative = $total < 0;

            if ($isNegative) {
                $owedBySellers += abs($total);
            } else {
                $owedToSellers += $total;
                $totalAvailable += max(0, $available);
                $totalHeld += max(0, $held);
            }

            $netSellerTotal += $total;

            return [
                'id' => (string) $row->shop_id,
                'name' => $shop->name ?? 'Unknown Shop',
                'slug' => $shop->slug ?? '',
                'available' => $available,
                'held' => $held,
                'total' => $total,
                'is_negative' => $isNegative,
            ];
        })->sortByDesc('total')->values()->all();

        $payoutRequests = Payout::query()
            ->with('shop:id,name')
            ->latest()
            ->limit(100)
            ->get()
            ->map(fn (Payout $payout) => [
                'id' => $payout->id,
                'shop' => $payout->shop->name,
                'amount' => $payout->amount,
                'status' => $payout->status->value,
                'method' => $payout->method,
                'account_name' => $payout->account_name,
                'account_number' => $payout->account_number,
                'reference' => $payout->reference,
                'created_at' => $payout->created_at?->toISOString(),
            ])
            ->all();

        // 2. Customers: pending (unprocessed) refunds
        $pendingRefundsQuery = OrderRefund::query()
            ->whereNull('processed_at')
            ->with(['order.user', 'resolvedBy'])
            ->latest();

        $pendingRefunds = $pendingRefundsQuery->get();
        $totalCustomerRefunds = (int) $pendingRefunds->sum('amount');
        $customerRefundsCount = $pendingRefunds->count();

        $customerRefunds = $pendingRefunds->map(function (OrderRefund $refund): array {
            $order = $refund->order;
            $buyer = $order->user;

            return [
                'id' => $refund->id,
                'order_id' => $order->id,
                'order_reference' => $order->referenceNumber(),
                'buyer' => [
                    'id' => $buyer->id,
                    'name' => $buyer->name,
                    'email' => $buyer->email,
                ],
                'amount' => $refund->amount,
                'reason' => $refund->reason,
                'resolved_by' => $refund->resolvedBy?->name,
                'created_at' => $refund->created_at?->toISOString(),
            ];
        })->all();

        // 3. Affiliates: accrued, non-cancelled affiliate_earnings net of reversals
        $cancelledStatus = AffiliateEarningStatus::Cancelled->value;
        $pendingStatus = AffiliateEarningStatus::Pending->value;
        $availableStatus = AffiliateEarningStatus::Available->value;

        $rawAffiliateTotals = AffiliateEarning::query()
            ->selectRaw('
                affiliate_profile_id,
                SUM(CASE WHEN status != ? OR amount < 0 THEN amount ELSE 0 END) as total,
                SUM(CASE WHEN status = ? THEN amount ELSE 0 END) as pending,
                SUM(CASE WHEN status = ? THEN amount ELSE 0 END) as available
            ', [$cancelledStatus, $pendingStatus, $availableStatus])
            ->groupBy('affiliate_profile_id')
            ->toBase()
            ->get()
            ->filter(fn ($row) => (int) $row->total > 0);

        $profiles = AffiliateProfile::query()
            ->with('user:id,name,email')
            ->whereIn('id', $rawAffiliateTotals->pluck('affiliate_profile_id'))
            ->get()
            ->keyBy('id');

        $totalAffiliateAccrued = 0;

        $affiliateProfiles = $rawAffiliateTotals->map(function ($row) use ($profiles, &$totalAffiliateAccrued): array {
            $profile = $profiles->get($row->affiliate_profile_id);
            $total = (int) $row->total;
            $totalAffiliateAccrued += $total;

            return [
                'id' => (string) $row->affiliate_profile_id,
                'code' => $profile->code ?? '',
                'user' => [
                    'id' => $profile->user->id ?? '',
                    'name' => $profile->user->name ?? 'Unknown',
                    'email' => $profile->user->email ?? '',
                ],
                'total' => $total,
                'pending' => (int) $row->pending,
                'available' => (int) $row->available,
            ];
        })->sortByDesc('total')->values()->all();

        return [
            'summary' => [
                'sellers' => [
                    'owed_to_sellers' => $owedToSellers,
                    'owed_by_sellers' => $owedBySellers,
                    'available' => $totalAvailable,
                    'held' => $totalHeld,
                    'net_total' => $netSellerTotal,
                ],
                'customers' => [
                    'total_refunds' => $totalCustomerRefunds,
                    'pending_count' => $customerRefundsCount,
                ],
                'affiliates' => [
                    'total_accrued' => $totalAffiliateAccrued,
                    'profiles_count' => count($affiliateProfiles),
                ],
            ],
            'sellers' => [
                'shop_balances' => $shopBalances,
                'payout_requests' => $payoutRequests,
            ],
            'customers' => [
                'refunds' => $customerRefunds,
            ],
            'affiliates' => [
                'profiles' => $affiliateProfiles,
            ],
        ];
    }
}
