<?php

declare(strict_types=1);

namespace App\Http\Controllers\Seller;

use App\Actions\Seller\GetSellerDashboard;
use App\Http\Requests\Seller\ShowSellerDashboardRequest;
use Inertia\Inertia;
use Inertia\Response;

final class DashboardController
{
    public function __invoke(ShowSellerDashboardRequest $request, GetSellerDashboard $action): Response
    {
        $shop = $request->user()->operatedShop();
        assert($shop !== null);
        $period = (string) $request->input('period', '7D');

        $data = $action->handle($shop, $period);

        return Inertia::render('seller/dashboard', $data);
    }
}
