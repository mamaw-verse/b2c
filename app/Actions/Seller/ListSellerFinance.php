<?php

declare(strict_types=1);

namespace App\Actions\Seller;

use App\Actions\Finance\GetShopBalance;
use App\Enums\LedgerEntryType;
use App\Models\LedgerEntry;
use App\Models\Payout;
use App\Models\Shop;
use App\Support\Settings;

final readonly class ListSellerFinance
{
    public function __construct(private GetShopBalance $balance, private Settings $settings) {}

    /**
     * @return array<string, mixed>
     */
    public function handle(Shop $shop, ?LedgerEntryType $type): array
    {
        return [
            'balance' => $this->balance->handle($shop),
            'minimum_payout' => $this->settings->marketplaceInt('payouts.minimum'),
            'hold_days' => $this->settings->marketplaceInt('payouts.hold_days'),
            'payout_account' => [
                'method' => $shop->payout_method,
                'name' => $shop->payout_account_name,
                'number_hint' => $shop->payout_account_number ? '••••'.mb_substr($shop->payout_account_number, -4) : null,
            ],
            'entries' => $shop->ledgerEntries()
                ->with('order:id')
                ->when($type, fn ($query) => $query->where('type', $type))
                ->latest()
                ->limit(100)
                ->get()
                ->map(fn (LedgerEntry $entry) => [
                    'id' => $entry->id,
                    'type' => $entry->type->value,
                    'label' => $entry->type->label(),
                    'amount' => $entry->amount,
                    'order' => $entry->order?->referenceNumber(),
                    'available_at' => $entry->available_at->toISOString(),
                    'is_available' => $entry->available_at->isPast(),
                    'created_at' => $entry->created_at?->toISOString(),
                ]),
            'payouts' => $shop->payouts()->latest()->limit(50)->get()->map(fn (Payout $payout) => [
                'id' => $payout->id,
                'amount' => $payout->amount,
                'status' => $payout->status->value,
                'reference' => $payout->reference,
                'created_at' => $payout->created_at?->toISOString(),
                'processed_at' => $payout->processed_at?->toISOString(),
            ]),
        ];
    }
}
