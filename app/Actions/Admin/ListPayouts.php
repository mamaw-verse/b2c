<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Enums\PayoutStatus;
use App\Models\Payout;

final readonly class ListPayouts
{
    /**
     * @return array<string, mixed>
     */
    public function handle(?PayoutStatus $status): array
    {
        return [
            'status' => $status?->value,
            'payouts' => Payout::query()
                ->with('shop:id,name')
                ->when($status, fn ($query) => $query->where('status', $status))
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
                ]),
        ];
    }
}
