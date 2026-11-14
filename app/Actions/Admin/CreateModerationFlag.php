<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Enums\ModerationItemType;
use App\Enums\ModerationState;
use App\Models\ModerationEvent;
use App\Models\ModerationQueueItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class CreateModerationFlag
{
    public function __construct(private RecordAuditLog $audit) {}

    public function handle(
        User $admin,
        Product $product,
        string $reason,
        string $note,
        ?string $ip = null,
    ): ModerationQueueItem {
        $existing = ModerationQueueItem::query()
            ->where('target_type', $product->getMorphClass())
            ->where('target_id', $product->id)
            ->whereIn('state', [
                ModerationState::Pending->value,
                ModerationState::Flagged->value,
            ])
            ->first();

        if ($existing !== null) {
            return $existing;
        }

        return DB::transaction(function () use ($admin, $product, $reason, $note, $ip) {
            $item = ModerationQueueItem::create([
                'target_type' => $product->getMorphClass(),
                'target_id' => $product->id,
                'type' => ModerationItemType::Manual->value,
                'state' => ModerationState::Pending->value,
                'reason_code' => $reason,
                'flagged_by_type' => $admin->getMorphClass(),
                'flagged_by_id' => $admin->id,
            ]);

            ModerationEvent::create([
                'moderation_queue_item_id' => $item->id,
                'admin_id' => $admin->id,
                'action' => 'flagged',
                'reason' => $note,
                'meta' => [
                    'reason_code' => $reason,
                    'note' => $note,
                ],
            ]);

            $this->audit->handle(
                $admin,
                'moderation.flagged',
                $item,
                [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'reason' => $reason,
                    'note' => $note,
                ],
                $ip,
            );

            return $item;
        });
    }
}
