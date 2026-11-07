<?php

declare(strict_types=1);

namespace App\Http\Controllers\Account;

use App\Actions\Address\CreateAddress;
use App\Actions\Address\DeleteAddress;
use App\Actions\Address\UpdateAddress;
use App\Http\Requests\CreateAddressRequest;
use App\Http\Requests\DeleteAddressRequest;
use App\Http\Requests\ListAddressRequest;
use App\Http\Requests\UpdateAddressRequest;
use App\Models\Address;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

final class AddressController
{
    public function index(ListAddressRequest $request): Response
    {
        $user = $request->user();
        assert($user instanceof User);

        $addresses = Address::where('user_id', $user->id)
            ->with(['region', 'province', 'city', 'barangay'])
            ->orderByDesc('is_default')
            ->latest('created_at')
            ->get()
            ->map(fn (Address $a) => [
                'id' => $a->id,
                'name' => $a->name,
                'phone' => $a->phone,
                'region_code' => $a->region_code,
                'province_code' => $a->province_code,
                'city_code' => $a->city_code,
                'barangay_code' => $a->barangay_code,
                'street' => $a->street,
                'postal_code' => $a->postal_code,
                'landmark' => $a->landmark,
                'label' => $a->label->value,
                'is_default' => $a->is_default,
                'formatted' => "{$a->street}, {$a->barangay?->name}, {$a->city?->name}, {$a->province?->name} {$a->postal_code}",
            ]);

        return Inertia::render('account/addresses', [
            'addresses' => $addresses,
        ]);
    }

    public function store(CreateAddressRequest $request, CreateAddress $action): RedirectResponse
    {
        $user = $request->user();
        assert($user instanceof User);

        $action->handle($user, $request->validated());

        return back();
    }

    public function update(UpdateAddressRequest $request, Address $address, UpdateAddress $action): RedirectResponse
    {
        $user = $request->user();
        assert($user instanceof User);

        $action->handle($user, $address, $request->validated());

        return back();
    }

    public function destroy(DeleteAddressRequest $request, Address $address, DeleteAddress $action): RedirectResponse
    {
        $user = $request->user();
        assert($user instanceof User);

        $action->handle($user, $address);

        return back();
    }
}
