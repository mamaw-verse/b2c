<?php

declare(strict_types=1);

namespace App\Http\Responses;

use App\Models\User;
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;

final class RegisterResponse implements RegisterResponseContract
{
    /**
     * Post-registration destination: if the user was invited and accepted
     * as shop staff, redirect to the seller dashboard, otherwise to the buyer account.
     */
    public function toResponse($request)
    {
        if ($request->wantsJson()) {
            return response()->json([], 201);
        }

        $user = $request->user();

        if ($user instanceof User && $user->isShopStaff()) {
            return redirect()->intended(route('seller.orders.index'));
        }

        return redirect()->intended(config('fortify.home', '/account'));
    }
}
