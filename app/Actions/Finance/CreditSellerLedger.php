<?php

declare(strict_types=1);

namespace App\Actions\Finance;

use App\Enums\LedgerEntryType;
use App\Models\Order;
use App\Support\Settings;

/**
 * Credits the shop for a completed order. Entries are idempotent via the
 * unique (order_id, type) key. COD orders use the same entries: the courier
 * collects the cash, so the commission is netted against future payouts.
 * Shipping fees pass through and are not credited.
 */
final readonly class CreditSellerLedger
{
    public function __construct(private Settings $settings) {}

    public function handle(Order $order): void
    {
        $availableAt = now()->addDays($this->settings->marketplaceInt('payouts.hold_days'));
        $commission = (int) $order->items()->sum('commission_amount');

        $entries = [
            [LedgerEntryType::Sale, $order->subtotal - $order->voucher_discount],
            [LedgerEntryType::Commission, -$commission],
            [LedgerEntryType::PlatformVoucherReimbursement, $order->platform_voucher_discount],
        ];

        foreach ($entries as [$type, $amount]) {
            if ($amount === 0) {
                continue;
            }

            $order->ledgerEntries()->firstOrCreate(
                ['type' => $type],
                ['shop_id' => $order->shop_id, 'amount' => $amount, 'available_at' => $availableAt],
            );
        }
    }
}
