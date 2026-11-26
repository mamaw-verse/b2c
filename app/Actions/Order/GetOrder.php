<?php

declare(strict_types=1);

namespace App\Actions\Order;

use App\Models\Order;
use App\Models\OrderEvent;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Support\Facades\Storage;

final readonly class GetOrder
{
    public function handle(User $user, Order $order): Response|Order
    {
        if ($order->user_id !== $user->id) {
            return Response::denyAsNotFound();
        }

        $order->load([
            'shop',
            'address',
            'shippingOption',
            'payment',
            'events',
            'refunds.items.orderItem.variation',
            'fulfillments.items.orderItem.variation',
            'fulfillments.items.orderItem.product.images',
            'items.product.images',
            'items.variation',
            'items.fulfillmentItems',
            'items.refundItems',
            'items.review.photos',
        ]);

        $order->events->each(function (OrderEvent $event): void {
            if ($event->metadata !== null && (isset($event->metadata['actor_name']) || isset($event->metadata['actor_id']))) {
                $meta = $event->metadata;
                unset($meta['actor_name'], $meta['actor_id']);
                $event->metadata = $meta;
            }
        });

        // Build proof URLs from the return/refund request event metadata
        $returnEvent = $order->events->where('title', 'Return/refund requested')->sortByDesc('created_at')->first();

        if ($returnEvent) {
            /** @var list<string> $photoPaths */
            $photoPaths = $returnEvent->metadata['photos'] ?? [];
            $photos = collect($photoPaths)
                ->map(fn (string $path) => Storage::disk('public')->url($path))
                ->values()
                ->all();
            $video = isset($returnEvent->metadata['video'])
                ? Storage::disk('public')->url($returnEvent->metadata['video'])
                : null;

            $order->setAttribute('return_proofs', ['photos' => $photos, 'video' => $video]);
        } else {
            $order->setAttribute('return_proofs', null);
        }

        return $order;
    }
}
