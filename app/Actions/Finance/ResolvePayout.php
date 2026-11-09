<?php

declare(strict_types=1);

namespace App\Actions\Finance;

use App\Actions\Admin\RecordAuditLog;
use App\Enums\LedgerEntryType;
use App\Enums\PayoutStatus;
use App\Models\Payout;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class ResolvePayout
{
    public function __construct(private RecordAuditLog $audit) {}

    public function handle(Payout $payout, User $admin, PayoutStatus $status, ?string $reference = null, ?string $ip = null): Payout
    {
        return DB::transaction(function () use ($payout, $admin, $status, $reference, $ip) {
            $payout = Payout::query()->lockForUpdate()->findOrFail($payout->id);

            if ($payout->status !== PayoutStatus::Requested) {
                return $payout;
            }

            $payout->update([
                'status' => $status,
                'reference' => $reference,
                'processed_by' => $admin->id,
                'processed_at' => now(),
            ]);

            if ($status === PayoutStatus::Rejected) {
                $payout->shop->ledgerEntries()->create([
                    'payout_id' => $payout->id,
                    'type' => LedgerEntryType::Adjustment,
                    'amount' => $payout->amount,
                    'available_at' => now(),
                    'metadata' => ['reason' => 'Payout rejected'],
                ]);
            }

            $this->audit->handle($admin, 'payout.'.$status->value, $payout, [
                'shop_id' => $payout->shop_id,
                'amount' => $payout->amount,
                'reference' => $reference,
            ], $ip);

            return $payout;
        });
    }
}
