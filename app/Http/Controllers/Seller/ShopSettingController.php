<?php

declare(strict_types=1);

namespace App\Http\Controllers\Seller;

use App\Actions\Seller\GetShopSettings;
use App\Actions\Seller\UpdateShopSettings;
use App\Http\Requests\Seller\EditShopSettingRequest;
use App\Http\Requests\Seller\UpdateShopSettingRequest;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

final class ShopSettingController
{
    public function edit(EditShopSettingRequest $request, GetShopSettings $action): Response
    {
        $shop = $request->user()->shop;
        $settings = $action->handle($shop);

        return Inertia::render('seller/settings', [
            'settings' => $settings,
        ]);
    }

    public function update(UpdateShopSettingRequest $request, UpdateShopSettings $action): RedirectResponse
    {
        $shop = $request->user()->shop;
        $action->handle($shop, $request->validated());

        return redirect()->route('seller.settings.edit')->with('success', 'Shop settings saved.');
    }
}
