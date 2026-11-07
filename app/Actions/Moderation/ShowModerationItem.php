<?php

declare(strict_types=1);

namespace App\Actions\Moderation;

use App\Enums\ModerationReason;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\ModerationQueueItem;
use App\Models\Product;
use App\Models\Report;
use App\Models\Review;
use App\Models\Shop;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

final readonly class ShowModerationItem
{
    /**
     * @return array{item: ModerationQueueItem, preview: array{kind: string, snapshot: array<string, mixed>}}
     */
    public function handle(ModerationQueueItem $item): array
    {
        $item->load([
            'target' => function (MorphTo $morphTo) {
                $morphTo->morphWith([
                    Product::class => ['shop', 'images'],
                    Shop::class => ['owner'],
                    Review::class => ['user'],
                    Report::class => [
                        'reporter',
                        'reportable' => function (MorphTo $nested) {
                            $nested->morphWith([
                                Product::class => ['shop', 'images'],
                                Shop::class => ['owner'],
                                Review::class => ['user'],
                                Conversation::class => ['messages'],
                            ]);
                        },
                    ],
                    Message::class => ['conversation'],
                    Conversation::class => ['messages'],
                ]);
            },
            'flaggedBy',
            'resolvedBy',
            'events.admin',
        ]);

        return [
            'item' => $item,
            'preview' => $this->preview($item),
        ];
    }

    /** @return array{kind: string, snapshot: array<string, mixed>} */
    private function preview(ModerationQueueItem $item): array
    {
        $target = $this->resolveTarget($item);

        return match (true) {
            $target instanceof Product => $this->productPreview($item, $target),
            $target instanceof Shop => $this->shopPreview($item, $target),
            $target instanceof Review => $this->reviewPreview($item, $target),
            $target instanceof Message, $target instanceof Conversation => $this->chatPreview($item, $target),
            default => ['kind' => 'unknown', 'snapshot' => []],
        };
    }

    private function resolveTarget(ModerationQueueItem $item): ?Model
    {
        $target = $item->target;

        if ($target instanceof Report) {
            return $target->reportable;
        }

        return $target;
    }

    /** @return array{kind: string, snapshot: array<string, mixed>} */
    private function productPreview(ModerationQueueItem $item, Product $product): array
    {
        return [
            'kind' => 'product',
            'snapshot' => [
                'title' => $product->name,
                'price' => $product->price,
                'seller_name' => $product->shop?->name,
                'seller_href' => $product->shop ? route('shops.show', $product->shop->slug) : null,
                'photos' => $product->images->pluck('url')->filter()->values()->all(),
                'flag_notice' => $this->reasonLabel($item),
                'halal_status' => $product->halal_status?->value ?? 'unknown',
                'ingredients' => $product->ingredients,
                'flagged_terms' => $this->flaggedTerms($item->reason_code),
            ],
        ];
    }

    /** @return array{kind: string, snapshot: array<string, mixed>} */
    private function shopPreview(ModerationQueueItem $item, Shop $shop): array
    {
        return [
            'kind' => 'product',
            'snapshot' => [
                'title' => $shop->name,
                'seller_name' => $shop->name,
                'seller_href' => route('shops.show', $shop->slug),
                'photos' => array_values(array_filter([$shop->banner_url, $shop->logo_url])),
                'flag_notice' => $this->reasonLabel($item),
                'halal_status' => $shop->halal_only ? 'halal-only shop' : 'general shop',
            ],
        ];
    }

    /** @return array{kind: string, snapshot: array<string, mixed>} */
    private function reviewPreview(ModerationQueueItem $item, Review $review): array
    {
        return [
            'kind' => 'review',
            'snapshot' => [
                'rating' => $review->rating,
                'text' => $review->body,
                'author' => $review->anonymous ? 'Anonymous' : ($review->user?->name ?? 'Anonymous'),
                'date' => $review->created_at?->format('M d, Y'),
                'flagged_terms' => $this->flaggedTerms($item->reason_code),
            ],
        ];
    }

    /** @return array{kind: string, snapshot: array<string, mixed>} */
    private function chatPreview(ModerationQueueItem $item, Message|Conversation $target): array
    {
        $messages = $target instanceof Message
            ? collect([$target])
            : $target->messages()->reorder()->latest()->limit(10)->get()->reverse()->values();

        return [
            'kind' => 'chat',
            'snapshot' => [
                'messages' => $messages->map(fn (Message $message) => [
                    'id' => $message->id,
                    'sender' => $message->sender_role?->value === 'seller' ? 'seller' : 'buyer',
                    'sender_label' => $message->sender_role?->value === 'seller' ? 'Seller' : 'Buyer',
                    'text' => $message->body ?? '',
                    'reported' => $message->id === $item->target_id,
                    'created_at' => $message->created_at?->toISOString(),
                ])->all(),
            ],
        ];
    }

    private function reasonLabel(ModerationQueueItem $item): string
    {
        $reason = $item->reason_code ? ModerationReason::tryFrom($item->reason_code) : null;

        return $reason?->label() ?? 'Flagged for moderation check';
    }

    /** @return list<string> */
    private function flaggedTerms(?string $reasonCode): array
    {
        return match ($reasonCode) {
            ModerationReason::ProhibitedIngredient->value => ['pork', 'lard', 'alcohol', 'gelatin', 'bacon', 'ham'],
            ModerationReason::HalalKeywordWithoutCertificate->value => ['halal'],
            default => [],
        };
    }
}
