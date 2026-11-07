<?php

declare(strict_types=1);

namespace App\Actions\Order;

use App\Enums\OrderStatus;
use App\Models\OrderItem;
use App\Models\Review;
use App\Models\ReviewPhoto;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final readonly class SubmitReview
{
    /**
     * @param  array<int, UploadedFile>  $photos
     */
    public function handle(
        User $user,
        OrderItem $orderItem,
        int $rating,
        ?string $body,
        bool $anonymous,
        array $photos = []
    ): Review {
        if ($orderItem->order->user_id !== $user->id) {
            throw ValidationException::withMessages(['order_item' => 'Order item not found.']);
        }

        if ($orderItem->order->status !== OrderStatus::Completed) {
            throw ValidationException::withMessages(['order_item' => 'You can only review completed orders.']);
        }

        if ($orderItem->review !== null) {
            throw ValidationException::withMessages(['order_item' => 'You have already reviewed this item.']);
        }

        return DB::transaction(function () use ($user, $orderItem, $rating, $body, $anonymous, $photos): Review {
            /** @var Review $review */
            $review = Review::create([
                'order_item_id' => $orderItem->id,
                'user_id' => $user->id,
                'product_id' => $orderItem->product_id,
                'rating' => $rating,
                'body' => $body,
                'anonymous' => $anonymous,
            ]);

            foreach ($photos as $position => $file) {
                $path = $file->store('reviews', 'public');

                ReviewPhoto::create([
                    'review_id' => $review->id,
                    'path' => $path,
                    'position' => $position,
                ]);
            }

            return $review;
        });
    }
}
