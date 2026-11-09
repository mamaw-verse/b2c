<?php

declare(strict_types=1);

namespace App\Http\Controllers\Seller;

use App\Actions\Finance\UpdatePayoutAccount;
use App\Http\Requests\Seller\UpdatePayoutAccountRequest;
use Illuminate\Http\RedirectResponse;

final class PayoutAccountController
{
    public function update(UpdatePayoutAccountRequest $request, UpdatePayoutAccount $action): RedirectResponse
    {
        $action->handle($request->user()->shop, $request->validated());

        return redirect()->route('seller.finance.index')->with('success', 'Payout account saved.');
    }
}
