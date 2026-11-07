<?php

declare(strict_types=1);

namespace App\Http\Controllers\Account;

use App\Actions\Order\MarkOrderReceived;
use App\Http\Requests\Account\UpdateOrderReceivedRequest;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;

final class OrderReceivedController
{
    public function update(UpdateOrderReceivedRequest $request, Order $order, MarkOrderReceived $action): RedirectResponse
    {
        $action->handle($request->user(), $order);

        return redirect()->route('orders.show', $order)->with('success', 'Order marked as received.');
    }
}
