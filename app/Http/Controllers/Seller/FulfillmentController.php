<?php

declare(strict_types=1);

namespace App\Http\Controllers\Seller;

use App\Actions\Seller\FulfillSellerOrder;
use App\Actions\Seller\UpdateFulfillmentTracking;
use App\Http\Requests\Seller\CreateFulfillmentRequest;
use App\Http\Requests\Seller\UpdateFulfillmentRequest;
use App\Models\Fulfillment;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;

final class FulfillmentController
{
    public function store(CreateFulfillmentRequest $request, Order $order, FulfillSellerOrder $action): RedirectResponse
    {
        $action->handle($order, $request->validated());

        return redirect()->route('seller.orders.show', $order)->with('success', 'Shipment arranged successfully.');
    }

    public function update(UpdateFulfillmentRequest $request, Order $order, Fulfillment $fulfillment, UpdateFulfillmentTracking $action): RedirectResponse
    {
        $action->handle($fulfillment, $request->validated());

        return redirect()->route('seller.orders.show', $order)->with('success', 'Tracking updated.');
    }
}
