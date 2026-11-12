<?php

declare(strict_types=1);

namespace App\Actions\Moderation;

use App\Actions\Admin\RecordAuditLog;
use App\Enums\ModerationState;
use App\Enums\ShopStatus;
use App\Models\ModerationEvent;
use App\Models\ModerationQueueItem;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class RequestModerationChanges
{
    public function __construct(private RecordAuditLog $audit) {}

    public function handle(ModerationQueueItem $item, User $admin, string $kind, string $reason, ?string $ip = null): ModerationQueueItem
    {
        return DB::transaction(function () use ($item, $admin, $kind, $reason, $ip) {
            $item->update([
                'state' => ModerationState::Flagged,
                'reason_code' => $kind,
                'decision_reason' => $reason,
            ]);

            ModerationEvent::create([
                'moderation_queue_item_id' => $item->id,
                'admin_id' => $admin->id,
                'action' => $kind,
                'reason' => $reason,
            ]);

            if ($item->target instanceof Shop && $item->target->status === ShopStatus::Pending) {
                $item->target->update([
                    'status' => ShopStatus::ChangesRequested,
                    'rejection_reason' => $reason,
                    'reviewed_at' => now(),
                    'reviewed_by' => $admin->id,
                ]);
            }

            $this->audit->handle($admin, 'moderation.'.$kind, $item, ['reason' => $reason], $ip);

            return $item;
        });
    }
}
