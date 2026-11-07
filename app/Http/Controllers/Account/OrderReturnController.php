<?php

declare(strict_types=1);

namespace App\Http\Controllers\Account;

use App\Actions\Order\RequestReturn;
use App\Http\Requests\Account\CreateOrderReturnRequest;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;

final class OrderReturnController
{
    public function store(CreateOrderReturnRequest $request, Order $order, RequestReturn $action): RedirectResponse
    {
        $action->handle($request->user(), $order, $request->string('reason')->toString());

        return redirect()->route('orders.show', $order)->with('success', 'Return/refund request submitted.');
    }
}
