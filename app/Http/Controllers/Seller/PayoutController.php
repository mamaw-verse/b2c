<?php

declare(strict_types=1);

namespace App\Http\Controllers\Seller;

use App\Actions\Finance\RequestPayout;
use App\Http\Requests\Seller\CreatePayoutRequest;
use Illuminate\Http\RedirectResponse;

final class PayoutController
{
    public function store(CreatePayoutRequest $request, RequestPayout $action): RedirectResponse
    {
        $action->handle($request->user()->shop, $request->integer('amount'));

        return redirect()->route('seller.finance.index')->with('success', 'Payout requested.');
    }
}
