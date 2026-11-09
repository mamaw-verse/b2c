<?php

declare(strict_types=1);

namespace App\Http\Controllers\Seller;

use App\Actions\Seller\ListSellerCustomers;
use App\Http\Requests\Seller\ListSellerCustomersRequest;
use Inertia\Inertia;
use Inertia\Response;

final class CustomerController
{
    public function index(ListSellerCustomersRequest $request, ListSellerCustomers $action): Response
    {
        return Inertia::render('seller/customers', ['customers' => $action->handle($request->user()->shop)]);
    }
}
