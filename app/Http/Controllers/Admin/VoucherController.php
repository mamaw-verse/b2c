<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Actions\Voucher\CreateVoucher;
use App\Actions\Voucher\DeleteVoucher;
use App\Actions\Voucher\ListVouchers;
use App\Actions\Voucher\UpdateVoucher;
use App\Http\Requests\Admin\CreateAdminVoucherRequest;
use App\Http\Requests\Admin\DeleteAdminVoucherRequest;
use App\Http\Requests\Admin\ListAdminVouchersRequest;
use App\Http\Requests\Admin\UpdateAdminVoucherRequest;
use App\Models\Voucher;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

final class VoucherController
{
    public function index(ListAdminVouchersRequest $request, ListVouchers $action): Response
    {
        return Inertia::render('admin/vouchers', $action->handle(null));
    }

    public function store(CreateAdminVoucherRequest $request, CreateVoucher $action): RedirectResponse
    {
        $action->handle($request->user(), null, $request->voucherPayload(), $request->ip());

        return redirect()->route('admin.vouchers.index')->with('success', 'Voucher created.');
    }

    public function update(UpdateAdminVoucherRequest $request, Voucher $voucher, UpdateVoucher $action): RedirectResponse
    {
        $action->handle($voucher, $request->voucherPayload(), $request->user(), $request->ip());

        return redirect()->route('admin.vouchers.index')->with('success', 'Voucher updated.');
    }

    public function destroy(DeleteAdminVoucherRequest $request, Voucher $voucher, DeleteVoucher $action): RedirectResponse
    {
        $action->handle($voucher, $request->user(), $request->ip());

        return redirect()->route('admin.vouchers.index')->with('success', 'Voucher deleted.');
    }
}
