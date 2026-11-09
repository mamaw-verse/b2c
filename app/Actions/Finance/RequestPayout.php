<?php

declare(strict_types=1);

namespace App\Actions\Finance;

use App\Enums\LedgerEntryType;
use App\Models\Payout;
use App\Models\Shop;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final readonly class RequestPayout
{
    public function __construct(private GetShopBalance $balance) {}

    public function handle(Shop $shop, int $amount): Payout
    {
        return DB::transaction(function () use ($shop, $amount) {
            $shop = Shop::query()->lockForUpdate()->findOrFail($shop->id);

            if ($amount > $this->balance->handle($shop)['available']) {
                throw ValidationException::withMessages(['amount' => 'Amount exceeds your available balance.']);
            }

            $payout = $shop->payouts()->create([
                'amount' => $amount,
                'method' => $shop->payout_method,
                'account_name' => $shop->payout_account_name,
                'account_number' => $shop->payout_account_number,
            ]);

            $shop->ledgerEntries()->create([
                'payout_id' => $payout->id,
                'type' => LedgerEntryType::Payout,
                'amount' => -$amount,
                'available_at' => now(),
            ]);

            return $payout;
        });
    }
}
