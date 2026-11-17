<?php

declare(strict_types=1);

namespace App\Http\Controllers\Seller;

use App\Enums\Workspace;
use App\Http\Requests\Seller\UpdateActiveShopRequest;
use App\Models\User;
use App\Support\ActiveShop;
use Illuminate\Http\RedirectResponse;

final class ActiveShopController
{
    public function update(UpdateActiveShopRequest $request, ActiveShop $activeShop): RedirectResponse
    {
        $user = $request->user();
        assert($user instanceof User);

        $shop = $activeShop->switchTo($user, (string) $request->validated('shop_id'));

        // Not a shop this user operates (or no longer does): same answer
        // as any other unauthorised seller resource.
        abort_if($shop === null, 404);

        // Land on the new shop's home rather than the page the user was
        // on: that page may be owner-only and 404 for their role there.
        return redirect(Workspace::Seller->home($user))
            ->with('success', "Switched to {$shop->name}.");
    }
}
