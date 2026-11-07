<?php

declare(strict_types=1);

namespace App\Http\Controllers\Account;

use App\Actions\Order\GetOrder;
use App\Actions\Order\GetOrders;
use App\Http\Requests\Account\ListOrdersRequest;
use App\Http\Requests\Account\ShowOrderRequest;
use App\Models\Order;
use Inertia\Inertia;
use Inertia\Response;

final class OrderController
{
    public function index(ListOrdersRequest $request, GetOrders $action): Response
    {
        $user = $request->user();
        $status = $request->status();

        return Inertia::render('account/orders', [
            'status' => $status?->value,
            'counts' => $action->counts($user),
            'orders' => Inertia::scroll($action->handle($user, $status)),
        ]);
    }

    public function show(ShowOrderRequest $request, Order $order, GetOrder $action): Response
    {
        $user = $request->user();
        $result = $action->handle($user, $order);

        return Inertia::render('account/order', [
            'order' => $result,
        ]);
    }
}
