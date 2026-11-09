<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Cart\ApplyVoucher;
use App\Http\Requests\CreateCartVoucherRequest;
use App\Http\Requests\DeleteCartVoucherRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;

final class CartVoucherController
{
    public function store(CreateCartVoucherRequest $request, ApplyVoucher $action): RedirectResponse
    {
        $user = $request->user();
        assert($user instanceof User);

        $voucher = $action->handle(
            $user,
            (string) $request->input('code'),
            array_values($request->array('cart_item_ids'))
        );

        return back()->with('applied_voucher', [
            'id' => $voucher->id,
            'code' => $voucher->code,
            'kind' => $voucher->kind->value,
        ]);
    }

    public function destroy(DeleteCartVoucherRequest $request): RedirectResponse
    {
        return back();
    }
}
