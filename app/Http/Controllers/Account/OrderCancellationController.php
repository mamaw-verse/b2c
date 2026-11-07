<?php

declare(strict_types=1);

namespace App\Http\Controllers\Account;

use App\Actions\Order\CancelOrder;
use App\Http\Requests\Account\CreateOrderCancellationRequest;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;

final class OrderCancellationController
{
    public function store(CreateOrderCancellationRequest $request, Order $order, CancelOrder $action): RedirectResponse
    {
        $action->handle($request->user(), $order);

        return redirect()->route('orders.show', $order)->with('success', 'Order cancelled.');
    }
}
