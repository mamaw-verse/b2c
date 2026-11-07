<?php

declare(strict_types=1);

namespace App\Actions\Moderation\Concerns;

use App\Enums\HalalStatus;
use App\Enums\ModerationState;
use App\Enums\ReportStatus;
use App\Models\ModerationEvent;
use App\Models\ModerationQueueItem;
use App\Models\Product;
use App\Models\Report;
use App\Models\Review;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

trait ResolvesQueueItem
{
    protected function resolve(
        ModerationQueueItem $item,
        User $admin,
        string $action,
        ModerationState $newState,
        string $reason,
    ): ModerationQueueItem {
        return DB::transaction(function () use ($item, $admin, $action, $newState, $reason) {
            $item->update([
                'state' => $newState->value,
                'resolved_by' => $admin->id,
                'resolved_at' => now(),
                'decision_reason' => $reason,
            ]);

            ModerationEvent::create([
                'moderation_queue_item_id' => $item->id,
                'admin_id' => $admin->id,
                'action' => $action,
                'reason' => $reason,
            ]);

            $this->applySideEffect($item->target, $action);

            return $item;
        });
    }

    private function applySideEffect(?Model $target, string $action): void
    {
        if ($target === null) {
            return;
        }

        match (true) {
            $action === 'hidden' && $target instanceof Product => $target->update(['hidden' => true, 'published' => false]),
            $action === 'hidden' && $target instanceof Review => $target->update(['hidden' => true]),
            $action === 'suspended' && $target instanceof Shop => $target->update(['suspended' => true]),
            $action === 'suspended' && $target instanceof Product => $target->update(['hidden' => true, 'published' => false]),
            $action === 'approved' && $target instanceof Product => $this->approveCertifiedProduct($target),
            $action === 'rejected' && $target instanceof Product && $target->halal_status === HalalStatus::Review => $target->update(['halal_status' => HalalStatus::Missing]),
            $target instanceof Report => $this->resolveReport($target, $action),
            default => null,
        };
    }

    private function resolveReport(Report $report, string $action): void
    {
        if (in_array($action, ['approved', 'hidden', 'suspended'], true)) {
            $report->update(['status' => ReportStatus::Actioned]);

            if ($report->reportable !== null) {
                if ($action === 'hidden') {
                    if ($report->reportable instanceof Product) {
                        $report->reportable->update(['hidden' => true, 'published' => false]);
                    } elseif ($report->reportable instanceof Review) {
                        $report->reportable->update(['hidden' => true]);
                    }
                } elseif ($action === 'suspended') {
                    if ($report->reportable instanceof Shop) {
                        $report->reportable->update(['suspended' => true]);
                    } elseif ($report->reportable instanceof Product) {
                        $report->reportable->update(['hidden' => true, 'published' => false]);
                    }
                }
            }
        } elseif ($action === 'rejected') {
            $report->update(['status' => ReportStatus::Dismissed]);
        }
    }

    private function approveCertifiedProduct(Product $product): void
    {
        // If the product was flagged for a halal review, approving moves it to certified.
        if ($product->halal_status === HalalStatus::Review) {
            $product->update(['halal_status' => HalalStatus::Certified]);

            if ($product->halalCertification) {
                $product->halalCertification->update(['checked_at' => now()]);
            }
        }
    }
}
