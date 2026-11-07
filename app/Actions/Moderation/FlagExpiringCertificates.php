<?php

declare(strict_types=1);

namespace App\Actions\Moderation;

use App\Enums\ModerationItemType;
use App\Enums\ModerationReason;
use App\Enums\ModerationState;
use App\Models\HalalCertification;
use App\Models\ModerationEvent;
use App\Models\ModerationQueueItem;
use Illuminate\Support\Facades\DB;

/**
 * Flags products/shops whose Halal certificates are expiring (30/7 days) or expired.
 * Run via scheduled command: `moderation:flag-expiring-certificates`.
 */
final readonly class FlagExpiringCertificates
{
    public function handle(): int
    {
        $flagged = 0;

        HalalCertification::query()
            ->where('valid_until', '<=', now()->addDays(30))
            ->with('certifiable')
            ->each(function (HalalCertification $cert) use (&$flagged) {
                $target = $cert->certifiable;

                if ($target === null) {
                    return;
                }

                $reasonCode = $cert->valid_until->isPast()
                    ? ModerationReason::HalalCertificateExpired
                    : ModerationReason::HalalCertificateExpiring;

                $existing = ModerationQueueItem::query()
                    ->where('target_type', $target->getMorphClass())
                    ->where('target_id', $target->id)
                    ->where('reason_code', $reasonCode->value)
                    ->whereIn('state', [ModerationState::Pending->value, ModerationState::Flagged->value])
                    ->exists();

                if ($existing) {
                    return;
                }

                DB::transaction(function () use ($target, $reasonCode) {
                    $item = ModerationQueueItem::create([
                        'target_type' => $target->getMorphClass(),
                        'target_id' => $target->id,
                        'type' => ModerationItemType::Expiry->value,
                        'state' => ModerationState::Flagged->value,
                        'reason_code' => $reasonCode->value,
                    ]);

                    ModerationEvent::create([
                        'moderation_queue_item_id' => $item->id,
                        'admin_id' => null,
                        'action' => 'auto_flagged',
                        'reason' => $reasonCode->label(),
                    ]);
                });

                $flagged++;
            });

        return $flagged;
    }
}
