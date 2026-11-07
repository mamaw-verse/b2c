<?php

declare(strict_types=1);

namespace App\Http\Controllers\Account;

use App\Actions\Address\SetDefaultAddress;
use App\Http\Requests\UpdateAddressDefaultRequest;
use App\Models\Address;
use App\Models\User;
use Illuminate\Http\RedirectResponse;

final class AddressDefaultController
{
    public function update(UpdateAddressDefaultRequest $request, Address $address, SetDefaultAddress $action): RedirectResponse
    {
        $user = $request->user();
        assert($user instanceof User);

        $action->handle($user, $address);

        return back();
    }
}
