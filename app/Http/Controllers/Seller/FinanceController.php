<?php

declare(strict_types=1);

namespace App\Http\Controllers\Seller;

use App\Actions\Seller\ListSellerFinance;
use App\Http\Requests\Seller\ListSellerFinanceRequest;
use Inertia\Inertia;
use Inertia\Response;

final class FinanceController
{
    public function index(ListSellerFinanceRequest $request, ListSellerFinance $action): Response
    {
        return Inertia::render('seller/finance', $action->handle($request->user()->shop, $request->type()));
    }
}
