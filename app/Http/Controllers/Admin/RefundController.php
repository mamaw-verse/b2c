<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\ProcessRefund;
use App\Http\Requests\Admin\UpdateOrderRefundRequest;
use App\Models\OrderRefund;
use Illuminate\Http\RedirectResponse;

final class RefundController
{
    public function update(UpdateOrderRefundRequest $request, OrderRefund $refund, ProcessRefund $action): RedirectResponse
    {
        $action->handle(
            refund: $refund,
            admin: $request->user(),
            reference: $request->string('reference')->toString(),
            ip: $request->ip(),
        );

        return redirect()->route('admin.payouts.index')->with('success', 'Refund marked as processed.');
    }
}
