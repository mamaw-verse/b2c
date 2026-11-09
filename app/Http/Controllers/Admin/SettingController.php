<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\UpdatePlatformSettings;
use App\Http\Requests\Admin\EditAdminSettingsRequest;
use App\Http\Requests\Admin\UpdateAdminSettingsRequest;
use App\Support\Settings;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

final class SettingController
{
    public function edit(EditAdminSettingsRequest $request, Settings $settings): Response
    {
        return Inertia::render('admin/settings', [
            'settings' => [
                'commission_rate' => $settings->marketplaceInt('commission.default_bps') / 100,
                'auto_confirm_days' => $settings->marketplaceInt('auto_confirm_days'),
                'return_window_days' => $settings->marketplaceInt('return_window_days'),
                'payout_hold_days' => $settings->marketplaceInt('payouts.hold_days'),
                'payout_minimum' => $settings->marketplaceInt('payouts.minimum') / 100,
                'announcement' => $settings->marketplace('announcement'),
            ],
        ]);
    }

    public function update(UpdateAdminSettingsRequest $request, UpdatePlatformSettings $action): RedirectResponse
    {
        $action->handle($request->user(), $request->settingsPayload(), $request->ip());

        return redirect()->route('admin.settings.edit')->with('success', 'Settings updated.');
    }
}
