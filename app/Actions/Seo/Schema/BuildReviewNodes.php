<?php

declare(strict_types=1);

namespace App\Actions\Seo\Schema;

use App\Models\Product;
use App\Models\Review;

/**
 * Honest review markup for a product: real, non-hidden reviews only.
 *
 * Seller replies are never emitted as reviews, and anonymous reviewers never expose a name.
 */
final readonly class BuildReviewNodes
{
    public const int MAX_REVIEWS = 5;

    /**
     * @return array{aggregateRating: array<string, mixed>|null, review: array<int, array<string, mixed>>}
     */
    public function handle(Product $product): array
    {
        $stats = Review::query()
            ->where('product_id', $product->id)
            ->where('hidden', false)
            ->selectRaw('COUNT(*) as review_count, AVG(rating) as average_rating')
            ->toBase()
            ->first();

        $count = (int) ($stats->review_count ?? 0);

        if ($count === 0) {
            return ['aggregateRating' => null, 'review' => []];
        }

        $recent = Review::query()
            ->with('user')
            ->where('product_id', $product->id)
            ->where('hidden', false)
            ->latest()
            ->limit(self::MAX_REVIEWS)
            ->get();

        return [
            'aggregateRating' => [
                '@type' => 'AggregateRating',
                'ratingValue' => number_format((float) $stats->average_rating, 1, '.', ''),
                'reviewCount' => $count,
                'bestRating' => 5,
                'worstRating' => 1,
            ],
            'review' => $recent->map(fn (Review $review): array => $this->review($review))->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function review(Review $review): array
    {
        $authorName = $review->anonymous ? 'Anonymous' : ($review->user->name ?? 'Anonymous');

        return [
            '@type' => 'Review',
            'author' => ['@type' => 'Person', 'name' => $authorName],
            'datePublished' => $review->created_at?->toDateString(),
            'reviewRating' => [
                '@type' => 'Rating',
                'ratingValue' => $review->rating,
                'bestRating' => 5,
                'worstRating' => 1,
            ],
            'reviewBody' => $review->body !== null ? mb_trim(strip_tags($review->body)) : null,
        ];
    }
}
