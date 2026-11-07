<?php

declare(strict_types=1);

namespace App\Actions\Order;

use App\Models\Order;
use App\Models\User;
use Illuminate\Auth\Access\Response;

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
            'items.product.images',
            'items.review.photos',
        ]);

        return $order;
    }
}
