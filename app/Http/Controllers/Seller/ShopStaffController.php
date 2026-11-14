<?php

declare(strict_types=1);

namespace App\Http\Controllers\Seller;

use App\Actions\Seller\InviteShopStaff;
use App\Actions\Seller\RemoveShopStaff;
use App\Http\Requests\Seller\CreateShopStaffRequest;
use App\Http\Requests\Seller\DeleteShopStaffRequest;
use App\Http\Requests\Seller\ListShopStaffRequest;
use App\Models\Shop;
use App\Models\ShopStaff;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

final class ShopStaffController
{
    public function index(ListShopStaffRequest $request): Response
    {
        $user = $request->user();
        assert($user instanceof User);
        $shop = $user->shop;
        assert($shop instanceof Shop);

        $staffMembers = $shop->staff()
            ->with('user')
            ->orderBy('created_at')
            ->get()
            ->map(fn (ShopStaff $staff) => [
                'id' => $staff->id,
                'email' => $staff->email,
                'status' => $staff->status->value,
                'name' => $staff->user?->name,
                'invited_at' => $staff->invited_at?->toIso8601String(),
                'accepted_at' => $staff->accepted_at?->toIso8601String(),
            ]);

        return Inertia::render('seller/staff', [
            'staff' => $staffMembers,
            'maxStaff' => (int) config('marketplace.seller.max_staff', 2),
        ]);
    }

    public function store(CreateShopStaffRequest $request, InviteShopStaff $action): RedirectResponse
    {
        $user = $request->user();
        assert($user instanceof User);
        $shop = $user->shop;
        assert($shop instanceof Shop);

        $action->handle($shop, $user, (string) $request->validated('email'), $request->ip());

        return back()->with('success', 'Invitation sent successfully.');
    }

    public function destroy(DeleteShopStaffRequest $request, ShopStaff $staff, RemoveShopStaff $action): RedirectResponse
    {
        $user = $request->user();
        assert($user instanceof User);
        $isSelf = $staff->user_id === $user->id;

        $action->handle($staff, $user, $request->ip());

        if ($isSelf) {
            return redirect()->route('dashboard')->with('success', 'You have left the shop.');
        }

        return back()->with('success', 'Staff member removed successfully.');
    }
}
