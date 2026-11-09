<?php

declare(strict_types=1);

namespace App\Http\Controllers\Seller;

use App\Actions\Seller\SubmitShopApplication;
use App\Http\Requests\Seller\CreateShopRegistrationRequest;
use App\Models\HalalCertification;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

final class ShopRegistrationController
{
    public function create(CreateShopRegistrationRequest $request): Response
    {
        $shop = $request->user()->shop;
        $shop?->loadMissing('halalCertifications');

        return Inertia::render('seller/register', [
            'terms' => [
                'version' => config('marketplace.seller_terms.version'),
            ],
            'application' => $shop === null ? null : [
                'status' => $shop->status->value,
                'shop_name' => $shop->name,
                'description' => $shop->description,
                'address_line' => $shop->address_line,
                'city' => $shop->city,
                'state' => $shop->state,
                'postal_code' => $shop->postal_code,
                'certificates' => $shop->halalCertifications
                    ->map(fn (HalalCertification $certificate) => [
                        'certifying_body' => $certificate->certifying_body,
                        'certificate_number' => $certificate->number,
                        'valid_until' => $certificate->valid_until->toDateString(),
                    ])
                    ->all(),
                'rejection_reason' => $shop->rejection_reason,
                'terms_version' => $shop->terms_version,
                'terms_accepted_at' => $shop->terms_accepted_at?->toISOString(),
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
