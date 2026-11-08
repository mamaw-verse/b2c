<?php

declare(strict_types=1);

namespace App\Http\Controllers\Seller;

use App\Actions\Seller\GetSellerOrder;
use App\Actions\Seller\ListSellerOrders;
use App\Http\Requests\Seller\ListSellerOrdersRequest;
use App\Http\Requests\Seller\ShowSellerOrderRequest;
use App\Models\Order;
use Inertia\Inertia;
use Inertia\Response;

final class OrderController
{
    public function index(ListSellerOrdersRequest $request, ListSellerOrders $action): Response
    {
        $shop = $request->user()->shop;
        $orders = $action->handle($shop, $request->validated());

        return Inertia::render('seller/orders/index', [
            'orders' => $orders,
            'counts' => $action->counts($shop),
            'filters' => $request->only('status', 'search'),
        ]);
    }

    public function show(ShowSellerOrderRequest $request, Order $order, GetSellerOrder $action): Response
    {
        $shop = $request->user()->shop;
        $orderData = $action->handle($shop, $order);

        return Inertia::render('seller/orders/show', [
            'order' => $orderData,
        ]);
    }
}
