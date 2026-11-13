<?php

declare(strict_types=1);

namespace App\Http\Controllers\Seller;

use App\Actions\Seller\SubmitShopApplication;
use App\Http\Requests\Seller\CreateShopRegistrationRequest;
use App\Models\HalalCertification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
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
                'region_code' => $shop->region_code,
                'province_code' => $shop->province_code,
                'city_code' => $shop->city_code,
                'barangay_code' => $shop->barangay_code,
                'logo_url' => $shop->logo_url,
                'business_permit_url' => $shop->business_permit_url,
                'halal_only' => $shop->halal_only,
                'certificates' => $shop->halalCertifications
                    ->map(fn (HalalCertification $certificate) => [
                        'id' => $certificate->id,
                        'certifying_body' => $certificate->certifying_body,
                        'certificate_number' => $certificate->number,
                        'valid_until' => $certificate->valid_until->toDateString(),
                        'document_url' => $certificate->document_path
                            ? Storage::disk('public')->url($certificate->document_path)
                            : null,
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
