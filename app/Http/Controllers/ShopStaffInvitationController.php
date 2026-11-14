<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Seller\AcceptShopStaffInvitation;
use App\Http\Requests\DeleteShopStaffInvitationRequest;
use App\Http\Requests\ShowShopStaffInvitationRequest;
use App\Http\Requests\UpdateShopStaffInvitationRequest;
use App\Models\ShopStaff;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

final class ShopStaffInvitationController
{
    public function show(ShowShopStaffInvitationRequest $request, ShopStaff $staffInvitation): Response
    {
        return Inertia::render('account/staff-invitation', [
            'invitation' => [
                'id' => $staffInvitation->id,
                'shop_name' => $staffInvitation->shop->name,
                'email' => $staffInvitation->email,
                'invited_at' => $staffInvitation->invited_at?->toIso8601String(),
            ],
        ]);
    }

    public function update(
        UpdateShopStaffInvitationRequest $request,
        ShopStaff $staffInvitation,
        AcceptShopStaffInvitation $action
    ): RedirectResponse {
        $user = $request->user();
        assert($user instanceof User);

        $action->handle($staffInvitation, $user, $request->ip());

        return redirect()->route('seller.dashboard')->with('success', "Welcome to the {$staffInvitation->shop->name} team!");
    }

    public function destroy(
        DeleteShopStaffInvitationRequest $request,
        ShopStaff $staffInvitation
    ): RedirectResponse {
        $staffInvitation->delete();

        return redirect()->route('account.home')->with('success', 'Invitation declined.');
    }
}
