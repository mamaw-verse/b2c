<?php

declare(strict_types=1);

namespace App\Actions\Moderation;

use App\Actions\Admin\RecordAuditLog;
use App\Models\ModerationEvent;
use App\Models\ModerationQueueItem;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class WarnModerationTarget
{
    public function __construct(private RecordAuditLog $audit) {}

    /**
     * A warning is advisory only: it is recorded on the item but does not
     * resolve it or change the target, so the review stays open.
     */
    public function handle(ModerationQueueItem $item, User $admin, string $reason, ?string $ip = null): ModerationQueueItem
    {
        return DB::transaction(function () use ($item, $admin, $reason, $ip) {
            ModerationEvent::create([
                'moderation_queue_item_id' => $item->id,
                'admin_id' => $admin->id,
                'action' => 'warn',
                'reason' => $reason,
            ]);

            $this->audit->handle($admin, 'moderation.warn', $item, ['reason' => $reason], $ip);

            return $item;
        });
    }
}
