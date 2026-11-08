<?php

declare(strict_types=1);

namespace App\Http\Controllers\Account;

use App\Actions\Order\GetOrder;
use App\Http\Requests\Account\ShowOrderConfirmedRequest;
use App\Models\Order;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

final class OrderConfirmationController
{
    public function __invoke(ShowOrderConfirmedRequest $request, Order $order, GetOrder $action): Response
    {
        $user = $request->user();
        assert($user instanceof User);

        $order = $action->handle($user, $order);
        assert($order instanceof Order);

        return Inertia::render('account/order-confirmed', [
            'order' => $order,
        ]);
    }
}
