<?php

declare(strict_types=1);

namespace App\Http\Responses;

use App\Enums\Workspace;
use App\Http\Middleware\RememberWorkspace;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

final class LoginResponse implements LoginResponseContract
{
    /**
     * Post-login destination: the intended URL first, then the last
     * workspace the user visited when it is still open to them, otherwise
     * their buyer account.
     */
    public function toResponse($request)
    {
        if ($request->wantsJson()) {
            return response()->json(['two_factor' => false]);
        }

        $workspace = Workspace::tryFrom((string) $request->session()->get(RememberWorkspace::SESSION_KEY, ''));
        $default = $workspace?->accessibleBy($request->user())
            ? $workspace->home()
            : (Workspace::allowedFor($request->user())[0] ?? Workspace::Buyer)->home();

        return redirect()->intended($default);
    }
}
