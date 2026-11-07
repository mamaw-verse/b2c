<?php

declare(strict_types=1);

namespace App\Actions\Moderation;

use App\Enums\ModerationItemType;
use App\Enums\ModerationReason;
use App\Enums\ModerationState;
use App\Models\ModerationEvent;
use App\Models\ModerationQueueItem;
use App\Models\Report;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/**
 * Enqueues a moderation item for logo misuse when a user report targets it.
 * Called by the report-creation flow in M5 when reason = 'logo_misuse'.
 */
final readonly class FlagLogoMisuse
{
    public function handle(Report $report): ?ModerationQueueItem
    {
        /** @var Model|null $target */
        $target = $report->reportable;

        if ($target === null) {
            return null;
        }

        $existing = ModerationQueueItem::query()
            ->where('target_type', $target->getMorphClass())
            ->where('target_id', $target->getKey())
            ->where('reason_code', ModerationReason::LogoMisuse->value)
            ->whereIn('state', [ModerationState::Pending->value, ModerationState::Flagged->value])
            ->exists();

        if ($existing) {
            return null;
        }

        return DB::transaction(function () use ($target, $report) {
            $item = ModerationQueueItem::create([
                'target_type' => $target->getMorphClass(),
                'target_id' => $target->getKey(),
                'type' => ModerationItemType::Report->value,
                'state' => ModerationState::Flagged->value,
                'reason_code' => ModerationReason::LogoMisuse->value,
                'flagged_by_type' => (new \App\Models\User)->getMorphClass(),
                'flagged_by_id' => $report->reporter_id,
            ]);

            ModerationEvent::create([
                'moderation_queue_item_id' => $item->id,
                'admin_id' => null,
                'action' => 'auto_flagged',
                'reason' => ModerationReason::LogoMisuse->label(),
                'meta' => ['report_id' => $report->id],
            ]);

            return $item;
        });
    }
}
