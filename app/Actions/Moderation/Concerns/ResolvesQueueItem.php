<?php

declare(strict_types=1);

namespace App\Actions\Moderation\Concerns;

use App\Actions\Admin\RecordAuditLog;
use App\Enums\HalalStatus;
use App\Enums\ModerationState;
use App\Enums\ReportStatus;
use App\Enums\ShopStatus;
use App\Models\ModerationEvent;
use App\Models\ModerationQueueItem;
use App\Models\Product;
use App\Models\Report;
use App\Models\Review;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/**
 * Using classes must expose a private `RecordAuditLog $audit` property.
 */
trait ResolvesQueueItem
{
    protected function resolve(
        ModerationQueueItem $item,
        User $admin,
        string $action,
        ModerationState $newState,
        string $reason,
        ?string $ip = null,
    ): ModerationQueueItem {
        return DB::transaction(function () use ($item, $admin, $action, $newState, $reason, $ip) {
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

            $this->applySideEffect($item->target, $action, $reason, $admin);

            $this->audit->handle($admin, 'moderation.'.$action, $item, ['reason' => $reason], $ip);

            return $item;
        });
    }

    private function applySideEffect(?Model $target, string $action, string $reason, User $admin): void
    {
        if ($target === null) {
            return;
        }

        match (true) {
            in_array($action, ['hidden', 'request_changes', 'request_certificate'], true) && $target instanceof Product => $target->update(['hidden' => true, 'published' => false]),
            in_array($action, ['hidden', 'request_changes', 'request_certificate'], true) && $target instanceof Review => $target->update(['hidden' => true]),
            $action === 'suspended' && $target instanceof Shop => $target->update(['suspended' => true]),
            $action === 'suspended' && $target instanceof Product => $target->update(['hidden' => true, 'published' => false]),
            in_array($action, ['hidden', 'request_changes', 'request_certificate'], true) && $target instanceof Shop && $target->status === ShopStatus::Pending => $this->requestShopRevision($target, $reason, $admin),
            $action === 'approved' && $target instanceof Shop && $target->status === ShopStatus::Pending => $this->approveShopApplication($target, $admin),
            $action === 'rejected' && $target instanceof Shop && $target->status === ShopStatus::Pending => $target->update([
                'status' => ShopStatus::Rejected,
                'rejection_reason' => $reason,
                'reviewed_at' => now(),
                'reviewed_by' => $admin->id,
            ]),
            $action === 'approved' && $target instanceof Product => $this->approveCertifiedProduct($target),
            $action === 'rejected' && $target instanceof Product && $target->halal_status === HalalStatus::Review => $target->update(['halal_status' => HalalStatus::Missing]),
            $target instanceof Report => $this->resolveReport($target, $action, $reason, $admin),
            default => null,
        };
    }

    private function resolveReport(Report $report, string $action, string $reason, User $admin): void
    {
        // Revision requests behave like hides: the reported content comes
        // down while the author fixes it and resubmits.
        $effective = in_array($action, ['request_changes', 'request_certificate'], true) ? 'hidden' : $action;

        if (in_array($effective, ['approved', 'hidden', 'suspended'], true)) {
            $report->update(['status' => ReportStatus::Actioned]);

            if ($report->reportable !== null) {
                if ($effective === 'hidden') {
                    if ($report->reportable instanceof Product) {
                        $report->reportable->update(['hidden' => true, 'published' => false]);
                    } elseif ($report->reportable instanceof Review) {
                        $report->reportable->update(['hidden' => true]);
                    } elseif ($report->reportable instanceof Shop && $report->reportable->status === ShopStatus::Pending) {
                        $this->requestShopRevision($report->reportable, $reason, $admin);
                    }
                } elseif ($effective === 'suspended') {
                    if ($report->reportable instanceof Shop) {
                        $report->reportable->update(['suspended' => true]);
                    } elseif ($report->reportable instanceof Product) {
                        $report->reportable->update(['hidden' => true, 'published' => false]);
                    }
                }
            }
        } elseif ($effective === 'rejected') {
            $report->update(['status' => ReportStatus::Dismissed]);
        }
    }

    private function requestShopRevision(Shop $shop, string $reason, User $admin): void
    {
        $shop->update([
            'status' => ShopStatus::ChangesRequested,
            'rejection_reason' => $reason,
            'reviewed_at' => now(),
            'reviewed_by' => $admin->id,
        ]);
    }

    private function approveShopApplication(Shop $shop, User $admin): void
    {
        $shop->update([
            'status' => ShopStatus::Approved,
            'reviewed_at' => now(),
            'reviewed_by' => $admin->id,
        ]);

        // Approving the application verifies the certificates submitted with it.
        $shop->halalCertifications()->update(['checked_at' => now()]);
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
