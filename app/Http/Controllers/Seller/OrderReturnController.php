<?php

declare(strict_types=1);

namespace App\Http\Controllers\Seller;

use App\Actions\Order\ResolveReturn;
use App\Http\Requests\Seller\ResolveOrderReturnRequest;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;

final class OrderReturnController
{
    public function store(ResolveOrderReturnRequest $request, Order $order, ResolveReturn $action): RedirectResponse
    {
        $action->handle($request->user(), $order, $request->validated('decision'), $request->validated('note'));

        return back();
    }
}
