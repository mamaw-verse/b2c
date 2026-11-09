<?php

declare(strict_types=1);

namespace App\Http\Controllers\Seller;

use App\Actions\Voucher\CreateVoucher;
use App\Actions\Voucher\DeleteVoucher;
use App\Actions\Voucher\ListVouchers;
use App\Actions\Voucher\UpdateVoucher;
use App\Http\Requests\Seller\CreateSellerVoucherRequest;
use App\Http\Requests\Seller\DeleteSellerVoucherRequest;
use App\Http\Requests\Seller\ListSellerVouchersRequest;
use App\Http\Requests\Seller\UpdateSellerVoucherRequest;
use App\Models\Voucher;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

final class VoucherController
{
    public function index(ListSellerVouchersRequest $request, ListVouchers $action): Response
    {
        return Inertia::render('seller/vouchers', $action->handle($request->user()->shop));
    }

    public function store(CreateSellerVoucherRequest $request, CreateVoucher $action): RedirectResponse
    {
        $action->handle($request->user(), $request->user()->shop, $request->voucherPayload(), $request->ip());

        return redirect()->route('seller.vouchers.index')->with('success', 'Voucher created.');
    }

    public function update(UpdateSellerVoucherRequest $request, Voucher $voucher, UpdateVoucher $action): RedirectResponse
    {
        $action->handle($voucher, $request->voucherPayload(), $request->user(), $request->ip());

        return redirect()->route('seller.vouchers.index')->with('success', 'Voucher updated.');
    }

    public function destroy(DeleteSellerVoucherRequest $request, Voucher $voucher, DeleteVoucher $action): RedirectResponse
    {
        $action->handle($voucher, $request->user(), $request->ip());

        return redirect()->route('seller.vouchers.index')->with('success', 'Voucher deleted.');
    }
}
