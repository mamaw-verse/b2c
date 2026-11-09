<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * A user suspended mid-session is logged out on their next request and sent
 * back to the login screen. Login itself is rejected in Fortify's
 * `authenticateUsing` callback.
 */
final class EnsureUserNotSuspended
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->isSuspended()) {
            return $next($request);
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')->with('status', 'Your account has been suspended.');
    }
}
