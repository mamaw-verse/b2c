<?php

declare(strict_types=1);

namespace App\Http\Controllers\Seller;

use App\Actions\Seller\GetSellerCustomer;
use App\Actions\Seller\ListSellerCustomers;
use App\Http\Requests\Seller\ListSellerCustomersRequest;
use App\Http\Requests\Seller\ShowSellerCustomerRequest;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

final class CustomerController
{
    public function index(ListSellerCustomersRequest $request, ListSellerCustomers $action): Response
    {
        return Inertia::render('seller/customers', ['customers' => $action->handle($request->user()->shop)]);
    }

    public function show(ShowSellerCustomerRequest $request, User $customer, GetSellerCustomer $action): Response
    {
        return Inertia::render('seller/customer', [
            'customer' => $action->handle($request->user()->shop, $customer),
        ]);
    }
}
