<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Seller\AcceptShopStaffInvitation;
use App\Http\Requests\DeleteShopStaffInvitationRequest;
use App\Http\Requests\ShowShopStaffInvitationRequest;
use App\Http\Requests\UpdateShopStaffInvitationRequest;
use App\Models\ShopStaff;
use App\Models\User;
use App\Support\ActiveShop;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

final class ShopStaffInvitationController
{
    public function show(ShowShopStaffInvitationRequest $request, ShopStaff $staffInvitation): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user === null) {
            $existingUser = User::query()->whereRaw('LOWER(email) = ?', [mb_strtolower($staffInvitation->email)])->first();

            if ($existingUser !== null) {
                session()->put('url.intended', $request->fullUrl());

                return redirect()->route('login', ['email' => $staffInvitation->email])
                    ->with('status', 'Please log in to view and accept your staff invitation.');
            }

            session()->put('staff_invitation_id', $staffInvitation->id);

            return redirect()->route('register', [
                'email' => $staffInvitation->email,
                'invitation' => $staffInvitation->id,
            ]);
        }

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
        AcceptShopStaffInvitation $action,
        ActiveShop $activeShop
    ): RedirectResponse {
        $user = $request->user();
        assert($user instanceof User);

        $action->handle($staffInvitation, $user, $request->ip());

        // Open the shop they just joined, even when they already work in others.
        $activeShop->refresh($user);
        $activeShop->switchTo($user, $staffInvitation->shop_id);

        return redirect()->route('seller.orders.index')->with('success', "Welcome to the {$staffInvitation->shop->name} team!");
    }

    public function destroy(
        DeleteShopStaffInvitationRequest $request,
        ShopStaff $staffInvitation
    ): RedirectResponse {
        $staffInvitation->delete();

        return redirect()->route('account.home')->with('success', 'Invitation declined.');
    }
}
