<?php

declare(strict_types=1);

namespace App\Actions\Report;

use App\Actions\Moderation\FlagLogoMisuse;
use App\Enums\ModerationItemType;
use App\Enums\ModerationReason;
use App\Enums\ModerationState;
use App\Enums\ReportStatus;
use App\Models\Conversation;
use App\Models\ModerationEvent;
use App\Models\ModerationQueueItem;
use App\Models\Product;
use App\Models\Report;
use App\Models\ReportEvidence;
use App\Models\Review;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final readonly class CreateReport
{
    /**
     * @param  array<int, UploadedFile>  $evidences
     */
    public function handle(
        User $user,
        string $targetType,
        string $targetId,
        string $reason,
        ?string $details = null,
        array $evidences = []
    ): Report {
        $modelClass = match ($targetType) {
            'product' => Product::class,
            'review' => Review::class,
            'shop' => Shop::class,
            'conversation' => Conversation::class,
            'user' => User::class,
            default => null,
        };

        if ($modelClass === null) {
            throw ValidationException::withMessages(['target_type' => 'Invalid report target type.']);
        }

        /** @var Model|null $target */
        $target = $modelClass::find($targetId);
        if ($target === null) {
            throw ValidationException::withMessages(['target_id' => 'Target not found.']);
        }

        return DB::transaction(function () use ($user, $target, $reason, $details, $evidences): Report {
            /** @var Report $report */
            $report = Report::create([
                'reporter_id' => $user->id,
                'reportable_type' => $target->getMorphClass(),
                'reportable_id' => $target->getKey(),
                'reason' => $reason,
                'details' => $details,
                'status' => ReportStatus::Pending,
            ]);

            foreach ($evidences as $index => $file) {
                $path = $file->store('reports/evidence', 'public');
                ReportEvidence::create([
                    'report_id' => $report->id,
                    'file_path' => $path,
                    'display_order' => $index,
                ]);
            }

            if ($reason === ModerationReason::LogoMisuse->value || str_contains(mb_strtolower($reason), 'logo')) {
                app(FlagLogoMisuse::class)->handle($report);
            } else {
                $item = ModerationQueueItem::create([
                    'target_type' => $report->getMorphClass(),
                    'target_id' => $report->id,
                    'type' => ModerationItemType::Report->value,
                    'state' => ModerationState::Pending->value,
                    'reason_code' => $reason,
                    'flagged_by_type' => $user->getMorphClass(),
                    'flagged_by_id' => $user->id,
                ]);

                ModerationEvent::create([
                    'moderation_queue_item_id' => $item->id,
                    'admin_id' => null,
                    'action' => 'flagged',
                    'reason' => $reason,
                ]);
            }

            return $report;
        });
    }
}
