<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\ListPayouts;
use App\Actions\Finance\ResolvePayout;
use App\Enums\PayoutStatus;
use App\Http\Requests\Admin\ListPayoutsRequest;
use App\Http\Requests\Admin\UpdatePayoutRequest;
use App\Models\Payout;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

final class PayoutController
{
    public function index(ListPayoutsRequest $request, ListPayouts $action): Response
    {
        return Inertia::render('admin/payouts', $action->handle($request->status()));
    }

    public function update(UpdatePayoutRequest $request, Payout $payout, ResolvePayout $action): RedirectResponse
    {
        $action->handle($payout, $request->user(), PayoutStatus::from($request->string('status')->toString()), $request->input('reference'), $request->ip());

        return redirect()->route('admin.payouts.index')->with('success', 'Payout updated.');
    }
}
