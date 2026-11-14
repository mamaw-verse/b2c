<?php

declare(strict_types=1);

namespace App\Http\Controllers\Seller;

use App\Actions\Seller\GetSellerCustomer;
use App\Actions\Seller\ListSellerCustomers;
use App\Http\Requests\Seller\ListSellerCustomersRequest;
use App\Http\Requests\Seller\ShowSellerCustomerRequest;
use App\Models\Shop;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

final class CustomerController
{
    public function index(ListSellerCustomersRequest $request, ListSellerCustomers $action): Response
    {
        $shop = $request->user()->operatedShop();
        assert($shop instanceof Shop);

        return Inertia::render('seller/customers', ['customers' => $action->handle($shop)]);
    }

    public function show(ShowSellerCustomerRequest $request, User $customer, GetSellerCustomer $action): Response
    {
        $shop = $request->user()->operatedShop();
        assert($shop instanceof Shop);

        return Inertia::render('seller/customer', [
            'customer' => $action->handle($shop, $customer),
        ]);
    }
}
