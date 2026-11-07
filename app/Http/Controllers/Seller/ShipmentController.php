<?php

declare(strict_types=1);

namespace App\Http\Controllers\Seller;

use App\Actions\Seller\FulfillSellerOrder;
use App\Http\Requests\Seller\CreateSellerShipmentRequest;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;

final class ShipmentController
{
    public function store(CreateSellerShipmentRequest $request, Order $order, FulfillSellerOrder $action): RedirectResponse
    {
        $action->handle($order, $request->validated());

        return redirect()->route('seller.orders.show', $order)->with('success', 'Shipment arranged successfully.');
    }
}
