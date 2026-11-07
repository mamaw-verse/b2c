<?php

declare(strict_types=1);

namespace App\Actions\Moderation;

use App\Enums\ModerationItemType;
use App\Enums\ModerationReason;
use App\Enums\ModerationState;
use App\Models\ModerationEvent;
use App\Models\ModerationQueueItem;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

/**
 * Auto-flags a product listing when it claims "halal" in name/description
 * without a certificate, or contains a prohibited ingredient keyword.
 * Run on product create/update (called by CreateSellerProduct / UpdateSellerProduct).
 */
final readonly class FlagListingKeywords
{
    /** @var list<string> Prohibited ingredient keywords (lowercase). */
    private const PROHIBITED_INGREDIENTS = [
        'pork', 'lard', 'bacon', 'ham', 'gelatin', 'alcohol', 'wine', 'beer',
        'baboy', 'mantika ng baboy', 'alak',
    ];

    /** @var list<string> Halal claim keywords in product name/description (lowercase). */
    private const HALAL_CLAIM_KEYWORDS = ['halal', 'certified halal', 'halal certified'];

    public function handle(Product $product): ?ModerationQueueItem
    {
        $reasonCode = $this->detectViolation($product);

        if ($reasonCode === null) {
            return null;
        }

        // Skip if an open item already exists for this product + reason.
        $existing = ModerationQueueItem::query()
            ->where('target_type', $product->getMorphClass())
            ->where('target_id', $product->id)
            ->where('reason_code', $reasonCode->value)
            ->whereIn('state', [ModerationState::Pending->value, ModerationState::Flagged->value])
            ->exists();

        if ($existing) {
            return null;
        }

        return DB::transaction(function () use ($product, $reasonCode) {
            $item = ModerationQueueItem::create([
                'target_type' => $product->getMorphClass(),
                'target_id' => $product->id,
                'type' => ModerationItemType::Keyword->value,
                'state' => ModerationState::Flagged->value,
                'reason_code' => $reasonCode->value,
            ]);

            ModerationEvent::create([
                'moderation_queue_item_id' => $item->id,
                'admin_id' => null,
                'action' => 'auto_flagged',
                'reason' => $reasonCode->label(),
            ]);

            return $item;
        });
    }

    private function detectViolation(Product $product): ?ModerationReason
    {
        $hasCertificate = $product->halalCertification()->exists();
        $searchText = mb_strtolower($product->name.' '.($product->description ?? '').' '.($product->ingredients ?? ''));

        // Prohibited ingredient takes highest priority.
        foreach (self::PROHIBITED_INGREDIENTS as $keyword) {
            if (str_contains($searchText, $keyword)) {
                return ModerationReason::ProhibitedIngredient;
            }
        }

        // Halal keyword in name/description without a certificate.
        if (! $hasCertificate) {
            foreach (self::HALAL_CLAIM_KEYWORDS as $keyword) {
                if (str_contains($searchText, $keyword)) {
                    return ModerationReason::HalalKeywordWithoutCertificate;
                }
            }
        }

        return null;
    }
}
