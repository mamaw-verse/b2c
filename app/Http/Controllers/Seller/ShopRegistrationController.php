<?php

declare(strict_types=1);

namespace App\Http\Controllers\Seller;

use App\Actions\Seller\SubmitShopApplication;
use App\Http\Requests\Seller\CreateShopRegistrationRequest;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

final class ShopRegistrationController
{
    public function create(CreateShopRegistrationRequest $request): Response
    {
        $shop = $request->user()->shop;

        return Inertia::render('seller/register', [
            'application' => $shop === null ? null : [
                'status' => $shop->status->value,
                'shop_name' => $shop->name,
                'description' => $shop->description,
                'location' => $shop->location,
                'contact_number' => $shop->contact_number,
                'halal_only' => $shop->halal_only,
                'id_type' => $shop->id_type,
                'id_number' => $shop->id_number,
                'bank_name' => $shop->bank_name,
                'bank_account_name' => $shop->bank_account_name,
                'bank_account_number' => $shop->bank_account_number,
                'rejection_reason' => $shop->rejection_reason,
                'submitted_at' => $shop->submitted_at?->toISOString(),
            ],
        ]);
    }

    public function store(
        CreateShopRegistrationRequest $request,
        SubmitShopApplication $action,
    ): RedirectResponse {
        $action->handle($request->user(), $request->applicationData());

        return redirect()->route('seller.register')
            ->with('status', 'application_submitted');
    }
}
