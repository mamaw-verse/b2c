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

        return Inertia::render('account/orders', [
            'orders' => $action->handle($user),
        ]);
    }

    public function show(ShowOrderRequest $request, Order $order, GetOrder $action): Response
    {
        $user = $request->user();
        $result = $action->handle($user, $order);

        if ($result instanceof \Illuminate\Auth\Access\Response) {
            abort(404);
        }

        $returnOutcome = null;
        if ($result->status->value === 'refunded') {
            $event = $result->events->where('title', 'Refund approved')->sortByDesc('created_at')->first();
            $returnOutcome = ['status' => 'approved', 'note' => $event?->detail];
        } elseif ($result->status->value === 'completed') {
            $event = $result->events->where('title', 'Return/refund declined')->sortByDesc('created_at')->first();
            if ($event) {
                $returnOutcome = ['status' => 'declined', 'note' => $event->detail];
            }
        }

        return Inertia::render('account/order', [
            'order' => $result,
            'return_outcome' => $returnOutcome,
        ]);
    }
}
